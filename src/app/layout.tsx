import type { Metadata } from "next";
import { Providers } from "@/providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkBanner } from "@/components";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

// Use system fonts as fallback during build
const geistSans = {
  variable: "--font-geist-sans",
  className: "font-sans",
};

const geistMono = {
  variable: "--font-geist-mono",
  className: "font-mono",
};

export const metadata: Metadata = {
  title: "JackpotWLD - World Pool Together",
  description: "Earn yield and win prizes with World ID verification on Worldchain",
  manifest: "/manifest.json",
  other: {
    "minikit:app-id": process.env.NEXT_PUBLIC_WORLD_APP_ID || "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <Providers>
            <NetworkBanner />
            {children}
            <Toaster />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
