import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roleService, CustomRole, CreateRolePayload, UpdateRolePayload } from "@/services/role.service";
import { QUERY_KEYS } from "./queryKeys";

export function useRoles() {
  return useQuery<CustomRole[]>({
    queryKey: QUERY_KEYS.roles.list(),
    queryFn: () => roleService.getAll(),
  });
}

export function useRole(id: string) {
  return useQuery<CustomRole>({
    queryKey: QUERY_KEYS.roles.detail(id),
    queryFn: () => roleService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => roleService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles.all });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
      roleService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
    },
  });
}
