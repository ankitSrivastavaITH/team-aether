"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search, X } from "lucide-react";

interface Vendor {
  supplier: string;
  count: number;
  total_value: number;
}

interface VendorSelectProps {
  value: string;
  onChange: (vendor: string) => void;
  placeholder?: string;
  label?: string;
}

export function VendorSelect({ value, onChange, placeholder = "Select a vendor...", label }: VendorSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["all-vendors"],
    queryFn: () => fetchAPI<Vendor[]>("/api/contracts/vendors"),
    staleTime: 10 * 60 * 1000,
  });

  // Close dropdown and return focus to trigger
  const closeDropdown = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
    // Return focus to trigger button after portal unmounts
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  // Close on click outside (check both trigger and portal dropdown)
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      // Check if click is inside the trigger area
      if (ref.current?.contains(target)) return;
      // Check if click is inside the portal dropdown (it has z-9999)
      const portal = document.querySelector("[style*='z-index: 9999']");
      if (portal?.contains(target)) return;
      closeDropdown();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, closeDropdown]);

  // Focus the search input when dropdown opens
  useEffect(() => {
    if (open) {
      // Wait for the portal to mount before focusing
      requestAnimationFrame(() => searchInputRef.current?.focus());
      setActiveIndex(-1);
    }
  }, [open]);

  // Keyboard handler for dropdown navigation
  const handleDropdownKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = listRef.current?.querySelectorAll<HTMLButtonElement>("button[data-vendor-item]");
      const count = items?.length ?? 0;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          closeDropdown();
          break;
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => {
            const next = prev < count - 1 ? prev + 1 : 0;
            items?.[next]?.scrollIntoView({ block: "nearest" });
            return next;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => {
            const next = prev > 0 ? prev - 1 : count - 1;
            items?.[next]?.scrollIntoView({ block: "nearest" });
            return next;
          });
          break;
        case "Enter":
          if (activeIndex >= 0 && items && items[activeIndex]) {
            e.preventDefault();
            items[activeIndex].click();
          }
          break;
      }
    },
    [activeIndex, closeDropdown],
  );

  const filtered = vendors.filter((v) =>
    v.supplier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative w-full" style={{ zIndex: open ? 100 : "auto" }}>
      {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">{label}</label>}
      <button
        ref={triggerRef}
        type="button"
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) {
            e.preventDefault();
            closeDropdown();
          }
        }}
        onClick={() => {
          if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownStyle({
              position: "fixed",
              top: rect.bottom + 4,
              left: rect.left,
              width: rect.width,
              zIndex: 9999,
            });
          }
          setOpen(!open);
        }}
        className="w-full h-11 px-3 text-left flex items-center justify-between gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm hover:border-blue-300 dark:hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        aria-label={label || "Select vendor"}
        aria-expanded={open}
      >
        <span className={value ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange(""); setSearch(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange(""); setSearch(""); } }}
              className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5 text-slate-400" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
        </div>
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          style={dropdownStyle}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl max-h-[300px] flex flex-col"
          role="listbox"
          aria-label="Vendor list"
          onKeyDown={handleDropdownKeyDown}
        >
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
              <Input
                ref={searchInputRef}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setActiveIndex(-1); }}
                placeholder="Search vendors..."
                className="pl-8 h-9 text-sm"
                aria-label="Search vendors"
              />
            </div>
          </div>
          <div ref={listRef} className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-400 p-3 text-center">No vendors found</p>
            ) : (
              filtered.slice(0, 50).map((v, idx) => (
                <button
                  key={v.supplier}
                  type="button"
                  data-vendor-item
                  role="option"
                  aria-selected={v.supplier === value}
                  onClick={() => { onChange(v.supplier); closeDropdown(); setSearch(""); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-between ${
                    idx === activeIndex ? "bg-blue-100 dark:bg-blue-900/40 outline-none" : ""
                  } ${
                    v.supplier === value ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium" : "text-slate-700 dark:text-slate-300"
                  }`}
                  style={{ minHeight: 40 }}
                >
                  <span className="truncate">{v.supplier}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{v.count} contracts</span>
                </button>
              ))
            )}
            {filtered.length > 50 && (
              <p className="text-xs text-slate-400 p-2 text-center border-t">Type to narrow down {filtered.length} vendors</p>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
