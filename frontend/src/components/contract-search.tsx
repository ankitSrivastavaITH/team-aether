"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface SearchResult {
  text: string;
  score: number | null;
  metadata: { filename?: string; chunk_index?: number };
}

export function ContractSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/extract/search?q=${encodeURIComponent(query)}&n=5`);
      const data = await res.json();
      setResults(data.results || []);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Search Uploaded Contracts</h2>
      <p className="text-sm text-gray-500">Search across all uploaded PDF contracts using AI-powered semantic search.</p>

      <div className="flex gap-2">
        <label htmlFor="contract-search" className="sr-only">Search contracts</label>
        <Input
          id="contract-search"
          placeholder="Example: renewal terms for maintenance services"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="h-12 text-base"
        />
        <Button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="h-12 px-6"
          aria-label="Search uploaded contracts"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Search className="h-5 w-5" aria-hidden="true" />}
        </Button>
      </div>

      {searched && results.length === 0 && (
        <p className="text-sm text-gray-500">No results found. Upload some contract PDFs first, then search.</p>
      )}

      {results.length > 0 && (
        <div className="space-y-3" role="region" aria-label="Search results">
          <p className="text-sm text-gray-500">{results.length} relevant sections found</p>
          {results.map((r, i) => (
            <Card key={i} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-blue-600">{r.metadata.filename || "Unknown file"}</span>
                {r.score !== null && (
                  <span className="text-xs text-gray-400">Relevance: {(r.score * 100).toFixed(0)}%</span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-gray-700">{r.text}</p>
            </Card>
          ))}
          <p className="text-xs text-gray-400">
            Results from AI-processed documents — verify against originals.
          </p>
        </div>
      )}
    </div>
  );
}
