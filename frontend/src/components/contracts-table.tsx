"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  MinusCircle,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { formatCurrency, formatDate, riskColor } from "@/lib/utils";
import type { Contract } from "@/hooks/use-contracts";

interface ContractsTableProps {
  contracts: Contract[];
  onRowClick: (contract: Contract) => void;
}

function RiskIcon({ level, className = "h-4 w-4" }: { level: string; className?: string }) {
  const props = { className, "aria-hidden": true as const };
  switch (level) {
    case "critical":
      return <AlertCircle {...props} />;
    case "warning":
      return <AlertTriangle {...props} />;
    case "attention":
      return <Clock {...props} />;
    case "ok":
      return <CheckCircle {...props} />;
    case "expired":
      return <MinusCircle {...props} />;
    default:
      return <HelpCircle {...props} />;
  }
}

function DaysLeftDisplay({ daysLeft }: { daysLeft: number | undefined | null }) {
  if (daysLeft === undefined || daysLeft === null) return <span className="text-slate-400">N/A</span>;
  if (daysLeft < 0) return <span className="text-red-700 font-medium">Expired</span>;
  if (daysLeft <= 30) return <span className="text-red-700 font-semibold">{daysLeft}d</span>;
  if (daysLeft <= 60) return <span className="text-yellow-700 font-semibold">{daysLeft}d</span>;
  if (daysLeft <= 90) return <span className="text-orange-700 font-semibold">{daysLeft}d</span>;
  return <span className="text-green-700">{daysLeft}d</span>;
}

function SortIcon({ isSorted }: { isSorted: false | "asc" | "desc" }) {
  if (isSorted === "asc") return <ChevronUp className="h-4 w-4 shrink-0" aria-hidden="true" />;
  if (isSorted === "desc") return <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />;
  return <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />;
}

export function ContractsTable({ contracts, onRowClick }: ContractsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<Contract>[]>(
    () => [
      {
        id: "risk_level",
        accessorKey: "risk_level",
        header: "Risk",
        cell: ({ row, getValue }) => {
          const level = (getValue() as string) ?? "unknown";
          const colorClass = riskColor(level);
          const daysLeft = row.original.days_to_expiry as number | undefined;
          const daysLabel = typeof daysLeft === "number" ? (daysLeft < 0 ? "Exp" : `${daysLeft}d`) : "";
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
              title={`${level}${daysLabel ? ` - ${daysLabel}` : ""}`}
            >
              <RiskIcon level={level} className="h-3.5 w-3.5" />
              {daysLabel && <span>{daysLabel}</span>}
            </span>
          );
        },
        sortingFn: (rowA, rowB) => {
          const order = ["critical", "warning", "attention", "ok", "expired", "unknown"];
          const a = order.indexOf(rowA.getValue("risk_level") ?? "unknown");
          const b = order.indexOf(rowB.getValue("risk_level") ?? "unknown");
          return a - b;
        },
      },
      {
        id: "vendor_name",
        accessorFn: (row) => (row.supplier as string) ?? (row.vendor_name as string) ?? "",
        header: "Vendor",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <span
              className="block max-w-[200px] truncate text-base font-medium text-slate-900"
              title={value}
            >
              {value || "N/A"}
            </span>
          );
        },
      },
      {
        id: "department",
        accessorKey: "department",
        header: "Department",
        cell: ({ getValue }) => {
          const value = (getValue() as string) ?? "";
          return (
            <span
              className="block max-w-[180px] truncate text-base text-slate-700"
              title={value}
            >
              {value || "N/A"}
            </span>
          );
        },
      },
      {
        id: "description",
        accessorFn: (row) => (row.description as string) ?? "",
        header: "Description",
        cell: ({ getValue }) => {
          const value = (getValue() as string) ?? "";
          const truncated = value.length > 80 ? `${value.slice(0, 80)}...` : value;
          return (
            <span
              className="block max-w-[220px] truncate text-sm text-slate-600"
              title={value || undefined}
            >
              {truncated || "—"}
            </span>
          );
        },
        enableSorting: false,
      },
      {
        id: "amount",
        accessorFn: (row) => (row.value as number) ?? (row.amount as number) ?? null,
        header: "Value",
        cell: ({ getValue }) => (
          <span className="text-base text-slate-800 whitespace-nowrap">
            {formatCurrency(getValue() as number)}
          </span>
        ),
        sortingFn: (rowA, rowB) => {
          const a = (rowA.getValue("amount") as number) ?? 0;
          const b = (rowB.getValue("amount") as number) ?? 0;
          return a - b;
        },
      },
      {
        id: "end_date",
        accessorFn: (row) => (row.end_date as string) ?? (row.expiration_date as string) ?? null,
        header: "Expires",
        cell: ({ getValue }) => (
          <span className="text-base text-slate-700 whitespace-nowrap">
            {formatDate(getValue() as string)}
          </span>
        ),
        sortingFn: (rowA, rowB) => {
          const a = rowA.getValue("end_date") as string | null;
          const b = rowB.getValue("end_date") as string | null;
          if (!a && !b) return 0;
          if (!a) return 1;
          if (!b) return -1;
          return new Date(a).getTime() - new Date(b).getTime();
        },
      },
      {
        id: "days_to_expiry",
        accessorKey: "days_to_expiry",
        header: "Days Left",
        cell: ({ getValue }) => <DaysLeftDisplay daysLeft={getValue() as number | null} />,
        sortingFn: (rowA, rowB) => {
          const a = (rowA.getValue("days_to_expiry") as number) ?? Infinity;
          const b = (rowB.getValue("days_to_expiry") as number) ?? Infinity;
          return a - b;
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: contracts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200 bg-white shadow-sm">
      <table
        className="w-full text-base border-collapse"
        aria-label="Contracts table"
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50">
              {headerGroup.headers.map((header) => {
                const isSorted = header.column.getIsSorted();
                const canSort = header.column.getCanSort();
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      isSorted === "asc"
                        ? "ascending"
                        : isSorted === "desc"
                        ? "descending"
                        : canSort
                        ? "none"
                        : undefined
                    }
                    className="px-4 py-3 text-left text-sm font-semibold text-slate-700 whitespace-nowrap"
                  >
                    {canSort ? (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1.5 hover:text-slate-900 focus:outline-none focus:ring-3 focus:ring-blue-500 focus:ring-offset-1 rounded min-h-[44px] px-1 -mx-1"
                        aria-label={`Sort by ${typeof header.column.columnDef.header === "string" ? header.column.columnDef.header : "column"}${isSorted === "asc" ? ", currently ascending" : isSorted === "desc" ? ", currently descending" : ""}`}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIcon isSorted={isSorted} />
                      </button>
                    ) : (
                      <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-base text-slate-500"
              >
                No contracts found matching your filters.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                onClick={() => onRowClick(row.original)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRowClick(row.original);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${(row.original.supplier as string) ?? "contract"}`}
                className={`border-b border-slate-100 cursor-pointer transition-all hover:bg-blue-50/70 hover:border-l-[3px] hover:border-l-blue-500 focus:outline-none focus:ring-3 focus:ring-inset focus:ring-blue-500 ${
                  rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2.5 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
