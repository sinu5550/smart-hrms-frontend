'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Department, DepartmentService, CreateDepartmentPayload, UpdateDepartmentPayload } from "@/services/department.service";
import { QUERY_KEYS } from "./queryKeys";

export function useDepartments() {
  return useQuery({
    queryKey: QUERY_KEYS.departments.list(),
    queryFn: () => DepartmentService.getAll(),
  });
}

export function useDepartmentDetails(id?: string | null) {
  return useQuery({
    queryKey: ["department", id],
    queryFn: () => (id ? DepartmentService.getById(id) : null),
    enabled: Boolean(id),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => DepartmentService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDepartmentPayload }) =>
      DepartmentService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => DepartmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
    },
  });
}

export function useUpdateEmployeeRosterOffDays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ departmentId, employeeUserId, rosterOffDays }: { departmentId: string; employeeUserId: string; rosterOffDays: string[] }) =>
      DepartmentService.updateEmployeeRosterOffDays(departmentId, employeeUserId, rosterOffDays),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["department", variables.departmentId] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      queryClient.invalidateQueries({ queryKey: ["attendance", "summary-report"] });
    },
  });
}
