'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shift, ShiftService, CreateShiftPayload, UpdateShiftPayload } from "@/services/shift.service";
import { QUERY_KEYS } from "./queryKeys";

export function useShifts() {
  return useQuery({
    queryKey: QUERY_KEYS.shifts.list(),
    queryFn: () => ShiftService.getAll(),
  });
}

export function useDefaultShift() {
  return useQuery({
    queryKey: QUERY_KEYS.shifts.default,
    queryFn: () => ShiftService.getDefault(),
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateShiftPayload) => ShiftService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shifts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
    },
  });
}

export function useUpdateShiftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateShiftPayload }) =>
      ShiftService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shifts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ShiftService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shifts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
    },
  });
}
