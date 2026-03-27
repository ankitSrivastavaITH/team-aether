import { PublicSidebar } from "@/components/public-sidebar";
import { AskRichmondPanel } from "@/components/ask-richmond-panel";

export const metadata = {
  title: "Public Transparency — RVA Contract Lens",
  description: "See where Richmond's $6.1 billion in public contracts go. Explore spending by department, vendor, and year.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicSidebar>{children}</PublicSidebar>
      <AskRichmondPanel />
    </>
  );
}
