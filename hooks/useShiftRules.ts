'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api";
import { QUERY_KEYS } from "./queryKeys";

export interface ShiftRuleData {
  shiftName: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
}

export function useShiftRules() {
  return useQuery<ShiftRuleData>({
    queryKey: QUERY_KEYS.settings.shift,
    queryFn: async () => {
      const { data } = await apiClient.get<ShiftRuleData>("/settings/shift");
      return data;
    },
  });
}

export function useUpdateShiftRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ShiftRuleData) => {
      const { data } = await apiClient.patch<ShiftRuleData>("/settings/shift", payload);
      return data;
    },
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings.shift });
      if (updatedData) {
        queryClient.setQueryData(QUERY_KEYS.settings.shift, updatedData);
      }
    },
  });
}
