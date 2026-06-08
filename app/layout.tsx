import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import { ALL_SERVICES, getServiceKeyword } from "./services-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const serviceKeywords = ALL_SERVICES.map((s) => getServiceKeyword(s.name));

export const metadata: Metadata = {
  title: "AtoZ Works - Premium Home Services & Verified Professionals",
  description: "Book verified professionals for AC repair, deep home cleaning, house shifting, plumbing, carpentry, pest control, electrical, and more. Fast, safe, and reliable same-day service.",
  keywords: [
    "home services in Hosur",
    "verified professionals in Hosur",
    "AtoZ Works Hosur",
    ...serviceKeywords
  ],
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
      <body className="min-h-full flex flex-col">
        {children}
        <WhatsAppWidget />
      </body>
    </html>
  );
}
