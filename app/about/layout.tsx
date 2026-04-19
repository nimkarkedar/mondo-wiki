import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About askTGP | The Gyaan Project",
  description:
    "askTGP is an AI oracle built on The Gyaan Project — a podcast and YouTube channel with 300+ conversations with India's leading designers, artists, architects, musicians, and writers.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About askTGP | The Gyaan Project",
    description:
      "askTGP is an AI oracle built on The Gyaan Project — a podcast and YouTube channel with 300+ conversations with India's leading designers, artists, architects, musicians, and writers.",
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About askTGP | The Gyaan Project",
    description:
      "askTGP is an AI oracle built on The Gyaan Project — a podcast and YouTube channel with 300+ conversations with India's leading designers, artists, architects, musicians, and writers.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
