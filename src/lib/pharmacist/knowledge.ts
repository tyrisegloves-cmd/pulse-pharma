/**
 * src/lib/pharmacist/knowledge.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Knowledge base for the "Ask Your Pharmacist" consult engine.
 *
 * Everything here is plain data — no imports — so the engine stays testable
 * and the content is easy for a pharmacist to review and extend.
 *
 * SCOPE: general, widely-accepted over-the-counter guidance (Ghana context).
 * The engine NEVER diagnoses, never gives pediatric doses, and always
 * defers to an in-person professional for confirmation. When editing an
 * entry, keep advice conservative and dosing to standard adult label ranges.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * A medicine the assistant can discuss. `names` are lowercase trigger terms
 * matched against the user's message. `stockName` is the exact product name
 * in the shop database (matched case-insensitively by the API) so replies
 * can link to real, purchasable items; omit it when we don't stock the item.
 */
export interface DrugEntry {
  id: string;
  names: string[];
  title: string;
  drugClass: string;
  about: string;
  uses: string[];
  /** Standard adult label dosing — never shown for children. */
  adultDose?: string;
  sideEffects: string[];
  warnings: string[];
  stockName?: string;
  requiresPrescriptionNote?: boolean;
  relatedTopicIds: string[];
}

/**
 * An illness / complaint the assistant recognises. `keywords` are lowercase
 * trigger terms; `followUps` are the clarifying questions the engine asks
 * when the user hasn't already provided those details.
 */
export interface ConditionEntry {
  id: string;
  keywords: string[];
  title: string;
  summary: string;
  possibleCauses: string[];
  selfCare: string[];
  /** Suggestions — `stockName` links to a shop product, plain `name` means "look for this at any pharmacy". */
  medicineSuggestions: { note: string; stockName?: string; name?: string }[];
  seeDoctor: string[];
  followUps: string[];
}

/* ─────────────────────────────── DRUGS ─────────────────────────────── */

export const DRUGS: DrugEntry[] = [
  {
    id: "paracetamol",
    names: ["paracetamol", "panadol", "acetaminophen", "tylenol", "panadol extra"],
    title: "Paracetamol (Panadol)",
    drugClass: "Painkiller & fever reducer",
    about:
      "Paracetamol is a gentle, first-line painkiller and fever reducer. It is easy on the stomach, which is why it is usually the safest starting point for most adults, including during pregnancy (after confirming with a health worker).",
    uses: [
      "Headaches and migraines",
      "Fever and fever-related body aches",
      "Toothache, period pain and general body pain",
    ],
    adultDose:
      "Adults: 1–2 tablets of 500mg every 4–6 hours when needed. **Never exceed 8 tablets (4,000mg) in 24 hours**, and remember some cold/flu combinations already contain paracetamol — count those in.",
    sideEffects: [
      "Rare at normal doses",
      "Overdose quietly damages the liver — this is the main danger",
    ],
    warnings: [
      "Do not drink heavily while using it regularly — alcohol plus paracetamol strains the liver",
      "If you take blood thinners like warfarin regularly, check with a pharmacist first",
    ],
    stockName: "Paracetamol 500mg (Panadol)",
    relatedTopicIds: ["headache", "fever", "toothache", "period-cramps", "cold"],
  },
  {
    id: "ibuprofen",
    names: ["ibuprofen", "brufen", "advil", "nurofen", "nsaid"],
    title: "Ibuprofen (Brufen)",
    drugClass: "Anti-inflammatory painkiller (NSAID)",
    about:
      "Ibuprofen is a stronger anti-inflammatory painkiller. It works especially well for pain that comes with swelling or inflammation — cramps, dental pain, back pain, joint pain. The trade-off is that it can irritate the stomach, so food matters.",
    uses: [
      "Period cramps, dental pain, back and joint pain",
      "Pain with swelling or inflammation",
      "Fever that paracetamol alone isn't settling",
    ],
    adultDose:
      "Adults: 1 tablet of 400mg every 6–8 hours **with food or milk**, up to 3 tablets (1,200mg) in 24 hours for over-the-counter use.",
    sideEffects: [
      "Stomach irritation, indigestion or heartburn",
      "In some people it can trigger or worsen asthma",
    ],
    warnings: [
      "Avoid with stomach ulcers, kidney problems, or if you are pregnant (especially the last 3 months)",
      "Not for babies under 3 months — dosing for children should be confirmed with a pharmacist",
      "Be careful combining it with other NSAIDs like aspirin",
    ],
    stockName: "Ibuprofen 400mg (Brufen)",
    relatedTopicIds: ["period-cramps", "toothache", "back-pain", "headache", "migraine"],
  },
  {
    id: "amoxicillin",
    names: ["amoxicillin", "amoxil", "amoxycillin"],
    title: "Amoxicillin",
    drugClass: "Antibiotic (penicillin family)",
    about:
      "Amoxicillin is a prescription antibiotic for confirmed bacterial infections — chest, ear, throat, dental and urinary infections. It does nothing for viruses, so it will not help a common cold or flu.",
    uses: [
      "Bacterial chest, ear, throat and urinary infections",
      "Dental infections (alongside dental treatment)",
    ],
    adultDose:
      "Adults: typically 1 capsule of 500mg every 8 hours, for the full course prescribed — usually 5 to 7 days. Your prescriber sets the exact course.",
    sideEffects: [
      "Nausea, mild diarrhoea, and sometimes a rash",
      "See a doctor urgently for hives, facial swelling or trouble breathing — that is an allergic reaction",
    ],
    warnings: [
      "Prescription-only in Ghana — a clinician must confirm the infection first",
      "Finish every dose even when you feel better; stopping early breeds resistance",
      "Tell your prescriber if you have ever reacted to penicillin",
    ],
    stockName: "Amoxicillin 500mg Capsules",
    requiresPrescriptionNote: true,
    relatedTopicIds: ["sore-throat", "uti", "cough", "toothache"],
  },
  {
    id: "coartem",
    names: ["coartem", "artemether", "lumefantrine", "malaria drug", "anti-malaria", "antimalarial"],
    title: "Coartem (artemether/lumefantrine)",
    drugClass: "Anti-malarial",
    about:
      "Coartem is the standard first-line treatment for **uncomplicated malaria** in Ghana. It works quickly, but it should only be started **after a positive malaria test** — treating blindly can mask something else that also needs attention.",
    uses: ["Treatment of uncomplicated, confirmed malaria in adults and children"],
    adultDose:
      "It comes as a 3-day course (usually 4 tablets twice a day for adults) — the exact number depends on weight and age. **Take it with a fatty food or milk**; on an empty stomach the body absorbs far too little of it.",
    sideEffects: [
      "Dizziness, mild nausea and disturbed sleep are the common ones",
      "It can briefly affect the heartbeat — tell your pharmacist if you have a heart rhythm condition",
    ],
    warnings: [
      "Get a malaria test (RDT at a pharmacy or lab) before starting — treatment without confirmation is guesswork",
      "Complete all 6 doses over the 3 days even if you feel fine after day one",
      "Not suitable in the first 3 months of pregnancy without medical advice",
    ],
    stockName: "Coartem Tablets 80/40",
    relatedTopicIds: ["malaria", "fever"],
  },
  {
    id: "metformin",
    names: ["metformin", "glucophage"],
    title: "Metformin",
    drugClass: "Diabetes medicine (biguanide)",
    about:
      "Metformin is the first-line medicine for **type 2 diabetes**. It lowers blood sugar mainly by reducing what the liver releases and helping insulin work better. It is long-term therapy, not a quick fix — consistency matters more than perfection.",
    uses: ["Type 2 diabetes, sometimes alongside other diabetes medicines"],
    adultDose:
      "Usually taken **with or just after meals** to reduce stomach upset — often once or twice daily as prescribed. Never change your dose on your own.",
    sideEffects: [
      "Nausea, loose stools and a metallic taste, especially in the first weeks",
      "Long-term use can lower vitamin B12 — worth checking at your reviews",
    ],
    warnings: [
      "Avoid binge drinking — alcohol plus metformin is hard on the body",
      "Pause and call your prescriber before any scan using contrast dye, or if you become seriously dehydrated (severe vomiting/diarrhoea)",
      "If you feel unwell with deep, rapid breathing and extreme tiredness, seek care urgently",
    ],
    stockName: "Metformin 500mg",
    requiresPrescriptionNote: true,
    relatedTopicIds: ["diabetes"],
  },
  {
    id: "amlodipine",
    names: ["amlodipine", "norvasc"],
    title: "Amlodipine",
    drugClass: "Blood pressure medicine (calcium channel blocker)",
    about:
      "Amlodipine relaxes the blood vessels so the heart pumps against less resistance. It is taken once daily for the long-term control of **high blood pressure** — it works quietly, so you often won't *feel* it working.",
    uses: ["High blood pressure", "Certain types of chest pain (angina)"],
    adultDose:
      "One tablet once daily, at roughly the same time each day — 5mg or 10mg as prescribed. It is about routine, not about chasing symptoms.",
    sideEffects: [
      "Ankle swelling, flushing, and sometimes headache or dizziness in the first weeks",
      "Report chest pain that is new or worsening while on it",
    ],
    warnings: [
      "Never stop suddenly because you 'feel fine' — BP often rebounds quietly",
      "Stand up slowly at first; the medicine can make you light-headed",
      "Tell your pharmacist before adding painkillers like ibuprofen — they can push BP up",
    ],
    stockName: "Amlodipine 5mg",
    requiresPrescriptionNote: true,
    relatedTopicIds: ["hypertension"],
  },
  {
    id: "vitamin-c",
    names: ["vitamin c", "ascorbic acid", "vit c", "sodium ascorbate"],
    title: "Vitamin C",
    drugClass: "Vitamin / supplement",
    about:
      "Vitamin C supports the immune system, helps iron absorption and aids recovery during illness. It does not cure colds, but steady intake while unwell can mildly shorten and soften them.",
    uses: [
      "Immune support during and after illness",
      "Helping iron absorption (useful in anaemia care)",
      "General wellness",
    ],
    adultDose:
      "One 1,000mg effervescent tablet dissolved in water, once daily is plenty. Drop it into water, let it finish fizzing, then drink.",
    sideEffects: [
      "High doses can cause stomach upset and loose stools",
      "Very high long-term doses can raise kidney-stone risk in susceptible people",
    ],
    warnings: [
      "Effervescent tablets contain sodium — fine for most people, but worth knowing if you are salt-restricted",
      "Supplements support treatment; they don't replace it",
    ],
    stockName: "Vitamin C 1000mg Effervescent",
    relatedTopicIds: ["cold", "wellness"],
  },
  {
    id: "ors",
    names: ["ors", "oral rehydration", "oral rehydration salts", "rehydration"],
    title: "Oral Rehydration Salts (ORS)",
    drugClass: "Rehydration therapy",
    about:
      "ORS is the single most important treatment for dehydration from diarrhoea or vomiting — for adults and especially for children. It replaces the water and salts the body is losing; plain water alone does not.",
    uses: ["Dehydration from diarrhoea, vomiting, or fever"],
    adultDose:
      "Dissolve one sachet in exactly **1 litre of clean, safe water** (not more, not less) and sip continuously. Small frequent sips beat big gulps, especially when nauseous.",
    sideEffects: ["None at correct preparation", "Vomiting more if gulped too fast — pause 10 minutes, then resume slowly"],
    warnings: [
      "Discard any mixed solution after 24 hours",
      "For babies and small children, continued vomiting or reduced urine means see a doctor now",
    ],
    relatedTopicIds: ["diarrhoea", "food-poisoning", "fever"],
  },
  {
    id: "antihistamine",
    names: ["antihistamine", "piriton", "chlorpheniramine", "cetirizine", "loratadine", "zyrtec", "allergy tablet"],
    title: "Antihistamines (e.g. Piriton, cetirizine)",
    drugClass: "Allergy medicine",
    about:
      "Antihistamines calm allergic reactions — sneezing, itchy eyes, rashes, hives and insect-bite reactions. Older ones like Piriton (chlorpheniramine) are effective but cause drowsiness; newer ones like cetirizine are much less sedating.",
    uses: ["Allergic rashes and hives", "Sneezing and itchy eyes", "Insect bite reactions"],
    adultDose:
      "Piriton: 1 tablet of 4mg every 4–6 hours (it will likely make you sleepy — don't drive after taking it). Cetirizine: 1 tablet of 10mg once daily, far less drowsy.",
    sideEffects: [
      "Drowsiness (especially Piriton) and dry mouth",
      "Occasionally the opposite in children — they become restless",
    ],
    warnings: [
      "Do not combine with alcohol or other sedating medicines",
      "Swelling of the lips, tongue or throat with breathing trouble is an emergency — that is not a tablet situation",
    ],
    relatedTopicIds: ["allergy", "cold"],
  },
  {
    id: "antacid",
    names: ["antacid", "omeprazole", "gaviscon", "esomeprazole", "nexium", "losec", "ppi"],
    title: "Antacids & acid controllers (e.g. omeprazole, Gaviscon)",
    drugClass: "Stomach acid medicine",
    about:
      "Antacids like Gaviscon neutralise acid within minutes; acid controllers like omeprazole switch acid production down for longer relief. Short-term use is fine; weeks of daily heartburn deserves a proper look.",
    uses: ["Heartburn and acid reflux", "Indigestion", "Stomach pain from excess acid"],
    adultDose:
      "Gaviscon: 10–20ml after meals and at bedtime. Omeprazole: 1 capsule of 20mg once daily before breakfast, usually for up to 14 days for self-care.",
    sideEffects: ["Wind, mild stomach changes", "Omeprazole used for months at a time can affect B12 and magnesium — not a self-care drug forever"],
    warnings: [
      "Heartburn most days for several weeks, difficulty swallowing, or unexplained weight loss needs a doctor, not more antacid",
      "Space omeprazole about 2 hours away from other medicines",
    ],
    relatedTopicIds: ["heartburn", "indigestion"],
  },
];

/* ──────────────────────────── CONDITIONS ──────────────────────────── */

export const CONDITIONS: ConditionEntry[] = [
  {
    id: "malaria",
    keywords: ["malaria", "mosquito", "rigors", "chills and fever"],
    title: "Malaria",
    summary:
      "Malaria is common in Ghana and usually starts with fever, headache, chills, body aches and tiredness — often mistaken for 'ordinary fever'. A simple finger-prick test (RDT) at a pharmacy or lab confirms it in minutes, so **never treat on suspicion alone**.",
    possibleCauses: [
      "Mosquito bites — risk is highest in the rainy season and at dawn/dusk",
      "It can return if a previous course of treatment wasn't completed",
    ],
    selfCare: [
      "Get tested first — a positive test is what guides the right treatment",
      "Rest, fluids, and paracetamol for the fever and aches while you arrange the test",
      "Sleep under a treated mosquito net and cover up at dusk going forward",
    ],
    medicineSuggestions: [
      { note: "For the fever and body aches while you get tested", stockName: "Paracetamol 500mg (Panadol)" },
      { note: "Standard first-line treatment once a test confirms malaria", stockName: "Coartem Tablets 80/40" },
    ],
    seeDoctor: [
      "Vomiting everything, confusion, yellow eyes, dark urine or fainting — same day, urgently",
      "Any malaria in pregnancy, or in a baby under 6 months",
      "Still feverish 48 hours after finishing treatment",
    ],
    followUps: ["How long have you had the fever?", "Any chills, vomiting, or body aches with it?", "Have you been able to eat and drink normally?"],
  },
  {
    id: "headache",
    keywords: ["headache", "head ache", "head pain", "head is pounding", "pounding head"],
    title: "Headache",
    summary:
      "Most headaches come from tension, dehydration, missed meals, screen strain, or fever — and settle with simple care. The pattern that matters is one that is severe, unusual for you, or dragging on for days.",
    possibleCauses: [
      "Tension — stress, long screen hours, poor sleep or posture",
      "Dehydration, hunger, or too little sleep",
      "Fever or illness (including malaria — very common here)",
    ],
    selfCare: [
      "Drink 2–3 glasses of water now — dehydration headache is the most common kind",
      "Rest your eyes off screens for 30–60 minutes, in a quiet dim room if you can",
      "Paracetamol first; ibuprofen with food if the pain has an inflammatory edge",
    ],
    medicineSuggestions: [
      { note: "First choice — gentle on the stomach", stockName: "Paracetamol 500mg (Panadol)" },
      { note: "Stronger option if there's tension or swelling — take with food", stockName: "Ibuprofen 400mg (Brufen)" },
    ],
    seeDoctor: [
      "A headache that is sudden and 'the worst ever', or with confusion, stiff neck, vision changes or weakness — emergency",
      "Daily for more than 2 weeks, or waking you from sleep",
    ],
    followUps: ["How many days has it been going on?", "Any fever alongside it?", "Are you drinking enough water these days?"],
  },
  {
    id: "migraine",
    keywords: ["migraine", "throbbing one side", "light hurts my eyes", "sensitive to light"],
    title: "Migraine",
    summary:
      "A migraine is more than a headache — typically a one-sided, throbbing pain with nausea and real sensitivity to light or sound, strong enough to stop normal activity. Attacks can last from 4 hours to 3 days.",
    possibleCauses: [
      "Triggers differ per person — stress, missed meals, poor sleep, strong smells, bright light, hormonal changes",
      "Some people notice an 'aura' — flashing lights or zigzag lines before the pain",
    ],
    selfCare: [
      "At the first sign: a dark, quiet room and slow fluids help more than pushing through",
      "Ibuprofen with food early in the attack works better than late",
      "Start noting your triggers — pattern-spotting is genuinely the best long-term treatment",
    ],
    medicineSuggestions: [
      { note: "Take early in the attack, with food", stockName: "Ibuprofen 400mg (Brufen)" },
      { note: "Alternative if ibuprofen doesn't suit your stomach", stockName: "Paracetamol 500mg (Panadol)" },
    ],
    seeDoctor: [
      "Attacks more than 4 times a month, or new 'worst ever' pattern — preventive treatment exists",
      "Any weakness, confusion or fainting with the attack — emergency",
    ],
    followUps: ["Does the pain sit on one side, with light bothering you?", "How long do these attacks usually last?", "Have you noticed what tends to set them off?"],
  },
  {
    id: "fever",
    keywords: ["fever", "high temperature", "hot body", "temperature is high", "running temperature", "shivering"],
    title: "Fever",
    summary:
      "Fever is the body fighting something — most often an infection, and in Ghana malaria is the first thing worth ruling out. The fever itself is less important than how the person is coping alongside it.",
    possibleCauses: ["Viral infections (colds, flu)", "Malaria — test to be sure", "Bacterial infections (throat, urine, chest)"],
    selfCare: [
      "Get a malaria test — in Ghana this is step one for any fever lasting beyond a day",
      "Paracetamol for the fever, light clothing, tepid sponging helps too",
      "Fluids constantly: water, soup, ORS if eating and drinking poorly",
    ],
    medicineSuggestions: [
      { note: "Brings the temperature down and eases aches", stockName: "Paracetamol 500mg (Panadol)" },
      { note: "For replacing fluids if there's vomiting or diarrhoea too", name: "Oral rehydration salts (ORS)" },
    ],
    seeDoctor: [
      "Any fever in a baby under 3 months — go now, don't wait",
      "Fever above 3 days, or with stiff neck, confusion, rash, or breathing difficulty",
    ],
    followUps: ["How long has the fever lasted?", "Any headache, chills or body aches with it?", "Have you done a malaria test yet?"],
  },
  {
    id: "cold",
    keywords: ["cold", "catarrh", "runny nose", "blocked nose", "sneezing", "common cold"],
    title: "Common cold",
    summary:
      "A cold is a viral infection — sneezing, runny or blocked nose, mild sore throat, maybe a low fever. It runs its course in 7–10 days; antibiotics do not shorten it, no matter how tempting.",
    possibleCauses: ["Viruses — spread easily by hands and sneezes", "Low immunity from stress or poor sleep lets them in more easily"],
    selfCare: [
      "Fluids and rest are the real treatment — the rest is comfort control",
      "Warm steam inhalation for the blocked nose, especially at night",
      "Vitamin C and a warm drink with honey and lemon genuinely take the edge off",
    ],
    medicineSuggestions: [
      { note: "Supports recovery while the cold runs its course", stockName: "Vitamin C 1000mg Effervescent" },
      { note: "For any fever, aches or headache with it", stockName: "Paracetamol 500mg (Panadol)" },
      { note: "A sedating antihistamine helps night-time sneezing and runny nose", name: "Piriton (chlorpheniramine) at night" },
    ],
    seeDoctor: [
      "Symptoms beyond 10 days, chest pain, breathing difficulty, or a fever that climbs after day 3",
      "Asthma getting worse with the cold",
    ],
    followUps: ["Is it mostly the nose and sneezing, or is there a cough too?", "Any fever with it?", "How many days in are you?"],
  },
  {
    id: "cough",
    keywords: ["cough", "coughing", "chest tight", "wheezing"],
    title: "Cough",
    summary:
      "A cough is how the airways clear themselves. Most are viral and settle within 2–3 weeks. What matters is the type — dry and tickly versus chesty and bringing up phlegm — and whether it comes with fever, weight loss or breathlessness.",
    possibleCauses: ["Post-cold airway irritation — the most common", "Chest infection (needs review if fever or fast breathing)", "Reflux or dust/allergies for stubborn dry coughs"],
    selfCare: [
      "Warm fluids through the day — honey with warm water or tea genuinely soothes (not for babies under 1 year)",
      "Steam inhalation morning and night loosens chest mucus",
      "Smoke makes every cough worse and longer — worth pausing while you recover",
    ],
    medicineSuggestions: [
      { note: "Supports immunity while you recover", stockName: "Vitamin C 1000mg Effervescent" },
      { note: "For any fever or chest ache with the cough", stockName: "Paracetamol 500mg (Panadol)" },
    ],
    seeDoctor: [
      "Cough beyond 3 weeks, coughing blood, weight loss or drenching night sweats — same week, could be TB and is very treatable",
      "Breathing difficulty, chest pain, or a child breathing fast or 'drawing in' under the ribs — urgently",
    ],
    followUps: ["Is it dry and tickly, or chesty with phlegm?", "Any fever alongside it?", "How long have you been coughing?"],
  },
  {
    id: "sore-throat",
    keywords: ["sore throat", "throat pain", "painful swallow", "hurts to swallow", "swallowing"],
    title: "Sore throat",
    summary:
      "Most sore throats are viral and settle within a week. A very painful throat with high fever, white patches on the tonsils or swollen glands in the neck is more likely bacterial and worth a proper look.",
    possibleCauses: ["Viral colds — the majority", "Strep throat — high fever, white patches, tender neck glands", "Shouting, smoking, or dry dusty air"],
    selfCare: [
      "Warm salt-water gargles 3× a day — old but genuinely effective",
      "Warm fluids, honey, and rest your voice",
      "Paracetamol takes the edge off the pain well",
    ],
    medicineSuggestions: [
      { note: "For the pain and any fever", stockName: "Paracetamol 500mg (Panadol)" },
      { note: "Stronger option if the pain is severe — with food", stockName: "Ibuprofen 400mg (Brufen)" },
    ],
    seeDoctor: [
      "Difficulty breathing or swallowing saliva, muffled voice, or a very one-sided swelling — urgently",
      "Very painful throat with fever and white patches — may need an antibiotic after review",
    ],
    followUps: ["Any fever or trouble swallowing?", "Can you see white patches on your tonsils?", "How many days has it been sore?"],
  },
  {
    id: "flu",
    keywords: ["flu", "influenza"],
    title: "Flu",
    summary:
      "Flu hits harder than a cold — sudden fever, deep body aches, headache, weakness, cough. It usually knocks you flat for 3–5 days, with tiredness lingering up to a week after.",
    possibleCauses: ["Influenza virus — seasonal spikes happen in Ghana too"],
    selfCare: [
      "Rest properly — literally stay off your feet for the worst days",
      "Fluids constantly, paracetamol for fever and aches",
      "Expect the tiredness tail — don't rush back into heavy work",
    ],
    medicineSuggestions: [
      { note: "For fever and body aches", stockName: "Paracetamol 500mg (Panadol)" },
      { note: "Supports recovery", stockName: "Vitamin C 1000mg Effervescent" },
    ],
    seeDoctor: [
      "Breathing difficulty, chest pain, confusion, or fever beyond 4–5 days",
      "Flu in someone with asthma, diabetes, heart disease or pregnancy — lower the threshold to be seen",
    ],
    followUps: ["Did it come on quite suddenly?", "Any fever and body aches?", "Any chest symptoms — cough or tightness?"],
  },
  {
    id: "diarrhoea",
    keywords: ["diarrhea", "diarrhoea", "running stomach", "loose stool", "watery stool", "running stool", "purging"],
    title: "Diarrhoea",
    summary:
      "Diarrhoea is usually the gut flushing out something irritant or infectious. Most cases settle in 2–3 days — the real danger is dehydration, so the treatment priority is fluids and salts, not stopping it instantly.",
    possibleCauses: ["Contaminated food or water", "Viral stomach bugs", "Food intolerance, or a new medication"],
    selfCare: [
      "ORS is the treatment: sip one litre across the day, more if stools are frequent",
      "Eat light — rice, kenkey, ripe banana, toast; avoid milk, fatty and spicy food for now",
      "Wash hands with soap and keep drinking even when appetite is gone",
    ],
    medicineSuggestions: [
      { note: "The most important medicine here — replaces lost water and salts", name: "Oral rehydration salts (ORS)" },
      { note: "For fever or cramping alongside", stockName: "Paracetamol 500mg (Panadol)" },
    ],
    seeDoctor: [
      "Blood in the stool, high fever, or severe belly pain — same day",
      "Signs of dehydration: dizziness on standing, sunken eyes, no urine for 8+ hours — urgently",
      "Any diarrhoea in a small child or an elderly relative that lasts beyond a day",
    ],
    followUps: ["How many times has it happened today?", "Any vomiting or fever with it?", "Have you managed to keep fluids down?"],
  },
  {
    id: "food-poisoning",
    keywords: ["food poisoning", "spoiled food", "bad food", "food poison"],
    title: "Food poisoning",
    summary:
      "Food poisoning usually announces itself within hours of a suspicious meal: nausea, vomiting, cramps and diarrhoea. It's miserable but most cases pass within 1–2 days — again, dehydration is the thing to beat.",
    possibleCauses: ["Bacteria in food left warm too long, or poorly reheated", "Contaminated water or unwashed produce"],
    selfCare: [
      "Small sips of ORS or water every few minutes once vomiting settles",
      "Rest the stomach for a few hours, then bland food only",
      "No anti-diarrhoea tablets unless a pharmacist advises — the gut needs to clear itself",
    ],
    medicineSuggestions: [
      { note: "Start sipping once vomiting eases", name: "Oral rehydration salts (ORS)" },
      { note: "For fever and body aches — gentle on the stomach", stockName: "Paracetamol 500mg (Panadol)" },
    ],
    seeDoctor: [
      "Vomiting everything for over 24 hours, blood in vomit or stool, severe pain, or fainting",
      "Shared the meal with others who are also sick — that's worth reporting",
    ],
    followUps: ["Any vomiting with it, or mainly diarrhoea?", "Have you kept fluids down in the last few hours?", "Did others who ate the same food fall ill too?"],
  },
  {
    id: "heartburn",
    keywords: ["heartburn", "acid reflux", "reflux", "burning chest", "acid", "burning in my chest"],
    title: "Heartburn / acid reflux",
    summary:
      "That burning behind the breastbone after meals or when lying down is stomach acid reaching the food pipe. Very common, very manageable — but frequent daily heartburn deserves review rather than a permanent antacid habit.",
    possibleCauses: ["Large, late or fatty meals; coffee, alcohol, smoking", "Pregnancy — the womb presses on the stomach", "Some painkillers (NSAIDs) irritate the stomach lining"],
    selfCare: [
      "Smaller meals, and nothing for 2–3 hours before lying down",
      "Raise the head of the bed slightly rather than piling up pillows",
      "Cut back on the usual triggers for a week and see what changes",
    ],
    medicineSuggestions: [
      { note: "Fast relief, works within minutes after meals", name: "Gaviscon or an antacid suspension" },
      { note: "Longer control — one capsule each morning for up to 2 weeks", name: "Omeprazole 20mg" },
    ],
    seeDoctor: [
      "Difficulty swallowing, vomiting blood or black stools, unexplained weight loss — promptly",
      "Burning that doesn't fit the usual pattern: chest pain with exertion must never be assumed to be heartburn",
    ],
    followUps: ["Does it come mostly after meals or at night?", "Any difficulty swallowing?", "How long have you been having it?"],
  },
  {
    id: "indigestion",
    keywords: ["indigestion", "bloated", "bloating", "wind", "gas", "stomach upset", "upset stomach"],
    title: "Indigestion",
    summary:
      "Indigestion — fullness, bloating, wind and discomfort after eating — is usually about what and how we ate, not a disease. It flares with heavy, fatty or rushed meals and stress.",
    possibleCauses: ["Eating quickly, heavy or fatty meals", "Carbonated drinks and excess coffee", "Stress — the gut feels it first"],
    selfCare: [
      "Eat slower and smaller portions for a few days and compare",
      "Gentle walking after meals helps more than lying down",
      "Peppermint or warm ginger tea settles wind nicely",
    ],
    medicineSuggestions: [
      { note: "After-meal relief for wind and fullness", name: "Antacid or simethicone suspension" },
      { note: "If acid discomfort comes with it", name: "Omeprazole 20mg, short course" },
    ],
    seeDoctor: ["Pain that is severe, moves to the back, or keeps returning", "Weight loss, persistent vomiting, or black stools"],
    followUps: ["Does it come after particular foods?", "Any burning sensation with it?", "Any recent stress or change in diet?"],
  },
  {
    id: "allergy",
    keywords: ["allergy", "allergic", "rash", "itching", "itchy", "hives", "hay fever", "hives", "eczema"],
    title: "Allergies & skin rashes",
    summary:
      "Allergies show up as itchy rashes, hives, sneezing fits and itchy watery eyes. Triggers range from dust, pollen and heat to foods, soaps and insect bites. An antihistamine calms most of it down quickly.",
    possibleCauses: ["Dust, pollen, heat and sweat", "Foods, new soaps, detergents, creams or jewelry", "Insect bites and stings"],
    selfCare: [
      "Cool compresses on itchy areas; keep nails short if a child is scratching",
      "Try to spot the trigger — think about what changed in the last 1–2 days",
      "A cool shower before bed calms the skin for the night",
    ],
    medicineSuggestions: [
      { note: "Daytime — much less drowsy", name: "Cetirizine 10mg once daily" },
      { note: "Night-time — works well but makes you sleepy", name: "Piriton (chlorpheniramine) 4mg" },
    ],
    seeDoctor: [
      "Swelling of lips, tongue or face, or any breathing difficulty — **emergency, call 112**",
      "Rash with fever, or a rash that looks like small bruises under the skin",
      "Weeping, spreading skin infection",
    ],
    followUps: ["Did anything new start 1–2 days before — food, soap, cream, medicine?", "Is it mainly skin, or sneezing and eyes too?", "Have you had reactions like this before?"],
  },
  {
    id: "period-cramps",
    keywords: ["period pain", "menstrual", "period cramp", "my period", "menstruation", "dysmenorrh"],
    title: "Period pain (menstrual cramps)",
    summary:
      "Period cramps are caused by the womb contracting — a dull, gripping lower-belly pain in the first 1–2 days of a period. Completely common, and very responsive to the right painkiller taken early.",
    possibleCauses: ["Natural womb contractions — the usual cause", "Endometriosis or fibroids if pain is severe, or worse than it used to be"],
    selfCare: [
      "Ibuprofen works best here — take it **with food** at the very first sign, not after the pain peaks",
      "Heat helps: hot water bottle or warm bath on the lower belly",
      "Gentle movement and warm fluids genuinely reduce the ache",
    ],
    medicineSuggestions: [
      { note: "The most effective option for cramps — with food", stockName: "Ibuprofen 400mg (Brufen)" },
      { note: "If ibuprofen doesn't agree with your stomach", stockName: "Paracetamol 500mg (Panadol)" },
    ],
    seeDoctor: [
      "Pain that stops you doing anything, despite painkillers",
      "Pain outside your period days, pain during sex, or very heavy bleeding with clots",
    ],
    followUps: ["Is it the first 1–2 days of your period that hurt most?", "Has the pain changed or worsened compared to before?", "Is the bleeding much heavier than usual?"],
  },
  {
    id: "uti",
    keywords: ["uti", "urinary", "burning when i pee", "painful urination", "pee hurts", "burning urination", "cystitis"],
    title: "Urinary tract infection (UTI)",
    summary:
      "A UTI means burning when passing urine, going very often, and urgency — sometimes cloudy or smelly urine. Women get them far more often. Antibiotics genuinely fix it, but the right one needs a professional.",
    possibleCauses: ["Bacteria entering the urinary tract", "Holding urine for long stretches and drinking too little", "Pregnancy and diabetes raise the risk"],
    selfCare: [
      "Drink water steadily — flushing the bladder genuinely helps",
      "Paracetamol for the discomfort while you arrange to be seen",
      "Don't hold urine; go whenever you feel the need",
    ],
    medicineSuggestions: [
      { note: "Eases the burning discomfort until you're seen", stockName: "Paracetamol 500mg (Panadol)" },
      { note: "May be needed — prescription-only, after proper review", stockName: "Amoxicillin 500mg Capsules" },
    ],
    seeDoctor: [
      "Fever, back or flank pain, vomiting — the infection may have reached the kidneys: same day",
      "Blood in the urine, or pregnant with these symptoms — promptly",
      "Men with these symptoms should always be reviewed",
    ],
    followUps: ["Any fever or back pain with it?", "Any blood or unusual smell in the urine?", "How many days has it been going on?"],
  },
  {
    id: "back-pain",
    keywords: ["back pain", "backache", "lower back", "waist pain", "my back"],
    title: "Back pain",
    summary:
      "Most back pain is mechanical — lifting, posture, long sitting or an awkward night's sleep. It hurts a lot and scares people, but the overwhelming majority settles within 1–2 weeks with the right approach.",
    possibleCauses: ["Muscle or ligament strain from lifting or sudden movement", "Long hours sitting or a weak mattress", "Disc problems if pain shoots down a leg"],
    selfCare: [
      "Keep moving gently — bed rest for days makes it worse, not better",
      "Heat pack on the sore area, 15–20 minutes at a time",
      "Ibuprofen with food eases it enough to stay active",
      "Lift with bent knees and a straight back from now on",
    ],
    medicineSuggestions: [
      { note: "Anti-inflammatory action helps here — always with food", stockName: "Ibuprofen 400mg (Brufen)" },
      { note: "Alternative if your stomach won't tolerate ibuprofen", stockName: "Paracetamol 500mg (Panadol)" },
    ],
    seeDoctor: [
      "Pain shooting down a leg with numbness, tingling or weakness — prompt review",
      "Any loss of bladder or bowel control — **emergency**",
      "Back pain with fever, or unexplained weight loss — same week",
    ],
    followUps: ["Did it start after lifting or some activity?", "Does the pain travel down your leg at all?", "How many days has it been?"],
  },
  {
    id: "toothache",
    keywords: ["toothache", "tooth pain", "my tooth", "teeth pain", "gum pain", "dental pain"],
    title: "Toothache",
    summary:
      "Toothache means something in the tooth or gum needs attention — painkillers quieten it, they don't fix it. The aim is comfort until you can see a dentist.",
    possibleCauses: ["Tooth decay reaching the nerve", "Gum infection or a dental abscess — often with swelling", "Wisdom tooth pressure"],
    selfCare: [
      "Ibuprofen with food is the most effective dental painkiller",
      "Warm salt-water rinses several times a day",
      "Avoid very hot, cold or sweet food on that side",
    ],
    medicineSuggestions: [
      { note: "Best choice for dental pain — with food", stockName: "Ibuprofen 400mg (Brufen)" },
      { note: "Add-on if needed, safe alongside ibuprofen", stockName: "Paracetamol 500mg (Panadol)" },
    ],
    seeDoctor: [
      "Facial swelling, fever, or difficulty opening the mouth or swallowing — urgently, an abscess spreads",
      "See a dentist within days regardless — the cause needs treatment",
    ],
    followUps: ["Any swelling in the gum or face?", "Is the pain constant or only with hot/cold food?", "How long has it been hurting?"],
  },
  {
    id: "hypertension",
    keywords: ["blood pressure", "hypertension", "bp is high", "high bp"],
    title: "High blood pressure",
    summary:
      "High blood pressure rarely causes symptoms — which is exactly why it's called silent, and why it quietly damages the heart, kidneys and brain over years. The good news: it responds beautifully to treatment and lifestyle.",
    possibleCauses: ["Mostly no single cause — genetics, salt, weight, stress, alcohol all contribute", "Rarely, another medical condition drives it"],
    selfCare: [
      "Cut added salt hard — seasoning cubes, salted fish, processed food",
      "Walk briskly 30 minutes most days; weight loss of even a few kilos moves the numbers",
      "Take your medicine daily, whether you feel like it needs it or not",
      "Check your BP regularly and keep a simple log",
    ],
    medicineSuggestions: [
      { note: "One of the standard once-daily BP medicines — prescription required", stockName: "Amlodipine 5mg" },
      { note: "Worth owning if you're managing BP at home", stockName: "Digital Thermometer" },
    ],
    seeDoctor: [
      "Readings consistently above 140/90 — start a review this week",
      "Severe headache with very high readings, chest pain, or one-sided weakness — **emergency**",
    ],
    followUps: ["Do you know your last BP reading?", "Are you on any BP medicine already?", "How is your salt intake, honestly?"],
  },
  {
    id: "diabetes",
    keywords: ["diabetes", "sugar level", "blood sugar", "sugary", "diabetic"],
    title: "Diabetes",
    summary:
      "Type 2 diabetes happens when the body struggles to control blood sugar. Signs include constant thirst, frequent urination, tiredness and slow-healing wounds. Controlled well, people live completely full lives with it.",
    possibleCauses: ["Insulin resistance — weight, genetics and activity levels play in", "Some medicines and illnesses can raise sugar too"],
    selfCare: [
      "Cut sugary drinks entirely — the single biggest daily sugar source",
      "Regular meals with more fibre (beans, vegetables, whole grains)",
      "Walk 30 minutes most days; check your feet weekly for cuts that don't heal",
      "Take metformin or your prescribed medicine consistently, with meals",
    ],
    medicineSuggestions: [
      { note: "First-line diabetes medicine — prescription required", stockName: "Metformin 500mg" },
    ],
    seeDoctor: [
      "Very thirsty, passing lots of urine, losing weight fast, or breath that smells fruity — urgently",
      "Any foot wound that isn't healing — diabetes makes small wounds dangerous",
      "Review your sugars at least every 3 months when on treatment",
    ],
    followUps: ["Have you checked your sugar level recently?", "Are you on any diabetes medicine?", "Any thirst, frequent urination or weight change?"],
  },
  {
    id: "constipation",
    keywords: ["constipation", "can't poop", "cannot pass stool", "hard stool", "bloated stomach"],
    title: "Constipation",
    summary:
      "Constipation is straining, hard stools, or going far less than your normal. It's usually about fibre, water and movement — medicines only finish the job these start.",
    possibleCauses: ["Low fibre and water intake", "Long sitting and little movement", "Some medicines (iron tablets, certain painkillers)"],
    selfCare: [
      "Water through the day — aim for 8 glasses, more in this heat",
      "Add fibre: vegetables, beans, oranges, whole grain foods",
      "A 20-minute walk stimulates the gut more than people expect",
    ],
    medicineSuggestions: [
      { note: "Gentle overnight relief if diet alone isn't enough", name: "Lactulose syrup or a mild laxative" },
    ],
    seeDoctor: [
      "Blood in the stool, weight loss, or alternating constipation and diarrhoea — get reviewed",
      "No bowel movement at all with vomiting and a swollen, painful belly — urgently",
    ],
    followUps: ["How many days since your last proper stool?", "How much water and fibre are you getting?", "Any new medicines recently — iron, painkillers?"],
  },
  {
    id: "wound-care",
    keywords: ["cut", "wound", "scrape", "abrasion", "graze", "bleeding cut"],
    title: "Minor cuts & wound care",
    summary:
      "Small cuts and grazes heal best with simple, clean care: clean, protect, watch. The first minutes matter more than anything you do after.",
    possibleCauses: ["Minor accidents at home, work or play"],
    selfCare: [
      "Wash your hands first, then clean the wound under running clean water — no need to scrub",
      "Pat dry, apply antiseptic, cover with a clean plaster or dressing",
      "Change the dressing daily and keep it dry",
    ],
    medicineSuggestions: [
      { note: "Antiseptic ointment for cleaned minor wounds", stockName: "NEOSPORIN® + Lidocaine First Aid Antibiotic Ointment with Numbing Pain Relief" },
      { note: "Plasters, gauze and antiseptic for the home kit", stockName: "First Aid Box" },
    ],
    seeDoctor: [
      "Deep, gaping or dirty wounds (rusted metal, animal bites) — you may need a tetanus booster",
      "Spreading redness, warmth, pus or fever — infection is setting in",
      "Bleeding that doesn't stop with 10 minutes of firm pressure — **emergency**",
    ],
    followUps: ["How deep is it, and is the bleeding stopped?", "Was it from something dirty or rusty?", "When was your last tetanus shot, do you know?"],
  },
];

/* ────────────────────────── EMERGENCY RED FLAGS ────────────────────────── */
/**
 * Each entry: regex on the user's message + the reason shown in the reply.
 * The engine checks these BEFORE anything else and, on a match, replies with
 * the emergency script — never product recommendations.
 */
export interface RedFlag {
  id: string;
  pattern: RegExp;
  label: string;
}

export const RED_FLAGS: RedFlag[] = [
  { id: "chest-pain", pattern: /\b(chest (pain|pressure|tightness|heaviness)|pain in my chest|chest feels tight|pressure on my chest)\b/i, label: "chest pain" },
  { id: "breathing", pattern: /\b(can'?t breathe|cannot breathe|difficulty breathing|struggling to breathe|short(ness)? of breath|gasping|choking)\b/i, label: "breathing difficulty" },
  { id: "stroke", pattern: /\b(slurred speech|face (is )?(drooping|dropped|droopy)|one side (of my body )?(is )?(weak|numb|paralysed|paralyzed)|sudden(ly)? (weak|numb))\b/i, label: "possible stroke signs" },
  { id: "seizure", pattern: /\b(seizure|convulsion|fitting|having a fit)\b/i, label: "seizure" },
  { id: "anaphylaxis", pattern: /\b(swollen (lips|tongue|throat|face)|throat (is )?closing|tongue swelling)\b/i, label: "severe allergic reaction" },
  { id: "bleeding", pattern: /\b(bleeding (that )?won'?t stop|severe bleeding|bleeding heavily|coughing up blood|vomit(ing)? blood|blood in (my )?vomit)\b/i, label: "serious bleeding" },
  { id: "overdose", pattern: /\b(overdose|took too many|swallowed (the whole|all of them|a lot of) (tablets?|pills?|capsules?)|whole packet|whole pack)\b/i, label: "possible overdose" },
  { id: "mental-health", pattern: /\b(kill myself|killing myself|end my life|suicidal|commit suicide|hurt myself|self[- ]harm)\b/i, label: "emotional crisis" },
  { id: "unconscious", pattern: /\b(unconscious|won'?t wake up|not waking up|collapsed|unresponsive|limp and not responding)\b/i, label: "unresponsiveness" },
  { id: "infant-fever", pattern: /\b(baby|infant|newborn|new born)\b[^.?!]{0,40}\b(1|2|one|two|three|3)\s*(month|months)\b[^.?!]{0,60}\bfever|fever[^.?!]{0,60}\bin my (1|2|3|one|two|three)\s*(month|months) old\b/i, label: "fever in a baby under 3 months" },
  { id: "thunderclap", pattern: /\b(worst headache (of my life|i'?ve ever)|sudden severe headache|thunderclap headache)\b/i, label: "sudden severe headache" },
  { id: "meningitis", pattern: /\b(stiff neck)\b[^.?!]{0,60}\b(fever|headache)|\b(fever|headache)\b[^.?!]{0,60}\b(stiff neck)\b/i, label: "fever with a stiff neck" },
  { id: "abdominal", pattern: /\b(severe (abdominal|belly|stomach) pain|worst (belly|stomach|abdominal) pain)\b/i, label: "severe abdominal pain" },
  { id: "snakebite", pattern: /\b(snake ?bite|bitten by a snake|scorpion sting)\b/i, label: "snakebite / scorpion sting" },
  { id: "pregnancy-bleeding", pattern: /\b(bleeding (while|during) pregnant|bleeding and (i'?m |we'?re )?pregnant|heavy bleeding in pregnancy)\b/i, label: "bleeding during pregnancy" },
  { id: "dehydration-severe", pattern: /\b(no urine (for|in) (8|eight|12|twelve)|hasn'?t passed urine|sunken eyes|not passed urine since)\b/i, label: "severe dehydration" },
];

/** Displayed in every emergency reply. */
export const EMERGENCY_INSTRUCTIONS = [
  "**Call 112 now** (Ghana's national emergency line) or get to the nearest hospital emergency unit immediately — do not wait to see if it passes.",
  "If someone is available, let them drive you; don't drive yourself if you feel faint or unwell.",
  "Bring any medicines you've taken (or the packaging) with you.",
];

export const MENTAL_HEALTH_INSTRUCTIONS = [
  "What you're feeling matters, and you deserve support right now — please don't carry this alone.",
  "**Call 112** if you are in immediate danger, or get someone you trust to stay with you and take you to the nearest hospital.",
  "Talking to someone tonight — a trusted friend, family member, or a health worker — is a genuine, brave step. Please take it.",
];

/* ────────────────────── DRUG–DRUG / DRUG–LIFE INTERACTIONS ────────────────────── */

export interface InteractionEntry {
  /** Drug ids, order-independent. */
  pair: [string, string];
  verdict: "safe" | "caution" | "avoid";
  advice: string;
}

export const INTERACTIONS: InteractionEntry[] = [
  {
    pair: ["paracetamol", "ibuprofen"],
    verdict: "safe",
    advice:
      "Yes — these two are safe together and work well as a team for stubborn pain: they act differently, so you can even alternate them. Just respect each one's daily maximum (paracetamol max 8×500mg; ibuprofen max 3×400mg with food).",
  },
  {
    pair: ["ibuprofen", "amlodipine"],
    verdict: "caution",
    advice:
      "Be careful with this combination. Ibuprofen (and NSAIDs generally) can push blood pressure up and work against amlodipine, and the combination strains the kidneys with regular use. Occasional use with food is usually fine — regular use should be discussed with your pharmacist or doctor.",
  },
  {
    pair: ["ibuprofen", "metformin"],
    verdict: "caution",
    advice:
      "An occasional ibuprofen with food is generally fine, but regular NSAID use can strain the kidneys — a real concern when you're on metformin, especially if you get dehydrated (vomiting, diarrhoea). Paracetamol is the safer everyday choice here.",
  },
  {
    pair: ["paracetamol", "metformin"],
    verdict: "safe",
    advice: "Yes, paracetamol is safe alongside metformin — it's the preferred painkiller when you're on diabetes medicines.",
  },
  {
    pair: ["paracetamol", "amlodipine"],
    verdict: "safe",
    advice: "Yes — paracetamol is the painkiller of choice when you're on blood pressure medicines like amlodipine.",
  },
  {
    pair: ["ibuprofen", "amoxicillin"],
    verdict: "safe",
    advice: "Yes, these can be taken together without any direct interaction. Take the ibuprofen with food, and remember to complete the full amoxicillin course.",
  },
  {
    pair: ["paracetamol", "amoxicillin"],
    verdict: "safe",
    advice: "Yes — paracetamol is safe with amoxicillin and is exactly what you want for fever or aches while the antibiotic does its work.",
  },
  {
    pair: ["paracetamol", "coartem"],
    verdict: "safe",
    advice: "Yes — paracetamol is fine alongside Coartem and helps with the fever and body aches malaria brings. Keep taking the full Coartem course with fatty food.",
  },
  {
    pair: ["paracetamol", "antihistamine"],
    verdict: "caution",
    advice: "Safe together, but older antihistamines like Piriton add drowsiness — don't drive, and go easy on evening alcohol.",
  },
  {
    pair: ["ibuprofen", "antihistamine"],
    verdict: "safe",
    advice: "No direct interaction — just take the ibuprofen with food. Note that sedating antihistamines plus ibuprofen can leave some people drowsy.",
  },
];
