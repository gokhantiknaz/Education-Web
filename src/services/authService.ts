import api, { ApiResponse } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config';
import { LoginRequest, LoginResponse, User } from '@/types';
import Cookies from 'js-cookie';

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>(
      API_ENDPOINTS.LOGIN,
      credentials
    );

    const data = response.data.data;

    // Store tokens
    Cookies.set('token', data.accessToken, { expires: 7 });
    Cookies.set('refreshToken', data.refreshToken, { expires: 30 });
    Cookies.set('user', JSON.stringify(data.user), { expires: 7 });

    return data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>(API_ENDPOINTS.CURRENT_USER);
    return response.data.data;
  }

  logout(): void {
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    Cookies.remove('user');
  }

  getStoredUser(): User | null {
    const userStr = Cookies.get('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!Cookies.get('token');
  }

  isAdmin(): boolean {
    const user = this.getStoredUser();
    return user?.role === 'Admin' || user?.role === 'ContentManager';
  }
}

export default new AuthService();
