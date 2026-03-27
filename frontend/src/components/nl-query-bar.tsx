"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { postAPI } from "@/lib/api";

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
        <h2 className="text-xl font-semibold mb-2">Ask a Question</h2>
        <p className="text-sm text-gray-500 mb-3">Ask about contracts in plain English. We will translate your question into a database query.</p>
      </div>

      <div className="flex gap-2">
        <label htmlFor="nl-query-input" className="sr-only">Type your question about contracts</label>
        <Input
          id="nl-query-input"
          placeholder="Example: Show me all contracts expiring in the next 30 days"
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

          {/* Results table */}
          {result.results.length > 0 && (
            <div className="overflow-auto max-h-[500px] border rounded-lg">
              <table className="w-full text-sm" role="table" aria-label="Query results">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {Object.keys(result.results[0]).map((key) => (
                      <th key={key} scope="col" className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">
                        {key.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.results.slice(0, 50).map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-4 py-3 max-w-[250px] truncate" title={String(val ?? "")}>
                          {String(val ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.results.length > 50 && (
            <p className="text-xs text-gray-400">Showing first 50 of {result.total} results</p>
          )}
        </Card>
      )}
    </div>
  );
}
