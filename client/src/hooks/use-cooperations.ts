import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertCooperation } from "@shared/routes";

export function useCooperations() {
  return useQuery({
    queryKey: [api.cooperations.list.path],
    queryFn: async () => {
      const res = await fetch(api.cooperations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cooperations");
      return api.cooperations.list.responses[200].parse(await res.json());
    },
  });
}

export function useToggleCooperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCooperation) => {
      const res = await fetch(api.cooperations.toggle.path, {
        method: api.cooperations.toggle.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to toggle cooperation");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cooperations.list.path] });
    },
  });
}
