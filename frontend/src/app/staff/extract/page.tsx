import { PdfUpload } from "@/components/pdf-upload";
import { ContractSearch } from "@/components/contract-search";
import { Disclaimer } from "@/components/disclaimer";
import { Separator } from "@/components/ui/separator";

export default function ExtractPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Contract PDF Analyzer</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">
          Upload procurement PDFs to extract key terms and search across documents.
        </p>
      </div>

      <Disclaimer />

      <PdfUpload />

      <Separator />

      <ContractSearch />
    </div>
  );
}
