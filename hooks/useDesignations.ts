'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Designation, DesignationService, CreateDesignationPayload, UpdateDesignationPayload } from "@/services/designation.service";
import { QUERY_KEYS } from "./queryKeys";

export function useDesignations() {
  return useQuery({
    queryKey: QUERY_KEYS.designations.list(),
    queryFn: () => DesignationService.getDesignations(),
  });
}

export function useCreateDesignation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDesignationPayload) => DesignationService.createDesignation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.designations.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
    },
  });
}

export function useUpdateDesignation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDesignationPayload }) =>
      DesignationService.updateDesignation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.designations.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
    },
  });
}

export function useDeleteDesignation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => DesignationService.deleteDesignation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.designations.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
    },
  });
}

