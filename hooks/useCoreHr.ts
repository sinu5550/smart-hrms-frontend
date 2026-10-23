import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  coreHrService,
  Branch,
  Holiday,
  JobGrade,
  GazetteRule,
  IdCardTemplate,
} from "@/services/core-hr.service";
import { QUERY_KEYS } from "./queryKeys";

// Branches
export function useBranches() {
  return useQuery<Branch[]>({
    queryKey: QUERY_KEYS.coreHr.branches,
    queryFn: () => coreHrService.getBranches(),
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Branch>) => coreHrService.createBranch(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.coreHr.branches }),
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coreHrService.deleteBranch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.coreHr.branches }),
  });
}

// Holidays
export function useHolidays() {
  return useQuery<Holiday[]>({
    queryKey: QUERY_KEYS.coreHr.holidays,
    queryFn: () => coreHrService.getHolidays(),
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Holiday>) => coreHrService.createHoliday(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.coreHr.holidays }),
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coreHrService.deleteHoliday(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.coreHr.holidays }),
  });
}

// Job Grades
export function useJobGrades() {
  return useQuery<JobGrade[]>({
    queryKey: QUERY_KEYS.coreHr.grades,
    queryFn: () => coreHrService.getGrades(),
  });
}

export function useCreateJobGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<JobGrade>) => coreHrService.createGrade(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.coreHr.grades }),
  });
}

// Gazette Rules
export function useGazetteRules() {
  return useQuery<GazetteRule[]>({
    queryKey: QUERY_KEYS.coreHr.gazettes,
    queryFn: () => coreHrService.getGazettes(),
  });
}

export function useCreateGazetteRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<GazetteRule>) => coreHrService.createGazette(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.coreHr.gazettes }),
  });
}

// ID Card Templates
export function useIdCardTemplates() {
  return useQuery<IdCardTemplate[]>({
    queryKey: QUERY_KEYS.coreHr.idTemplates,
    queryFn: () => coreHrService.getIdCardTemplates(),
  });
}

export function useSaveIdCardTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<IdCardTemplate>) => coreHrService.saveIdCardTemplate(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.coreHr.idTemplates }),
  });
}
