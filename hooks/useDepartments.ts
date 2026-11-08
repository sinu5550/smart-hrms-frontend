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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ["department", variables.id] });
      }
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
    onMutate: async ({ departmentId, employeeUserId, rosterOffDays }) => {
      await queryClient.cancelQueries({ queryKey: ["department", departmentId] });

      const prevDepartment = queryClient.getQueryData<any>(["department", departmentId]);

      queryClient.setQueryData(["department", departmentId], (old: any) => {
        if (!old || !Array.isArray(old.users)) return old;
        return {
          ...old,
          users: old.users.map((u: any) =>
            u.id === employeeUserId ? { ...u, rosterOffDays } : u
          ),
        };
      });

      return { prevDepartment };
    },
    onError: (_err, variables, context) => {
      if (context?.prevDepartment) {
        queryClient.setQueryData(["department", variables.departmentId], context.prevDepartment);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["department", variables.departmentId] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      queryClient.invalidateQueries({ queryKey: ["attendance", "summary-report"] });
      queryClient.invalidateQueries({ queryKey: ["employees", "dashboard-stats"] });
    },
  });
}

export function useUpdateEmployeeShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ departmentId, employeeUserId, shiftId }: { departmentId: string; employeeUserId: string; shiftId: string | null }) =>
      DepartmentService.updateEmployeeShift(departmentId, employeeUserId, shiftId),
    onMutate: async ({ departmentId, employeeUserId, shiftId }) => {
      await queryClient.cancelQueries({ queryKey: ["department", departmentId] });

      const prevDepartment = queryClient.getQueryData<any>(["department", departmentId]);

      queryClient.setQueryData(["department", departmentId], (old: any) => {
        if (!old || !Array.isArray(old.users)) return old;
        return {
          ...old,
          users: old.users.map((u: any) =>
            u.id === employeeUserId ? { ...u, shiftId, shift: shiftId ? { id: shiftId } : null } : u
          ),
        };
      });

      return { prevDepartment };
    },
    onError: (_err, variables, context) => {
      if (context?.prevDepartment) {
        queryClient.setQueryData(["department", variables.departmentId], context.prevDepartment);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["department", variables.departmentId] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useRosterShiftRequests(status?: string) {
  return useQuery({
    queryKey: ["roster-shift-requests", status || "ALL"],
    queryFn: () => DepartmentService.getRosterShiftRequests(status),
  });
}

export function useCreateRosterShiftRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { targetShiftId: string; effectiveDate?: string; reason?: string }) =>
      DepartmentService.createRosterShiftRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roster-shift-requests"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "today-status"] });
    },
  });
}

export function useActionRosterShiftRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action, actionNote }: { id: string; action: "APPROVED" | "REJECTED"; actionNote?: string }) =>
      DepartmentService.actionRosterShiftRequest(id, action, actionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roster-shift-requests"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      queryClient.invalidateQueries({ queryKey: ["department"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "today-status"] });
    },
  });
}
