import { PdfUpload } from "@/components/pdf-upload";
import { ContractSearch } from "@/components/contract-search";
import { Disclaimer } from "@/components/disclaimer";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ExtractPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contract PDF Analyzer</h1>
          <p className="text-gray-500 mt-2 text-base">
            Upload procurement PDFs to extract key terms and search across documents.
          </p>
        </div>
        <Link href="/staff">
          <Button variant="outline" className="h-11 gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Disclaimer />

      <PdfUpload />

      <Separator />

      <ContractSearch />
    </div>
  );
}
