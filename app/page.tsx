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
  endingQuestion?: string;
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
  const [focused, setFocused] = useState(false);

  const [typedText, setTypedText] = useState("");
  const [loadingLabel, setLoadingLabel] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const LOADING_LABELS = [
    "Thinking…",
    "Asking the Oracle…",
    "Checking with past 7 generations…",
    "Contemplating…",
    "Checking archives…",
    "Finding patterns…",
    "Connecting dots…",
    "Synthesising…",
    "Feeling lost…",
    "Regaining consciousness…",
    "Figuring out…",
    "Going on tangent…",
    "Course correcting…",
    "Wondering what life is this…",
    "Trying to stay in the present with your question…",
    "Day dreaming…",
    "Ah, think I am close to getting an answer…",
    "Lost in the weeds…",
    "Wandering and wondering at the same time…",
    "Asking neighbours…",
    "Looking out…",
    "Consulting 300 souls…",
    "Brewing the wisdom…",
    "Shaking the oracle…",
    "Chasing the muse…",
    "Untangling the cosmos…",
    "Reading between the lines…",
    "Waking up the archive…",
    "Summoning the Gyaan…",
    "Flipping through dog-eared notebooks…",
    "Listening to the silence between words…",
    "Dusting off an old cassette…",
    "Asking the ghost of a designer…",
    "Holding the thought gently…",
    "Letting it simmer…",
    "Tracing the thread…",
    "Whispering to the muse…",
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
    const tail = answer.endingQuestion ? `\n\n${answer.endingQuestion}` : "";
    const footer = `\n\nQ&A from asktgp.com (Powered by The Gyaan Project)`;
    return `Q: ${question}\n\nShort answer: ${answer.short}\n\nLong answer: ${answer.long}${tail}${footer}`;
  }

  function getAnswerHtml() {
    if (!answer) return "";
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const longHtml = esc(answer.long).replace(/\n\n/g, "<br><br>");
    const ending = answer.endingQuestion
      ? `<p><em>${esc(answer.endingQuestion)}</em></p>`
      : "";
    return `<div>
      <p><strong>Q:</strong> ${esc(question)}</p>
      <p><strong>Short answer:</strong> ${esc(answer.short)}</p>
      <p><strong>Long answer:</strong> ${longHtml}</p>
      ${ending}
      <p>Q&amp;A from <a href="https://asktgp.com">asktgp.com</a> (Powered by The Gyaan Project)</p>
    </div>`;
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

  async function writeToClipboard(text: string, html?: string) {
    // Rich copy: write both HTML (for rich-text apps like email, Notion, Docs)
    // and plain text (for terminals, code editors) so the asktgp.com link
    // appears as a clickable hyperlink when pasted into rich apps.
    try {
      if (html && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
        return;
      }
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
    await writeToClipboard(getAnswerText(), getAnswerHtml());
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
    <div className="relative min-h-screen w-full flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row w-full">

        {/* Left panel — orange */}
        <section className="w-full md:w-[34%] bg-[#ff6400] flex flex-col">
          {/* Header */}
          <header className="w-full flex items-stretch justify-between pl-0 pr-6 md:pr-10">
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
              className="focus:outline-none shrink-0 flex items-center pl-6 md:pl-10 pr-5 md:pr-7 py-0 md:py-[10px] cursor-pointer"
            >
              <Image
                src="/asktgp-logo.svg"
                alt="Ask TGP"
                width={156}
                height={44}
                priority
                className="h-[72px] md:h-[70px] w-auto"
              />
            </button>
            <nav className="flex items-center gap-8 md:gap-12 text-black text-lg">
              <Link href="/about" className="hover:opacity-70 transition-opacity">About</Link>
            </nav>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[14px] px-6 md:px-10 pt-10 md:pt-14 pb-10 md:pb-14">
            <div className="relative">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="w-full rounded-2xl border border-black/20 px-6 pt-[40px] pb-[12px] pr-14 text-black text-base bg-white focus:outline-none focus:border-black"
              />
              <label
                className={`absolute left-6 pointer-events-none select-none text-[#656565] transition-all duration-150 ${
                  focused || question
                    ? "top-[14px] text-xs"
                    : "top-1/2 -translate-y-1/2 text-base"
                }`}
              >
                {focused || question ? "Question" : "Ask any question on design and art"}
              </label>
              {question && (
                <button
                  type="button"
                  onClick={() => { setQuestion(""); setAnswer(null); setFeedback(null); }}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[#656565] hover:text-black transition-colors"
                  aria-label="Clear"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="12" fill="black" />
                    <line x1="7.5" y1="7.5" x2="16.5" y2="16.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="16.5" y1="7.5" x2="7.5" y2="16.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <p className="text-black text-base font-bold">{loadingLabel}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={!question.trim()}
                  className="w-full bg-black text-white text-xl font-semibold px-12 py-4 rounded-full cursor-pointer hover:bg-[#111111] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Submit
                </button>
                <div className="text-black text-center md:text-left">
                  <p className="font-bold text-base">Expect a philosophical answer.</p>
                  <Link href="/explore" className="text-black text-base underline hover:opacity-70 transition-opacity">
                    See examples
                  </Link>
                </div>
              </div>
            )}
          </form>
        </section>

        {/* Right panel — black */}
        <section className="relative w-full flex-1 md:flex-none md:w-[66%] bg-[#111111] flex flex-col">
          {!answer && !loading ? (
            <div className="flex-1 flex items-center justify-center px-6 md:px-10 py-16 md:py-14">
              <p className="text-white text-base text-center">
                Answers powered by{" "}
                <a
                  href="https://thegyaanproject.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  The Gyaan Project
                </a>{" "}
                Podcast.
              </p>
            </div>
          ) : (
          <div className="flex-1 flex flex-col px-6 md:px-10 pt-10 md:pt-[85px] pb-10 md:pb-14">

            {loading && (
              <p className="text-white/60 text-base animate-pulse md:mt-[85px]">Distilling wisdom…</p>
            )}

            {answer && !loading && answer.isError && (
              <div key="error" style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards" }} className="flex flex-col gap-3 max-w-xl md:mt-[85px]">
                <p className="text-2xl">😕</p>
                <p className="text-white/70 text-base leading-relaxed">{answer.long}</p>
              </div>
            )}

            {answer && !loading && answer.needsContext && (
              <div key="needs-context" style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards" }} className="flex flex-col gap-4 max-w-xl md:mt-[85px]">
                <p className="text-2xl">🤔</p>
                <p className="text-white text-base font-bold leading-snug">Can you be more specific?</p>
                <p className="text-white/70 text-base leading-relaxed">{answer.hint}</p>
              </div>
            )}

            {answer && !loading && answer.outOfSyllabus && (
              <div key="out-of-syllabus" style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards" }} className="flex flex-col gap-5 max-w-xl md:mt-[85px]">
                <p className="text-4xl">🙃</p>
                <p className="text-white text-base font-bold leading-snug">
                  This question is out of syllabus.
                </p>
                <p className="text-white/70 text-base leading-relaxed">
                  The Gyaan Project only speaks on design and art. Yes, I get it, everything is design, but seems like askTGP oracle was not able to find what you are looking for. Sorry. Either something is messed up or the repository needs to be richer.
                </p>
                {answer.funUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={answer.funUrl}
                    alt="A random reaction"
                    className="rounded-2xl max-w-sm w-full h-auto border border-white/10"
                  />
                )}
              </div>
            )}

            {hasAnswer && (
              <div key={answer.short} className="flex flex-col gap-6 max-w-xl md:mt-[70px]">
                <div style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards" }}>
                  <p className="font-bold text-base text-white mb-2">Short answer:</p>
                  <p className="text-base font-normal text-white leading-snug">
                    {answer.short}
                  </p>
                </div>

                <div style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 160ms forwards" }}>
                  <p className="font-bold text-base text-white mb-3">Long answer:</p>
                  <div className="text-white text-base font-normal leading-relaxed space-y-4">
                    {answer.long.split("\n\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>

                {answer.endingQuestion && (
                  <div style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 240ms forwards" }} className="pt-2 border-t border-white/15">
                    <p className="text-white text-base italic leading-relaxed pt-4">
                      {answer.endingQuestion}
                    </p>
                  </div>
                )}

<div style={{ opacity: 0, animation: "answerReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) 300ms forwards" }} className="flex items-center gap-2 pt-2">
                  {feedback ? (
                    <p className="text-sm text-white/60">Thanks for the feedback.</p>
                  ) : (
                    <>
                      <button
                        onClick={() => sendFeedback("makes_sense")}
                        className="text-sm px-4 py-2 rounded-full border border-white/30 text-white hover:border-white transition-colors whitespace-nowrap"
                      >
                        👍 Agree
                      </button>
                      <button
                        onClick={() => sendFeedback("doesnt_make_sense")}
                        className="text-sm px-4 py-2 rounded-full border border-white/30 text-white hover:border-white transition-colors whitespace-nowrap"
                      >
                        👎 Disagree
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleCopy}
                    title="Copy answer"
                    className="p-2 rounded-full border border-white/30 text-white/70 hover:border-white hover:text-white transition-colors"
                    aria-label="Copy"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12V4a1 1 0 0 1 1-1h8" />
                      <path d="M10 8h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                    </svg>
                  </button>
                </div>

                <p className="text-sm text-white/60 pt-4">
                  AI can make mistakes. Use your <a href="https://en.wikipedia.org/wiki/Viveka" target="_blank" rel="noopener noreferrer" className="underline">Vivek</a>.
                </p>
              </div>
            )}
          </div>
          )}
        </section>

      </div>

      <p className="absolute bottom-6 left-0 right-0 px-6 text-center md:left-10 md:right-auto md:px-0 md:text-left z-10 text-xs text-white pointer-events-none">© 2026 The Gyaan Project. All rights reserved.</p>

      {toast && (
        <div className="fixed bottom-16 left-0 right-0 flex justify-center px-8 pointer-events-none z-50">
          <div
            style={{ animation: "toastShow 5s ease forwards" }}
            className="bg-white text-black text-sm px-5 py-2.5 rounded-full shadow-lg"
          >
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
