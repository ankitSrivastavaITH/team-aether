import { StaffGate } from "@/components/staff-gate";
import { StaffSidebar } from "@/components/staff-sidebar";

export const metadata = {
  title: "Staff Dashboard — RVA Contract Lens",
  description: "Track expiring contracts, analyze risk, and manage procurement.",
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffGate>
      <StaffSidebar>{children}</StaffSidebar>
    </StaffGate>
  );
}
