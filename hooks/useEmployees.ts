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

export function useEmployee(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.employees.detail(id),
    queryFn: () => EmployeeService.getById(id),
    enabled: Boolean(id),
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["employees", "dashboard-stats"],
    queryFn: () => EmployeeService.getDashboardStats(),
    refetchInterval: 30000,
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
    onMutate: async ({ id, status }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.employees.all });
      await queryClient.cancelQueries({ queryKey: ["employees", "dashboard-stats"] });

      // Snapshot previous data across queries
      const previousQueries = queryClient.getQueriesData<Employee[]>({ queryKey: ["employees", "list"] });
      const previousStats = queryClient.getQueryData<any>(["employees", "dashboard-stats"]);

      // Optimistically update all matching employee lists
      queryClient.setQueriesData<Employee[]>(
        { queryKey: ["employees", "list"] },
        (old) => {
          if (!old) return old;
          return old.map((emp) => (emp.id === id ? { ...emp, status } : emp));
        }
      );

      return { previousQueries, previousStats };
    },
    onError: (_err, _vars, context) => {
      // Rollback on failure
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      if (context?.previousStats) {
        queryClient.setQueryData(["employees", "dashboard-stats"], context.previousStats);
      }
    },
    onSettled: () => {
      // Ensure backend sync is completed without UI delay
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
      queryClient.invalidateQueries({ queryKey: ["employees", "dashboard-stats"] });
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

export function useBulkDeleteEmployees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => EmployeeService.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
    },
  });
}
