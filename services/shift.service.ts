import { apiClient } from "./api";

export interface Shift {
  id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  overtimeThresholdMins?: number;
  isDefault: boolean;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

export interface CreateShiftPayload {
  shiftName?: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  overtimeThresholdMins?: number;
  isDefault?: boolean;
}

export interface UpdateShiftPayload {
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  gracePeriodMinutes?: number;
  overtimeThresholdMins?: number;
  isDefault?: boolean;
}

export const ShiftService = {
  getAll: async (): Promise<Shift[]> => {
    const { data } = await apiClient.get<Shift[]>("/shifts");
    return data;
  },

  getDefault: async (): Promise<Shift> => {
    const { data } = await apiClient.get<Shift>("/shifts/default");
    return data;
  },

  create: async (payload: CreateShiftPayload): Promise<Shift> => {
    const { data } = await apiClient.post<Shift>("/shifts", payload);
    return data;
  },

  update: async (id: string, payload: UpdateShiftPayload): Promise<Shift> => {
    const { data } = await apiClient.patch<Shift>(`/shifts/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/shifts/${id}`);
  },
};
