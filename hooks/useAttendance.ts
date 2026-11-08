'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AttendanceService, BreakType } from "@/services/attendance.service";
import { QUERY_KEYS } from "./queryKeys";

export function useAttendanceByDate(query: string | { date?: string; startDate?: string; endDate?: string; userId?: string }) {
  const queryParam = typeof query === "string" ? { date: query } : query;
  return useQuery({
    queryKey: QUERY_KEYS.attendance.list(queryParam),
    queryFn: () => AttendanceService.getByDate(query),
    enabled: typeof query === "string" ? Boolean(query) : Boolean(query?.date || query?.startDate),
    refetchInterval: 10000, // Live attendance monitor: gentle 10s poll without UI slowdown
    refetchIntervalInBackground: false, // Never poll when admin minimizes or switches tab
  });
}

export function useAttendanceSummaryReport(query: { startDate: string; endDate: string; departmentId?: string }) {
  return useQuery({
    queryKey: ["attendance", "summary-report", query],
    queryFn: () => AttendanceService.getSummaryReport(query),
    enabled: Boolean(query.startDate && query.endDate),
  });
}

import { useAuth } from "@/components/auth/AuthProvider";

export function useMyTodayAttendance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.attendance.myToday(user?.id),
    queryFn: () => AttendanceService.getTodayStatus(),
    enabled: Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: (query) => {
      // If user has already checked out for the day, stop polling completely to save battery and network!
      if (query.state.data?.checkedOut || query.state.data?.attendance?.currentState === "CHECKED_OUT") {
        return false;
      }
      return 10000; // Lightweight 10-second poll while active on duty
    },
    refetchIntervalInBackground: false, // Freeze polling when app/tab is in the background
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
    mutationFn: (payload: { qrSecret: string; latitude?: number; longitude?: number; address?: string } | string) =>
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
