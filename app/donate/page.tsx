import Image from "next/image";
import Link from "next/link";

export default function Donate() {
  return (
    <div className="min-h-screen w-full bg-white md:bg-gray-100 flex flex-col items-center md:py-10">
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

      <main className="flex-1" />

    </div>
    <p className="text-xs text-[#656565] text-center mt-6 pb-6 px-6">© 2026 The Gyaan Project. All rights reserved.</p>
    </div>
  );
}
