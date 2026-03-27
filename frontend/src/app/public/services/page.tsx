"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Loader2, MapPin, Phone, ExternalLink, CheckCircle,
  AlertTriangle, HelpCircle, ArrowRight, Building2
} from "lucide-react";
import { postAPI } from "@/lib/api";
import { Disclaimer } from "@/components/disclaimer";

interface NavigationResult {
  matched_category: string;
  department: string;
  confidence: string;
  next_step: string;
  explanation: string;
  url: string;
  alternative_categories: string[];
  call_311: boolean;
  disclaimer: string;
}

const EXAMPLE_ISSUES = [
  "There's a pothole on my street",
  "I need to start gas service at my new home",
  "My trash wasn't picked up this week",
  "How do I get a building permit?",
  "There's an abandoned car on my block",
  "I want to register to vote",
  "A tree fell and is blocking the road",
  "Where do I pay my water bill?",
];

function ConfidenceBadge({ level }: { level: string }) {
  const styles = {
    high: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", icon: CheckCircle, label: "High confidence" },
    medium: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", icon: AlertTriangle, label: "Medium confidence" },
    low: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: HelpCircle, label: "Low confidence — call 3-1-1 to confirm" },
  };
  const s = styles[level as keyof typeof styles] || styles.low;
  const Icon = s.icon;
  return (
    <Badge className={`${s.bg} ${s.text} border-0 gap-1.5 text-sm px-3 py-1`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {s.label}
    </Badge>
  );
}

export default function ServiceNavigatorPage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<NavigationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNavigate(q?: string) {
    const input = q || question;
    if (!input.trim()) return;
    setQuestion(input);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await postAPI<NavigationResult>("/api/services/navigate", { question: input });
      setResult(data);
    } catch {
      setError("Could not connect to the service navigator. Please try calling 3-1-1 directly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mb-2">
          <MapPin className="h-8 w-8 text-blue-600" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold dark:text-white">Find the Right City Service</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Describe your issue in your own words. We will find the right department and tell you exactly what to do next.
        </p>
      </div>

      <Disclaimer />

      {/* Search */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <label htmlFor="service-input" className="sr-only">Describe your issue</label>
          <Input
            id="service-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNavigate()}
            placeholder="Example: There's a pothole on my street..."
            className="h-14 text-lg dark:bg-slate-800 dark:border-slate-700"
            aria-describedby="service-help"
          />
          <Button
            onClick={() => handleNavigate()}
            disabled={loading || !question.trim()}
            className="h-14 px-8 text-base"
            aria-label="Find the right service"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Search className="h-5 w-5 mr-2" /> Find</>}
          </Button>
        </div>

        {/* Examples */}
        {!result && !error && (
          <div id="service-help">
            <p className="text-sm text-slate-400 mb-2">Or try one of these common issues:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_ISSUES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleNavigate(ex)}
                  className="text-sm px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20" role="alert">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <div className="mt-3 flex items-center gap-2">
            <Phone className="h-4 w-4 text-red-500" aria-hidden="true" />
            <a href="tel:311" className="text-red-700 dark:text-red-400 font-semibold underline">Call 3-1-1 directly</a>
          </div>
        </Card>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Main result card */}
          <Card className="p-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-bold dark:text-white">{result.matched_category}</h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-600 dark:text-slate-400">
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  {result.department}
                </div>
              </div>
              <ConfidenceBadge level={result.confidence} />
            </div>

            <p className="text-base leading-relaxed dark:text-slate-300">{result.explanation}</p>

            {/* Next step — the most important part */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                Your Next Step
              </h3>
              <p className="text-base font-medium dark:text-white">{result.next_step}</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
              {result.url && (
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-base font-medium"
                  style={{ minHeight: 44 }}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Go to {result.url.replace("https://www.", "")}
                </a>
              )}
              {result.call_311 && (
                <a
                  href="tel:311"
                  className="inline-flex items-center gap-2 px-5 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-base font-medium dark:text-white"
                  style={{ minHeight: 44 }}
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Call 3-1-1
                </a>
              )}
            </div>
          </Card>

          {/* Alternative categories */}
          {result.alternative_categories && result.alternative_categories.length > 0 && (
            <Card className="p-4 dark:bg-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">This could also be related to:</p>
              <div className="flex gap-2 flex-wrap">
                {result.alternative_categories.map((cat, i) => (
                  <Badge key={i} variant="outline" className="text-sm px-3 py-1">{cat}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-slate-400 text-center">{result.disclaimer}</p>

          {/* Try another */}
          <div className="text-center">
            <Button variant="ghost" onClick={() => { setResult(null); setQuestion(""); }} className="gap-2">
              <Search className="h-4 w-4" aria-hidden="true" />
              Search for another service
            </Button>
          </div>
        </div>
      )}

      {/* Always show 311 */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-800/50 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Not sure? You can always <a href="tel:311" className="text-blue-600 font-semibold underline">call 3-1-1</a> or visit{" "}
          <a href="https://www.rva311.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline">rva311.com</a> — a representative will help you find the right service.
        </p>
      </Card>
    </div>
  );
}
