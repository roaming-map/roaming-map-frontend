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
  title: "Roaming Map - Sri Lanka Travel Q&A",
  description: "Ask and answer destination-specific travel questions for Sri Lanka. Browse discussions by place, category, and useful community replies.",
  icons: {
    icon: "/short-logo.png",
    apple: "/short-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
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
