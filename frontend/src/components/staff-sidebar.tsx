"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Table,
  MessageSquare,
  FileUp,
  ShieldAlert,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  LogOut,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LanguageToggle } from "@/components/language-toggle";

const COLLAPSE_KEY = "staff-sidebar-collapsed";

const navItems = [
  { href: "/staff", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/staff/contracts", label: "Contracts", icon: Table },
  { href: "/staff/ask", label: "Ask Richmond", icon: MessageSquare },
  { href: "/staff/extract", label: "PDF Analyzer", icon: FileUp },
  { href: "/staff/risk", label: "Risk Analysis", icon: ShieldAlert },
  { href: "/staff/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/staff/report", label: "AI Report", icon: FileText },
];

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname.startsWith(href);
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
        collapsed ? "justify-center px-2" : "px-3"
      } ${
        active
          ? "bg-blue-50 text-blue-700 font-medium"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
      style={{ minHeight: 44 }}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="text-sm">{label}</span>}
    </Link>
  );
}

function SidebarContent({
  collapsed,
  onToggle,
  onNavClick,
}: {
  collapsed: boolean;
  onToggle?: () => void;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();

  function handleLogout() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("staff_auth");
      window.location.href = "/";
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo / Title */}
      <div
        className={`flex items-center border-b border-slate-200 shrink-0 ${
          collapsed ? "justify-center px-2 h-16" : "px-4 h-16 gap-3"
        }`}
      >
        {!collapsed && (
          <Link
            href="/staff"
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-1"
          >
            <span className="font-bold text-lg text-slate-900 whitespace-nowrap">
              RVA Contract Lens
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 uppercase tracking-wide">
              Staff
            </span>
          </Link>
        )}
        {collapsed && (
          <Link
            href="/staff"
            className="font-bold text-lg text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-1"
            aria-label="RVA Contract Lens Staff Dashboard"
          >
            RVA
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav
        aria-label="Staff navigation"
        className="flex-1 overflow-y-auto px-2 py-4 space-y-1"
      >
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(pathname, item.href, item.exact)}
            collapsed={collapsed}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-200 px-2 py-3 space-y-1 shrink-0">
        {/* Public view link */}
        <Link
          href="/public"
          className={`flex items-center gap-3 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
            collapsed ? "justify-center px-2" : "px-3"
          }`}
          style={{ minHeight: 44 }}
          title={collapsed ? "Public View" : undefined}
        >
          <Eye className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!collapsed && <span className="text-sm">Public View</span>}
        </Link>

        {/* Language toggle */}
        <div className={collapsed ? "flex justify-center" : "px-1"}>
          <LanguageToggle />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
            collapsed ? "justify-center px-2" : "px-3"
          }`}
          style={{ minHeight: 44 }}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>

        {/* Collapse toggle (desktop only) */}
        {onToggle && (
          <button
            onClick={onToggle}
            className={`flex items-center gap-3 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              collapsed ? "justify-center px-2" : "px-3"
            }`}
            style={{ minHeight: 44 }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function StaffSidebar({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Load collapse state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(COLLAPSE_KEY);
      if (stored === "true") setCollapsed(true);
    }
  }, []);

  function handleToggle() {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(COLLAPSE_KEY, String(next));
      }
      return next;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col bg-white border-r border-slate-200 shrink-0 transition-[width] duration-200 ease-out overflow-hidden"
        style={{ width: collapsed ? 64 : 240 }}
      >
        <SidebarContent collapsed={collapsed} onToggle={handleToggle} />
      </aside>

      {/* Mobile hamburger + Sheet */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center h-14 px-4 bg-white border-b border-slate-200">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0" showCloseButton={false}>
            <SidebarContent
              collapsed={false}
              onNavClick={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <Link
          href="/staff"
          className="ml-3 font-bold text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-1"
        >
          RVA Contract Lens
        </Link>
      </div>

      {/* Main content area */}
      <main
        id="main-content"
        role="main"
        className="flex-1 overflow-y-auto bg-[#F8FAFC]"
      >
        {/* Top padding for mobile header */}
        <div className="md:hidden h-14" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
