'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AttendanceService, BreakType } from "@/services/attendance.service";
import { QUERY_KEYS } from "./queryKeys";

export function useAttendanceByDate(date: string) {
  return useQuery({
    queryKey: QUERY_KEYS.attendance.list({ date }),
    queryFn: () => AttendanceService.getByDate(date),
    enabled: Boolean(date),
  });
}

export function useMyTodayAttendance() {
  return useQuery({
    queryKey: QUERY_KEYS.attendance.myToday,
    queryFn: () => AttendanceService.getTodayStatus(),
  });
}

export function useAttendanceActions() {
  const queryClient = useQueryClient();

  const checkInMutation = useMutation({
    mutationFn: (payload: string | { qrSecret: string; latitude?: number; longitude?: number; address?: string; selfieUrl?: string }) =>
      AttendanceService.checkIn(payload),
    onSuccess: () => {
      // Revalidate cache without forced refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.all });
    },
  });

  const startBreakMutation = useMutation({
    mutationFn: (breakType: BreakType) => AttendanceService.startBreak(breakType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.all });
    },
  });

  const endBreakMutation = useMutation({
    mutationFn: () => AttendanceService.endBreak(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.all });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: (payload?: { latitude?: number; longitude?: number; address?: string }) =>
      AttendanceService.checkOut(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.all });
    },
  });

  return {
    checkIn: checkInMutation,
    startBreak: startBreakMutation,
    endBreak: endBreakMutation,
    checkOut: checkOutMutation,
  };
}
