"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3, Search, FileText, Shield } from "lucide-react";

const STEPS = [
  {
    icon: BarChart3,
    title: "See Where Your Money Goes",
    description: "Explore $6.1 billion in Richmond contracts by department, vendor, and year.",
  },
  {
    icon: Search,
    title: "Ask Questions in Plain English",
    description: "Type questions like 'Show me contracts expiring this month' and get instant answers.",
  },
  {
    icon: FileText,
    title: "Analyze Contract PDFs",
    description: "Upload procurement documents and AI will extract key terms, dates, and conditions.",
  },
  {
    icon: Shield,
    title: "Track Contract Risk",
    description: "Staff can filter by expiration window, export to CSV, and monitor vendor concentration.",
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && !sessionStorage.getItem("welcome_seen")) {
      setOpen(true);
    }
  }, []);

  function handleClose() {
    setOpen(false);
    sessionStorage.setItem("welcome_seen", "true");
  }

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md" aria-label="Welcome to RVA Contract Lens">
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <Icon className="h-14 w-14 text-blue-600" aria-hidden="true" />
          <h2 className="text-xl font-bold">{current.title}</h2>
          <p className="text-base text-slate-500 leading-relaxed">{current.description}</p>

          {/* Step indicators */}
          <div className="flex gap-2" role="tablist" aria-label="Welcome steps">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${i === step ? "bg-blue-600" : "bg-slate-200"}`}
                aria-label={`Step ${i + 1} of ${STEPS.length}`}
                aria-selected={i === step}
                role="tab"
              />
            ))}
          </div>

          <div className="flex gap-3 w-full mt-2">
            {step < STEPS.length - 1 ? (
              <>
                <Button variant="ghost" onClick={handleClose} className="flex-1 h-11">Skip</Button>
                <Button onClick={() => setStep(step + 1)} className="flex-1 h-11">Next</Button>
              </>
            ) : (
              <Button onClick={handleClose} className="w-full h-11">Get Started</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
