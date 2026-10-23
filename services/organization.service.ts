import { apiClient } from "./api";

export interface OrganizationDetails {
  id: string;
  name: string;
  slug: string;
  emailDomain: string;
  employeePrefix: string;
  ownerEmail: string;
  logoUrl?: string | null;
  status: string;
  createdAt: string;
  subscriptions?: Array<{
    plan: string;
    status: string;
    trialEndsAt?: string | null;
  }>;
}

export const OrganizationService = {
  async getCurrent(): Promise<OrganizationDetails | null> {
    const { data } = await apiClient.get<{ organization: OrganizationDetails | null }>("/organizations/current");
    return data.organization;
  },

  async updateCurrent(payload: { name?: string; logoUrl?: string; employeePrefix?: string }): Promise<OrganizationDetails> {
    const { data } = await apiClient.patch<{ organization: OrganizationDetails }>("/organizations/current", payload);
    return data.organization;
  },
};
