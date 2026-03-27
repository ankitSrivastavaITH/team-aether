import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, FileSpreadsheet, Search, BarChart3, Brain, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Compare — RVA Contract Lens vs Excel",
  description: "See how RVA Contract Lens saves procurement staff hours compared to manual Excel workflows.",
};

const comparisons = [
  {
    task: "Find contracts expiring this month",
    oldWay: "Download CSV, open Excel, sort by date, manually scan rows",
    oldTime: "15-30 minutes",
    newWay: "Type 'contracts expiring this month' in Ask Richmond",
    newTime: "2 seconds",
    icon: Search,
  },
  {
    task: "Extract key terms from a contract PDF",
    oldWay: "Open 40-page PDF, scroll through, take notes manually",
    oldTime: "30-60 minutes",
    newWay: "Upload PDF → AI extracts expiration, renewal, pricing, conditions",
    newTime: "10 seconds",
    icon: Brain,
  },
  {
    task: "See which department spends the most",
    oldWay: "Pivot table in Excel, format chart manually",
    oldTime: "20-45 minutes",
    newWay: "Open Public Transparency → instant interactive charts",
    newTime: "Instant",
    icon: BarChart3,
  },
  {
    task: "Check vendor concentration risk",
    oldWay: "Manual cross-referencing across spreadsheets",
    oldTime: "1-2 hours",
    newWay: "HHI index and department flags calculated automatically",
    newTime: "Instant",
    icon: FileSpreadsheet,
  },
  {
    task: "Share a filtered view with a colleague",
    oldWay: "Save Excel file, email attachment, explain filters",
    oldTime: "5-10 minutes",
    newWay: "Copy URL — filters are in the link",
    newTime: "2 seconds",
    icon: Download,
  },
  {
    task: "Export data for a report",
    oldWay: "Already in Excel — but filters/formatting lost between sessions",
    oldTime: "Varies",
    newWay: "Apply filters → Export CSV with one click",
    newTime: "5 seconds",
    icon: Download,
  },
];

export default function ComparePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">RVA Contract Lens vs. The Old Way</h1>
        <p className="text-xl text-slate-500">
          Procurement staff currently use Excel spreadsheets and manual PDF review.
          Here is what changes.
        </p>
      </div>

      <div className="space-y-6">
        {comparisons.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={i} className="p-6">
              <div className="flex items-start gap-4">
                <Icon className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" aria-hidden="true" />
                <div className="flex-1 space-y-4">
                  <h2 className="text-lg font-semibold">{c.task}</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                        <span className="font-medium text-red-700">Before</span>
                        <span className="ml-auto text-sm text-red-500 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {c.oldTime}
                        </span>
                      </div>
                      <p className="text-sm text-red-800">{c.oldWay}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                        <span className="font-medium text-green-700">With Contract Lens</span>
                        <span className="ml-auto text-sm text-green-500 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {c.newTime}
                        </span>
                      </div>
                      <p className="text-sm text-green-800">{c.newWay}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="text-center space-y-4 py-8">
        <p className="text-2xl font-bold">Ready to see it in action?</p>
        <div className="flex justify-center gap-4">
          <Link href="/public">
            <Button className="h-12 px-8 text-base">Explore Public Data</Button>
          </Link>
          <Link href="/staff">
            <Button variant="outline" className="h-12 px-8 text-base">Staff Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
