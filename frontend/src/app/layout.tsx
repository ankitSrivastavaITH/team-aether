import type { Metadata } from "next";
import { Inter, Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/components/query-provider";
import { SkipLink } from "@/components/skip-link";
import { ErrorBoundary } from "@/components/error-boundary";
// AskRichmondPanel moved to staff/public layouts — not shown on landing/about/compare
import { Toaster } from "sonner";

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sans",
  display: "swap",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "RVA Contract Lens — Richmond Procurement Transparency",
  description: "Explore Richmond's $6.1 billion in public contracts. Staff procurement dashboard and public spending transparency.",
};

// Static JSON-LD structured data — no user input, safe for injection
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "GovernmentService",
  name: "RVA Contract Lens",
  description: "Richmond procurement transparency tool showing $6.1 billion in public contracts",
  serviceType: "Procurement Transparency",
  areaServed: {
    "@type": "City",
    name: "Richmond",
    containedInPlace: { "@type": "State", name: "Virginia" },
  },
  provider: {
    "@type": "Organization",
    name: "Team Aether - Hack for RVA 2026",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${atkinson.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-[#1E293B] dark:text-slate-200 font-sans antialiased">
        {/* JSON-LD structured data for SEO — static content, no XSS risk */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SkipLink />
          <QueryProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            {/* AskRichmondPanel moved to staff/public layouts only — not on landing/about/compare */}
            <Toaster position="bottom-right" richColors closeButton />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
