import { apiClient } from "./api";

export interface Department {
  id: string;
  name: string;
  code: string;
  organizationId: string;
  headUserId?: string | null;
  headUser?: {
    id: string;
    fullName: string;
    employeeId: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  users?: Array<{
    id: string;
    fullName: string;
    employeeId: string;
    email: string;
    avatarUrl?: string | null;
    role: string;
    status: string;
    rosterOffDays?: string[];
    designation?: { id: string; name: string } | null;
    shift?: { id: string; shiftName: string; startTime: string; endTime: string } | null;
  }>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

export interface CreateDepartmentPayload {
  name: string;
  code?: string;
  headUserId?: string | null;
}

export interface UpdateDepartmentPayload {
  name?: string;
  code?: string;
  headUserId?: string | null;
}

export const DepartmentService = {
  getAll: async (): Promise<Department[]> => {
    const { data } = await apiClient.get<Department[]>("/departments");
    return data;
  },

  getById: async (id: string): Promise<Department> => {
    const { data } = await apiClient.get<Department>(`/departments/${id}`);
    return data;
  },

  create: async (payload: CreateDepartmentPayload): Promise<Department> => {
    const { data } = await apiClient.post<Department>("/departments", payload);
    return data;
  },

  update: async (id: string, payload: UpdateDepartmentPayload): Promise<Department> => {
    const { data } = await apiClient.patch<Department>(`/departments/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/departments/${id}`);
  },

  updateEmployeeRosterOffDays: async (departmentId: string, employeeUserId: string, rosterOffDays: string[]): Promise<any> => {
    const { data } = await apiClient.patch(`/departments/${departmentId}/employee-roster-offdays`, {
      employeeUserId,
      rosterOffDays,
    });
    return data;
  },
};
