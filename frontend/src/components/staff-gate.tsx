"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

const STAFF_CODE = "rva2026"; // Simple access code for demo

export function StaffGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("staff_auth") === "true") {
      setAuthenticated(true);
    }
  }, []);

  function handleLogin() {
    if (code.toLowerCase() === STAFF_CODE) {
      localStorage.setItem("staff_auth", "true");
      setAuthenticated(true);
      toast.success("Welcome to the Staff Dashboard");
    } else {
      setError(true);
      toast.error("Invalid access code");
    }
  }

  if (authenticated) return <>{children}</>;

  return (
    <div role="main" className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Branding */}
        <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-wide">RVA Contract Lens</span>
        </div>

        <Card className="p-8 w-full space-y-6 bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="text-center space-y-3">
            <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Staff Portal Access</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Enter the staff access code to view procurement tools and contract management features.
            </p>
          </div>
          <div className="space-y-3">
            <label htmlFor="access-code" className="text-sm font-medium text-slate-700 dark:text-slate-300">Access Code</label>
            <Input
              id="access-code"
              type="password"
              placeholder="Enter access code"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="h-12 text-base"
              aria-describedby={error ? "code-error" : "code-hint"}
            />
            {error && <p id="code-error" className="text-sm text-red-600 dark:text-red-400" role="alert">Invalid code. Please try again.</p>}
            <Button type="button" onClick={() => handleLogin()} className="w-full h-12 text-base gap-2">
              <Lock className="h-4 w-4" aria-hidden="true" />
              Access Dashboard
            </Button>
          </div>
          <div id="code-hint" className="text-center space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Demo access code: <code className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">rva2026</code>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
