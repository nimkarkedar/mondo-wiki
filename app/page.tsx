"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const PLACEHOLDERS = [
  "How do I find my voice as a designer?",
  "What makes a design truly original?",
  "How do I deal with creative block?",
  "When is a design finished?",
  "How do I know if my work is good?",
  "What is the relationship between art and commerce?",
  "How do I stay inspired over a long career?",
  "Can design change the world?",
  "How do I handle criticism of my work?",
  "What separates craft from art?",
  "How do I find meaning in my creative practice?",
  "Is style something you find or something you build?",
  "How do I collaborate without losing my vision?",
  "What does it mean to have taste?",
  "How do I stop copying my influences?",
];

type Answer = {
  id?: string;
  short: string;
  long: string;
  references: { name: string; profession: string }[];
  outOfSyllabus?: boolean;
  funUrl?: string;
  needsContext?: boolean;
  hint?: string;
  isError?: boolean;
};

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<"makes_sense" | "doesnt_make_sense" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [typedText, setTypedText] = useState("");
  const [loadingLabel, setLoadingLabel] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const LOADING_LABELS = [
    "Asking the elders…",
    "Brewing the wisdom…",
    "Consulting 300 souls…",
    "Shaking the oracle…",
    "Chasing the muse…",
    "Untangling the cosmos…",
    "Reading between the lines…",
    "Waking up the archive…",
    "Summoning the Gyaan…",
    "Almost there, maybe…",
  ];

  useEffect(() => {
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function tick() {
      const phrase = PLACEHOLDERS[phraseIndex];

      if (!isDeleting) {
        charIndex++;
        setTypedText(phrase.slice(0, charIndex));
        if (charIndex === phrase.length) {
          timeoutRef.current = setTimeout(() => {
            isDeleting = true;
            tick();
          }, 2200);
        } else {
          timeoutRef.current = setTimeout(tick, 55);
        }
      } else {
        charIndex--;
        setTypedText(phrase.slice(0, charIndex));
        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % PLACEHOLDERS.length;
          timeoutRef.current = setTimeout(tick, 400);
        } else {
          timeoutRef.current = setTimeout(tick, 28);
        }
      }
    }

    timeoutRef.current = setTimeout(tick, 800);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function fetchAnswer(q: string) {
    setLoading(true);
    setAnswer(null);
    setFeedback(null);
    setLoadingLabel(LOADING_LABELS[Math.floor(Math.random() * LOADING_LABELS.length)]);
    loadingTimerRef.current = setInterval(() => {
      setLoadingLabel(LOADING_LABELS[Math.floor(Math.random() * LOADING_LABELS.length)]);
    }, 1800);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnswer(data);
    } catch (err) {
      console.error(err);
      setAnswer({
        isError: true,
        short: "",
        long: "Something went wrong. Please try again.",
        references: [],
      });
    } finally {
      setLoading(false);
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    }
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    await fetchAnswer(question);
  }

  function getAnswerText() {
    if (!answer) return "";
    return `Q: ${question}\n\nShort answer: ${answer.short}\n\nLong answer: ${answer.long}`;
  }

  function showToast(msg: string) {
    setToast(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setToast(msg);
        setTimeout(() => setToast(null), 5000);
      });
    });
  }

  async function writeToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  }

  async function handleCopy() {
    await writeToClipboard(getAnswerText());
    showToast("Copied to clipboard");
  }


  async function sendFeedback(rating: "makes_sense" | "doesnt_make_sense") {
    if (!answer || feedback) return;
    setFeedback(rating);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        short_answer: answer.short,
        long_answer: answer.long,
        rating,
        qa_history_id: answer.id ?? null,
      }),
    });
  }

  const hasAnswer = answer && !loading && !answer.isError && !answer.needsContext && !answer.outOfSyllabus;

  return (
    <div className="min-h-screen w-full bg-white md:bg-gray-100 flex flex-col items-center md:py-10">
    <div className="w-full md:max-w-[1200px] md:mx-8 bg-white md:rounded-3xl md:shadow-2xl md:overflow-hidden flex flex-col flex-1">

      {/* Header */}
      <header className="w-full border-b border-gray-200 flex items-stretch justify-between pl-6 md:pl-10 pr-6 md:pr-10">
        <button
          type="button"
          onClick={() => {
            setQuestion("");
            setAnswer(null);
            setFeedback(null);
            setLoading(false);
            setToast(null);
            if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
          }}
          className="focus:outline-none shrink-0 flex items-center px-5 md:px-7 py-0 md:py-[10px] -mb-px cursor-pointer"
          style={{ backgroundColor: "#ff6900" }}
        >
          <Image
            src="/asktgp-logo.svg"
            alt="Ask TGP"
            width={156}
            height={44}
            priority
            className="h-[60px] md:h-[58px] w-auto"
          />
        </button>
        <nav className="flex items-center gap-8 md:gap-12 text-black text-lg">
          <Link href="/about" className="hover:opacity-70 transition-opacity">About</Link>
          <Link href="/donate" className="hover:opacity-70 transition-opacity">Donate</Link>
        </nav>
      </header>

      {/* Main two-column */}
      <main className="flex-1 flex flex-col md:flex-row w-full">

        {/* Left column — question + submit */}
        <div className="w-full md:w-1/2 px-8 md:px-10 py-10 md:py-14">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
            <p className="font-bold text-base text-black select-none">Ask any question on design and art</p>
            <div className="relative">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-6 py-[26px] pr-14 text-black text-base bg-white focus:outline-none focus:border-black"
              />
              {question && (
                <button
                  type="button"
                  onClick={() => { setQuestion(""); setAnswer(null); setFeedback(null); }}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[#656565] hover:text-gray-600 transition-colors"
                  aria-label="Clear"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="12" fill="black" />
                    <line x1="7.5" y1="7.5" x2="16.5" y2="16.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="16.5" y1="7.5" x2="7.5" y2="16.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
              {!question && (
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#656565] text-base pointer-events-none select-none">
                  {typedText}
                  <span className="cursor ml-[1px]">|</span>
                </span>
              )}
            </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="w-full md:w-auto bg-black text-white text-xl font-semibold px-12 py-4 rounded-full cursor-pointer hover:bg-[#FF6400] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? loadingLabel : "Submit"}
              </button>
              <div className="text-black text-center md:text-left">
                <p className="font-bold text-base">Expect a philosophical answer.</p>
                <p className="text-[#656565] text-base">
                  Answers powered by{" "}
                  <a
                    href="https://thegyaanproject.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    The Gyaan Project
                  </a>
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Dashed divider — horizontal on mobile, vertical on desktop */}
        <div className="md:hidden border-t border-dashed border-gray-300 mx-8" />
        <div className="hidden md:block border-l border-dashed border-gray-300" />

        {/* Right column — answer */}
        <div className="relative w-full md:w-1/2 px-8 md:px-10 py-10 md:py-14 flex flex-col">

          {!answer && !loading && (
            <>
              <p className="text-[#656565] text-base select-none text-center md:text-left">Your answer will appear here</p>
              <div className="flex-1 flex items-center justify-center py-16 md:py-0">
                <Link
                  href="/explore"
                  className="explore-card block border-2 rounded-full px-8 py-4 group"
                >
                  <p className="text-[16px] text-black group-hover:text-gray-700 transition-colors">See what others are asking →</p>
                </Link>
              </div>
            </>
          )}

          {loading && (
            <div className="flex-1 flex items-center justify-start text-[#656565] text-base animate-pulse">
              Distilling wisdom…
            </div>
          )}

          {answer && !loading && answer.isError && (
            <div key="error" style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards" }} className="flex flex-col gap-3 max-w-xl">
              <p className="text-2xl">😕</p>
              <p className="text-[#656565] text-base leading-relaxed">{answer.long}</p>
            </div>
          )}

          {answer && !loading && answer.needsContext && (
            <div key="needs-context" style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards" }} className="flex flex-col gap-4 max-w-xl">
              <p className="text-2xl">🤔</p>
              <p className="text-black text-base font-bold leading-snug">Can you be more specific?</p>
              <p className="text-[#656565] text-base leading-relaxed">{answer.hint}</p>
            </div>
          )}

          {answer && !loading && answer.outOfSyllabus && (
            <div key="out-of-syllabus" style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards" }} className="flex flex-col gap-5 max-w-xl">
              <p className="text-4xl">🙃</p>
              <p className="text-black text-base font-bold leading-snug">
                This question is out of syllabus.
              </p>
              <p className="text-[#656565] text-base leading-relaxed">
                Our oracle only speaks design and art. Your question has wandered somewhere the archive has never been.
              </p>
              {answer.funUrl && (
                <a
                  href={answer.funUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold underline text-black hover:text-gray-600 transition-colors"
                >
                  Have Fun →
                </a>
              )}
            </div>
          )}

          {hasAnswer && (
            <div key={answer.short} className="flex flex-col gap-6 max-w-xl">
              <div style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards" }}>
                <p className="font-bold text-base text-black mb-2">Short answer:</p>
                <p className="text-base font-normal text-black leading-snug">
                  {answer.short}
                </p>
              </div>

              <div style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 160ms forwards" }}>
                <p className="font-bold text-base text-black mb-3">Long answer:</p>
                <div className="text-black text-base font-normal leading-relaxed space-y-4">
                  {answer.long.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>

              {answer.references && answer.references.length > 0 && (
                <div style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 240ms forwards" }}>
                  <p className="text-[#656565] text-[15px] mb-2">Further exploration in…</p>
                  <ul className="list-disc pl-5 text-black text-[16px] space-y-1">
                    {answer.references.map((ref, i) => (
                      <li key={i}>
                        <span className="underline">{ref.name}</span>
                        {ref.profession ? ` — ${ref.profession}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 300ms forwards" }} className="flex items-center gap-2 pt-2">
                {feedback ? (
                  <p className="text-sm text-[#656565]">Thanks for the feedback.</p>
                ) : (
                  <>
                    <button
                      onClick={() => sendFeedback("makes_sense")}
                      className="text-sm px-4 py-2 rounded-full border border-gray-300 text-black hover:border-black transition-colors whitespace-nowrap"
                    >
                      👍 Agree
                    </button>
                    <button
                      onClick={() => sendFeedback("doesnt_make_sense")}
                      className="text-sm px-4 py-2 rounded-full border border-gray-300 text-black hover:border-black transition-colors whitespace-nowrap"
                    >
                      👎 Disagree
                    </button>
                  </>
                )}
                <button
                  onClick={handleCopy}
                  title="Copy answer"
                  className="p-2 rounded-full border border-gray-300 text-gray-600 hover:border-black hover:text-black transition-colors"
                  aria-label="Copy"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12V4a1 1 0 0 1 1-1h8" />
                    <path d="M10 8h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                  </svg>
                </button>
                <button
                  onClick={handleCopy}
                  title="Share"
                  className="p-2 rounded-full border border-gray-300 text-gray-600 hover:border-black hover:text-black transition-colors"
                  aria-label="Share"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12" />
                    <path d="m8 7 4-4 4 4" />
                    <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-[#656565] pt-4">
                AI can make mistakes. Use your <span className="underline">viveka</span>.
              </p>
            </div>
          )}

        </div>

      </main>

      {toast && (
        <div className="fixed bottom-16 left-0 right-0 flex justify-center px-8 pointer-events-none z-50">
          <div
            style={{ animation: "toastShow 5s ease forwards" }}
            className="bg-black text-white text-sm px-5 py-2.5 rounded-full shadow-lg"
          >
            {toast}
          </div>
        </div>
      )}
    </div>
    <p className="text-xs text-[#656565] text-center mt-6 pb-6 px-6">© 2026 The Gyaan Project. All rights reserved.</p>
    </div>
  );
}
