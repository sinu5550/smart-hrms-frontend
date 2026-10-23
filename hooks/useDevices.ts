import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deviceService,
  BiometricDevice,
  BiometricRawLog,
  RegisterDevicePayload,
} from "@/services/device.service";
import { QUERY_KEYS } from "./queryKeys";

export function useBiometricDevices() {
  return useQuery<BiometricDevice[]>({
    queryKey: QUERY_KEYS.devices.list(),
    queryFn: () => deviceService.getAll(),
  });
}

export function useBiometricRawLogs() {
  return useQuery<BiometricRawLog[]>({
    queryKey: QUERY_KEYS.devices.logs(),
    queryFn: () => deviceService.getRecentLogs(),
    refetchInterval: 10000, // Live poll every 10s for real-time punch stream
  });
}

export function useRegisterBiometricDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterDevicePayload) => deviceService.register(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.devices.all });
    },
  });
}

export function useDeleteBiometricDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deviceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.devices.all });
    },
  });
}
