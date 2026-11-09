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
  overtimeMinutes?: number;
  status: AttendanceStatus;
  breaks: AttendanceBreakRecord[];
}

export interface RosterEmployeeDetails {
  isRosterEmployee: boolean;
  shiftName: string;
  startTime: string;
  endTime: string;
  offDays: string[];
}

export interface TodayStatusResponse {
  checkedIn: boolean;
  checkedOut: boolean;
  attendance: TodayAttendanceRecord | null;
  isExempt?: boolean;
  rosterDetails?: RosterEmployeeDetails | null;
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

  getByDate: async (query: string | { date?: string; startDate?: string; endDate?: string; userId?: string }): Promise<any[]> => {
    let url = "/attendance/admin/by-date";
    if (typeof query === "string") {
      url += `?date=${query}`;
    } else if (query) {
      const params = new URLSearchParams();
      if (query.date) params.append("date", query.date);
      if (query.startDate) params.append("startDate", query.startDate);
      if (query.endDate) params.append("endDate", query.endDate);
      if (query.userId && query.userId !== "ALL") params.append("userId", query.userId);
      url += `?${params.toString()}`;
    }
    const { data } = await apiClient.get<any[]>(url);
    return data;
  },

  checkOut: async (payload: { qrSecret: string; latitude?: number; longitude?: number; address?: string } | string): Promise<TodayAttendanceRecord> => {
    const body = typeof payload === "string" ? { qrSecret: payload } : payload;
    const { data } = await apiClient.post<TodayAttendanceRecord>("/attendance/check-out", body);
    return data;
  },

  getSummaryReport: async (query: { startDate: string; endDate: string; departmentId?: string }): Promise<{
    organization: { name: string; address: string | null; logoUrl: string | null };
    reportPeriod: { startDate: string; endDate: string };
    summary: Array<{
      serialNo: number;
      employeeId: string;
      employeeName: string;
      status?: string;
      departmentName: string;
      designation: string;
      branchName: string;
      isRoster: boolean;
      officeDays: number;
      absent: number;
      leave: number;
      present: number;
      late: number;
      extremeDelay: number;
      totalDelayFormatted: string;
      totalDelayMinutes: number;
      overtimeDays: number;
      expectedDutyFormatted: string;
      expectedDutyMinutes: number;
      actualDutyFormatted: string;
      actualDutyMinutes: number;
      overtimeFormatted: string;
      overtimeMinutes: number;
      extraLessBalanceFormatted: string;
      balanceMinutes: number;
    }>;
  }> => {
    const params = new URLSearchParams();
    params.append("startDate", query.startDate);
    params.append("endDate", query.endDate);
    if (query.departmentId && query.departmentId !== "ALL") {
      params.append("departmentId", query.departmentId);
    }
    const { data } = await apiClient.get<any>(`/attendance/admin/summary-report?${params.toString()}`);
    return data;
  },

  getIndividualReport: async (query: { userId: string; month?: string; startDate?: string; endDate?: string }): Promise<IndividualAttendanceReportResponse> => {
    const params = new URLSearchParams();
    params.append("userId", query.userId);
    if (query.month) params.append("month", query.month);
    if (query.startDate) params.append("startDate", query.startDate);
    if (query.endDate) params.append("endDate", query.endDate);
    const { data } = await apiClient.get<IndividualAttendanceReportResponse>(`/attendance/admin/individual-report?${params.toString()}`);
    return data;
  },
};

export interface IndividualAttendanceReportResponse {
  success: boolean;
  employee: {
    id: string;
    fullName: string;
    employeeId: string;
    email: string;
    avatarUrl: string | null;
    department: string;
    designation: string;
    branch: string;
    shift: {
      name: string;
      startTime: string;
      endTime: string;
    } | null;
    offDays: string[];
  };
  period: {
    startDate: string;
    endDate: string;
    month: string;
    monthLabel: string;
  };
  stats: {
    presentDays: number;
    absentDays: number;
    lateDays: number;
    leaveDays: number;
    offDays: number;
    holidays: number;
    totalWorkHours: string;
    totalWorkMinutes: number;
    totalOvertimeMinutes: number;
  };
  dailyHistory: Array<{
    date: string;
    dateFormatted: string;
    dayName: string;
    checkIn: string;
    checkOut: string;
    status: "Present" | "Late" | "Absent" | "Leave" | "Off-Day" | "Holiday" | "Upcoming";
    currentState?: "NOT_CHECKED_IN" | "CHECKED_IN" | "ON_BREAK" | "CHECKED_OUT";
    totalBreakMinutes?: number;
    breaks?: Array<{
      id: string;
      breakType: string;
      startTime: string;
      endTime?: string | null;
      durationMinutes?: number;
    }>;
    workMinutes: number;
    workHoursFormatted: string;
    overtimeMinutes: number;
    holidayName: string | null;
  }>;
}
