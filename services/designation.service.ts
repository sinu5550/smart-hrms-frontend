import { apiClient } from "./api";

export interface Designation {
  id: string;
  name: string;
  code: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    users: number;
  };
}

export interface CreateDesignationPayload {
  name: string;
  code?: string;
}

export interface UpdateDesignationPayload {
  name?: string;
  code?: string;
}

export const DesignationService = {
  getDesignations: async (): Promise<Designation[]> => {
    const { data } = await apiClient.get<Designation[]>("/designations");
    return data;
  },

  createDesignation: async (payload: CreateDesignationPayload): Promise<Designation> => {
    const { data } = await apiClient.post<Designation>("/designations", payload);
    return data;
  },

  updateDesignation: async (id: string, payload: UpdateDesignationPayload): Promise<Designation> => {
    const { data } = await apiClient.patch<Designation>(`/designations/${id}`, payload);
    return data;
  },

  deleteDesignation: async (id: string): Promise<Designation> => {
    const { data } = await apiClient.delete<Designation>(`/designations/${id}`);
    return data;
  },
};

