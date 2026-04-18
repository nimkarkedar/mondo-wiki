import Image from "next/image";
import Link from "next/link";

export default function About() {
  return (
    <div className="relative min-h-screen w-full flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row w-full">

        {/* Left panel — orange */}
        <section className="w-full md:w-[30%] bg-[#ff6400] flex flex-col">
          <header className="w-full flex items-stretch justify-between pl-0 pr-6 md:pr-10">
            <Link
              href="/"
              className="focus:outline-none shrink-0 flex items-center pl-6 md:pl-10 pr-5 md:pr-7 py-0 md:py-[10px]"
            >
              <Image
                src="/asktgp-logo.svg"
                alt="Ask TGP"
                width={156}
                height={44}
                priority
                className="h-[72px] md:h-[70px] w-auto"
              />
            </Link>
            <nav className="flex items-center gap-8 md:gap-12 text-black text-lg">
              <Link href="/about" className="hover:opacity-70 transition-opacity">About</Link>
              <Link href="/donate" className="hover:opacity-70 transition-opacity">Donate</Link>
            </nav>
          </header>

          <div className="px-6 md:px-10 pt-10 md:pt-[50px] pb-10 md:pb-14">
            <h1 className="text-black text-5xl md:text-6xl font-bold leading-none" style={{ letterSpacing: "-2px" }}>About</h1>
          </div>
        </section>

        {/* Right panel — black */}
        <section className="relative w-full flex-1 md:flex-none md:w-[70%] bg-[#111111] flex flex-col">
          <div className="px-6 md:px-10 pt-10 md:pt-[50px] pb-20 md:pb-24 max-w-[36ch] md:max-w-[52ch]">
            <div className="flex flex-col gap-6 text-white text-base leading-relaxed">
              <p>
                Ask TGP is an AI oracle built on conversations that{" "}
                <a href="https://www.nimkarkedar.com/about" target="_blank" rel="noopener noreferrer" className="underline">
                  Kedar Nimkar
                </a>{" "}
                has recorded with some of the finest minds from India&apos;s creative world on{" "}
                <a href="https://thegyaanproject.com" target="_blank" rel="noopener noreferrer" className="underline">
                  The Gyaan Project
                </a>{" "}
                Podcast.
              </p>

              <p>
                Ask it anything, and it responds with a short answer and a long answer, drawn from conversations. Expect philosophical answers and insights rather than practical tips and instructions.
              </p>

              <p>
                Nothing is pre-written. Every response is generated fresh, straight from the source. It can make mistakes. Treat these answers as a starting point, not gospel.
              </p>

              <p>
                The Gyaan Project is a podcast and YouTube channel dedicated to exploring creative wisdom. Since 2016, it has been chronicling the ideas, philosophies, and stories of Indian luminaries: designers, artists, musicians, writers, and thinkers. It functions as a contemporary creative archive, bridging the past with the present to inspire the future.
              </p>

              <p>
                At its heart, TGP is to widen our understanding of design and art, and their impact on culture, society, and individual lives.
              </p>

              <p>
                TGP is the brain child of{" "}
                <a href="https://www.linkedin.com/in/nimkarkedar/" target="_blank" rel="noopener noreferrer" className="underline">
                  Kedar Nimkar
                </a>
                . Kedar is a design leader with over two decades of experience shaping Indian and South East Asian digital landscape. He has held senior roles at Cleartrip, Jupiter, BookMyShow, and PropertyGuru in Singapore.
              </p>

              <p>
                Got questions? Feedback? Reach out to him at{" "}
                <a href="mailto:thegyaanprojectpodcast@gmail.com" className="underline">
                  thegyaanprojectpodcast@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>

      </div>

      <p className="absolute bottom-6 left-0 right-0 px-6 text-center md:left-10 md:right-auto md:px-0 md:text-left z-10 text-xs text-white pointer-events-none">© 2026 The Gyaan Project. All rights reserved.</p>
    </div>
  );
}
