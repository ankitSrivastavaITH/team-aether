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
  return <LandingContent />;
}
