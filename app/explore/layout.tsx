import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design and Art related questions from people - askTGP | The Gyaan Project",
  description:
    "Explore real questions people have asked askTGP about design, art, architecture, and creativity — answered from The Gyaan Project's 300+ conversations.",
  alternates: { canonical: "/explore" },
  openGraph: {
    title: "Design and Art related questions from people - askTGP | The Gyaan Project",
    description:
      "Explore real questions people have asked askTGP about design, art, architecture, and creativity — answered from The Gyaan Project's 300+ conversations.",
    url: "/explore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Design and Art related questions from people - askTGP | The Gyaan Project",
    description:
      "Explore real questions people have asked askTGP about design, art, architecture, and creativity — answered from The Gyaan Project's 300+ conversations.",
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
