import { apiClient } from "./api";

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  isHeadOffice?: boolean;
  createdAt: string;
  _count?: { users: number };
}

export interface Holiday {
  id: string;
  title: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  holidayType: string;
  description?: string | null;
}

export interface JobGrade {
  id: string;
  gradeName: string;
  gradeLevel: number;
  minBasic: number;
  maxBasic: number;
  description?: string | null;
  _count?: { users: number };
}

export interface GazetteRule {
  id: string;
  gazetteName: string;
  basicPercentage: number;
  houseRentPercentage: number;
  medicalAllowanceFixed: number;
  conveyanceAllowanceFixed: number;
  foodAllowanceFixed: number;
  overtimeMultiplier: number;
  isDefault: boolean;
}

export interface IdCardTemplate {
  id: string;
  templateName: string;
  primaryColor: string;
  accentColor: string;
  showBloodGroup: boolean;
  showEmergencyContact: boolean;
  showQrCode: boolean;
  showBarcode: boolean;
  customFooterText: string;
  isDefault: boolean;
}

export const coreHrService = {
  // Branches
  async getBranches(): Promise<Branch[]> {
    const { data } = await apiClient.get<Branch[]>("/core-hr/branches");
    return data;
  },
  async createBranch(payload: Partial<Branch>): Promise<Branch> {
    const { data } = await apiClient.post<Branch>("/core-hr/branches", payload);
    return data;
  },
  async deleteBranch(id: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete<{ success: boolean }>(`/core-hr/branches/${id}`);
    return data;
  },

  // Holidays
  async getHolidays(): Promise<Holiday[]> {
    const { data } = await apiClient.get<Holiday[]>("/core-hr/holidays");
    return data;
  },
  async createHoliday(payload: Partial<Holiday>): Promise<Holiday> {
    const { data } = await apiClient.post<Holiday>("/core-hr/holidays", payload);
    return data;
  },
  async deleteHoliday(id: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete<{ success: boolean }>(`/core-hr/holidays/${id}`);
    return data;
  },

  // Grades
  async getGrades(): Promise<JobGrade[]> {
    const { data } = await apiClient.get<JobGrade[]>("/core-hr/grades");
    return data;
  },
  async createGrade(payload: Partial<JobGrade>): Promise<JobGrade> {
    const { data } = await apiClient.post<JobGrade>("/core-hr/grades", payload);
    return data;
  },

  // Gazette
  async getGazettes(): Promise<GazetteRule[]> {
    const { data } = await apiClient.get<GazetteRule[]>("/core-hr/gazette");
    return data;
  },
  async createGazette(payload: Partial<GazetteRule>): Promise<GazetteRule> {
    const { data } = await apiClient.post<GazetteRule>("/core-hr/gazette", payload);
    return data;
  },

  // ID Card Templates
  async getIdCardTemplates(): Promise<IdCardTemplate[]> {
    const { data } = await apiClient.get<IdCardTemplate[]>("/core-hr/id-card-templates");
    return data;
  },
  async saveIdCardTemplate(payload: Partial<IdCardTemplate>): Promise<IdCardTemplate> {
    const { data } = await apiClient.post<IdCardTemplate>("/core-hr/id-card-templates", payload);
    return data;
  },
};
