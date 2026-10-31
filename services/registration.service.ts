import { apiClient } from "./api";

export interface EmployeeRegistration {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  nidOrPassport?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  presentAddress?: string | null;
  permanentAddress?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  designationId?: string | null;
  designationName?: string | null;
  avatarUrl?: string | null;
  password?: string;
  passwordHash?: string | null;
  status: "PENDING" | "ENLISTED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export interface PublicOrgFormDetails {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  address?: string | null;
  employeePrefix?: string | null;
  departments: Array<{ id: string; name: string; code: string }>;
  designations: Array<{ id: string; name: string; code: string }>;
}

export const RegistrationService = {
  // Public endpoint: Fetch tenant details for public registration form
  async getPublicOrgForm(tenantSlug: string): Promise<PublicOrgFormDetails> {
    const res = await apiClient.get<{ organization: PublicOrgFormDetails }>(`/organizations/public-form/${tenantSlug}`);
    return res.data.organization;
  },

  // Public endpoint: Submit new employee registration
  async submitRegistration(tenantSlug: string, payload: Partial<EmployeeRegistration>): Promise<{ success: boolean; message: string; registrationId: string }> {
    const res = await apiClient.post(`/organizations/public-form/${tenantSlug}/submit`, payload);
    return res.data;
  },

  // Protected endpoint: Get list of submissions for current organization
  async getRegistrations(status?: string): Promise<EmployeeRegistration[]> {
    const params = status ? { status } : {};
    const res = await apiClient.get<{ registrations: EmployeeRegistration[] }>("/organizations/registrations", { params });
    return res.data.registrations;
  },

  // Protected endpoint: Mark status as ENLISTED or REJECTED
  async updateStatus(id: string, status: "ENLISTED" | "REJECTED"): Promise<void> {
    await apiClient.patch(`/organizations/registrations/${id}/status`, { status });
  },
};
