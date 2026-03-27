"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Search, Loader2, FileText, Eye, ChevronDown, ChevronUp,
  ExternalLink, BookOpen, Sparkles,
} from "lucide-react";
import { API_BASE } from "@/lib/api";

interface SearchResult {
  text: string;
  score: number | null;
  metadata: { filename?: string; chunk_index?: number; total_chunks?: number };
}

const EXAMPLE_SEARCHES = [
  "What are the renewal terms?",
  "HVAC renovation scope",
  "Insurance requirements",
  "Body camera warranty",
  "DBE participation goals",
  "Liquidated damages",
];

function highlightQuery(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return text;

  const regex = new RegExp(`(${words.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    words.some((w) => part.toLowerCase() === w) ? (
      <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function relevanceColor(score: number): string {
  if (score >= 0.7) return "bg-green-100 text-green-700 border-green-200";
  if (score >= 0.5) return "bg-blue-100 text-blue-700 border-blue-200";
  if (score >= 0.3) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

function relevanceLabel(score: number): string {
  if (score >= 0.7) return "High match";
  if (score >= 0.5) return "Good match";
  if (score >= 0.3) return "Partial match";
  return "Low match";
}

// Extract structured sections from contract text
function parseContractSections(text: string): Array<{ label: string; content: string }> {
  const sections: Array<{ label: string; content: string }> = [];
  const sectionRegex = /(\d+\.\s*(?:SCOPE|TERM|PRICING|INSURANCE|TERMINATION|SPECIAL|RENEWAL|COMPENSATION)[^\n]*)/gi;
  const parts = text.split(sectionRegex);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    if (sectionRegex.test(part)) {
      sectionRegex.lastIndex = 0; // Reset regex
      const content = parts[i + 1]?.trim() || "";
      sections.push({ label: part, content });
      i++; // Skip the content part
    } else if (sections.length === 0) {
      // Header/intro text before first section
      sections.push({ label: "Contract Overview", content: part });
    }
  }

  if (sections.length === 0) {
    sections.push({ label: "Document Content", content: text });
  }

  return sections;
}

function SearchResultCard({
  result,
  query,
  index,
}: {
  result: SearchResult;
  query: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0); // First result auto-expanded
  const [pdfOpen, setPdfOpen] = useState(false);
  const score = result.score ?? 0;
  const sections = parseContractSections(result.text);

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header — always visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left p-4 hover:bg-slate-50/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
          aria-expanded={expanded}
          aria-label={`Search result from ${result.metadata.filename}. Relevance: ${(score * 100).toFixed(0)}%`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-600" aria-hidden="true" />
                    {result.metadata.filename || "Unknown file"}
                  </span>
                  {result.metadata.chunk_index !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      Section {result.metadata.chunk_index + 1}
                      {result.metadata.total_chunks ? ` of ${result.metadata.total_chunks}` : ""}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={`${relevanceColor(score)} text-xs border`}>
                {(score * 100).toFixed(0)}% · {relevanceLabel(score)}
              </Badge>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-slate-400" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
              )}
            </div>
          </div>

          {/* Preview when collapsed */}
          {!expanded && (
            <p className="text-sm text-slate-500 mt-2 line-clamp-2 ml-11">
              {result.text.slice(0, 200)}...
            </p>
          )}
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
            {/* Action buttons */}
            <div className="flex gap-2 ml-11">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPdfOpen(true)}
                className="gap-1.5 h-9"
                aria-label={`View original PDF: ${result.metadata.filename}`}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                View Original PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(
                    `${API_BASE}/api/extract/pdf/${encodeURIComponent(result.metadata.filename || "")}`,
                    "_blank"
                  );
                }}
                className="gap-1.5 h-9"
                aria-label={`Download PDF: ${result.metadata.filename}`}
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Download PDF
              </Button>
            </div>

            {/* Parsed sections with highlights */}
            <div className="ml-11 space-y-3">
              {sections.map((section, si) => (
                <div key={si}>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {section.label}
                  </h4>
                  <p className="text-sm leading-relaxed text-slate-700 bg-slate-50 rounded-lg p-3">
                    {highlightQuery(section.content, query)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* PDF Viewer Modal */}
      <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
        <DialogContent className="max-w-4xl h-[85vh] p-0" aria-label={`PDF viewer: ${result.metadata.filename}`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />
                <span className="font-semibold">{result.metadata.filename}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(
                    `${API_BASE}/api/extract/pdf/${encodeURIComponent(result.metadata.filename || "")}`,
                    "_blank"
                  );
                }}
                className="gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Open in New Tab
              </Button>
            </div>
            <iframe
              src={`${API_BASE}/api/extract/pdf/${encodeURIComponent(result.metadata.filename || "")}`}
              className="flex-1 w-full"
              title={`PDF: ${result.metadata.filename}`}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ContractSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(q?: string) {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/extract/search?q=${encodeURIComponent(searchQuery)}&n=5`
      );
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
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" aria-hidden="true" />
          Search Uploaded Contracts
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Ask questions about any uploaded contract. AI finds the most relevant sections instantly.
        </p>
      </div>

      <div className="flex gap-2">
        <label htmlFor="contract-search" className="sr-only">
          Search contracts
        </label>
        <Input
          id="contract-search"
          placeholder="Ask anything — e.g., 'What are the renewal terms?' or 'HVAC scope'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="h-12 text-base"
        />
        <Button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="h-12 px-6"
          aria-label="Search uploaded contracts"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-5 w-5" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Example searches */}
      {!searched && (
        <div>
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" aria-hidden="true" /> Try these:
          </p>
          <div className="flex gap-2 flex-wrap">
            {EXAMPLE_SEARCHES.map((ex) => (
              <button
                key={ex}
                onClick={() => handleSearch(ex)}
                className="text-sm px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {searched && results.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-slate-500">
            No matching sections found. Try different keywords or upload more PDFs.
          </p>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3" role="region" aria-label="Search results">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {results.length} relevant section{results.length !== 1 ? "s" : ""} found
            </p>
            <Badge variant="outline" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              AI-powered semantic search
            </Badge>
          </div>

          {results.map((r, i) => (
            <SearchResultCard key={i} result={r} query={query} index={i} />
          ))}

          <p className="text-xs text-slate-400 text-center pt-2">
            Results from AI-processed documents — always verify against the original PDF.
          </p>
        </div>
      )}
    </div>
  );
}
