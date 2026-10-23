import { apiClient } from "./api";

export interface Department {
  id: string;
  name: string;
  code: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

export interface CreateDepartmentPayload {
  name: string;
  code?: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  code?: string;
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
};
