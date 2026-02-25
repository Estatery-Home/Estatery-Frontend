/**
 * Next.js root layout – wraps all pages.
 * Defines metadata (SEO, OG), viewport, and global styles.
 */
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Estatery | Buy, Rent & Sell Properties",
  description:
    "Estatery is a modern real estate platform for buying, renting, and selling properties.",
  icons: { icon: "/images/HomeLogo.webp" },
  openGraph: {
    title: "Estatery | Buy, Rent & Sell Properties",
    description: "Estatery is a modern real estate platform for buying, renting, and selling properties.",
    type: "website",
    url: baseUrl,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
