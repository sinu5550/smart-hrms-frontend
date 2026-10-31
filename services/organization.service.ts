import { apiClient } from "./api";

export interface OrganizationDetails {
  id: string;
  name: string;
  slug: string;
  emailDomain: string;
  employeePrefix: string;
  ownerEmail: string;
  logoUrl?: string | null;
  address?: string | null;
  weekendDays?: string[];
  hasRosterDuty?: boolean;
  rosterDepartmentIds?: string[];
  status: string;
  createdAt: string;
  subscriptions?: Array<{
    plan: string;
    status: string;
    trialEndsAt?: string | null;
  }>;
}

export interface OfficeNetwork {
  id: string;
  organizationId: string;
  locationName: string;
  allowedPublicIp: string;
  subnetMask?: string | null;
  isActive: boolean;
  createdAt: string;
}

export const OrganizationService = {
  async getCurrent(): Promise<OrganizationDetails | null> {
    const { data } = await apiClient.get<{ organization: OrganizationDetails | null }>("/organizations/current");
    return data.organization;
  },

  async updateCurrent(payload: {
    name?: string;
    logoUrl?: string;
    employeePrefix?: string;
    address?: string;
    weekendDays?: string[];
    hasRosterDuty?: boolean;
    rosterDepartmentIds?: string[];
  }): Promise<OrganizationDetails> {
    const { data } = await apiClient.patch<{ organization: OrganizationDetails }>("/organizations/current", payload);
    return data.organization;
  },

  async getNetworks(): Promise<OfficeNetwork[]> {
    const { data } = await apiClient.get<OfficeNetwork[]>("/organizations/networks");
    return data;
  },

  async addNetwork(payload: { locationName?: string; allowedPublicIp: string; subnetMask?: string }): Promise<OfficeNetwork> {
    const { data } = await apiClient.post<OfficeNetwork>("/organizations/networks", payload);
    return data;
  },

  async deleteNetwork(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>(`/organizations/networks/${id}`);
    return data;
  },

  async getMyIp(): Promise<{ ip: string }> {
    const { data } = await apiClient.get<{ ip: string }>("/organizations/my-ip");
    return data;
  },
};
