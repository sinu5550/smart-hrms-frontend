import { apiClient } from "./api";

export type EmploymentStatus = "ACTIVE" | "ON_PROBATION" | "RESIGNED" | "TERMINATED" | "SUSPENDED";
export type Role = "OWNER" | "ADMIN" | "HR" | "EMPLOYEE";

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: EmploymentStatus;
  bloodGroup?: string | null;
  departmentId?: string | null;
  designationId?: string | null;
  shiftId?: string | null;
  customRoleId?: string | null;
  department?: { id: string; name: string } | null;
  designation?: { id: string; name: string } | null;
  shift?: { id: string; shiftName: string; startTime: string; endTime: string } | null;
  customRole?: { id: string; name: string; permissions: string[] } | null;
  joiningDate: string;
  avatarUrl?: string | null;
  attendanceExempt?: boolean;
  permissions?: string[];
  isOwner?: boolean;
}

export interface CreateEmployeePayload {
  employeeId: string;
  email: string;
  fullName: string;
  phone: string;
  role?: Role;
  attendanceExempt?: boolean;
  password?: string;
  departmentId?: string;
  designationId?: string;
  shiftId?: string;
  customRoleId?: string;
  bloodGroup?: string;
  presentAddress?: string;
  permanentAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  permissions?: string[];
}

export const EmployeeService = {
  getAll: async (params?: Record<string, any>): Promise<Employee[]> => {
    const { data } = await apiClient.get<Employee[]>("/employees", { params });
    return data;
  },

  getNextId: async (): Promise<{ nextEmployeeId: string; prefix: string }> => {
    const { data } = await apiClient.get<{ nextEmployeeId: string; prefix: string }>("/employees/next-id");
    return data;
  },

  create: async (payload: CreateEmployeePayload): Promise<{ user: Employee; initialTemporaryPassword: string }> => {
    const { data } = await apiClient.post("/employees", payload);
    return data;
  },

  changeStatus: async (id: string, status: EmploymentStatus) => {
    const { data } = await apiClient.patch(`/employees/${id}/status`, { status });
    return data;
  },

  update: async (id: string, payload: Partial<CreateEmployeePayload> & { avatarUrl?: string }): Promise<Employee> => {
    const { data } = await apiClient.patch<Employee>(`/employees/${id}`, payload);
    return data;
  },

  uploadAvatar: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post(`/employees/${id}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  softDelete: async (id: string, confirmationText: string) => {
    const { data } = await apiClient.delete(`/employees/${id}`, {
      data: { confirmationText },
    });
    return data;
  },

  bulkImport: async (rows: Array<Record<string, any>>) => {
    const { data } = await apiClient.post("/employees/bulk-import", { rows });
    return data;
  },
};

export interface ShiftSettings {
  id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
}

export const SettingsService = {
  getShift: async (): Promise<ShiftSettings> => {
    const { data } = await apiClient.get<ShiftSettings>("/settings/shift");
    return data;
  },

  updateShift: async (payload: Partial<ShiftSettings>): Promise<ShiftSettings> => {
    const { data } = await apiClient.patch<ShiftSettings>("/settings/shift", payload);
    return data;
  },
};
