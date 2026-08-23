import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { MobileNav } from "@/components/MobileNav";
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
    { media: "(prefers-color-scheme: light)", color: "#f4f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#061614" },
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand focus:shadow-lift"
        >
          Skip to content
        </a>
        <NavBar />
        <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-8 sm:px-6 lg:pb-20">
          {children}
        </main>
        <footer className="border-t border-line">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 py-10 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2.5 text-sm font-bold tracking-tight">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-accent text-[0.65rem] font-black text-on-brand shadow-glow">
                M
              </span>
              MCQure
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-muted-fg">
              {FOOTER_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="transition-colors hover:text-brand">
                  {l.label}
                </Link>
              ))}
              <a
                href="https://dsssb.delhi.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-brand"
              >
                DSSSB official site ↗
              </a>
            </nav>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-subtle-fg">
              Practice → Study → Prepare → Mock
            </p>
          </div>
        </footer>
        <div aria-hidden className="h-16 lg:hidden" />
        <MobileNav />
      </body>
    </html>
  );
}
