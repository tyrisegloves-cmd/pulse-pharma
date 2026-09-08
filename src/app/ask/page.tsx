"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ClipboardCheck,
  Loader2,
  MessageCircle,
  Phone,
  RotateCcw,
  Send,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import type { ConsultProduct, Urgency } from "@/lib/pharmacist/engine";

/* ───────────────────────────── Constants ───────────────────────────── */

const STORAGE_KEY = "pulse-pharma:ask-history";

const GREETING = `Hello! 👋 I'm **Dr. Osei**, your Pulse Pharma pharmacy guide. I'm here whenever you need quick, reliable guidance — free and confidential.

Here's what I can help with:
- **Understanding a medicine** — what it's for, how to take it, side effects
- **Working out an illness** — tell me your symptoms and I'll guide you step by step
- **Safety checks** — whether two medicines are safe to take together
- **Finding the right product** from our shop for what you're facing

What's on your mind today? The more detail you share — what you feel, for how long, and for whom — the better I can help.`;

const QUICK_START = [
  "I have a headache and fever",
  "What is Coartem used for?",
  "Can I take paracetamol with ibuprofen?",
  "My child has a cough",
];

/** Chips that navigate instead of sending a message. */
const CHIP_ACTIONS: Record<string, string> = {
  "Browse the shop": "/shop",
  "Upload prescription": "/upload-prescription",
};

const COMMON_TOPICS: [string, string][] = [
  ["Malaria", "I think I have malaria"],
  ["Headache", "I've had a headache"],
  ["Fever", "I have a fever"],
  ["Cough", "I have a cough"],
  ["Period pain", "I have bad period pain"],
  ["Heartburn", "I keep getting heartburn"],
  ["Toothache", "I have a toothache"],
  ["Diarrhoea", "I have a running stomach"],
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  time: string;
  products?: ConsultProduct[];
  urgency?: Urgency;
  suggestions?: string[];
}

/* ───────────────────────── Rich text rendering ───────────────────────── */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(
    /(\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\([^)\s]+\))/g
  );
  return parts.filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const [, label, href] = link;
      const classes =
        "text-red-600 font-medium underline underline-offset-2 hover:text-red-700";
      if (href.startsWith("/") || href.startsWith("#")) {
        return <Link key={key} href={href} className={classes}>{label}</Link>;
      }
      return (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {label}
        </a>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

function RichText({ text }: { text: string }) {
  const blocks = text.split("\n\n");
  return (
    <div className="space-y-3">
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const isBullets =
          lines.length > 0 && lines.every((l) => l.trim().startsWith("- "));
        if (isBullets) {
          return (
            <ul key={bi} className="space-y-1.5">
              {lines.map((line, li) => (
                <li key={li} className="flex gap-2">
                  <span className="mt-[8px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                  <span>{renderInline(line.trim().slice(2), `${bi}-${li}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi}>
            {lines.map((line, li) => (
              <Fragment key={li}>
                {renderInline(line, `${bi}-${li}`)}
                {li < lines.length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Product mini card ───────────────────────── */

function ProductMiniCard({ product }: { product: ConsultProduct }) {
  return (
    <Link
      href={`/shop/${product.id}`}
      className="group w-[190px] flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-red-300 hover:shadow-md"
    >
      <div className="flex h-24 items-center justify-center overflow-hidden bg-gray-50">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <Stethoscope size={28} className="text-gray-300" />
        )}
      </div>
      <div className="space-y-1 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {product.isPrescriptionRequired && (
            <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
              Rx required
            </span>
          )}
          {!product.inStock && (
            <span className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
              Out of stock
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-red-600">
          {product.name}
        </p>
        <p className="line-clamp-2 text-xs text-gray-500">{product.note}</p>
        <p className="text-sm font-bold text-gray-900">GH₵ {product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}

/* ───────────────────────────── Main page ───────────────────────────── */

export default function AskPharmacist() {
  const { user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: GREETING, time: "" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);

  const messagesRef = useRef(messages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Personalize the greeting when we know the user's name.
  const userName = useMemo(() => {
    const meta = user?.user_metadata as Record<string, unknown> | undefined;
    const fullName = typeof meta?.full_name === "string" ? meta.full_name.trim() : "";
    if (fullName) return fullName.split(/\s+/)[0];
    if (user?.email) return user.email.split("@")[0];
    return undefined;
  }, [user]);

  // Restore the conversation within this browser session. This must happen
  // after mount (not in a lazy initializer) so server and client render the
  // same first paint — hence the scoped lint exception below.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        messages?: ChatMessage[];
        notes?: string[];
      };
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        setMessages(parsed.messages);
        setNotes(Array.isArray(parsed.notes) ? parsed.notes : []);
      }
    } catch {
      // Corrupt storage — start fresh silently.
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Keep a ref in sync (for closures) and persist after every turn.
  useEffect(() => {
    messagesRef.current = messages;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, notes }));
    } catch {
      // Storage full or unavailable — persistence is a nice-to-have.
    }
  }, [messages, notes]);

  // Always show the latest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || loading) return;

      // Some chips are links, not messages.
      const action = CHIP_ACTIONS[text];
      if (action) {
        router.push(action);
        return;
      }

      const now = () =>
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const userMsg: ChatMessage = { role: "user", content: text, time: now() };
      const history = [...messagesRef.current, userMsg];
      setMessages(history);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setLoading(true);

      try {
        const [res] = await Promise.all([
          fetch("/api/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: history.map(({ role, content }) => ({ role, content })),
              userName,
            }),
          }),
          // A short pause makes the exchange feel considered rather than canned.
          new Promise((resolve) => setTimeout(resolve, 700)),
        ]);

        if (!res.ok) throw new Error(`Consult request failed: ${res.status}`);
        const data = await res.json();

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
            time: now(),
            products: data.products ?? [],
            urgency: data.urgency,
            suggestions: data.suggestions ?? [],
          },
        ]);
        setNotes(data.notes ?? []);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I'm having trouble connecting right now — please try again in a moment. For anything urgent, call **112** or visit the nearest pharmacy.",
            time: now(),
            urgency: "normal",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, router, userName]
  );

  const resetChat = () => {
    if (loading) return;
    setMessages([{ role: "assistant", content: GREETING, time: "" }]);
    setNotes([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const latestEmergency =
    messages[messages.length - 1]?.urgency === "emergency";
  const latestSuggestions =
    messages[messages.length - 1]?.role === "assistant"
      ? messages[messages.length - 1]?.suggestions ?? []
      : [];
  const firstUserIndex = messages.findIndex((m) => m.role === "user");

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        {/* Intro */}
        <div className="mb-4 flex items-start justify-between gap-4 sm:mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Ask Your Pharmacist
            </h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">
              Friendly, confidential guidance on medicines and symptoms — attentive to every detail you share.
            </p>
          </div>
          <button
            onClick={resetChat}
            title="Start a new conversation"
            aria-label="Start a new conversation"
            className="hidden flex-shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition hover:border-red-300 hover:text-red-600 sm:flex"
          >
            <RotateCcw size={15} /> New chat
          </button>
        </div>

        {/* Emergency banner */}
        {latestEmergency && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-red-600 px-4 py-3 text-white">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <p className="min-w-0 flex-1 text-sm font-medium">
              Emergency guidance shown below — call 112 or get to the nearest hospital now.
            </p>
            <a
              href="tel:112"
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-red-700 hover:bg-red-50"
            >
              <Phone size={14} /> Call 112
            </a>
          </div>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
          {/* ── Chat card ── */}
          <div className="flex h-[calc(100dvh-14rem)] min-h-[440px] max-h-[1200px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:h-[calc(100dvh-14.5rem)]">

            {/* Chat header */}
            <div className="flex items-center justify-between gap-3 bg-gray-900 p-3 sm:p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-700 sm:h-10 sm:w-10">
                  <Stethoscope size={19} className="text-red-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-white">Dr. Osei</h2>
                  <div className="flex items-center gap-1 text-[11px] text-green-400 sm:text-xs">
                    <span className="h-2 w-2 rounded-full bg-green-400" /> Online — replies instantly
                  </div>
                </div>
              </div>
              <button
                onClick={resetChat}
                title="Start a new conversation"
                aria-label="Start a new conversation"
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white sm:hidden"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Noted-so-far chips — proof we're listening */}
            {notes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 bg-red-50/60 px-3 py-2 sm:px-4">
                <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-red-700">
                  <ClipboardCheck size={12} /> Noted so far:
                </span>
                {notes.map((note) => (
                  <span
                    key={note}
                    className="rounded-full border border-red-100 bg-white px-2 py-0.5 text-[11px] text-gray-700"
                  >
                    {note}
                  </span>
                ))}
              </div>
            )}

            {/* Messages */}
            <div
              role="log"
              aria-live="polite"
              className="flex-1 space-y-4 overflow-y-auto bg-gray-50 px-3 py-4 sm:px-5"
            >
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const isEmergency = msg.urgency === "emergency";
                const showProducts =
                  !isUser && (msg.products?.length ?? 0) > 0;
                return (
                  <div
                    key={idx}
                    className={`flex max-w-[88%] gap-2.5 sm:max-w-[85%] sm:gap-3 ${
                      isUser ? "ml-auto flex-row-reverse" : "self-start"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        isUser
                          ? "bg-gray-200 text-gray-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {isUser ? <User size={15} /> : <Stethoscope size={15} />}
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed sm:px-4 ${
                          isUser
                            ? "rounded-tr-none bg-red-600 text-white"
                            : isEmergency
                              ? "rounded-tl-none border border-red-300 bg-red-50 text-gray-800"
                              : "rounded-tl-none border border-gray-200 bg-white text-gray-800"
                        }`}
                      >
                        <RichText text={msg.content} />
                        {isEmergency && (
                          <a
                            href="tel:112"
                            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-red-700"
                          >
                            <Phone size={16} /> Call 112 now
                          </a>
                        )}
                      </div>
                      {msg.time && (
                        <div
                          className={`mt-1 text-[10px] text-gray-400 sm:text-xs ${
                            isUser ? "text-right" : "text-left"
                          }`}
                        >
                          {msg.time}
                        </div>
                      )}
                      {showProducts && (
                        <div className="mt-2 flex gap-2.5 overflow-x-auto pb-1 sm:gap-3">
                          {msg.products!.map((product) => (
                            <ProductMiniCard key={product.id} product={product} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2.5 sm:gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <Stethoscope size={15} />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-none border border-gray-200 bg-white px-4 py-3.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestion chips */}
            {!loading && latestSuggestions.length > 0 && (
              <div className="flex gap-2 overflow-x-auto border-t border-gray-100 bg-white px-3 py-2 pb-2.5 sm:flex-wrap sm:overflow-visible sm:px-4">
                {latestSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => void send(suggestion)}
                    className="flex-shrink-0 whitespace-nowrap rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 transition hover:border-red-400 hover:text-red-600 sm:text-[13px]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
              {firstUserIndex === -1 && (
                <div className="mb-2 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                  {QUICK_START.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => void send(chip)}
                      className="flex-shrink-0 whitespace-nowrap rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 sm:text-[13px]"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(input);
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your symptoms, ask about a medicine…"
                  aria-label="Your message to the pharmacist"
                  className="max-h-[160px] flex-grow resize-none rounded-xl border border-gray-300 p-3 text-[15px] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-red-600 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </form>
              <p className="mt-2 text-center text-[11px] text-gray-400 sm:text-xs">
                Guidance, not a diagnosis — always confirm with a health worker. For medical
                emergencies, call <span className="font-semibold text-gray-500">112</span> or go to
                the nearest hospital immediately.
              </p>
            </div>
          </div>

          {/* ── Sidebar (desktop) ── */}
          <aside className="hidden flex-col gap-5 lg:flex">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 font-bold text-gray-900">How this works</h3>
              <ol className="space-y-4">
                {[
                  {
                    icon: MessageCircle,
                    title: "Describe what you feel",
                    text: "Symptoms, since when, who it's for — every detail sharpens the guidance.",
                  },
                  {
                    icon: ClipboardCheck,
                    title: "I note every detail",
                    text: "Duration, fever, age, pregnancy, allergies — tracked and reflected back to you.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Honest, safe guidance",
                    text: "Free and confidential — and clear about when a real professional must take over.",
                  },
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                      <step.icon size={17} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <h3 className="flex items-center gap-2 font-bold text-red-800">
                <AlertTriangle size={17} /> In an emergency?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-red-700">
                Chest pain, breathing trouble, heavy bleeding, stroke signs, overdose — don&apos;t
                chat, act:
              </p>
              <a
                href="tel:112"
                className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white transition-colors hover:bg-red-700"
              >
                <Phone size={16} /> Call 112
              </a>
              <p className="mt-2 text-center text-[11px] text-red-600">
                Ghana&apos;s national emergency line — ambulance, police, fire.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 font-bold text-gray-900">Common topics</h3>
              <div className="flex flex-wrap gap-2">
                {COMMON_TOPICS.map(([label, message]) => (
                  <button
                    key={label}
                    onClick={() => void send(message)}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 transition hover:border-red-300 hover:text-red-600"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="font-bold text-gray-900">Need prescription medicine?</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                Antibiotics and some other medicines need a valid prescription. Upload yours and
                our pharmacist will verify it before checkout.
              </p>
              <Link
                href="/upload-prescription"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Upload prescription →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
