import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import CookieConsent from "@/components/cookies";
import { GoogleAnalytics } from '@next/third-parties/google';
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

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
  const gaID = process.env.NEXT_PUBLIC_GOOGLE_TAG;
  return (
    <html lang="en">
    <body className={`${inter.className} text-sm antialiased bg-background text-foreground`}>
      {children}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 5000,
          classNames: {
            success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
            error: 'bg-orange-50 text-orange-900 border-orange-200',
            warning: 'bg-amber-50 text-amber-900 border-amber-200',
            info: 'bg-blue-50 text-blue-900 border-blue-200',
          },
        }}
      />
      <Analytics />
      <CookieConsent />
      { gaID && (
          <GoogleAnalytics gaId={gaID}/>
      )}

    </body>
    </html>
  );
}
