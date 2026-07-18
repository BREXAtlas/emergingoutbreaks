import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const image = new URL("/og.png", base).toString();

  return {
    metadataBase: base,
    title: "Outbreak Atlas | U.S. Cyclospora Situation Desk",
    description:
      "Evidence-led U.S. Cyclospora case tracking, outbreak maps, verified alerts, news, research, prevention, and daily source updates.",
    applicationName: "Outbreak Atlas",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Outbreak Atlas | Cyclospora Situation Desk",
      description: "Verified sources. Clear uncertainty. Daily U.S. outbreak intelligence.",
      type: "website",
      images: [{ url: image, width: 1672, height: 941, alt: "Outbreak Atlas Cyclospora U.S. situation desk" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Outbreak Atlas | Cyclospora Situation Desk",
      description: "Verified sources. Clear uncertainty. Daily U.S. outbreak intelligence.",
      images: [image],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
