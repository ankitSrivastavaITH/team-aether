"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="gap-2 h-10 px-3 text-sm"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <><Sun className="h-4 w-4" aria-hidden="true" /><span>Light</span></>
      ) : (
        <><Moon className="h-4 w-4" aria-hidden="true" /><span>Dark</span></>
      )}
    </Button>
  );
}
