import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { TanStackQueryProvider } from '@/providers';
import { BottomNav } from '@/components/BottomNav';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Roaming Map - Travel Q&A Platform | Get Answers from Verified Locals",
  description: "Connect with verified locals worldwide for authentic travel insights, real-time Q&A, and transparent pricing. Your local buddy in your pocket.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <TanStackQueryProvider>
            <div className="min-h-screen pb-16 md:pb-0">
              {children}
            </div>
            <Suspense fallback={null}>
              <BottomNav />
            </Suspense>
          </TanStackQueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
