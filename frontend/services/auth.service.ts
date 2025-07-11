import api from "@/lib/api";
import Cookies from "js-cookie";

export interface User {
  _id: string;
  username: string;
  name: string;
  email: string;
  profilePic?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/sign-in", credentials);
    if (response.data.success) {
      Cookies.set("token", response.data.data.token, { expires: 7 });
      localStorage.setItem("token", response.data.data.token);
      // Note: User will be set in Zustand store by the calling component
    }
    return response.data;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      "/auth/sign-up",
      credentials
    );
    if (response.data.success) {
      Cookies.set("token", response.data.data.token, { expires: 7 });
      localStorage.setItem("token", response.data.data.token);
      // Note: User will be set in Zustand store by the calling component
    }
    return response.data;
  }

  async logout(): Promise<void> {
    Cookies.remove("token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Note: Zustand logout will also be called by the calling component
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return Cookies.get("token") || localStorage.getItem("token");
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.post("/auth/change-password", data);
  }
}

export const authService = new AuthService();
