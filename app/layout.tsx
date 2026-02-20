import type { Metadata } from "next";
import { Literata } from "next/font/google";
import "./globals.css";

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "mondo.wiki — Powered by The Gyaan Project",
  description: "Wisdom from 300+ conversations on design and art.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/mondo-favicon.png" />
        <link rel="apple-touch-icon" href="/mondo-favicon.png" />
      </head>
      <body className={`${literata.variable} antialiased`}>{children}</body>
    </html>
  );
}
