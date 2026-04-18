"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const UPI_ID = "9886219108@okhdfcbank";
const PAYEE_NAME = "Kedar Nimkar";
const PRESETS = [100, 200, 500, 1000, 2000];

function buildUpiUrl(amount: number) {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: PAYEE_NAME,
    am: String(amount),
    cu: "INR",
  });
  return `upi://pay?${params.toString()}`;
}

function qrSrc(amount: number) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=16&data=${encodeURIComponent(
    buildUpiUrl(amount)
  )}`;
}

export default function Donate() {
  const [amount, setAmount] = useState<number>(100);
  const [copied, setCopied] = useState(false);

  async function copyUpi() {
    try {
      await navigator.clipboard.writeText(UPI_ID);
    } catch {
      // noop
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sharePage() {
    const shareData = {
      title: "Support Ask TGP",
      text: "Help keep The Gyaan Project going.",
      url: typeof window !== "undefined" ? window.location.href : "",
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled
      }
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  }

  return (
    <div className="min-h-screen w-full bg-white md:bg-[#ff6400] flex flex-col items-center md:py-10">
    <div className="w-full md:max-w-[1200px] md:mx-8 bg-white md:rounded-3xl md:shadow-2xl md:overflow-hidden flex flex-col flex-1">

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
          <h1 className="text-black text-5xl md:text-6xl font-bold leading-tight">Donate</h1>
        </div>

        {/* Two-column content */}
        <div className="flex-1 flex flex-col md:flex-row w-full mt-8 md:mt-10">

          {/* Left column — copy */}
          <div className="w-full md:w-1/2 px-8 md:px-10 pb-10 md:pb-14 flex flex-col gap-5">
            <p className="text-base text-black leading-relaxed">
              <a href="https://thegyaanproject.com" target="_blank" rel="noopener noreferrer" className="underline">The Gyaan Project</a> and now askTGP is labour of love since 2016. I have made more than 300+ episodes and ongoing TGP SamaChar. This is a solo effort and my way of giving back to design and art community. The Gyaan Project is one of the longest and consistent podcast and youtube channel in India.
            </p>

            <p className="text-base text-black leading-relaxed">
              All this takes time, effort and money. I would like to keep the project running for a long time and as authentic I can.
            </p>

            <p className="text-base text-black leading-relaxed">
              Thats only possible with generous donations from patrons like you.
            </p>

            <p className="text-base text-black leading-relaxed">
              I will be investing the donated money in buying AI tools, research and improving the production quality of the episodes. Of course, the money will be used to keep these kind of sites up and running.
            </p>

            <p className="text-base text-black leading-relaxed">
              You can donate from ₹100 all the way to ₹2,000 rupees.<br />
              Thanks in advance.
            </p>
          </div>

          {/* Dashed divider */}
          <div className="md:hidden border-t border-dashed border-gray-300 mx-8" />
          <div className="hidden md:block border-l border-dashed border-gray-300" />

          {/* Right column — QR donate module */}
          <div className="w-full md:w-1/2 px-8 md:px-10 pb-10 md:pb-14 flex flex-col gap-6 items-center md:items-stretch">

            {/* QR Card */}
            <div className="w-full bg-white border border-gray-200 rounded-3xl p-6 flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={amount}
                src={qrSrc(amount)}
                alt={`Scan to send ₹${amount}`}
                width={280}
                height={280}
                className="w-[260px] h-[260px]"
              />
              <p className="text-[#656565] text-base mt-4">
                Scan to send ₹{amount.toLocaleString("en-IN")}
              </p>
            </div>

            {/* Amount input */}
            <div className="w-full">
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => {
                  const n = parseInt(e.target.value);
                  setAmount(Number.isFinite(n) && n > 0 ? n : 0);
                }}
                className="w-full rounded-xl border border-gray-300 px-5 py-4 text-black text-base bg-white focus:outline-none focus:border-black"
              />
            </div>

            {/* Preset chips */}
            <div className="w-full flex flex-wrap gap-3">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`px-5 py-2 rounded-full border text-base transition-colors cursor-pointer ${
                    amount === p
                      ? "border-black text-black font-semibold"
                      : "border-gray-300 text-black hover:border-black"
                  }`}
                >
                  ₹{p.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            {/* UPI + Share */}
            <div className="w-full flex flex-col gap-1 items-center text-center">
              <p className="text-black text-base">Send custom amount?</p>
              <button
                type="button"
                onClick={copyUpi}
                className="flex items-center justify-center gap-2 text-[#656565] text-base hover:text-black transition-colors cursor-pointer"
              >
                <span>UPI: {UPI_ID}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copied && <span className="text-xs text-black ml-1">Copied</span>}
              </button>

              <button
                type="button"
                onClick={sharePage}
                className="mt-2 text-base font-semibold underline text-black hover:opacity-70 transition-opacity cursor-pointer"
              >
                Share this page
              </button>
            </div>

          </div>
        </div>
      </main>

    </div>
    <p className="text-xs text-black md:text-white text-center mt-6 pb-6 px-6">© 2026 The Gyaan Project. All rights reserved.</p>
    </div>
  );
}
