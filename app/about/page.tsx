import Image from "next/image";
import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen w-full bg-white md:bg-[#111111] flex flex-col items-center md:py-10">
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
          <h1 className="text-black text-5xl md:text-6xl font-bold leading-tight">About</h1>
        </div>

        {/* Two-column content */}
        <div className="flex-1 flex flex-col md:flex-row w-full mt-8 md:mt-10">

          {/* Left column */}
          <div className="w-full md:w-1/2 px-8 md:px-10 pb-10 md:pb-14 flex flex-col gap-5">
            <p className="text-base text-black leading-relaxed">
              Ask TGP is an AI oracle built on conversations that <a href="https://www.nimkarkedar.com/about" target="_blank" rel="noopener noreferrer" className="underline">Kedar Nimkar</a> has recorded with some of the finest minds from India&apos;s creative world on The Gyaan Project Podcast.
            </p>

            <p className="text-base text-black leading-relaxed">
              Ask it anything, and it responds with a short answer and a long answer, drawn from conversations. Expect philosophical answers and insights rather than practical tips and instructions.
            </p>

            <p className="text-base text-black leading-relaxed">
              Nothing is pre-written. Every response is generated fresh, straight from the source. It can make mistakes. Treat these answers as a starting point, not gospel.
            </p>
          </div>

          {/* Dashed divider */}
          <div className="md:hidden border-t border-dashed border-gray-300 mx-8" />
          <div className="hidden md:block border-l border-dashed border-gray-300" />

          {/* Right column */}
          <div className="w-full md:w-1/2 px-8 md:px-10 pb-10 md:pb-14 flex flex-col gap-5">
            <p className="text-base text-black leading-relaxed">
              The Gyaan Project is a podcast and YouTube channel dedicated to exploring creative wisdom. Since 2016, it has been chronicling the ideas, philosophies, and stories of Indian luminaries: designers, artists, musicians, writers, and thinkers. It functions as a contemporary creative archive, bridging the past with the present to inspire the future.
            </p>

            <p className="text-base text-black leading-relaxed">
              At its heart, TGP is to widen our understanding of design and art, and their impact on culture, society, and individual lives.
            </p>

            <p className="text-base text-black leading-relaxed">
              TGP is the brain child of{" "}
              <a
                href="https://www.linkedin.com/in/nimkarkedar/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Kedar Nimkar
              </a>
              . Kedar is a design leader with over two decades of experience shaping Indian and South East Asian digital landscape. He has held senior roles at Cleartrip, Jupiter, BookMyShow, and PropertyGuru in Singapore.
            </p>

            <p className="text-base text-black leading-relaxed">
              Got questions? Feedback? Reach out to him at{" "}
              <a href="mailto:thegyaanprojectpodcast@gmail.com" className="underline">
                thegyaanprojectpodcast@gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>

    </div>
    <p className="text-xs text-black md:text-white text-center mt-6 pb-6 px-6">© 2026 The Gyaan Project. All rights reserved.</p>
    </div>
  );
}
