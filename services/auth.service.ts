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
  role: "PLATFORM_ADMIN" | "OWNER" | "ADMIN" | "HR" | "EMPLOYEE";
  isOwner?: boolean;
  permissions?: string[];
  mustChangePassword?: boolean;
  organization?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    employeePrefix: string;
    ownerEmail?: string | null;
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

// 30 days continuous inactivity timeout (in ms)
export const INACTIVITY_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000;

export const AuthService = {
  recordActivity(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("last_active_at", Date.now().toString());
    }
  },

  isInactiveExpired(): boolean {
    if (typeof window === "undefined") return false;
    const lastActive = localStorage.getItem("last_active_at");
    if (!lastActive) return false;
    const elapsed = Date.now() - Number(lastActive);
    return elapsed > INACTIVITY_TIMEOUT_MS;
  },

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/login", credentials);
    if (response.data?.accessToken) {
      localStorage.setItem("access_token", response.data.accessToken);
      localStorage.setItem("refresh_token", response.data.refreshToken);
      localStorage.setItem("user_profile", JSON.stringify(response.data.user));
      this.recordActivity();
    }
    return response.data;
  },

  async platformLogin(identifier: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>("/auth/platform-login", { identifier, password });
    localStorage.setItem("access_token", data.accessToken);
    localStorage.setItem("refresh_token", data.refreshToken);
    localStorage.setItem("user_profile", JSON.stringify(data.user));
    this.recordActivity();
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
      this.recordActivity();
    }
    return response.data;
  },

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_profile");
      localStorage.removeItem("last_active_at");
    }
  },

  async sendOtp(email: string, type: "sign-in" | "email-verification" | "forget-password" = "sign-in"): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>("/auth/send-otp", { email, type });
    return response.data;
  },

  async verifyOtp(email: string, otp: string, type: "sign-in" | "email-verification" | "forget-password" = "sign-in"): Promise<{ success: boolean; verified: boolean; session?: LoginResponse }> {
    const response = await apiClient.post<{ success: boolean; verified: boolean; session?: LoginResponse }>("/auth/verify-otp", { email, otp, type });
    if (response.data?.session?.accessToken) {
      localStorage.setItem("access_token", response.data.session.accessToken);
      localStorage.setItem("refresh_token", response.data.session.refreshToken);
      localStorage.setItem("user_profile", JSON.stringify(response.data.session.user));
      this.recordActivity();
    }
    return response.data;
  },

  getUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    if (this.isInactiveExpired()) {
      this.logout();
      return null;
    }
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
    if (this.isInactiveExpired()) {
      this.logout();
      return false;
    }
    const hasToken = !!localStorage.getItem("access_token");
    if (hasToken && !localStorage.getItem("last_active_at")) {
      this.recordActivity();
    }
    return hasToken;
  },
};
