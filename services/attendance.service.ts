import { apiClient } from "./api";

export type AttendanceStatus = "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | "ON_LEAVE";
export type AttendanceSessionState = "CHECKED_IN" | "ON_BREAK" | "CHECKED_OUT";
export type BreakType = "LUNCH" | "PRAYER" | "TEA_COFFEE" | "SMOKE" | "PERSONAL" | "EMERGENCY";

export interface AttendanceBreakRecord {
  id: string;
  breakType: BreakType;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
}

export interface TodayAttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  currentState: AttendanceSessionState;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  status: AttendanceStatus;
  breaks: AttendanceBreakRecord[];
}

export interface TodayStatusResponse {
  checkedIn: boolean;
  checkedOut: boolean;
  attendance: TodayAttendanceRecord | null;
  isExempt?: boolean;
}

export const AttendanceService = {
  getTodayStatus: async (): Promise<TodayStatusResponse> => {
    const { data } = await apiClient.get<TodayStatusResponse>("/attendance/today-status");
    return data;
  },

  checkIn: async (payload: string | { qrSecret: string; latitude?: number; longitude?: number; address?: string; selfieUrl?: string }): Promise<TodayAttendanceRecord> => {
    const body = typeof payload === "string" ? { qrSecret: payload } : payload;
    const { data } = await apiClient.post<TodayAttendanceRecord>("/attendance/check-in", body);
    return data;
  },

  startBreak: async (breakType: BreakType): Promise<AttendanceBreakRecord> => {
    const { data } = await apiClient.post<AttendanceBreakRecord>("/attendance/break-start", {
      breakType,
    });
    return data;
  },

  endBreak: async (): Promise<TodayAttendanceRecord> => {
    const { data } = await apiClient.post<TodayAttendanceRecord>("/attendance/break-end");
    return data;
  },

  getByDate: async (date: string): Promise<any[]> => {
    const { data } = await apiClient.get<any[]>(`/attendance/admin/by-date?date=${date}`);
    return data;
  },

  checkOut: async (payload: { qrSecret: string; latitude?: number; longitude?: number; address?: string } | string): Promise<TodayAttendanceRecord> => {
    const body = typeof payload === "string" ? { qrSecret: payload } : payload;
    const { data } = await apiClient.post<TodayAttendanceRecord>("/attendance/check-out", body);
    return data;
  },
};
