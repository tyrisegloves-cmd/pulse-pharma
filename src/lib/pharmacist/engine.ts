/**
 * src/lib/pharmacist/engine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * The consult engine behind "Ask Your Pharmacist".
 *
 * Given the conversation so far (plus the live product catalogue), it:
 *   1. Checks EMERGENCY red flags first — always.
 *   2. Extracts the details the user shares: symptoms, duration, age,
 *      pregnancy, allergies, named medicines, severity.
 *   3. Works out the intent: illness help, medicine info, interaction check,
 *      greeting, or a follow-up on the active topic.
 *   4. Composes a reply that explicitly reflects the user's details back,
 *      asks targeted follow-ups, and links to real shop products.
 *
 * The engine is STATELESS — all context is rebuilt from the message history
 * on every call, which keeps the API simple and horizontally safe.
 *
 * SAFETY RULES baked in:
 *   • Red flags short-circuit everything with an emergency script.
 *   • No pediatric doses, ever — children get "see a pharmacist" dosing.
 *   • Pregnancy/breastfeeding switches ibuprofen-type advice off.
 *   • Every illness reply carries "get seen in person if…" warnings.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  DRUGS,
  CONDITIONS,
  RED_FLAGS,
  INTERACTIONS,
  EMERGENCY_INSTRUCTIONS,
  MENTAL_HEALTH_INSTRUCTIONS,
  type DrugEntry,
  type ConditionEntry,
} from "./knowledge";

/* ───────────────────────────── PUBLIC TYPES ───────────────────────────── */

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** The product fields the engine needs from the live catalogue. */
export interface CatalogueProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  brand: string;
  dosage: string;
  isPrescriptionRequired: boolean;
  inStock: boolean;
}

export interface ConsultProduct extends CatalogueProduct {
  /** Why this product is being suggested, shown on the card. */
  note: string;
}

export type Urgency = "normal" | "urgent" | "emergency";

export interface ConsultResult {
  reply: string;
  urgency: Urgency;
  /** Tappable quick replies offered under the message. */
  suggestions: string[];
  products: ConsultProduct[];
  /** What the engine has noted about the user, displayed as context chips. */
  notes: string[];
  /** Human title of the active topic, for the UI. */
  topicTitle?: string;
}

/* ─────────────────────── DETAIL EXTRACTION ─────────────────────── */

interface ConsultDetails {
  symptoms: string[];
  drugIds: string[];
  /** Last mention wins. */
  durationDays?: number;
  durationLabel?: string;
  ageYears?: number;
  ageMonths?: number;
  isChild: boolean;
  pregnant: boolean;
  breastfeeding: boolean;
  allergicTo?: string;
  severity?: "mild" | "severe";
  fever: boolean;
}

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

const SYMPTOM_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "headache", pattern: /\bheadache|\bhead (pain|ache)|pounding head/i },
  { label: "fever", pattern: /\bfever|high temperature|hot body|running temperature|\bchills\b|\bshivering\b/i },
  { label: "cough", pattern: /\bcough/i },
  { label: "sore throat", pattern: /sore throat|throat (is )?(painful|sore)|hurts? to swallow|painful swallow/i },
  { label: "runny / blocked nose", pattern: /runny nose|blocked nose|catarrh|sneez/i },
  { label: "body aches", pattern: /body (pain|ache)|body is aching|joint pain|muscle pain|\bwaist pain\b/i },
  { label: "stomach pain", pattern: /stomach ?(ache| pain)?|belly|abdominal|\btummy\b/i },
  { label: "vomiting / nausea", pattern: /vomit|throwing up|threw up|nausea|feel(ing)? like vomiting|\bpuking\b/i },
  { label: "diarrhoea", pattern: /diarrh?o?ea|running stomach|watery stool|loose (stool|motion)|purging|running stool/i },
  { label: "heartburn / reflux", pattern: /heartburn|acid reflux|\breflux\b|burning (in|of) (my )?chest/i },
  { label: "rash / itching", pattern: /\brash\b|\bitch(y|ing)\b|hives/i },
  { label: "painful urination", pattern: /burning (when|while) (i )?(pee|urinate|pass urine)|painful urination|pee hurts|urin(e|ary) (pain|burning)/i },
  { label: "period pain", pattern: /period (pain|cramp)|menstrual|cramps/i },
  { label: "back pain", pattern: /back ?(ache|pain)|lower back|my back/i },
  { label: "toothache", pattern: /tooth ?(ache| pain)?|teeth pain|gum pain|dental pain/i },
  { label: "dizziness", pattern: /dizzy|dizziness|light-?headed|vertigo/i },
  { label: "weakness / fatigue", pattern: /\bweak(ness)?\b|fatigue|tired(ness)?|no energy|\bexhausted\b/i },
  { label: "insomnia", pattern: /can'?t sleep|insomnia|not sleeping|losing sleep/i },
];

/**
 * Rebuild everything the user has told us from the full user-side history.
 * Called fresh on every engine run — no server-side memory needed.
 */
function extractDetails(messages: ChatTurn[]): ConsultDetails {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");
  const text = userText.toLowerCase();

  const details: ConsultDetails = {
    symptoms: [],
    drugIds: [],
    isChild: false,
    pregnant: false,
    breastfeeding: false,
    fever: false,
  };

  // Symptoms
  for (const { label, pattern } of SYMPTOM_PATTERNS) {
    if (pattern.test(text) && !details.symptoms.includes(label)) {
      details.symptoms.push(label);
    }
  }

  // Named medicines — word-boundary matching so "worse" doesn't match "ORS".
  for (const drug of DRUGS) {
    if (drug.names.some((n) => matchesWord(text, n))) {
      details.drugIds.push(drug.id);
    }
  }

  // Duration — e.g. "3 days", "two weeks", "a week", "6 hours", "since yesterday".
  // Age phrases are stripped first so "8 months old" is never read as a duration.
  const textWithoutAges = text.replace(/\b\d+\s*(month|year)s?\s*old\b/g, "");
  const durationMatch = textWithoutAges.match(
    /(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+(day|days|week|weeks|hour|hours|month|months)\b/
  );
  if (durationMatch) {
    const n = NUMBER_WORDS[durationMatch[1]] ?? parseInt(durationMatch[1], 10);
    const unit = durationMatch[2];
    const days = unit.startsWith("hour") ? 0.2 : unit.startsWith("week") ? n * 7 : unit.startsWith("month") ? n * 30 : n;
    details.durationDays = days;
    details.durationLabel = `${durationMatch[1] === "a" || durationMatch[1] === "an" ? "about a" : n} ${unit}`;
  } else if (/\bsince yesterday\b|\bstarted yesterday\b|\byesterday\b/.test(textWithoutAges)) {
    details.durationDays = 1;
    details.durationLabel = "since yesterday";
  } else if (/\b(this morning|since morning|today|just started|few hours)\b/.test(textWithoutAges)) {
    details.durationDays = 0.2;
    details.durationLabel = "since this morning";
  } else if (/\b(last night|overnight)\b/.test(textWithoutAges)) {
    details.durationDays = 0.5;
    details.durationLabel = "since last night";
  }

  // Age — "I am 30 (years old)", "my baby is 8 months (old)", "my 4 year old"
  const selfYears = text.match(/\b(?:i am|i'?m|am) (\d{1,3})(?:\s*years?)?\b/);
  const yearsOld = text.match(/(\d{1,3})\s*(?:years?|yrs?)\s*(?:old)?/);
  const monthsOld = text.match(/(\d{1,2})\s*(?:month|months)\s*(?:old)?/);
  const childRef = /\b(my (baby|child|son|daughter|kid|toddler|nephew|niece|grand(child|son|daughter))|for my (baby|child|son|daughter|kid)|my little (one|boy|girl))\b/.test(text);

  if (childRef) {
    details.isChild = true;
    if (monthsOld) {
      details.ageMonths = parseInt(monthsOld[1], 10);
    } else if (yearsOld) {
      details.ageYears = parseInt(yearsOld[1], 10);
    }
  } else {
    const y = selfYears ? parseInt(selfYears[1], 10) : yearsOld ? parseInt(yearsOld[1], 10) : undefined;
    if (y && y > 0 && y < 120) {
      details.ageYears = y;
      if (y < 12) details.isChild = true;
    }
  }

  // Pregnancy / breastfeeding
  if (/\bpregnant\b|\bpreggy\b|expecting a baby|\bam expecting\b|\btrimester\b/.test(text)) {
    details.pregnant = true;
  }
  if (/\bbreast ?feed|\bnursing\b|\bleaking milk\b/.test(text)) {
    details.breastfeeding = true;
  }

  // Allergies — capture what follows "allergic to"
  const allergyMatch = userText.match(/allergic to ([a-zA-Z0-9 ,&'-]{2,40})/i);
  if (allergyMatch) {
    details.allergicTo = allergyMatch[1].trim().replace(/[.,!?]+$/, "");
  }

  // Severity
  if (/\b(severe|excruciating|unbearable|worst|really bad|very bad|intense|so much pain)\b/.test(text)) {
    details.severity = "severe";
  } else if (/\b(mild|manageable|slight|a little|not too bad)\b/.test(text)) {
    details.severity = "mild";
  }

  // The fever flag mirrors the fever symptom label.
  details.fever = details.symptoms.includes("fever");

  return details;
}

/* ─────────────────────────── HELPERS ─────────────────────────── */

function findDrug(id: string): DrugEntry | undefined {
  return DRUGS.find((d) => d.id === id);
}

function findCondition(id: string): ConditionEntry | undefined {
  return CONDITIONS.find((c) => c.id === id);
}

/** Whole-word containment so "worse" never matches the drug "ORS". */
function matchesWord(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

/** Which condition is the user talking about in the given text? */
function matchCondition(text: string): ConditionEntry | undefined {
  const lower = text.toLowerCase();
  return CONDITIONS.find((c) => c.keywords.some((k) => lower.includes(k)));
}

/** Which drug is being discussed in the given text? */
function matchDrugs(text: string): DrugEntry[] {
  return DRUGS.filter((d) => d.names.some((n) => matchesWord(text, n)));
}

function isEmergency(text: string): RedFlagHit | null {
  for (const flag of RED_FLAGS) {
    if (flag.pattern.test(text)) return flag;
  }
  return null;
}

interface RedFlagHit {
  id: string;
  label: string;
}

/** Case-insensitive catalogue lookup using the entry's stock name. */
function findProduct(
  catalogue: CatalogueProduct[],
  stockName: string
): CatalogueProduct | undefined {
  const target = stockName.toLowerCase();
  return (
    catalogue.find((p) => p.name.toLowerCase() === target) ??
    catalogue.find((p) => p.name.toLowerCase().includes(target)) ??
    catalogue.find((p) => target.includes(p.name.toLowerCase()))
  );
}

/** Two drug ids form a known interaction pair? */
function findInteraction(a: string, b: string) {
  return INTERACTIONS.find(
    (i) =>
      (i.pair[0] === a && i.pair[1] === b) ||
      (i.pair[0] === b && i.pair[1] === a)
  );
}

const VERDICT_WORD: Record<string, string> = {
  safe: "✅ Safe together",
  caution: "⚠️ Use with care",
  avoid: "🚫 Best avoided",
};

/** The most recently discussed topic across the whole conversation. */
function findActiveTopic(messages: ChatTurn[]): { condition?: ConditionEntry; drug?: DrugEntry } {
  const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content);
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const drug = matchDrugs(userMessages[i])[0];
    if (drug) return { drug };
    const condition = matchCondition(userMessages[i]);
    if (condition) return { condition };
  }
  return {};
}

/* ─────────────────────── NOTE / REFLECTION BUILDERS ─────────────────────── */

/** The "noted so far" chips the UI shows — proof we're paying attention. */
function buildNotes(details: ConsultDetails): string[] {
  const notes: string[] = [];
  if (details.symptoms.length) notes.push(...details.symptoms.slice(0, 3));
  if (details.durationLabel) notes.push(`Duration: ${details.durationLabel}`);
  if (details.severity) notes.push(`Pain: ${details.severity}`);
  if (details.isChild) {
    notes.push(
      details.ageMonths != null
        ? `Child — ${details.ageMonths} months`
        : details.ageYears != null
          ? `Child — ${details.ageYears} yrs`
          : "About a child"
    );
  } else if (details.ageYears) {
    notes.push(`Adult — ${details.ageYears} yrs`);
  }
  if (details.pregnant) notes.push("Pregnant");
  if (details.breastfeeding) notes.push("Breastfeeding");
  if (details.allergicTo) notes.push(`Allergic to ${details.allergicTo}`);
  if (details.drugIds.length) {
    const names = details.drugIds.map((id) => findDrug(id)?.title.split(" (")[0] ?? id);
    notes.push(`Mentioned: ${names.join(", ")}`);
  }
  return notes.slice(0, 6);
}

/**
 * An opener that explicitly mirrors what the user told us — the heart of
 * being "attentive to details". Never canned: it changes with the details.
 */
function buildOpener(details: ConsultDetails, isFollowUp: boolean): string {
  const bits: string[] = [];
  if (details.durationLabel) bits.push(`it has been going on for **${details.durationLabel}**`);
  if (details.severity === "severe") bits.push("the pain is **quite severe**");
  if (details.pregnant) bits.push("you're **pregnant**");
  if (details.breastfeeding) bits.push("you're **breastfeeding**");
  if (details.allergicTo) bits.push(`you're allergic to **${details.allergicTo}**`);
  if (details.isChild) bits.push("this is **for a child**");

  if (isFollowUp) {
    return bits.length
      ? `Thank you — that helps a lot. I've noted that ${bits.join(", and ")}. Here's my updated thinking:\n\n`
      : `Thank you — every detail helps me guide you better. Here's where things stand:\n\n`;
  }

  if (bits.length) {
    return `Thanks for sharing that with me — I've noted that ${bits.join(", and ")}. Let me help you properly.\n\n`;
  }
  return `Thanks for sharing this with me — let's get you sorted out.\n\n`;
}

/** Ask only the follow-ups we're still missing, as a friendly question. */
function buildFollowUpQuestion(condition: ConditionEntry, details: ConsultDetails): string {
  const missing: string[] = [];
  if (details.durationDays == null) missing.push(condition.followUps[0]);
  const feverRelevant = ["malaria", "fever", "headache", "cough", "flu", "cold"].includes(condition.id);
  if (feverRelevant && !details.fever) missing.push(condition.followUps[1] ?? condition.followUps[0]);
  if (missing.length === 0) return "";
  return `\n\nWhile you're here — ${missing[0].charAt(0).toLowerCase()}${missing[0].slice(1)}${
    missing[1] ? ` Also: ${missing[1].charAt(0).toLowerCase()}${missing[1].slice(1)}` : ""
  }`;
}

/** Duration beyond which a self-care topic becomes "get seen" — per condition. */
const ESCALATION_DAYS: Record<string, number> = {
  fever: 3,
  malaria: 3,
  headache: 7,
  migraine: 3,
  cough: 21,
  cold: 10,
  "sore-throat": 7,
  diarrhoea: 3,
  "food-poisoning": 2,
  constipation: 7,
  "back-pain": 14,
  toothache: 3,
  uti: 3,
};

/* ─────────────────────────── REPLY BUILDERS ─────────────────────────── */

function cap(list: string[], max: number): string[] {
  return list.slice(0, max);
}

function bullets(items: string[]): string {
  return items.map((i) => `- ${i}`).join("\n");
}

function buildEmergencyReply(flag: RedFlagHit): ConsultResult {
  const isMentalHealth = flag.id === "mental-health";
  const instructions = isMentalHealth ? MENTAL_HEALTH_INSTRUCTIONS : EMERGENCY_INSTRUCTIONS;

  const reply = isMentalHealth
    ? `I'm really glad you told me. What you're going through sounds heavy, and I want to be honest with you: **this is bigger than a chat — you deserve real support right now.**\n\n${bullets(instructions)}\n\nYou matter. Please make that call or reach that person now — and if you'd like, I'm still here to talk through anything afterwards. 💙`
    : `🚨 **Please treat this as an emergency.** What you've described — ${flag.label} — is something that needs hands-on medical care **right now**, not a chat reply.\n\n${bullets(instructions)}\n\nI'm a guidance tool, and this is exactly the moment I step aside for real help. Please make that call now. 🙏`;

  return {
    reply,
    urgency: "emergency",
    suggestions: ["I've called 112", "Where is the nearest hospital?", "I need help staying calm"],
    products: [],
    notes: [`🚨 ${flag.label}`],
    topicTitle: "Emergency",
  };
}

function buildGreetingReply(details: ConsultDetails, userName?: string): ConsultResult {
  const name = userName ? ` ${userName}` : "";
  return {
    reply: `Hello${name}! 👋 I'm **Dr. Osei**, your Pulse Pharma pharmacy guide. I'm here whenever you need quick, reliable guidance — free and confidential.\n\nHere's what I can help with:\n- **Understanding a medicine** — what it's for, how to take it, side effects\n- **Working out an illness** — tell me your symptoms and I'll guide you step by step\n- **Safety checks** — whether two medicines are safe to take together\n- **Finding the right product** from our shop for what you're facing\n\nWhat's on your mind today? The more detail you share — what you feel, for how long, and for whom — the better I can help.`,
    urgency: "normal",
    suggestions: [
      "I have a headache and fever",
      "What is Coartem used for?",
      "Can I take paracetamol with ibuprofen?",
      "My child has a cough",
    ],
    products: [],
    notes: [],
  };
}

function buildThanksReply(): ConsultResult {
  return {
    reply: `You're very welcome — I'm glad I could help. 😊\n\nA few parting reminders:\n- If anything **worsens or changes**, come back and tell me — I'll reassess with you.\n- Prescription medicines need a valid prescription — you can upload yours on the [Upload Prescription](/upload-prescription) page.\n- For emergencies, always call **112** or go to the nearest hospital.\n\nTake care of yourself. Your health, just a tap away. ❤️`,
    urgency: "normal",
    suggestions: ["Browse the shop", "I have another question"],
    products: [],
    notes: [],
  };
}

function buildInteractionReply(drugA: DrugEntry, drugB: DrugEntry): ConsultResult {
  const interaction = findInteraction(drugA.id, drugB.id);

  const reply = interaction
    ? `**${drugA.title} + ${drugB.title}** — ${VERDICT_WORD[interaction.verdict]}\n\n${interaction.advice}\n\n${
        interaction.verdict === "safe"
          ? "If either medicine is new for you and you notice anything unusual — rash, swelling, stomach upset — stop and check with a pharmacist."
          : "Whenever you're unsure about a combination, bring both packs to any Pulse Pharma counter and a pharmacist will review them with you."
      }`
    : `**${drugA.title} + ${drugB.title}** — ℹ️ No well-known direct interaction between these two.\n\nThat said, "no known interaction" isn't the same as "always fine" — it depends on your doses, your health conditions, and anything else you take. If you're combining them regularly, it's worth a quick check with a pharmacist in person.`;

  return {
    reply,
    urgency: interaction?.verdict === "avoid" ? "urgent" : "normal",
    suggestions: [
      `What is ${drugA.title.split(" (")[0]} used for?`,
      `What is ${drugB.title.split(" (")[0]} used for?`,
      "What do you stock for pain relief?",
    ],
    products: [],
    notes: [`Interaction check: ${drugA.title.split(" (")[0]} + ${drugB.title.split(" (")[0]}`],
    topicTitle: "Medicine safety check",
  };
}

function buildDrugReply(
  drug: DrugEntry,
  details: ConsultDetails,
  catalogue: CatalogueProduct[],
  isFollowUp: boolean
): ConsultResult {
  const opener = buildOpener(details, isFollowUp);
  const sections: string[] = [];

  sections.push(`${opener}**${drug.title}** — *${drug.drugClass}*\n\n${drug.about}`);

  sections.push(`**What it's used for**\n${bullets(cap(drug.uses, 3))}`);

  // Dosing — adults only. Children and pregnancy get a careful redirect.
  if (drug.adultDose) {
    if (details.isChild) {
      sections.push(
        `**About dosing**\nSince this is for a child, I won't give a dose here — children's doses depend on age and weight, and getting it wrong is risky. Bring the child (or their weight) to any pharmacy counter and the pharmacist will measure it out exactly for you.`
      );
    } else if (details.pregnant) {
      sections.push(
        `**About dosing during pregnancy**\nBecause you're pregnant, please confirm the dose with your midwife or doctor first — pregnancy changes what's safe and how much. ${drug.id === "paracetamol" ? "Paracetamol is generally the preferred painkiller in pregnancy, but your health worker should still sign off on dose and duration." : ""}`
      );
    } else {
      sections.push(`**How it's taken (adults)**\n${drug.adultDose}`);
    }
  }

  sections.push(`**Side effects to expect**\n${bullets(cap(drug.sideEffects, 2))}`);
  sections.push(`**Be careful if…**\n${bullets(cap(drug.warnings, 2))}`);

  if (drug.requiresPrescriptionNote) {
    sections.push(
      `📋 This one is **prescription-only** — you'll need a valid prescription. You can upload yours on the [Upload Prescription](/upload-prescription) page and we'll have it verified before checkout.`
    );
  }

  const products: ConsultProduct[] = [];
  if (drug.stockName) {
    const product = findProduct(catalogue, drug.stockName);
    if (product) {
      products.push({ ...product, note: `What we stock` });
      sections.push(`💡 You can get **${product.name}** in our shop — I've attached it below.`);
    }
  }

  const firstName = drug.title.split(" (")[0];
  return {
    reply: sections.join("\n\n"),
    urgency: "normal",
    suggestions: [
      `Can I take ${firstName} with paracetamol?`,
      ...drug.relatedTopicIds.slice(0, 2).map((id) => {
        const t = findCondition(id);
        return t ? `I think I have ${t.title.toLowerCase()}` : "What do you stock?";
      }),
      "What are the side effects?",
    ],
    products,
    notes: buildNotes(details),
    topicTitle: drug.title,
  };
}

function buildConditionReply(
  condition: ConditionEntry,
  details: ConsultDetails,
  catalogue: CatalogueProduct[],
  isFollowUp: boolean
): ConsultResult {
  const opener = buildOpener(details, isFollowUp);
  const sections: string[] = [];
  let urgency: Urgency = "normal";

  sections.push(`${opener}**${condition.title}** — ${condition.summary}`);

  sections.push(`**What's likely going on**\n${bullets(cap(condition.possibleCauses, 2))}`);

  // Self-care, tailored to the details we hold.
  const selfCare = [...cap(condition.selfCare, 3)];
  if (details.pregnant) {
    selfCare.push(
      "⚠️ Since you're pregnant, treat ibuprofen-type painkillers as off-limits and confirm anything with your midwife — and mention these symptoms at your next visit."
    );
    urgency = "urgent";
  }
  if (details.breastfeeding) {
    selfCare.push("Since you're breastfeeding, confirm medicines with a pharmacist first — some pass into breast milk.");
  }
  if (details.isChild) {
    selfCare.push(
      details.ageMonths != null && details.ageMonths < 6
        ? "👶 At this age, don't give any medicine without professional advice — see a health worker the same day."
        : "👶 For a child this age, doses are worked out by weight — let a pharmacist dose it exactly rather than estimating."
    );
  }
  if (details.severity === "severe") {
    selfCare.push("Given how severe you say it is, don't push through — strong, worsening pain deserves same-day review.");
    urgency = "urgent";
  }

  // Duration escalation — attentive to how long this has dragged on.
  const escalation = ESCALATION_DAYS[condition.id];
  if (escalation != null && details.durationDays != null && details.durationDays >= escalation) {
    urgency = "urgent";
    selfCare.push(
      `⏱️ You've mentioned this has lasted **${details.durationLabel}** — that's past the window for home care. Please see a health worker **within 24 hours** even if it feels manageable.`
    );
  }

  // Ghana-specific attentiveness: fever + aches ⇒ rule malaria out.
  const feverish = details.fever || details.symptoms.includes("fever");
  const malariaRelevant = ["headache", "fever", "malaria", "flu", "body aches"].includes(condition.id) || details.symptoms.includes("body aches");
  if (feverish && malariaRelevant && condition.id !== "malaria") {
    selfCare.push(
      "🦟 One more thing — here in Ghana, a fever with headache/body aches deserves a **malaria test** (a quick finger-prick at any pharmacy or lab). Don't treat blind."
    );
  }

  sections.push(`**What you can do now**\n${bullets(selfCare)}`);

  if (condition.seeDoctor.length) {
    sections.push(`**Get seen in person if…**\n${bullets(cap(condition.seeDoctor, 3))}`);
  }

  // Products — real, in-shop items with a "why" note each. Ibuprofen is
  // filtered out during pregnancy/breastfeeding, whatever the topic.
  const products: ConsultProduct[] = [];
  const attached: string[] = [];
  const nsaidRe = /ibuprofen|brufen|advil|nurofen|aspirin/i;
  for (const suggestion of condition.medicineSuggestions) {
    if (suggestion.stockName) {
      if ((details.pregnant || details.breastfeeding) && nsaidRe.test(suggestion.stockName)) {
        continue;
      }
      const product = findProduct(catalogue, suggestion.stockName);
      if (product) {
        products.push({ ...product, note: suggestion.note });
        attached.push(product.name);
      }
    }
  }
  if (attached.length) {
    sections.push(`💡 We stock what you need for this — I've attached them below for a closer look.`);
  }

  const followUpQuestion = buildFollowUpQuestion(condition, details);

  // Tappable quick replies the user can answer with, focused on what we
  // still don't know about their situation.
  const suggestions: string[] = [];
  if (details.durationDays == null) {
    suggestions.push("It started today", "About 3 days now", "Over a week");
  }
  const feverRelevant = ["malaria", "fever", "headache", "cough", "flu", "cold", "sore-throat"].includes(condition.id);
  if (feverRelevant && !details.fever) {
    suggestions.push("I also feel feverish", "No fever, just this");
  }
  suggestions.push("What do you stock for this?", "When should I see a doctor?");

  return {
    reply: sections.join("\n\n") + followUpQuestion,
    urgency,
    suggestions: suggestions.slice(0, 4),
    products,
    notes: buildNotes(details),
    topicTitle: condition.title,
  };
}

function buildUnknownMedicineReply(userText: string): ConsultResult {
  const guess =
    userText
      .replace(/^(what|who) (is|are) |tell me about |what about /gi, "")
      .replace(/\b(used? (for|to)|good for|meant for|taken? for)\b/gi, "")
      .replace(/\b(tablets?|capsules?|drugs?|medicine|syrup|sachet|injection)s?\b/gi, "")
      .replace(/\b(for|to|with|at|in|on)\s*$/gi, "")
      .replace(/[^a-zA-Z0-9 ()&-]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join(" ") || "that medicine";

  return {
    reply: `I want to give you accurate information, and I don't have **${guess}** in my guide yet — I'd rather say that honestly than guess with medicine.\n\nA few good options:\n- Browse our [shop](/shop) — if we stock it, the product page has full details\n- Bring the pack to any pharmacy counter and a pharmacist will walk you through it\n- Or tell me the **symptoms** you're treating, and I'll guide you to the right option\n\nWhat are you hoping to treat? I can definitely help with that.`,
    urgency: "normal",
    suggestions: ["Browse the shop", "Let me describe my symptoms instead"],
    products: [],
    notes: [],
  };
}

function buildFallbackReply(details?: ConsultDetails): ConsultResult {
  const pregnancyLine =
    details?.pregnant || details?.breastfeeding
      ? `\n\nAnd since you mentioned you're **${details?.pregnant ? "pregnant" : "breastfeeding"}** — please always include that when you speak to any health worker; it changes what's safe.`
      : "";
  return {
    reply: `I want to guide you accurately, so let me ask: could you tell me a little more?\n\n- **What are you feeling?** — symptoms and where\n- **Since when?** — hours, days, weeks\n- **Who is it for?** — you, a child, an elderly relative\n- **Any medicines** already being taken?\n\nFor example: *"I've had a headache for 3 days with fever, I'm 28."* That gives me everything I need to help properly. 💬${pregnancyLine}`,
    urgency: "normal",
    suggestions: ["I have a headache and fever", "My child has diarrhoea", "What is amoxicillin used for?"],
    products: [],
    notes: buildNotes(details ?? {
      symptoms: [], drugIds: [], isChild: false, pregnant: false, breastfeeding: false, fever: false,
    }),
  };
}

/* ─────────────────────────── MAIN ENTRY ─────────────────────────── */

export function respond(input: {
  messages: ChatTurn[];
  catalogue: CatalogueProduct[];
  userName?: string;
}): ConsultResult {
  const { messages, catalogue, userName } = input;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  if (!lastUser || !lastUser.content.trim()) {
    return buildGreetingReply(extractDetails(messages), userName);
  }

  const text = lastUser.content.trim();
  const lower = text.toLowerCase();
  const details = extractDetails(messages);
  const isFirstUserMessage = messages.filter((m) => m.role === "user").length === 1;
  const isShort = text.split(/\s+/).length <= 5;
  const hasMedicalContent = matchDrugs(lower).length > 0 || !!matchCondition(lower);

  /* 1 ── EMERGENCIES FIRST. Always. */
  const flag = isEmergency(text);
  if (flag) return buildEmergencyReply(flag);

  /* 1.5 ── Emergency follow-through: stay in support mode after a red flag. */
  const hadEmergencyEarlier = messages
    .slice(0, -1)
    .some((m) => m.role === "user" && isEmergency(m.content) !== null);
  const asksFacility =
    /\b(nearest|closest)\b[^.?!]{0,24}\b(hospital|clinic|er|emergency)\b|\bhow do i get to a hospital\b/i.test(text);
  const saysCalled =
    /\b(i'?ve |i )?(called|calling|dial(ed|led)|rang)\b[^.?!]{0,12}\b(112|911|999|ambulance)\b|\bambulance (is )?(on (its|the) way|coming)\b/i.test(text);
  const asksCalm = /\b(calm|panic(king)?|scared|afraid|anxious|freaking out)\b/i.test(text);

  if (!flag && asksFacility) {
    return {
      reply: `I can't see your location, so here's the fastest way to real help:\n\n- **Call 112** — the operator can dispatch an ambulance and direct you to the nearest emergency unit.\n- Ask someone nearby to point you to the closest hospital or clinic — in an emergency, nearest beats best.\n- If you have a maps app, search "**hospital emergency**" — it shows the closest one with travel time.\n\nDon't wait for the "right" hospital. Go to whoever can see you soonest. 🙏`,
      urgency: "urgent",
      suggestions: ["I've called 112", "I need help staying calm"],
      products: [],
      notes: ["🚨 Emergency support"],
      topicTitle: "Emergency",
    };
  }

  if (!flag && hadEmergencyEarlier && (saysCalled || asksCalm || (isShort && !hasMedicalContent))) {
    if (saysCalled) {
      return {
        reply: `Well done — that was exactly the right call. 💙 While help is on the way:\n\n- **Stay with the person** (or stay put if it's you) — don't lock doors a responder may need to open\n- Keep any **medicines or packaging** involved within reach to hand over\n- If symptoms change suddenly — breathing, consciousness, bleeding — call 112 again immediately\n- If it's safe, have someone wait outside to guide the ambulance in\n\nYou did the right thing. Stay on the line with them until help arrives.`,
        urgency: "urgent",
        suggestions: ["I need help staying calm", "The ambulance has arrived"],
        products: [],
        notes: ["🚨 Emergency — help called"],
        topicTitle: "Emergency",
      };
    }
    if (asksCalm) {
      return {
        reply: `I know this feels frightening — let's steady things together, right now:\n\n- **Breathe with me**: in slowly for 4 counts, hold for 4, out gently for 6. Repeat it five times.\n- **Sit or lie down** somewhere safe — don't fight dizziness standing up.\n- **Unlock the door** so responders can reach you, and stay on the line with 112.\n- Sip of water if your mouth is dry — small, slow sips.\n\nYou're doing the right things. Help has been called, and that was the hard part. Stay with me. 💙`,
        urgency: "urgent",
        suggestions: ["Okay, I'm breathing", "The ambulance is here"],
        products: [],
        notes: ["🚨 Emergency — staying calm"],
        topicTitle: "Emergency",
      };
    }
    return {
      reply: `I'm still with you. 🙏 You did the right thing getting emergency help.\n\n- Keep the person **still, warm and reassured** while you wait\n- **Don't give food, drink or medicines** unless emergency services tell you to\n- If anything changes — breathing, responsiveness, bleeding — **call 112 again** right away\n\nTell me what's happening now and I'll stay here with you.`,
      urgency: "urgent",
      suggestions: ["I've called 112", "I need help staying calm", "The ambulance has arrived"],
      products: [],
      notes: ["🚨 Emergency support"],
      topicTitle: "Emergency",
    };
  }

  /* 2 ── Social turns (only when there's no medical content in the message). */
  if (isShort && !hasMedicalContent) {
    if (/^(hi|hello|hey|good (morning|afternoon|evening)|howdy|greetings)\b/i.test(text)) {
      return buildGreetingReply(details, userName);
    }
    if (/\b(thank|thanks|appreciate|god bless)\b/i.test(text)) {
      return buildThanksReply();
    }
    if (/^(bye|goodbye|good ?night|see you)\b/i.test(text)) {
      return {
        reply: `Goodbye, and take good care of yourself! 🌿 Remember: **112** for emergencies, and I'm right here whenever you need guidance. Your health, just a tap away. ❤️`,
        urgency: "normal",
        suggestions: ["I'm back — I have a question"],
        products: [],
        notes: [],
      };
    }
  }

  /* 3 ── Interaction check: two known medicines in one question. Naming two
         medicines together is itself the question — no connector required. */
  const mentionedDrugs = matchDrugs(text);
  if (mentionedDrugs.length >= 2) {
    return buildInteractionReply(mentionedDrugs[0], mentionedDrugs[1]);
  }

  /* 4 ── Medicine question in this message. */
  if (mentionedDrugs.length > 0) {
    const drug = mentionedDrugs[0];
    const isFollowUp = !isFirstUserMessage;
    return buildDrugReply(drug, details, catalogue, isFollowUp);
  }

  /* 5 ── Illness/symptom question in this message. */
  const condition = matchCondition(lower);
  if (condition) {
    const isFollowUp = !isFirstUserMessage;
    return buildConditionReply(condition, details, catalogue, isFollowUp);
  }

  /* 6 ── Follow-up on the active topic: the user answered our question or
         added details ("it's been 3 days", "yes, and now I'm feverish"). */
  const activeTopic = findActiveTopic(messages);
  const addedDetail =
    details.durationDays != null ||
    details.fever ||
    details.severity != null ||
    details.symptoms.length > 0 ||
    details.pregnant ||
    details.isChild;
  if (activeTopic.condition && addedDetail) {
    return buildConditionReply(activeTopic.condition, details, catalogue, true);
  }
  if (activeTopic.drug) {
    return buildDrugReply(activeTopic.drug, details, catalogue, true);
  }

  /* 7 ── Asking about a medicine we don't know. */
  if (/\b(tablet|tablets|capsule|capsules|drug|medicine|syrup|sachet|injection)\b/i.test(lower)) {
    return buildUnknownMedicineReply(text);
  }

  /* 8 ── Can't tell yet — ask for the details that matter. */
  return buildFallbackReply(details);
}
