import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/query-provider";
import { SkipLink } from "@/components/skip-link";
import { NavBar } from "@/components/nav-bar";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "RVA Contract Lens — Richmond Procurement Transparency",
  description: "Explore Richmond's $6.1 billion in public contracts. Staff procurement dashboard and public spending transparency.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans antialiased">
        <SkipLink />
        <QueryProvider>
          <header role="banner">
            <NavBar />
          </header>
          <main id="main-content" role="main" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <footer role="contentinfo" className="border-t border-[#E2E8F0] bg-white mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-[#475569]">
              <p>RVA Contract Lens — Built for Hack for RVA 2026</p>
              <p className="mt-1">Data from City of Richmond Open Data. Not official City reporting.</p>
            </div>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
