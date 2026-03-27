"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Loader2, ChevronDown, ChevronUp, ExternalLink, Sparkles } from "lucide-react";
import { postAPI } from "@/lib/api";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

function formatResultValue(key: string, val: unknown): string {
  if (val === null || val === undefined) return "—";
  const s = String(val);
  if ((key === "value" || key === "total_value" || key.includes("value")) && !isNaN(Number(val)) && Number(val) > 0) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(val));
  }
  if (key.includes("date") && s.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return s;
}

function ResultCards({ results }: { results: Record<string, unknown>[] }) {
  const [showAll, setShowAll] = useState(false);
  if (!results.length) return null;

  const keys = Object.keys(results[0]);
  const nameKey = keys.find(k => k === "supplier" || k === "department" || k === "title" || k === "name") || keys[0];
  const valueKey = keys.find(k => k === "value" || k === "total_value" || k.includes("value"));
  const otherKeys = keys.filter(k => k !== nameKey);
  const visible = showAll ? results.slice(0, 100) : results.slice(0, 8);

  return (
    <div className="space-y-2">
      {visible.map((row, i) => {
        const supplierName = (row.supplier as string) || (row.vendor as string) || "";
        const hasLink = supplierName.length > 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Wrapper: React.ElementType = hasLink ? Link : "div";
        const wrapperProps = hasLink ? { href: `/public/vendor/${encodeURIComponent(supplierName)}` } : {};

        return (
          <Wrapper key={i} {...wrapperProps} className="block bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-sm space-y-1 border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all cursor-pointer group">
            <div className="flex items-start justify-between gap-3">
              <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                {String(row[nameKey] ?? `Row ${i + 1}`)}
              </span>
              <div className="flex items-center gap-2">
                {valueKey && row[valueKey] != null && (
                  <span className="font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">{formatResultValue(String(valueKey), row[valueKey])}</span>
                )}
                {hasLink && <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 flex-shrink-0" aria-hidden="true" />}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400 text-xs">
              {otherKeys.filter(k => k !== valueKey && row[k] != null && String(row[k]).trim() !== "").slice(0, 5).map(k => (
                <span key={k}>
                  <span className="text-slate-400 dark:text-slate-500">{k.replace(/_/g, " ")}:</span>{" "}
                  <span className="text-slate-600 dark:text-slate-300">{String(formatResultValue(k, row[k]))}</span>
                </span>
              ))}
            </div>
          </Wrapper>
        );
      })}
      {results.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 py-2 font-medium"
        >
          {showAll ? "Show less" : `Show all ${results.length} results`}
        </button>
      )}
    </div>
  );
}

const EXAMPLE_QUERIES = [
  "Show me all contracts expiring in the next 30 days",
  "Which department has the highest total contract value?",
  "List Public Works contracts over $1 million",
  "Who are the top 5 vendors by number of contracts?",
  "Show contracts with Carahsoft Technology",
];

interface QueryResult {
  sql?: string;
  explanation?: string;
  analysis?: string;
  followups?: string[];
  results?: Record<string, unknown>[];
  total?: number;
  error?: string;
}

export function NLQueryBar() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [lastQueryTime, setLastQueryTime] = useState(0);
  const [rateLimitMsg, setRateLimitMsg] = useState(false);

  async function handleQuery(q?: string) {
    const queryText = q || question;
    if (!queryText.trim()) return;
    const now = Date.now();
    if (now - lastQueryTime < 2000) {
      setRateLimitMsg(true);
      setTimeout(() => setRateLimitMsg(false), 2000);
      return;
    }
    setLastQueryTime(now);
    setRateLimitMsg(false);
    setLoading(true);
    setResult(null);
    setQuestion(queryText);
    try {
      const data = await postAPI<QueryResult>("/api/nl-query", { question: queryText });
      setResult(data);
    } catch {
      setResult({ error: "Could not connect to the server. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4" role="region" aria-label="Natural language contract query">
      <div>
        <h2 className="text-xl font-semibold mb-2">Ask Richmond</h2>
        <p className="text-sm text-gray-500 mb-3">Ask about contracts in plain English. We will translate your question into a database query.</p>
      </div>

      <div className="flex gap-2">
        <label htmlFor="nl-query-input" className="sr-only">Type your question about contracts</label>
        <Input
          id="nl-query-input"
          placeholder="Ask Richmond anything about city contracts..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleQuery()}
          className="h-12 text-base"
          aria-describedby="nl-query-help"
          maxLength={500}
        />
        <Button
          onClick={() => handleQuery()}
          disabled={loading || !question.trim()}
          className="h-12 px-6"
          aria-label={loading ? "Running query" : "Run query"}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <><Search className="h-5 w-5 mr-2" aria-hidden="true" /> Ask</>
          )}
        </Button>
      </div>
      {rateLimitMsg && (
        <p role="status" aria-live="polite" className="text-sm text-amber-600">
          Please wait a moment before submitting another query.
        </p>
      )}

      {/* Example queries */}
      {!result && (
        <div id="nl-query-help">
          <p className="text-sm text-gray-500 mb-2">Try one of these:</p>
          <div className="flex gap-2 flex-wrap">
            {EXAMPLE_QUERIES.map((ex) => (
              <button
                key={ex}
                onClick={() => handleQuery(ex)}
                className="text-sm px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                aria-label={`Ask: ${ex}`}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {result?.error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-800 text-sm">
          {result.error}
        </div>
      )}

      {/* Results */}
      {result?.results && (
        <Card className="p-5 space-y-4">
          {/* Explanation */}
          {result.explanation && (
            <p className="text-base text-gray-700">{result.explanation}</p>
          )}

          {/* SQL toggle */}
          {result.sql && (
            <div>
              <button
                onClick={() => setShowSql(!showSql)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                aria-expanded={showSql}
                aria-controls="generated-sql"
              >
                {showSql ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                {showSql ? "Hide" : "View"} generated SQL
              </button>
              {showSql && (
                <pre id="generated-sql" className="mt-2 p-3 bg-gray-50 rounded-lg text-xs font-mono overflow-x-auto border">
                  {result.sql}
                </pre>
              )}
            </div>
          )}

          {/* Result count */}
          <p className="text-sm text-gray-500">{result.total} result{result.total !== 1 ? "s" : ""} found</p>

          {/* AI Analysis */}
          {result.analysis && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">AI Analysis</span>
              </div>
              <div className="text-sm text-blue-900 dark:text-blue-200 prose prose-sm prose-blue dark:prose-invert max-w-none">
                <ReactMarkdown>{result.analysis}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Results — clickable formatted cards */}
          {result.results.length > 0 && (
            <ResultCards results={result.results} />
          )}

          {result.results.length > 50 && (
            <p className="text-xs text-gray-400">Showing first 50 of {result.total} results</p>
          )}

          {/* Follow-up questions */}
          {result.followups && result.followups.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" aria-hidden="true" /> Follow-up questions:
              </p>
              <div className="flex flex-wrap gap-2">
                {result.followups.map((fq, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuery(fq)}
                    className="text-sm px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {fq}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
