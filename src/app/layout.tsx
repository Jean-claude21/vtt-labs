import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import CookieConsent from "@/components/cookies";
import { GoogleAnalytics } from '@next/third-parties/google';
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_PRODUCTNAME,
  description: "The best way to build your SaaS product.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let theme = process.env.NEXT_PUBLIC_THEME
  if(!theme) {
    theme = "dark"
  }
  const gaID = process.env.NEXT_PUBLIC_GOOGLE_TAG;
  return (
    <html lang="en">
    <body className={`${theme} ${inter.className} text-sm antialiased`}>
      {children}
      <Analytics />
      <CookieConsent />
      { gaID && (
          <GoogleAnalytics gaId={gaID}/>
      )}

    </body>
    </html>
  );
}
