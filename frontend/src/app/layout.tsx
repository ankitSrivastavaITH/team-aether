import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { QueryProvider } from "@/components/query-provider";
import { SkipLink } from "@/components/skip-link";
import { BarChart3, Shield } from "lucide-react";

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
            <nav aria-label="Main navigation" className="border-b border-[#E2E8F0] bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-8">
                <Link href="/" className="font-bold text-xl text-[#1E293B] hover:text-[#2563EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 rounded-md px-1">
                  RVA Contract Lens
                </Link>
                <div className="flex items-center gap-1">
                  <Link
                    href="/staff"
                    className="flex items-center gap-2 px-4 py-2 text-base text-[#475569] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                  >
                    <Shield className="h-5 w-5" aria-hidden="true" />
                    <span>Staff Dashboard</span>
                  </Link>
                  <Link
                    href="/public"
                    className="flex items-center gap-2 px-4 py-2 text-base text-[#475569] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                  >
                    <BarChart3 className="h-5 w-5" aria-hidden="true" />
                    <span>Public Transparency</span>
                  </Link>
                </div>
              </div>
            </nav>
          </header>
          <main id="main-content" role="main" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {children}
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
