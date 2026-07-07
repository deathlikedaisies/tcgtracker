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

const siteDescription =
  "SixPrizer helps competitive Pokémon TCG players log games, spot matchup patterns, compare deck versions, and decide what to test next.";

const ogImageUrl = "https://sixprizer.com/og/sixprizer-og.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://sixprizer.com"),
  title: {
    default: "SixPrizer",
    template: "%s | SixPrizer",
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SixPrizer",
    description: siteDescription,
    url: "https://sixprizer.com",
    siteName: "SixPrizer",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "SixPrizer Pokémon TCG testing tracker",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SixPrizer",
    description: siteDescription,
    images: [ogImageUrl],
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
