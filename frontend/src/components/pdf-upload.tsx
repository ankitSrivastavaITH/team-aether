"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ExtractionResult {
  filename: string;
  text_length: number;
  chunks_stored: number;
  extraction: {
    expiration_date?: string | null;
    renewal_option?: string | null;
    pricing_structure?: string | null;
    key_conditions?: string[];
    parties?: string[];
    contract_value?: string | null;
    summary?: string | null;
    error?: string;
  };
  disclaimer: string;
}

export function PdfUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/api/extract`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-400 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
        role="region"
        aria-label="PDF file upload area"
      >
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); setError(null); }}
          className="sr-only"
          id="pdf-input"
          aria-describedby="pdf-help"
        />
        <label htmlFor="pdf-input" className="cursor-pointer flex flex-col items-center gap-3">
          <Upload className="h-10 w-10 text-gray-400" aria-hidden="true" />
          <span className="text-lg font-medium text-gray-700">
            {file ? file.name : "Click to select a procurement PDF"}
          </span>
          <span id="pdf-help" className="text-sm text-gray-500">
            PDF files only. The document will be analyzed by AI.
          </span>
        </label>
      </div>

      {/* Upload button */}
      {file && (
        <Button
          onClick={handleUpload}
          disabled={loading}
          className="w-full h-12 text-base"
          aria-label={loading ? "Extracting contract terms" : "Extract key terms from PDF"}
        >
          {loading ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> Analyzing document...</>
          ) : (
            <><FileText className="mr-2 h-5 w-5" aria-hidden="true" /> Extract Key Terms</>
          )}
        </Button>
      )}

      {/* Error */}
      {error && (
        <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-800">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && !result.extraction?.error && (
        <Card className="p-6 space-y-5">
          {/* Disclaimer */}
          <div role="note" className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            {result.disclaimer}
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
              {result.text_length.toLocaleString()} characters extracted
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
              {result.chunks_stored} chunks stored for search
            </span>
          </div>

          {/* Summary */}
          {result.extraction.summary && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Summary</h3>
              <p className="text-base leading-relaxed">{result.extraction.summary}</p>
            </div>
          )}

          {/* Key fields */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Extracted Terms</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Expiration Date</dt>
                <dd className="text-base mt-1">{result.extraction.expiration_date || "Not found"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Contract Value</dt>
                <dd className="text-base mt-1">{result.extraction.contract_value || "Not found"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Renewal Option</dt>
                <dd className="text-base mt-1">{result.extraction.renewal_option || "Not found"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Pricing Structure</dt>
                <dd className="text-base mt-1">{result.extraction.pricing_structure || "Not found"}</dd>
              </div>
            </dl>
          </div>

          {/* Parties */}
          {result.extraction.parties && result.extraction.parties.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Parties Involved</h3>
              <ul className="list-disc list-inside text-base space-y-1">
                {result.extraction.parties.map((p: string, i: number) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}

          {/* Conditions */}
          {result.extraction.key_conditions && result.extraction.key_conditions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Key Conditions</h3>
              <ul className="list-disc list-inside text-base space-y-1">
                {result.extraction.key_conditions.map((c: string, i: number) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
        </Card>
      )}

      {result?.extraction?.error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-800 text-sm">
          Extraction error: {result.extraction.error}
        </div>
      )}
    </div>
  );
}
