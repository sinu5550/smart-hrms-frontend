import { apiClient } from "./api";

export interface CustomRole {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: string[];
}

export const roleService = {
  async getAll(): Promise<CustomRole[]> {
    const response = await apiClient.get<CustomRole[]>("/roles");
    return response.data;
  },

  async getById(id: string): Promise<CustomRole> {
    const response = await apiClient.get<CustomRole>(`/roles/${id}`);
    return response.data;
  },

  async create(payload: CreateRolePayload): Promise<CustomRole> {
    const response = await apiClient.post<CustomRole>("/roles", payload);
    return response.data;
  },

  async update(id: string, payload: UpdateRolePayload): Promise<CustomRole> {
    const response = await apiClient.patch<CustomRole>(`/roles/${id}`, payload);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/roles/${id}`);
    return response.data;
  },
};
