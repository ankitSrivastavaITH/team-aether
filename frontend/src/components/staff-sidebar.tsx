"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Table,
  FileUp,
  ShieldAlert,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  LogOut,
  Menu,
  Users,
  AlertOctagon,
  Brain,
  Zap,
  CalendarDays,
  LayoutGrid,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

const COLLAPSE_KEY = "staff-sidebar-collapsed";
const ANALYTICS_OPEN_KEY = "sidebar-analytics-open";
const RISK_OPEN_KEY = "sidebar-risk-open";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}

interface NavSection {
  title: string;
  collapsible?: boolean;
  storageKey?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "",
    items: [
      { href: "/staff", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: "Procurement",
    items: [
      { href: "/staff/contracts", label: "All Contracts", icon: Table },
      { href: "/staff/decision", label: "Decision Engine", icon: Zap },
    ],
  },
  {
    title: "AI Tools",
    items: [
      { href: "/staff/extract", label: "PDF Analyzer", icon: FileUp },
      { href: "/staff/parsed", label: "Contract Intel", icon: Brain },
      { href: "/staff/health", label: "Health Scanner", icon: Activity },
    ],
  },
  {
    title: "Analytics",
    collapsible: true,
    storageKey: ANALYTICS_OPEN_KEY,
    items: [
      { href: "/staff/analytics", label: "Charts & Trends", icon: BarChart3 },
      { href: "/staff/scorecard", label: "Dept Scorecards", icon: LayoutGrid },
      { href: "/staff/cost-analysis", label: "Cost Analysis", icon: TrendingUp },
      { href: "/staff/timeline", label: "Timeline", icon: CalendarDays },
    ],
  },
  {
    title: "Risk & Equity",
    collapsible: true,
    storageKey: RISK_OPEN_KEY,
    items: [
      { href: "/staff/risk", label: "Vendor Risk (HHI)", icon: ShieldAlert },
      { href: "/staff/anomalies", label: "Anomalies", icon: AlertOctagon },
      { href: "/staff/mbe", label: "MBE Analysis", icon: Users },
    ],
  },
];

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname.startsWith(href);
}

function sectionContainsActivePage(pathname: string, items: NavItem[]): boolean {
  return items.some((item) => isActive(pathname, item.href, item.exact));
}

function NavItemLink({
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
          ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-medium"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
      }`}
      style={{ minHeight: 44 }}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="text-sm">{label}</span>}
    </Link>
  );
}

function CollapsibleSection({
  section,
  pathname,
  collapsed: sidebarCollapsed,
  onNavClick,
}: {
  section: NavSection;
  pathname: string;
  collapsed: boolean;
  onNavClick?: () => void;
}) {
  const hasActivePage = sectionContainsActivePage(pathname, section.items);

  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined" && section.storageKey) {
      const stored = localStorage.getItem(section.storageKey);
      if (stored !== null) return stored === "true";
    }
    return false;
  });

  // Auto-expand if user navigates to a page inside this section
  useEffect(() => {
    if (hasActivePage && !isOpen) {
      setIsOpen(true);
      if (typeof window !== "undefined" && section.storageKey) {
        localStorage.setItem(section.storageKey, "true");
      }
    }
  }, [hasActivePage]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (typeof window !== "undefined" && section.storageKey) {
        localStorage.setItem(section.storageKey, String(next));
      }
      return next;
    });
  }, [section.storageKey]);

  // In collapsed sidebar mode, show all items as flat icons
  if (sidebarCollapsed) {
    return (
      <div className="mt-4">
        <div className="mx-3 mb-2 border-t border-slate-200 dark:border-slate-700" />
        {section.items.map((item) => (
          <NavItemLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(pathname, item.href, item.exact)}
            collapsed
            onClick={onNavClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full px-3 mb-1 group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
        aria-expanded={isOpen}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
          {section.title}
        </span>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
        )}
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          {section.items.map((item) => (
            <NavItemLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(pathname, item.href, item.exact)}
              collapsed={false}
              onClick={onNavClick}
            />
          ))}
        </div>
      </div>
    </div>
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

  return (
    <div className="flex flex-col h-full">
      {/* Logo / Title */}
      <div
        className={`flex items-center border-b border-slate-200 dark:border-slate-700 shrink-0 ${
          collapsed ? "justify-center px-2 h-16" : "px-4 h-16 gap-3"
        }`}
      >
        {!collapsed && (
          <Link
            href="/staff"
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-1"
          >
            <span className="font-bold text-lg text-slate-900 dark:text-slate-100 whitespace-nowrap">
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
        className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5"
      >
        {navSections.map((section, si) => {
          // Collapsible sections get their own component
          if (section.collapsible) {
            return (
              <CollapsibleSection
                key={si}
                section={section}
                pathname={pathname}
                collapsed={collapsed}
                onNavClick={onNavClick}
              />
            );
          }

          // Non-collapsible sections render inline
          return (
            <div key={si} className={si > 0 ? "mt-4" : ""}>
              {section.title && !collapsed && (
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.title}
                </p>
              )}
              {collapsed && si > 0 && (
                <div className="mx-3 mb-2 border-t border-slate-200 dark:border-slate-700" />
              )}
              {section.items.map((item) => (
                <NavItemLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isActive(pathname, item.href, item.exact)}
                  collapsed={collapsed}
                  onClick={onNavClick}
                />
              ))}
            </div>
          );
        })}
      </nav>

      {/* Bottom section — collapse toggle only */}
      <div className="border-t border-slate-200 dark:border-slate-700 px-2 py-3 shrink-0">
        {onToggle && (
          <button
            onClick={onToggle}
            className={`flex items-center gap-3 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
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
        className="hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shrink-0 transition-[width] duration-200 ease-out overflow-hidden"
        style={{ width: collapsed ? 64 : 240 }}
      >
        <SidebarContent collapsed={collapsed} onToggle={handleToggle} />
      </aside>

      {/* Mobile hamburger + Sheet */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center h-14 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 bg-white dark:bg-slate-900" showCloseButton={false}>
            <SidebarContent
              collapsed={false}
              onNavClick={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <Link
          href="/staff"
          className="ml-3 font-bold text-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-1"
        >
          RVA Contract Lens
        </Link>
      </div>

      {/* Main content area */}
      <main
        id="main-content"
        role="main"
        className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-slate-950"
      >
        {/* Top padding for mobile header */}
        <div className="md:hidden h-14" />

        {/* Top-right toolbar */}
        <div className="flex items-center justify-end gap-1 px-4 sm:px-6 lg:px-8 pt-4 pb-0">
          <Link
            href="/public"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Public View"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Public View</span>
          </Link>
          <LanguageToggle />
          <ThemeToggle />
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("staff_auth");
                window.location.href = "/";
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Logout"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
