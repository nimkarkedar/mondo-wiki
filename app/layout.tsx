import type { Metadata } from "next";
import { Literata } from "next/font/google";
import "./globals.css";

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://asktgp.vercel.app"),
  title: "Ask TGP — Powered by The Gyaan Project",
  description: "Wisdom from 300+ conversations on design and art.",
  openGraph: {
    title: "Ask TGP — Powered by The Gyaan Project",
    description: "Wisdom from 300+ conversations on design and art.",
    siteName: "Ask TGP",
    images: [
      {
        url: "/meta-image.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ask TGP — Powered by The Gyaan Project",
    description: "Wisdom from 300+ conversations on design and art.",
    images: ["/meta-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/asktgp-favicon.png" />
        <link rel="apple-touch-icon" href="/asktgp-favicon.png" />
      </head>
      <body className={`${literata.variable} antialiased`}>{children}</body>
    </html>
  );
}
