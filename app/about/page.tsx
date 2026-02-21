import Image from "next/image";
import Link from "next/link";

export default function About() {
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

        <div className="hidden md:flex flex-1" />

        <Link
          href="/"
          className="hidden md:inline-flex items-center gap-2 text-black text-sm underline mt-10"
        >
          ← Back to mondo.wiki
        </Link>
      </div>

      {/* ── White Pane ── */}
      <div className="w-full md:flex-1 bg-white flex flex-col px-8 md:px-14 py-10 overflow-y-auto">

        <h1 className="text-black text-4xl md:text-5xl font-bold leading-tight mb-10">About</h1>

        <div className="flex flex-col gap-10 pr-8 md:pr-16">

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
              <a
                href="https://www.linkedin.com/in/nimkarkedar/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline inline-flex items-center gap-1"
              >
                Kedar Nimkar
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="inline-block translate-y-[-1px]">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>{" "}
              is a design leader with over two decades of experience shaping India&apos;s digital landscape. He has held senior roles at Cleartrip, Jupiter, BookMyShow, and PropertyGuru in Singapore, building products that have reached millions of users. Beyond his corporate work, Kedar is deeply embedded in India&apos;s creative ecosystem as an educator, speaker, and curator. A Mumbai native now based in Singapore, he brings a distinctive voice to the global design community.
            </p>
          </div>

          <div>
            <p className="text-[18px] text-black leading-relaxed">
              Got questions? Feedback? Reach out at{" "}
              <a href="mailto:thegyaanprojectpodcast@gmail.com" className="underline">
                thegyaanprojectpodcast@gmail.com
              </a>
            </p>
          </div>

        </div>

      </div>
    </div>
    <p className="text-xs text-black/40 text-center px-8 md:px-0">
      © 2026 The Gyaan Project. All rights reserved.
    </p>
    </div>
  );
}
