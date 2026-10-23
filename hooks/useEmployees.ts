'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Employee, EmployeeService, CreateEmployeePayload, EmploymentStatus } from "@/services/employee.service";
import { QUERY_KEYS } from "./queryKeys";

export function useEmployees(query?: {
  search?: string;
  status?: string;
  bloodGroup?: string;
  departmentId?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.employees.list(query),
    queryFn: () => EmployeeService.getAll(query),
  });
}

export function useNextEmployeeId() {
  return useQuery({
    queryKey: QUERY_KEYS.employees.nextId,
    queryFn: () => EmployeeService.getNextId(),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => EmployeeService.create(payload),
    onSuccess: () => {
      // Precise cache invalidation without refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.nextId });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateEmployeePayload> & { avatarUrl?: string; permissions?: string[] } }) =>
      EmployeeService.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.detail(variables.id) });
    },
  });
}

export function useChangeEmployeeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EmploymentStatus }) =>
      EmployeeService.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
    },
  });
}

export function useSoftDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, confirmationText }: { id: string; confirmationText: string }) =>
      EmployeeService.softDelete(id, confirmationText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
    },
  });
}
