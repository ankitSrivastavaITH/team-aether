import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/query-provider";
import { SkipLink } from "@/components/skip-link";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans antialiased">
        {/* JSON-LD structured data for SEO — static content, no XSS risk */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SkipLink />
        <QueryProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  );
}
