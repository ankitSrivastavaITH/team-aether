import { NavBar } from "@/components/nav-bar";
import { LandingContent } from "@/components/landing-content";

export const metadata = {
  title: "RVA Contract Lens — Richmond's $6.76B in Public Contracts, Made Visible",
  description:
    "Track 1,395 contracts across City, Federal, and State sources. AI-powered analysis for staff. Transparent spending for Richmond residents.",
  openGraph: {
    title: "RVA Contract Lens — Richmond's $6.76B in Public Contracts, Made Visible",
    description:
      "Track 1,395 contracts across City, Federal, and State sources. AI-powered analysis for staff. Transparent spending for residents.",
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      <header role="banner">
        <NavBar />
      </header>
      <main id="main-content" role="main">
        <LandingContent />
      </main>
    </>
  );
}
