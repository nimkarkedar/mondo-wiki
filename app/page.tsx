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
  short: string;
  long: string;
  references: { name: string; profession: string }[];
  outOfSyllabus?: boolean;
  funUrl?: string;
};

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<"makes_sense" | "doesnt_make_sense" | null>(null);
  const [toast, setToast] = useState("");

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

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!question.trim()) return;
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
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnswer(data);
    } catch (err) {
      console.error(err);
      setAnswer({
        short: "Something broke.",
        long: "We couldn't fetch an answer. Please try again.",
        references: [],
      });
    } finally {
      setLoading(false);
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    }
  }

  function getAnswerText() {
    if (!answer) return "";
    return `Q: ${question}\n\nIn short: ${answer.short}\n\nIn detail: ${answer.long}`;
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(getAnswerText());
    showToast("Copied to clipboard");
  }

  async function handleShare() {
    const text = getAnswerText();
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard");
    }
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
      }),
    });
  }

  return (
    <div className="min-h-screen w-screen flex items-start md:items-center justify-center p-0 md:p-8">
    <div className="flex flex-col md:flex-row w-full md:max-w-[1200px] md:rounded-2xl md:overflow-hidden md:shadow-2xl min-h-screen md:min-h-0 md:h-[88vh]">

      {/* ── Orange Pane ── */}
      <div
        className="w-full md:w-[50%] md:h-full flex flex-col px-8 md:px-10 py-10"
        style={{
          background: "linear-gradient(135deg, #ff9a3c 0%, #ff6900 35%, #e85000 65%, #ff7a10 100%)",
          backgroundSize: "300% 300%",
          animation: "orangeFlow 12s ease infinite",
        }}
      >

        {/* Logo + tagline + About */}
        <div className="mb-8 md:mb-10">
          <div className="flex items-start justify-between">
            <Link href="/">
              <Image
                src="/mondo-wiki-logo.svg"
                alt="MONDO.WIKI"
                width={210}
                height={58}
                priority
              />
            </Link>
            <a href="/about" className="text-white font-semibold text-base mt-2">
              About
            </a>
          </div>
          <p className="text-black text-sm mt-2">
            Powered by{" "}
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

        {/* Form area */}
        <div className="flex flex-col gap-5">
          <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight">
            Ask any question on design and art
          </h1>
          <p className="text-white text-lg leading-snug">
            Answers are fetched from The Gyaan Project&apos;s 300+ conversations using AI. It can make mistakes.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-1">
            {/* Input with typewriter placeholder */}
            <div className="relative">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full rounded-lg px-5 py-5 pr-12 text-black text-base bg-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-0"
              />
              {/* Clear button — shown when user has typed */}
              {question && (
                <button
                  type="button"
                  onClick={() => { setQuestion(""); setAnswer(null); setFeedback(null); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="12" fill="black" />
                    <line x1="7.5" y1="7.5" x2="16.5" y2="16.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="16.5" y1="7.5" x2="7.5" y2="16.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
              {/* Fake animated placeholder — hidden when user has typed */}
              {!question && (
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none select-none">
                  {typedText}
                  <span className="cursor ml-[1px]">|</span>
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="w-full bg-black text-white text-base font-semibold py-4 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? loadingLabel : "Submit"}
            </button>
            <p className="text-white text-sm text-center mt-1">
              First question is free. Then you have to{" "}
              <a href="#register" className="underline">
                Register
              </a>
              .
            </p>
          </form>
        </div>

        <div className="hidden md:flex flex-1" />

        <p className="hidden md:block text-black text-xs opacity-60 mt-10">
          © 2026 The Gyaan Project. All rights reserved.
        </p>
      </div>

      {/* ── White Pane ── */}
      <div className="relative w-full md:w-[50%] bg-white flex flex-col px-8 md:px-14 py-10 min-h-[50vh] md:min-h-0 overflow-y-auto">

        {/* Copy + Share buttons */}
        {answer && !loading && !answer.outOfSyllabus && (
          <div className="absolute top-8 right-8 md:right-10 flex items-center gap-2">
            {/* Copy */}
            <button
              onClick={handleCopy}
              title="Copy answer"
              className="p-2 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            {/* Share */}
            <button
              onClick={handleShare}
              title="Share answer"
              className="p-2 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        )}

        {!answer && !loading && (
          <div className="flex-1 flex items-center justify-center text-gray-300 text-lg select-none py-16 md:py-0">
            Your answer will appear here.
          </div>
        )}

        {loading && (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-base animate-pulse py-16 md:py-0">
            Distilling wisdom…
          </div>
        )}

        {answer && !loading && (
          answer.outOfSyllabus ? (
            <div key="out-of-syllabus" style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards" }} className="flex flex-col gap-5 max-w-xl">
              <p className="text-4xl">🙃</p>
              <p className="text-black text-[18px] font-bold leading-snug">
                This question is out of syllabus.
              </p>
              <p className="text-gray-500 text-base leading-relaxed">
                Our oracle only speaks design and art. Your question has wandered somewhere the archive has never been.
              </p>
              <a
                href={answer.funUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-semibold underline text-black hover:text-gray-600 transition-colors"
              >
                Have Fun →
              </a>
            </div>
          ) : (
          <div key={answer.short} className="flex flex-col gap-7 max-w-xl">
            <div style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards" }}>
              <p className="font-bold text-[18px] text-black">In short</p>
              <p className="text-[18px] font-normal text-black leading-snug mt-1">
                {answer.short}
              </p>
            </div>

            <div style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 160ms forwards" }}>
              <p className="font-bold text-[18px] text-black mb-3">In detail</p>
              <div className="text-black text-[18px] font-normal leading-relaxed space-y-5">
                {answer.long.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 300ms forwards" }} className="flex items-center gap-3 pt-2">
              {feedback ? (
                <p className="text-sm text-gray-400">Thanks for the feedback.</p>
              ) : (
                <>
                  <button
                    onClick={() => sendFeedback("makes_sense")}
                    className="text-sm px-4 py-2 rounded-full border border-gray-200 text-gray-500 hover:border-black hover:text-black transition-colors"
                  >
                    👍 Makes sense
                  </button>
                  <button
                    onClick={() => sendFeedback("doesnt_make_sense")}
                    className="text-sm px-4 py-2 rounded-full border border-gray-200 text-gray-500 hover:border-black hover:text-black transition-colors"
                  >
                    👎 Doesn&apos;t make sense
                  </button>
                </>
              )}
            </div>

          </div>
          )
        )}

        <p className="md:hidden text-black text-xs opacity-60 mt-10 pb-4">
          © 2026 The Gyaan Project. All rights reserved.
        </p>

        {/* Toast */}
        {toast && (
          <div
            style={{ animation: "toastIn 0.2s ease forwards" }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-4 py-2 rounded-full shadow-lg pointer-events-none z-50"
          >
            {toast}
          </div>
        )}
      </div>

    </div>
    </div>
  );
}
