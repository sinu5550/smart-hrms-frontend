import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RegistrationService, EmployeeRegistration } from "@/services/registration.service";

export const REGISTRATION_QUERY_KEYS = {
  all: ["registrations"] as const,
  list: (status?: string) => ["registrations", "list", status] as const,
  publicForm: (slug: string) => ["registrations", "publicForm", slug] as const,
};

export function useRegistrations(status?: string) {
  return useQuery({
    queryKey: REGISTRATION_QUERY_KEYS.list(status),
    queryFn: () => RegistrationService.getRegistrations(status),
    staleTime: 30 * 1000,
  });
}

export function usePendingRegistrationsCount() {
  const query = useRegistrations("PENDING");
  return {
    count: query.data?.length || 0,
    ...query,
  };
}

export function usePublicOrgForm(tenantSlug: string) {
  return useQuery({
    queryKey: REGISTRATION_QUERY_KEYS.publicForm(tenantSlug),
    queryFn: () => RegistrationService.getPublicOrgForm(tenantSlug),
    enabled: Boolean(tenantSlug),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateRegistrationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ENLISTED" | "REJECTED" }) =>
      RegistrationService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REGISTRATION_QUERY_KEYS.all });
    },
  });
}
