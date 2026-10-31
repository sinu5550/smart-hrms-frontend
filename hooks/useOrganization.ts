'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrganizationService, OrganizationDetails } from "@/services/organization.service";
import { QUERY_KEYS } from "./queryKeys";

export function useOrganization() {
  return useQuery({
    queryKey: QUERY_KEYS.organization.current,
    queryFn: () => OrganizationService.getCurrent(),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      name?: string;
      logoUrl?: string;
      employeePrefix?: string;
      address?: string;
      weekendDays?: string[];
      hasRosterDuty?: boolean;
      rosterDepartmentIds?: string[];
    }) => OrganizationService.updateCurrent(payload),
    onSuccess: (updatedOrg) => {
      // Invalidate cache for real-time consistency across layout and pages
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organization.current });
      if (updatedOrg) {
        queryClient.setQueryData(QUERY_KEYS.organization.current, updatedOrg);
      }
    },
  });
}

export function useOfficeNetworks() {
  return useQuery({
    queryKey: ["organization", "networks"],
    queryFn: () => OrganizationService.getNetworks(),
  });
}

export function useAddOfficeNetwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { locationName?: string; allowedPublicIp: string; subnetMask?: string }) =>
      OrganizationService.addNetwork(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "networks"] });
    },
  });
}

export function useDeleteOfficeNetwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => OrganizationService.deleteNetwork(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "networks"] });
    },
  });
}
