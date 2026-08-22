import type { Metadata, Viewport } from "next";
import Link from "next/link";
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
  title: {
    default: "MCQure — AI Exam Command Center",
    template: "%s — MCQure",
  },
  description:
    "Adaptive MCQs, PYQs, concise study notes and data-driven motivation for competitive exams like DSSSB TGT Computer Science.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

const FOOTER_LINKS: Array<{ href: string; label: string }> = [
  { href: "/practice", label: "Practice" },
  { href: "/mock", label: "Mock tests" },
  { href: "/study", label: "Study notes" },
  { href: "/questions", label: "Question bank" },
  { href: "/pyq", label: "PYQ bank" },
  { href: "/analytics", label: "Analytics" },
  { href: "/reports", label: "Reports" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col" suppressHydrationWarning>
        <NavBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-6 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[0.65rem] font-black text-white">
                M
              </span>
              MCQure
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              {FOOTER_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                  {l.label}
                </Link>
              ))}
            </nav>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Practice → Study → Prepare → Mock
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
