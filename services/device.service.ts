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

  async update(id: string, payload: Partial<RegisterDevicePayload>): Promise<BiometricDevice> {
    const { data } = await apiClient.patch<BiometricDevice>(`/devices/${id}`, payload);
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

  async syncPunches(id: string, days?: number): Promise<{
    success: boolean;
    totalEventsExamined: number;
    recordedPunches: number;
    attendanceCheckIns: number;
    message: string;
  }> {
    const { data } = await apiClient.post(`/devices/${id}/sync-punches`, { days });
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

  async reconcileBio(): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post("/devices/reconcile-bio");
    return data;
  },

  async syncAllDevices(options?: { startDate?: string; endDate?: string; quick?: boolean }): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post("/devices/sync-all", options || {});
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

  async getEmployeeFingerprints(deviceId: string, employeeId: string): Promise<{
    success: boolean;
    terminalEmployeeNo: string;
    employee: any;
    fingerprints: Array<{
      cardReaderNo: number;
      fingerPrintID: number;
      fingerType: string;
      fingerData?: string;
    }>;
    totalFP: number;
    device: { id: string; name: string; model: string; serial: string };
  }> {
    const { data } = await apiClient.get(`/devices/${deviceId}/employee-fingerprints/${employeeId}`);
    return data;
  },

  async deleteEmployeeFingerprint(deviceId: string, employeeId: string, fingerPrintId: number): Promise<{
    success: boolean;
    message: string;
    fingerprints: any[];
    totalFP: number;
  }> {
    const { data } = await apiClient.delete(`/devices/${deviceId}/employee-fingerprints/${employeeId}/${fingerPrintId}`);
    return data;
  },

  async promptEmployeeFingerprint(deviceId: string, employeeId: string): Promise<{
    success: boolean;
    terminalEmployeeNo: string;
    employeeName: string;
    deviceName: string;
    message: string;
  }> {
    const { data } = await apiClient.post(`/devices/${deviceId}/employee-fingerprints/${employeeId}/prompt`);
    return data;
  },

  async downloadConfiguredAgent(deviceId: string, deviceName: string): Promise<void> {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000";
    const apiBaseUrl = rawBaseUrl.endsWith("/api") ? rawBaseUrl : `${rawBaseUrl.replace(/\/+$/, "")}/api`;
    const downloadUrl = `${apiBaseUrl}/devices/${deviceId}/download-agent${token ? `?token=${encodeURIComponent(token)}` : ""}`;

    const link = document.createElement("a");
    link.href = downloadUrl;
    const safeName = (deviceName || "device").replace(/[^a-zA-Z0-9_-]/g, "_");
    link.download = `SmartHRM-Agent-${safeName}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
