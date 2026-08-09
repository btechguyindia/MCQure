import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { ThemeScript } from "@/components/ThemeScript";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MCQure — AI Exam Command Center",
  description:
    "Adaptive MCQs, PYQs, concise study notes and data-driven motivation for competitive exams like DSSSB TGT Computer Science.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col">
        <NavBar />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-6">
          {children}
        </main>
        <footer className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          MCQure — your personal AI exam command center
        </footer>
      </body>
    </html>
  );
}
