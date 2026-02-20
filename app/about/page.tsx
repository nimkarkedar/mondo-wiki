import Image from "next/image";
import Link from "next/link";

export default function About() {
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
        {/* Logo */}
        <div className="mb-10">
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

        <div className="flex flex-col gap-5">
          <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight">
            About mondo.wiki
          </h1>
          <p className="text-white text-lg leading-relaxed opacity-90">
            A living oracle of wisdom from 300+ conversations on design, art, and creative practice.
          </p>
        </div>

        <div className="hidden md:flex flex-1" />

        {/* Back button */}
        <Link
          href="/"
          className="hidden md:inline-flex items-center gap-2 text-black text-sm underline mt-10"
        >
          ← Back to mondo.wiki
        </Link>
      </div>

      {/* ── White Pane ── */}
      <div className="w-full md:w-[50%] bg-white flex flex-col px-8 md:px-14 py-10 overflow-y-auto">

        <div className="flex flex-col gap-10 max-w-xl">

          {/* What is this */}
          <div>
            <p className="font-bold text-[18px] text-black mb-3">What is mondo.wiki?</p>
            <p className="text-[18px] text-black leading-relaxed">
              mondo.wiki is an AI oracle built on the wisdom of The Gyaan Project — a podcast of conversations with artists, designers, filmmakers, educators, and creative thinkers from across India and the world.
            </p>
            <p className="text-[18px] text-black leading-relaxed mt-4">
              Ask any question about design or art. Get an answer distilled from over a decade of conversations — short enough to stop you in your tracks, long enough to stay with you.
            </p>
          </div>

          {/* The Koan */}
          <div>
            <p className="font-bold text-[18px] text-black mb-3">Why a Koan?</p>
            <p className="text-[18px] text-black leading-relaxed">
              In the Mondo school of Zen Buddhism, a Koan is a question or statement that cannot be answered by rational thinking alone. It is designed to provoke, to unsettle, to open a door.
            </p>
            <p className="text-[18px] text-black leading-relaxed mt-4">
              Every answer on mondo.wiki begins with a Koan — 2 to 5 words that reframe your question in a way you didn't expect. The longer answer follows, but the Koan is the seed.
            </p>
          </div>

          {/* The Gyaan Project */}
          <div>
            <p className="font-bold text-[18px] text-black mb-3">The Gyaan Project</p>
            <p className="text-[18px] text-black leading-relaxed">
              Since 2016, The Gyaan Project has recorded 300+ conversations with some of the most interesting creative minds — asking not just what they make, but how and why they think the way they do.
            </p>
            <p className="text-[18px] text-black leading-relaxed mt-4">
              mondo.wiki is the distillation of that archive — not a search engine, but a wisdom engine. The answers are not quotes. They are the collective voice of everyone who ever sat across from that microphone.
            </p>
          </div>

          {/* How it works */}
          <div>
            <p className="font-bold text-[18px] text-black mb-3">How it works</p>
            <p className="text-[18px] text-black leading-relaxed">
              Every transcript from The Gyaan Project is embedded into a vector database. When you ask a question, the most relevant passages are retrieved and passed to Claude — Anthropic's AI — which synthesises them into a Koan and a detailed answer.
            </p>
            <p className="text-[18px] text-black leading-relaxed mt-4">
              No answer is pre-written. Every response is generated fresh, from the source.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-auto pt-10 flex items-center justify-between">
          <p className="text-black text-xs opacity-60">
            © 2026 The Gyaan Project. All rights reserved.
          </p>
          <Link href="/" className="text-black underline text-sm">
            ← Back
          </Link>
        </div>

      </div>
    </div>
  );
}
