"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PdfUpload } from "@/components/pdf-upload";
import { ContractSearch } from "@/components/contract-search";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchAPI } from "@/lib/api";
import {
  FileSearch,
  FileText,
  ChevronRight,
  ChevronDown,
  Upload,
  Search,
  Loader2,
  ScanEye,
  BrainCircuit,
  Database,
} from "lucide-react";

interface IngestedFile {
  filename: string;
  chunks: number;
}

interface ExtractedContract {
  id: string;
  filename: string;
  uploaded_at: string;
  expiration_date: string | null;
  renewal_option: string | null;
  contract_value: string | null;
  summary: string | null;
  parties: string | null;
  key_conditions: string | null;
  pricing_structure: string | null;
}

// Categorize files
function categorizeFile(name: string): string {
  if (name.startsWith("Contract_")) return "Hackathon Contracts";
  if (name.endsWith(".txt")) return "OCR Text";
  return "Uploaded PDFs";
}

export default function ExtractPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const { data: filesData, isLoading: filesLoading, refetch: refetchFiles } = useQuery({
    queryKey: ["extract-files"],
    queryFn: () => fetchAPI<{ files: IngestedFile[] }>("/api/extract/files"),
  });

  const { data: extractedData, refetch: refetchExtracted } = useQuery({
    queryKey: ["extracted-contracts"],
    queryFn: () => fetchAPI<{ contracts: ExtractedContract[] }>("/api/extract/extracted").then(d => d.contracts),
  });

  const files = filesData?.files ?? [];
  const extracted = extractedData ?? [];

  // Build category counts
  const categories: Record<string, IngestedFile[]> = {};
  for (const f of files) {
    const cat = categorizeFile(f.filename);
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(f);
  }

  const filteredFiles = activeTab === "all" ? files : (categories[activeTab] ?? []);
  const totalChunks = files.reduce((s, f) => s + f.chunks, 0);

  // Find extracted data for a file
  function getExtraction(filename: string): ExtractedContract | undefined {
    const base = filename.replace(".txt", ".pdf");
    return extracted.find((e) =>
      e.filename === filename ||
      e.filename === base ||
      e.filename === filename.replace(".pdf", ".txt") ||
      e.filename.replace(".txt", ".pdf") === base
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
            <FileSearch className="h-5 w-5 text-blue-700 dark:text-blue-300" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Document Intelligence</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upload, extract, and search across procurement PDFs with OCR + AI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1"><Database className="h-4 w-4" /> {totalChunks} chunks</span>
          <span>{files.length} files</span>
        </div>
      </div>

      {/* Action buttons row */}
      <div className="flex gap-2">
        <button
          onClick={() => { setShowUpload(!showUpload); setShowSearch(false); }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            showUpload
              ? "bg-blue-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
          style={{ minHeight: 40 }}
        >
          <Upload className="h-4 w-4" /> Upload PDF
        </button>
        <button
          onClick={() => { setShowSearch(!showSearch); setShowUpload(false); }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            showSearch
              ? "bg-violet-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
          style={{ minHeight: 40 }}
        >
          <Search className="h-4 w-4" /> Search Documents
        </button>
      </div>

      {/* Collapsible upload panel */}
      {showUpload && (
        <Card>
          <CardContent className="pt-4">
            <PdfUpload onUploadComplete={() => { refetchFiles(); refetchExtracted(); }} />
          </CardContent>
        </Card>
      )}

      {/* Collapsible search panel */}
      {showSearch && (
        <Card>
          <CardContent className="pt-4">
            <ContractSearch />
          </CardContent>
        </Card>
      )}

      {/* Feature badges */}
      <div className="flex flex-wrap gap-2">
        <Badge className="border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          <ScanEye className="mr-1 h-3 w-3" /> OCR Support
        </Badge>
        <Badge className="border border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
          <BrainCircuit className="mr-1 h-3 w-3" /> AI Extraction
        </Badge>
        <Badge className="border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
          <Database className="mr-1 h-3 w-3" /> {extracted.length} Contracts Analyzed
        </Badge>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "all"
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          All ({files.length})
        </button>
        {Object.entries(categories).map(([cat, catFiles]) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === cat
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {cat} ({catFiles.length})
          </button>
        ))}
      </div>

      {/* File list — clean expandable rows like the reference */}
      <div className="space-y-2">
        {filesLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {!filesLoading && filteredFiles.length === 0 && (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No files in this category. Upload a PDF to get started.</p>
          </div>
        )}

        {filteredFiles.map((f) => {
          const isExpanded = expandedFile === f.filename;
          const extraction = getExtraction(f.filename);
          const cat = categorizeFile(f.filename);
          const catColor = cat === "Hackathon Contracts"
            ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
            : cat === "OCR Text"
            ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
            : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300";

          return (
            <div key={f.filename}>
              <button
                onClick={() => setExpandedFile(isExpanded ? null : f.filename)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                style={{ minHeight: 56 }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{f.filename}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{f.chunks} chunks indexed</p>
                </div>
                <Badge className={`text-[10px] shrink-0 ${catColor}`}>{cat.split(" ")[0]}</Badge>
                {extraction && (
                  <Badge className="text-[10px] bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 shrink-0">
                    AI Extracted
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0" />
                )}
              </button>

              {/* Expanded detail */}
              {isExpanded && extraction && (() => {
                const fields: { label: string; value: string | null | undefined }[] = [
                  { label: "Contract Value", value: extraction.contract_value },
                  { label: "Expiration Date", value: extraction.expiration_date },
                  { label: "Renewal Option", value: extraction.renewal_option },
                  { label: "Pricing Structure", value: extraction.pricing_structure },
                  { label: "Parties", value: extraction.parties },
                  { label: "Key Conditions", value: extraction.key_conditions },
                ];
                const hasData = fields.filter(f => f.value && f.value !== "null" && f.value !== "Not found");
                return (
                  <div className="ml-12 mt-1 mb-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 space-y-3">
                    {extraction.summary && extraction.summary !== "null" && extraction.summary !== "2 sentence summary" && (
                      <p className="text-sm text-slate-700 dark:text-slate-300">{extraction.summary}</p>
                    )}
                    {hasData.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {hasData.map(f => (
                          <div key={f.label}>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">{f.label}</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{f.value}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Document indexed for search. Detailed terms not yet extracted.</p>
                    )}
                  </div>
                );
              })()}

              {/* Expanded but no extraction */}
              {isExpanded && !extraction && (
                <div className="ml-12 mt-1 mb-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Indexed for search ({f.chunks} chunks) but not yet AI-analyzed.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`${API_BASE}/api/extract`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ filename: f.filename, rescan: true }),
                          });
                          if (res.ok) { refetchExtracted(); refetchFiles(); }
                        } catch {}
                      }}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                      style={{ minHeight: 32 }}
                    >
                      <BrainCircuit className="h-3 w-3" /> Analyze Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
