"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Shield, Lock } from "lucide-react";
import { toast } from "sonner";

const STAFF_CODE = "rva2026"; // Simple access code for demo

export function StaffGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("staff_auth") === "true") {
      setAuthenticated(true);
    }
  }, []);

  function handleLogin() {
    if (code.toLowerCase() === STAFF_CODE) {
      setAuthenticated(true);
      sessionStorage.setItem("staff_auth", "true");
      toast.success("Welcome to the Staff Dashboard");
    } else {
      setError(true);
      toast.error("Invalid access code");
    }
  }

  if (authenticated) return <>{children}</>;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="p-8 max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Shield className="h-12 w-12 text-blue-600 mx-auto" aria-hidden="true" />
          <h1 className="text-2xl font-bold">Staff Access</h1>
          <p className="text-slate-500">Enter your team access code to view the procurement dashboard.</p>
        </div>
        <div className="space-y-3">
          <label htmlFor="access-code" className="text-sm font-medium">Access Code</label>
          <Input
            id="access-code"
            type="password"
            placeholder="Enter access code"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="h-12 text-base"
            aria-describedby={error ? "code-error" : undefined}
          />
          {error && <p id="code-error" className="text-sm text-red-600" role="alert">Invalid code. Please try again.</p>}
          <Button onClick={handleLogin} className="w-full h-12 text-base gap-2">
            <Lock className="h-4 w-4" aria-hidden="true" />
            Access Dashboard
          </Button>
        </div>
        <p className="text-xs text-center text-slate-400">Access codes are distributed at the hackathon kickoff.</p>
      </Card>
    </div>
  );
}
