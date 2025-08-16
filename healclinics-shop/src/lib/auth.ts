// src/lib/auth.ts
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

interface RegisterResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

class AuthService {
  private baseUrl = 'http://127.0.0.1:8080/api';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('healclinics_access_token');
      this.refreshToken = localStorage.getItem('healclinics_refresh_token');
    }
  }

  async login(credentials: { username: string; password: string }): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Ongeldig e-mailadres of wachtwoord');
        }
        throw new Error(`Login failed: ${response.statusText}`);
      }

      const data: LoginResponse = await response.json();
      
      this.accessToken = data.access;
      this.refreshToken = data.refresh;

      if (typeof window !== 'undefined') {
        localStorage.setItem('healclinics_access_token', data.access);
        localStorage.setItem('healclinics_refresh_token', data.refresh);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // STAP 2: DIRECT URL - NO CONCATENATION ISSUES
  async register(userData: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password_confirm: string;
  }): Promise<RegisterResponse> {
    try {
      // DIRECT URL - NO CONCATENATION ISSUES
      const registerUrl = 'http://127.0.0.1:8080/api/auth/register/';
      
      console.log('🔄 Registering user to:', registerUrl);
      console.log('📝 User data:', { ...userData, password: '***', password_confirm: '***' });

      const response = await fetch(registerUrl, {  // ← FIXED: Direct URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('📡 Response status:', response.status);
      console.log('📋 Response headers:', response.headers.get('content-type'));

      // Check if response is HTML instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const htmlText = await response.text();
        console.error('❌ Expected JSON but got HTML:', htmlText.substring(0, 200));
        throw new Error('Server returned HTML instead of JSON. Check if Django API is running correctly.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registratie mislukt');
      }

      const data: RegisterResponse = await response.json();
      console.log('✅ Registration successful:', data);

      // Store tokens from registration response
      this.accessToken = data.tokens.access;
      this.refreshToken = data.tokens.refresh;

      if (typeof window !== 'undefined') {
        localStorage.setItem('healclinics_access_token', data.tokens.access);
        localStorage.setItem('healclinics_refresh_token', data.tokens.refresh);
      }

      return data;
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  }

  // VERBETERDE LOGOUT METHOD - COMPLETE CLEANUP
  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    
    if (typeof window !== 'undefined') {
      // Clear all HealClinics data from localStorage
      localStorage.removeItem('healclinics_access_token');
      localStorage.removeItem('healclinics_refresh_token');
      localStorage.removeItem('healclinics_user');
      
      // Clear any cart data (optional - depends on your preference)
      // localStorage.removeItem('healclinics-cart');
      
      // Clear any other stored data related to authentication
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('healclinics_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  // HELPER FUNCTIE VOOR REDIRECT
  redirectToLogin(returnUrl?: string): void {
    if (typeof window !== 'undefined') {
      const loginUrl = returnUrl 
        ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
        : '/auth/login';
      
      window.location.href = loginUrl;
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setCurrentUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('healclinics_user', JSON.stringify(user));
    }
  }

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('healclinics_user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: this.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.accessToken = data.access;

      if (typeof window !== 'undefined') {
        localStorage.setItem('healclinics_access_token', data.access);
      }

      return data.access;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout(); // Clear invalid tokens
      throw error;
    }
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    let token = this.accessToken;

    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Try to refresh token
      try {
        token = await this.refreshAccessToken();
        
        // Retry request with new token
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (refreshError) {
        // Refresh failed, redirect to login
        this.logout();
        this.redirectToLogin();
        throw refreshError;
      }
    }

    return response;
  }
}

// Export singleton instance
export const authService = new AuthService();
