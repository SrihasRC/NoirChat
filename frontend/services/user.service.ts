import api from '../lib/api';
import { User } from './auth.service';

export interface UpdateProfileData {
  name?: string;
  username?: string;
  email?: string;
  bio?: string;
  profilePic?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UserActivity {
  username: string;
  lastSeen: string;
  isOnline: boolean;
}

class UserService {
  async getProfile(): Promise<User> {
    const response = await api.get('/users/profile');
    return response.data.user;
  }

  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await api.put('/users/profile', data);
    return response.data.user;
  }

  async changePassword(data: ChangePasswordData): Promise<void> {
    await api.put('/users/change-password', data);
  }

  async deleteAccount(): Promise<void> {
    await api.delete('/users/account');
  }

  async getUserByUsername(username: string): Promise<User> {
    const response = await api.get(`/users/${username}`);
    return response.data.user;
  }

  async searchUsers(query: string): Promise<User[]> {
    const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
    return response.data.users;
  }

  async getUserActivity(): Promise<UserActivity> {
    const response = await api.get('/users/activity');
    return response.data.activity;
  }
}

export const userService = new UserService();
