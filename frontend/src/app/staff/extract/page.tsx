"use client";

import { useState } from "react";
import { PdfUpload } from "@/components/pdf-upload";
import { ContractSearch } from "@/components/contract-search";
import { Disclaimer } from "@/components/disclaimer";
import { Separator } from "@/components/ui/separator";
import { FileUp } from "lucide-react";

export default function ExtractPage() {
  const [hasUploaded, setHasUploaded] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Contract PDF Analyzer</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">
          Upload procurement PDFs to extract key terms and search across documents.
        </p>
      </div>

      <Disclaimer />

      <PdfUpload onUploadComplete={() => setHasUploaded(true)} />

      <Separator />

      {hasUploaded ? (
        <ContractSearch />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <FileUp className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
            No contracts extracted yet
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 max-w-sm">
            Upload a PDF above to extract contract terms, conditions, and key details using AI.
          </p>
        </div>
      )}
    </div>
  );
}
