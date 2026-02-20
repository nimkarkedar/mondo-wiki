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
  links: { title: string; url: string }[];
};

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);

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
        links: [],
      });
    } finally {
      setLoading(false);
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-screen">

      {/* ── Orange Pane ── */}
      <div
        className="w-full md:w-[50%] md:h-screen md:sticky md:top-0 flex flex-col px-8 md:px-10 py-10"
        style={{
          background: "linear-gradient(135deg, #ff9a3c 0%, #ff6900 35%, #e85000 65%, #ff7a10 100%)",
          backgroundSize: "300% 300%",
          animation: "orangeFlow 12s ease infinite",
        }}
      >

        {/* Logo + tagline */}
        <div className="mb-8 md:mb-10">
          <Link href="/">
            <Image
              src="/mondo-wiki-logo.svg"
              alt="MONDO.WIKI"
              width={210}
              height={58}
              priority
            />
          </Link>
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
            Answers will be fetched by AI (Claude) from all my 300+ conversations on The Gyaan Project Podcast.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-1">
            {/* Input with typewriter placeholder */}
            <div className="relative">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full rounded-lg px-5 py-5 text-black text-base bg-white focus:outline-none focus:ring-2 focus:ring-black"
              />
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
      <div className="w-full md:w-[50%] bg-white flex flex-col px-8 md:px-14 py-10 min-h-[50vh] md:min-h-screen overflow-y-auto">

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
          <div className="flex flex-col gap-7 max-w-xl">
            <div>
              <p className="font-bold text-[18px] text-black">In short</p>
              <p className="text-[18px] font-normal text-black leading-snug mt-1">
                {answer.short}
              </p>
            </div>

            <div>
              <p className="font-bold text-[18px] text-black mb-3">In detail</p>
              <div className="text-black text-[18px] font-normal leading-relaxed space-y-5">
                {answer.long.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

          </div>
        )}

        <div className="mt-auto pt-10 flex items-center justify-between md:justify-end">
          <p className="md:hidden text-black text-xs opacity-60">
            © 2026 The Gyaan Project. All rights reserved.
          </p>
          <a href="/about" className="text-black underline text-sm">
            About
          </a>
        </div>
      </div>

    </div>
  );
}
