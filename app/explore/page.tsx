"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

type HistoryItem = {
  id: string;
  question: string;
  short_answer: string;
  long_answer: string;
  created_at: string;
  thumbsUp: number;
  thumbsDown: number;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  );
}

export default function Explore() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, "up" | "down">>({});
  const initialized = useRef(false);

  async function loadItems(currentOffset: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/history?offset=${currentOffset}`);
      const data = await res.json();
      setItems((prev) => {
        const merged = currentOffset === 0
          ? (data.items ?? [])
          : [...prev, ...(data.items ?? [])];
        const seen = new Set<string>();
        return merged.filter((item: HistoryItem) => {
          const key = item.question.trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });
      setOffset(currentOffset + (data.items?.length ?? 0));
      setHasMore(data.hasMore);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadItems(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(msg: string) {
    setToast(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setToast(msg);
        setTimeout(() => setToast(null), 5000);
      });
    });
  }

  async function copyItem(item: HistoryItem) {
    const text = `Q: ${item.question}\n\nShort answer: ${item.short_answer}\n\nLong answer: ${item.long_answer}`;
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
    showToast("Copied to clipboard");
  }

  async function handleVote(item: HistoryItem, vote: "up" | "down") {
    if (votes[item.id]) return;
    setVotes((prev) => ({ ...prev, [item.id]: vote }));
    setItems((prev) =>
      prev.map((i) =>
        i.id !== item.id
          ? i
          : {
              ...i,
              thumbsUp: vote === "up" ? i.thumbsUp + 1 : i.thumbsUp,
              thumbsDown: vote === "down" ? i.thumbsDown + 1 : i.thumbsDown,
            }
      )
    );
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: item.question,
        short_answer: item.short_answer,
        long_answer: item.long_answer,
        rating: vote === "up" ? "makes_sense" : "doesnt_make_sense",
        qa_history_id: item.id,
      }),
    });
  }

  return (
    <div className="min-h-screen w-full bg-white md:bg-gray-100 flex flex-col items-center md:py-10">
    <div className="w-full md:max-w-[1200px] md:mx-8 bg-white md:rounded-3xl md:shadow-2xl md:overflow-hidden flex flex-col flex-1 relative">

      {/* Header */}
      <header className="w-full border-b border-gray-200 flex items-stretch justify-between pl-6 md:pl-10 pr-6 md:pr-10">
        <Link
          href="/"
          className="focus:outline-none shrink-0 flex items-center px-5 md:px-7 py-0 md:py-[10px] -mb-px"
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
        </Link>
        <nav className="flex items-center gap-8 md:gap-12 text-black text-lg">
          <Link href="/" className="hidden md:inline hover:opacity-70 transition-opacity">Home</Link>
          <Link href="/about" className="hover:opacity-70 transition-opacity">About</Link>
          <Link href="/donate" className="hover:opacity-70 transition-opacity">Donate</Link>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col">

        {/* Title row */}
        <div className="px-8 md:px-10 pt-10 md:pt-12">
          <h1 className="text-black text-5xl md:text-6xl font-bold leading-tight">What others are asking</h1>
          {items.length > 0 && (
            <p className="text-[#656565] text-sm mt-3">Last 10 days only</p>
          )}
        </div>

        {/* Full-width content */}
        <div className="px-8 md:px-10 pt-8 md:pt-10 pb-10 md:pb-14 flex flex-col">

          {!initialLoaded && loading && (
            <div className="flex items-center justify-center text-[#656565] text-base animate-pulse py-12">
              Loading…
            </div>
          )}

          {initialLoaded && items.length === 0 && (
            <p className="text-[#656565] text-base">No questions yet. Be the first to ask!</p>
          )}

          {/* Accordion list */}
          <div className="flex flex-col divide-y divide-gray-300">
            {items.map((item) => (
              <div key={item.id} className="py-5">

                <button
                  className="w-full text-left flex items-start justify-between gap-4 group focus:outline-none"
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#656565] mb-1">{formatDate(item.created_at)}</p>
                    <p className="text-[17px] font-semibold text-black group-hover:text-gray-600 transition-colors leading-snug">
                      {item.question}
                    </p>
                  </div>
                  <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 group-hover:border-gray-400 transition-colors mt-0.5">
                    <span className="text-[#656565] text-lg leading-none select-none">
                      {expanded === item.id ? "−" : "+"}
                    </span>
                  </div>
                </button>

                {expanded === item.id && (
                  <div
                    className="mt-5 flex flex-col gap-5"
                    style={{ opacity: 0, animation: "answerReveal 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards" }}
                  >
                    <div>
                      <p className="font-bold text-base text-black mb-1">Short answer:</p>
                      <p className="text-base text-black leading-snug">{item.short_answer}</p>
                    </div>
                    <div>
                      <p className="font-bold text-base text-black mb-2">Long answer:</p>
                      <div className="text-base text-black leading-relaxed space-y-4">
                        {item.long_answer.split("\n\n").map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      {votes[item.id] ? (
                        <p className="text-sm text-[#656565]">Thanks for the feedback.</p>
                      ) : (
                        <>
                          <button
                            onClick={() => handleVote(item, "up")}
                            className="text-sm px-4 py-2 rounded-full border border-gray-200 text-[#656565] hover:border-black hover:text-black transition-colors whitespace-nowrap"
                          >
                            👍 Agree
                          </button>
                          <button
                            onClick={() => handleVote(item, "down")}
                            className="text-sm px-4 py-2 rounded-full border border-gray-200 text-[#656565] hover:border-black hover:text-black transition-colors whitespace-nowrap"
                          >
                            👎 Disagree
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => copyItem(item)}
                        title="Copy answer"
                        className="ml-auto p-2 rounded-lg text-[#656565] hover:text-black transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {initialLoaded && hasMore && (
            <button
              onClick={() => loadItems(offset)}
              disabled={loading}
              className="mt-8 w-full py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#656565] hover:border-gray-400 hover:text-black transition-colors disabled:opacity-40"
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          )}

          {initialLoaded && !hasMore && items.length > 0 && (
            <p className="mt-6 text-sm text-[#656565]">
              You&apos;ve seen all questions from the last 10 days.
            </p>
          )}

        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center px-8 pointer-events-none">
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
