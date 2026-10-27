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
