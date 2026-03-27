"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";

export interface Contract {
  id: string;
  vendor_name?: string;
  department?: string;
  amount?: number;
  start_date?: string;
  end_date?: string;
  risk_level?: string;
  [key: string]: unknown;
}

export interface ContractStats {
  total_contracts: number;
  total_value: number;
  expiring_soon: number;
  by_department: Record<string, number>;
  [key: string]: unknown;
}

export function useContracts(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ["contracts", params],
    queryFn: () => fetchAPI<{ contracts: Contract[]; total: number }>("/api/contracts", params),
  });
}

export function useContractStats() {
  return useQuery({
    queryKey: ["contract-stats"],
    queryFn: () => fetchAPI<ContractStats>("/api/contracts/stats"),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => fetchAPI<string[]>("/api/contracts/departments"),
  });
}
