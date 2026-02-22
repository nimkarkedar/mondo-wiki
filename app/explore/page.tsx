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
      // Replace on first load, append on "load more"
      setItems((prev) =>
        currentOffset === 0 ? (data.items ?? []) : [...prev, ...(data.items ?? [])]
      );
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
    <div className="min-h-screen w-screen flex flex-col items-center justify-start md:justify-center p-0 md:p-8 md:gap-4 pb-8 md:pb-0">
      <div className="flex flex-col md:flex-row w-full md:max-w-[1200px] md:rounded-2xl md:overflow-hidden md:shadow-2xl min-h-screen md:min-h-0 md:h-[88vh]">

        {/* ── Orange Pane ── */}
        <div
          className="w-full md:w-auto md:shrink-0 md:h-full flex flex-col px-8 md:px-10 py-10"
          style={{
            background: "linear-gradient(135deg, #ff9a3c 0%, #ff6900 35%, #e85000 65%, #ff7a10 100%)",
            backgroundSize: "300% 300%",
            animation: "orangeFlow 12s ease infinite",
          }}
        >
          <div className="mb-10">
            <Link href="/">
              <Image src="/asktgp-logo.svg" alt="Ask TGP" width={210} height={58} priority />
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

          <div className="hidden md:flex flex-1" />

          <Link
            href="/"
            className="hidden md:inline-flex items-center gap-2 text-black text-sm underline mt-10"
          >
            ← Back to Ask TGP
          </Link>
        </div>

        {/* ── White Pane ── */}
        <div className="relative w-full md:flex-1 bg-white flex flex-col min-h-[50vh] md:min-h-0">

          <div className="flex-1 overflow-y-auto px-8 md:px-14 py-10 flex flex-col">

            <h1 className="text-black text-4xl md:text-5xl font-bold leading-tight mb-2">
              What others are asking
            </h1>
            <p className="text-gray-400 text-sm mb-8">Last 10 days only</p>

            {!initialLoaded && loading && (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-base animate-pulse">
                Loading…
              </div>
            )}

            {initialLoaded && items.length === 0 && (
              <p className="text-gray-400 text-base">No questions yet. Be the first to ask!</p>
            )}

            {/* Accordion list */}
            <div className="flex flex-col divide-y divide-gray-300">
              {items.map((item) => (
                <div key={item.id} className="py-5">

                  {/* Row: question + toggle */}
                  <button
                    className="w-full text-left flex items-start justify-between gap-4 group focus:outline-none"
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-1">{formatDate(item.created_at)}</p>
                      <p className="text-[17px] font-semibold text-black group-hover:text-gray-600 transition-colors leading-snug">
                        {item.question}
                      </p>
                    </div>
                    {/* Toggle icon — large tappable area */}
                    <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 group-hover:border-gray-400 transition-colors mt-0.5">
                      <span className="text-gray-500 text-lg leading-none select-none">
                        {expanded === item.id ? "−" : "+"}
                      </span>
                    </div>
                  </button>

                  {/* Expanded content — full width, matches question */}
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

                      {/* Feedback row */}
                      <div className="flex items-center gap-3 pt-1">
                        {votes[item.id] ? (
                          <p className="text-sm text-gray-400">Thanks for the feedback.</p>
                        ) : (
                          <>
                            <button
                              onClick={() => handleVote(item, "up")}
                              className="text-sm px-4 py-2 rounded-full border border-gray-200 text-gray-500 hover:border-black hover:text-black transition-colors whitespace-nowrap"
                            >
                              👍 {item.thumbsUp > 0 ? item.thumbsUp : "Makes sense"}
                            </button>
                            <button
                              onClick={() => handleVote(item, "down")}
                              className="text-sm px-4 py-2 rounded-full border border-gray-200 text-gray-500 hover:border-black hover:text-black transition-colors whitespace-nowrap"
                            >
                              👎 {item.thumbsDown > 0 ? item.thumbsDown : "Non-sense"}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => copyItem(item)}
                          title="Copy answer"
                          className="ml-auto p-2 rounded-lg text-gray-400 hover:text-black transition-colors"
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

            {/* Load more */}
            {initialLoaded && hasMore && (
              <button
                onClick={() => loadItems(offset)}
                disabled={loading}
                className="mt-8 w-full py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-400 hover:text-black transition-colors disabled:opacity-40"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            )}

            {initialLoaded && !hasMore && items.length > 0 && (
              <p className="mt-6 text-sm text-gray-400">
                You&apos;ve seen all questions from the last 10 days.
              </p>
            )}

          </div>

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
      </div>
      <p className="text-xs text-black/40 text-center px-8 md:px-0 pt-6 md:pt-2">
        © 2026 The Gyaan Project. All rights reserved.
      </p>
    </div>
  );
}
