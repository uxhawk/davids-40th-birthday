import type { Metadata, Viewport } from "next";
import { Outfit, Righteous, Space_Mono } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const display = Righteous({ variable: "--ff-display", weight: "400", subsets: ["latin"] });
const body = Outfit({ variable: "--ff-body", subsets: ["latin"] });
const mono = Space_Mono({ variable: "--ff-mono", weight: ["400", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${site.title} · ${site.country} ${site.start.getUTCFullYear()}`,
  description: `${site.title} in ${site.country}, ${site.dateLabel}.`,
  // Private party: keep it out of search engines.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#150f2e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
