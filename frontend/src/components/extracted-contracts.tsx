"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";

interface ExtractedContract {
  id: string;
  filename: string;
  uploaded_at: string;
  expiration_date: string | null;
  renewal_option: string | null;
  pricing_structure: string | null;
  contract_value: string | null;
  parties: string | null;
  key_conditions: string | null;
  summary: string | null;
}

function formatUploadDate(raw: string): string {
  try {
    return new Date(raw).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return raw;
  }
}

export function ExtractedContracts() {
  const [contracts, setContracts] = useState<ExtractedContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/extract/extracted`)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setContracts(data.contracts ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section aria-labelledby="extracted-heading" aria-busy="true">
        <h2 id="extracted-heading" className="text-xl font-semibold text-slate-800 mb-4">
          Recently Uploaded PDFs
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-labelledby="extracted-heading">
        <h2 id="extracted-heading" className="text-xl font-semibold text-slate-800 mb-4">
          Recently Uploaded PDFs
        </h2>
        <div className="rounded-xl ring-1 ring-red-200 bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-700">Unable to load extracted contracts. Try refreshing.</p>
        </div>
      </section>
    );
  }

  if (contracts.length === 0) {
    return (
      <section aria-labelledby="extracted-heading">
        <h2 id="extracted-heading" className="text-xl font-semibold text-slate-800 mb-4">
          Recently Uploaded PDFs
        </h2>
        <div className="rounded-xl ring-1 ring-slate-200 bg-white p-6 text-center">
          <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-slate-500">
            No PDFs uploaded yet.{" "}
            <Link
              href="/staff/extract"
              className="text-blue-600 underline underline-offset-2 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              Upload a contract PDF
            </Link>{" "}
            to get started.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="extracted-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="extracted-heading" className="text-xl font-semibold text-slate-800">
          Recently Uploaded PDFs
        </h2>
        <Link
          href="/staff/extract"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Go to PDF Extractor to upload more contracts"
        >
          Upload more
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="rounded-xl ring-1 ring-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm" aria-label="AI-extracted contract records">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">
                  Filename
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">
                  Uploaded
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">
                  Expiration
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">
                  Value
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700">
                  Summary
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap sr-only">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap max-w-[200px] truncate" title={c.filename}>
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                      {c.filename}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {c.uploaded_at ? formatUploadDate(c.uploaded_at) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {c.expiration_date ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {c.contract_value ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[340px]">
                    {c.summary ? (
                      <span className="line-clamp-2" title={c.summary}>
                        {c.summary}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No summary</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/staff/extract?q=${encodeURIComponent(c.filename)}`}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                      aria-label={`Search PDF content for ${c.filename}`}
                    >
                      Search PDF
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
          AI-assisted extraction — verify against original documents
        </div>
      </div>
    </section>
  );
}
