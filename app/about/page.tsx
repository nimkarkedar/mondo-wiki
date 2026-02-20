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

          <div>
            <p className="font-bold text-[18px] text-black mb-3">What is Mondo?</p>
            <p className="text-[18px] text-black leading-relaxed">
              Mondo is a fundamental practice in Zen Buddhism meaning "The Way of Dialogue" — a spontaneous question-and-answer exchange between a Zen master (roshi) and a disciple (unsui). In Zen, this form of live dialogue is considered one of the purest methods of transmitting insight.
            </p>
          </div>

          <div>
            <p className="font-bold text-[18px] text-black mb-3">What is Mondo.Wiki?</p>
            <p className="text-[18px] text-black leading-relaxed">
              Mondo.Wiki is an AI oracle built on over 300 conversations that Kedar Nimkar has recorded with some of the finest minds from India&apos;s creative world, representing more than 50,000 minutes of dialogue from his podcast, The Gyaan Project. Ask it anything, and it responds in true Mondo spirit: a short answer and a long answer, drawn from those conversations.
            </p>
          </div>

          <div>
            <p className="font-bold text-[18px] text-black mb-3">How does Mondo.Wiki work?</p>
            <p className="text-[18px] text-black leading-relaxed">
              Every transcript from The Gyaan Project is embedded into a vector database. When you ask a question, the most relevant passages are retrieved and passed to Claude, which synthesises them into a short and long answer. Nothing is pre-written. Every response is generated fresh, straight from the source.
            </p>
            <p className="text-[18px] text-black leading-relaxed mt-4 italic opacity-60">
              It can make mistakes. Treat its answers as a starting point, not gospel.
            </p>
          </div>

          <div>
            <p className="font-bold text-[18px] text-black mb-3">What is The Gyaan Project?</p>
            <p className="text-[18px] text-black leading-relaxed">
              The Gyaan Project (formerly Audiogyan) is a podcast and YouTube channel dedicated to exploring creative wisdom. Since 2016, it has been chronicling the ideas, philosophies, and stories of Indian luminaries: designers, artists, musicians, writers, and thinkers. Hosted by Kedar Nimkar, it functions as a contemporary creative archive, bridging the past with the present to inspire the future. At its heart, TGP is to deepen our understanding of design and art, and their impact on culture, climate, and individual lives.
            </p>
          </div>

          <div>
            <p className="font-bold text-[18px] text-black mb-3">Who created Mondo.Wiki?</p>
            <p className="text-[18px] text-black leading-relaxed">
              Kedar Nimkar is a design leader with over two decades of experience shaping India&apos;s digital landscape. He has held senior roles at Cleartrip, Jupiter, BookMyShow, and PropertyGuru in Singapore, building products that have reached millions of users. Beyond his corporate work, Kedar is deeply embedded in India&apos;s creative ecosystem as an educator, speaker, and curator. A Mumbai native now based in Singapore, he brings a distinctive voice to the global design community.
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
