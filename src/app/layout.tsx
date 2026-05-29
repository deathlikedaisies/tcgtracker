import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/geist-sans.woff2",
  variable: "--font-geist-sans",
  display: "swap",
  weight: "100 900",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

const geistMono = localFont({
  src: "./fonts/geist-mono.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
  fallback: ["ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sixprizer.com"),
  title: {
    default: "SixPrizer",
    template: "%s | SixPrizer",
  },
  description:
    "SixPrizer helps competitive Pokémon TCG players log games, spot the matchups costing them wins, compare deck versions, and decide what to test next.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SixPrizer",
    description:
      "SixPrizer helps competitive Pokémon TCG players log games, spot the matchups costing them wins, compare deck versions, and decide what to test next.",
    url: "https://sixprizer.com",
    siteName: "SixPrizer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SixPrizer",
    description:
      "SixPrizer helps competitive Pokémon TCG players log games, spot the matchups costing them wins, compare deck versions, and decide what to test next.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
