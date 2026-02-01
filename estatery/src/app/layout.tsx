import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estatery | Buy, Rent & Sell Properties",
  description:
    "Estatery is a modern real estate platform for buying, renting, and selling properties.",
  icons: { icon: "/Logo.png" },
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
