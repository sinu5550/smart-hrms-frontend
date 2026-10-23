import { apiClient } from "./api";

export interface LoginCredentials {
  identifier: string; // HR-assigned employee ID or email
  password: string;
}

export interface AuthUser {
  id: string;
  employeeId: string;
  email: string;
  fullName: string;
  role: "PLATFORM_ADMIN" | "ADMIN" | "HR" | "EMPLOYEE";
  permissions?: string[];
  mustChangePassword?: boolean;
  organization?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    employeePrefix: string;
  } | null;
  phone?: string | null;
  avatarUrl?: string | null;
  departmentId?: string | null;
  designationId?: string | null;
  customRoleId?: string | null;
  department?: { id: string; name: string } | null;
  designation?: { id: string; title: string } | null;
  customRole?: { id: string; name: string } | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  organizationId: string | null;
  mustChangePassword: boolean;
  user: AuthUser;
}

export const AuthService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/login", credentials);
    if (response.data?.accessToken) {
      localStorage.setItem("access_token", response.data.accessToken);
      localStorage.setItem("refresh_token", response.data.refreshToken);
      localStorage.setItem("user_profile", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async platformLogin(identifier: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>("/auth/platform-login", { identifier, password });
    localStorage.setItem("access_token", data.accessToken);
    localStorage.setItem("refresh_token", data.refreshToken);
    localStorage.setItem("user_profile", JSON.stringify(data.user));
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post("/auth/change-password", { currentPassword, newPassword });
    this.logout();
  },

  async getProfile(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>("/auth/me");
    if (response.data) {
      localStorage.setItem("user_profile", JSON.stringify(response.data));
    }
    return response.data;
  },

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_profile");
    }
  },

  getUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("user_profile");
    if (!stored) return null;
    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("access_token");
  },
};
