import { NavBar } from "@/components/nav-bar";
import { LandingContent } from "@/components/landing-content";

export const metadata = {
  title: "RVA Contract Lens — Richmond Procurement Transparency",
  description: "Explore Richmond's $6.1 billion in public contracts. See where your tax dollars go with interactive spending charts, vendor analysis, and contract tracking.",
  openGraph: {
    title: "RVA Contract Lens — Where Do Your Tax Dollars Go?",
    description: "Richmond spends $6.1 billion in public contracts. Now you can see where it goes.",
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      <header role="banner">
        <NavBar />
      </header>
      <main id="main-content" role="main" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <LandingContent />
      </main>
      <footer role="contentinfo" className="border-t border-[#E2E8F0] bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-[#475569]">
          <p>RVA Contract Lens — Built for Hack for RVA 2026</p>
          <p className="mt-1">Data from City of Richmond Open Data. Not official City reporting.</p>
        </div>
      </footer>
    </>
  );
}
