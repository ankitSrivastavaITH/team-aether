"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, X } from "lucide-react";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder = "All", label }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      const portal = document.querySelector("[data-multiselect-portal]");
      if (portal?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggle(val: string) {
    if (selected.includes(val)) {
      onChange(selected.filter(s => s !== val));
    } else {
      onChange([...selected, val]);
    }
  }

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const displayText = selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block sr-only">{label}</label>}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setStyle({ position: "fixed", top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 250), zIndex: 9999 });
          }
          setOpen(!open);
        }}
        className="h-11 px-3 text-left flex items-center justify-between gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm hover:border-blue-300 dark:hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors min-w-[200px]"
        aria-label={label || placeholder}
        aria-expanded={open}
      >
        <span className={`truncate ${selected.length > 0 ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>
          {displayText}
        </span>
        <div className="flex items-center gap-1">
          {selected.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange([]); } }}
              className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              aria-label="Clear all"
            >
              <X className="h-3.5 w-3.5 text-slate-400" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
        </div>
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div data-multiselect-portal style={style} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl max-h-[300px] flex flex-col">
          {options.length > 8 && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter..."
                className="w-full h-8 px-2 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          )}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-400 p-3 text-center">No options</p>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2 text-slate-700 dark:text-slate-300"
                  style={{ minHeight: 36 }}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    selected.includes(opt)
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-300 dark:border-slate-600"
                  }`}>
                    {selected.includes(opt) && <Check className="h-3 w-3" />}
                  </div>
                  <span className="truncate">{opt}</span>
                </button>
              ))
            )}
          </div>
          {selected.length > 0 && (
            <div className="p-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <span className="text-xs text-slate-500">{selected.length} selected</span>
              <button onClick={() => onChange([])} className="text-xs text-blue-600 hover:underline">Clear all</button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
