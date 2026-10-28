import { apiClient } from "./api";

export interface BiometricDevice {
  id: string;
  organizationId: string;
  deviceName: string;
  deviceSerialNumber: string;
  deviceModel: string;
  ipAddress?: string | null;
  port: number;
  username?: string | null;
  locationName: string;
  status: "ONLINE" | "OFFLINE";
  lastHeartbeat?: string | null;
  totalLogsSynced: number;
  isActive: boolean;
  createdAt: string;
}

export interface BiometricRawLog {
  id: string;
  deviceSerialNumber: string;
  employeeId: string;
  employeeName?: string | null;
  punchTime: string;
  punchType: string;
  verificationMode: string;
  syncStatus: string;
  createdAt: string;
  device?: {
    deviceName: string;
    locationName: string;
  };
}

export interface RegisterDevicePayload {
  deviceName: string;
  deviceSerialNumber: string;
  deviceModel?: string;
  ipAddress?: string;
  port?: number;
  username?: string;
  password?: string;
  locationName?: string;
}

export const deviceService = {
  async getAll(): Promise<BiometricDevice[]> {
    const { data } = await apiClient.get<BiometricDevice[]>("/devices");
    return data;
  },

  async register(payload: RegisterDevicePayload): Promise<BiometricDevice> {
    const { data } = await apiClient.post<BiometricDevice>("/devices", payload);
    return data;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete<{ success: boolean }>(`/devices/${id}`);
    return data;
  },

  async syncPersons(id: string): Promise<{
    success: boolean;
    totalFound: number;
    importedCount: number;
    updatedCount: number;
    message: string;
  }> {
    const { data } = await apiClient.post(`/devices/${id}/sync-persons`);
    return data;
  },

  async getDevicePortal(id: string): Promise<{
    device: BiometricDevice;
    isTerminalReachable: boolean;
    totalTerminalUsers: number;
    terminalUsers: Array<{
      employeeNo: string;
      name: string;
      userType: string;
      hasFingerprint: boolean;
      numOfFP: number;
      hasFace: boolean;
      numOfFace: number;
    }>;
    recentLogs: BiometricRawLog[];
  }> {
    const { data } = await apiClient.get(`/devices/${id}/portal`);
    return data;
  },

  async syncPunches(id: string): Promise<{
    success: boolean;
    totalEventsExamined: number;
    recordedPunches: number;
    attendanceCheckIns: number;
    message: string;
  }> {
    const { data } = await apiClient.post(`/devices/${id}/sync-punches`);
    return data;
  },

  async pushEmployee(deviceId: string, payload: { employeeId?: string; employeeDbId?: string }): Promise<{
    success: boolean;
    terminalEmployeeNo: string;
    employeeName: string;
    message: string;
  }> {
    const { data } = await apiClient.post(`/devices/${deviceId}/push-employee`, payload);
    return data;
  },

  async updatePerson(deviceId: string, payload: { employeeNo: string; name: string; employeeId?: string }): Promise<{
    success: boolean;
    message: string;
    updatedEmployee?: { id: string; employeeId: string; fullName: string };
  }> {
    const { data } = await apiClient.put(`/devices/${deviceId}/update-person`, payload);
    return data;
  },

  async deletePerson(deviceId: string, employeeNo: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const { data } = await apiClient.delete(`/devices/${deviceId}/persons/${encodeURIComponent(employeeNo)}`);
    return data;
  },

  async getRecentLogs(): Promise<BiometricRawLog[]> {
    const { data } = await apiClient.get<BiometricRawLog[]>("/devices/logs");
    return data;
  },

  async getQrCode(): Promise<{
    organization: { id: string; name: string; slug: string; employeePrefix: string; logoUrl?: string | null };
    officeNetworks: Array<{ id: string; locationName: string; allowedPublicIp: string }>;
    primaryIp: string;
    qrPayload: string;
    qrDataUrl: string;
    staticOfficeSecret: string;
  }> {
    const { data } = await apiClient.get("/devices/qr-code");
    return data;
  },
};
