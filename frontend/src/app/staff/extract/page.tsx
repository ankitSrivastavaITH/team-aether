"use client";

import { useQuery } from "@tanstack/react-query";
import { PdfUpload } from "@/components/pdf-upload";
import { ContractSearch } from "@/components/contract-search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchAPI } from "@/lib/api";
import {
  FileSearch,
  ScanEye,
  BrainCircuit,
  Radar,
  Database,
  Upload,
  ScanText,
  Sparkles,
  Search,
  ArrowRight,
  FileText,
  Info,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface IngestedFile {
  filename: string;
  chunks: number;
}

const PIPELINE_STEPS = [
  {
    icon: Upload,
    title: "Upload PDF",
    description: "Drop any procurement PDF, text-based or scanned.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    icon: ScanText,
    title: "OCR + Text Extraction",
    description: "Extracts text with the unstructured OCR library.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    icon: Sparkles,
    title: "AI Term Extraction",
    description: "LLM identifies parties, dates, values, and conditions.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
  },
  {
    icon: Search,
    title: "Semantic Search Ready",
    description: "Chunks are embedded and indexed for instant retrieval.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
] as const;

export default function ExtractPage() {
  const {
    data: filesData,
    isLoading: filesLoading,
    error: filesError,
    refetch: refetchFiles,
  } = useQuery({
    queryKey: ["extract-files"],
    queryFn: () => fetchAPI<{ files: IngestedFile[] }>("/api/extract/files"),
  });

  const files = filesData?.files ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50"
            aria-hidden="true"
          >
            <FileSearch className="h-6 w-6 text-blue-700 dark:text-blue-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Document Intelligence
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              Upload procurement PDFs for AI extraction with OCR support. Search
              across all ingested contracts.
            </p>
          </div>
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap gap-2" role="list" aria-label="Feature highlights">
          <Badge
            role="listitem"
            className="border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          >
            <ScanEye className="mr-1 h-3 w-3" aria-hidden="true" />
            OCR Support
          </Badge>
          <Badge
            role="listitem"
            className="border border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
          >
            <BrainCircuit className="mr-1 h-3 w-3" aria-hidden="true" />
            AI Extraction
          </Badge>
          <Badge
            role="listitem"
            className="border border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
          >
            <Radar className="mr-1 h-3 w-3" aria-hidden="true" />
            Semantic Search
          </Badge>
          <Badge
            role="listitem"
            className="border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
          >
            <Database className="mr-1 h-3 w-3" aria-hidden="true" />
            10 Hackathon Contracts Pre-loaded
          </Badge>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Two-column layout                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left column: Upload + Extraction results */}
        <section className="space-y-6" aria-label="Upload and extraction">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                Upload Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PdfUpload onUploadComplete={() => refetchFiles()} />
            </CardContent>
          </Card>
        </section>

        {/* Right column: Search + Ingested files */}
        <section className="space-y-6" aria-label="Search and ingested files">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
                Search Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContractSearch />
            </CardContent>
          </Card>

          {/* Ingested files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                Ingested Files
                {files.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {files.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filesLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2
                    className="h-6 w-6 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Loading ingested files</span>
                </div>
              )}

              {filesError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span>Failed to load ingested files.</span>
                </div>
              )}

              {!filesLoading && !filesError && files.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No files ingested yet. Upload a PDF to get started.
                </p>
              )}

              {!filesLoading && files.length > 0 && (
                <ul className="space-y-2" role="list" aria-label="Ingested document files">
                  {files.map((f) => (
                    <li key={f.filename}>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/60">
                        <span className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                          <FileText
                            className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400"
                            aria-hidden="true"
                          />
                          <span className="truncate">{f.filename}</span>
                        </span>
                        <Badge variant="outline" className="ml-2 flex-shrink-0 text-xs">
                          {f.chunks} chunk{f.chunks !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* How It Works                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="how-it-works-heading" className="space-y-5">
        <h2
          id="how-it-works-heading"
          className="text-xl font-semibold text-foreground"
        >
          How It Works
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex items-start gap-3">
                <Card className="flex-1">
                  <CardContent className="flex flex-col items-center py-5 text-center">
                    {/* Step number + icon */}
                    <div
                      className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${step.bg}`}
                      aria-hidden="true"
                    >
                      <Icon className={`h-6 w-6 ${step.color}`} />
                    </div>
                    <span className="mb-1 text-xs font-semibold text-muted-foreground">
                      Step {idx + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Arrow connector (hidden on last step and on smaller screens) */}
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div
                    className="hidden flex-shrink-0 self-center lg:flex"
                    aria-hidden="true"
                  >
                    <ArrowRight className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Handles both text-based and scanned/image PDFs using the unstructured
          OCR library.
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Pre-loaded Contracts Banner                                         */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-label="Pre-loaded contracts information"
        className="rounded-xl border border-blue-200 bg-blue-50/60 px-5 py-4 dark:border-blue-800 dark:bg-blue-950/30"
      >
        <div className="flex items-start gap-3">
          <Info
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
              10 official Hack for RVA procurement contracts are pre-loaded and
              searchable.
            </p>
            <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
              Try searching for{" "}
              <span className="font-semibold">&quot;elevator inspection&quot;</span> or{" "}
              <span className="font-semibold">&quot;paving construction&quot;</span>{" "}
              to see results immediately.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
