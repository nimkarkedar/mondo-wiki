export default function Footer() {
  return (
    <footer className="w-full bg-[#111111] border-t border-white/10 py-4 px-6 md:px-10">
      <p className="text-xs text-white text-center md:text-left">
        © 2026{" "}
        <a
          href="https://www.thegyaanproject.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:opacity-70 transition-opacity"
        >
          The Gyaan Project
        </a>
        . All rights reserved.
      </p>
    </footer>
  );
}
