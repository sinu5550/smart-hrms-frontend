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

export interface RosterShiftRequestItem {
  id: string;
  organizationId: string;
  userId: string;
  targetShiftId: string;
  effectiveDate: string;
  reason?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  actionedById?: string | null;
  actionedAt?: string | null;
  actionNote?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    employeeId: string;
    email: string;
    avatarUrl?: string | null;
    departmentId?: string | null;
    department?: { id: string; name: string; headUserId?: string | null } | null;
    shift?: { id: string; shiftName: string; startTime: string; endTime: string } | null;
  };
  targetShift: {
    id: string;
    shiftName: string;
    startTime: string;
    endTime: string;
  };
}

export interface CreateRosterShiftRequestPayload {
  targetShiftId: string;
  effectiveDate?: string;
  reason?: string;
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

  updateEmployeeShift: async (departmentId: string, employeeUserId: string, shiftId: string | null): Promise<any> => {
    const { data } = await apiClient.patch(`/departments/${departmentId}/employee-shift`, {
      employeeUserId,
      shiftId,
    });
    return data;
  },

  getRosterShiftRequests: async (status?: string, mine?: boolean): Promise<RosterShiftRequestItem[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (mine) params.mine = "true";
    const { data } = await apiClient.get<RosterShiftRequestItem[]>("/departments/roster-shift-requests", {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return data;
  },

  createRosterShiftRequest: async (payload: CreateRosterShiftRequestPayload): Promise<RosterShiftRequestItem> => {
    const { data } = await apiClient.post<RosterShiftRequestItem>("/departments/roster-shift-requests", payload);
    return data;
  },

  actionRosterShiftRequest: async (id: string, action: "APPROVED" | "REJECTED", actionNote?: string): Promise<any> => {
    const { data } = await apiClient.patch(`/departments/roster-shift-requests/${id}/action`, {
      action,
      actionNote,
    });
    return data;
  },
};
