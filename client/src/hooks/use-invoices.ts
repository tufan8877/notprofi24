import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useInvoices() {
  return useQuery({
    queryKey: [api.invoices.list.path],
    queryFn: async () => {
      const res = await fetch(api.invoices.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return api.invoices.list.responses[200].parse(await res.json());
    },
  });
}

export function useGenerateInvoices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (monthYear: string) => {
      const res = await fetch(api.invoices.generate.path, {
        method: api.invoices.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthYear }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate invoices");
      return api.invoices.generate.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
    },
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paidAt }: { id: number; paidAt: string }) => {
      const url = buildUrl(api.invoices.markPaid.path, { id });
      const res = await fetch(url, {
        method: api.invoices.markPaid.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAt }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update invoice");
      return api.invoices.markPaid.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
    },
  });
}
