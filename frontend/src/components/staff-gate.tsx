"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Sparkles, Info } from "lucide-react";
import { toast } from "sonner";

const STAFF_PASSWORD = "rva2026";

export function StaffGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("staff_auth") === "true") {
      setAuthenticated(true);
    }
  }, []);

  function handleLogin() {
    if (email.includes("@") && password.toLowerCase() === STAFF_PASSWORD) {
      localStorage.setItem("staff_auth", "true");
      setAuthenticated(true);
      toast.success("Welcome to the Staff Dashboard");
    } else {
      setError(true);
      toast.error("Invalid email or password");
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
          {/* Demo Mode Badge */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <span className="font-semibold">Demo Environment</span> — Use any email + password: <code className="font-mono font-bold bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded">rva2026</code>
            </p>
          </div>

          <div className="text-center space-y-3">
            <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Staff Portal Access</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Sign in to access procurement tools and contract management features.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="h-12 text-base"
                autoComplete="email"
                aria-describedby={error ? "login-error" : undefined}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <Input
                id="login-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="h-12 text-base"
                autoComplete="current-password"
                aria-describedby={error ? "login-error" : undefined}
              />
            </div>
            {error && <p id="login-error" className="text-sm text-red-600 dark:text-red-400" role="alert">Invalid email or password. Please try again.</p>}
            <Button type="button" onClick={() => handleLogin()} className="w-full h-12 text-base gap-2">
              <Lock className="h-4 w-4" aria-hidden="true" />
              Sign In
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
