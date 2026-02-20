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
  icons: {
    icon: "/mondo-favicon.png",
    apple: "/mondo-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${literata.variable} antialiased`}>{children}</body>
    </html>
  );
}
