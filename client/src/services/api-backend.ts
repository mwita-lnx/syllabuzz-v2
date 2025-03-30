// api.ts - Core API client for making HTTP requests

import { AuthResponse, ApiResponse, User } from '../types/index3';

// API base URL - replace with environment variable in production
const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api` || 'http://localhost:5000/api';


console.log('API_BASE_URL:', API_BASE_URL);

// Token storage keys
const TOKEN_KEY = 'token';
const USER_KEY = 'user';



/**
 * Get stored auth token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
  };

/**
 * Get stored user
 */
export const getUser = (): User | null => {
  let userStr = localStorage.getItem(USER_KEY);
  // parse id to userId
  
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

/**
 * Set auth token and user in storage
 */
export const setAuth = (token: string, user: User): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Clear auth data

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

/**
 * Create headers with auth token if available
 */
export const createHeaders = (contentType = 'application/json'): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': contentType,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Handle API response
 */
export const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  // If status is 204 No Content, return a success response with no data
  if (response.status === 204) {
    return { success: true };
  }

  const data = await response.json();

  if (!response.ok) {
    // Handle API errors
    return {
      success: false,
      error: data.error || data.message || 'An unknown error occurred',
    };
  }

  return data as ApiResponse<T>;
};

/**
 * API client for making HTTP requests
 */
export const apiClient = {
  /**
   * Make GET request to API
   */
  get: async <T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> => {
    try {
      const url = new URL(`${API_BASE_URL}${path}`);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
          }
        });
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: createHeaders(),
      });

      return handleResponse<T>(response);
    } catch (error) {
      console.error('API GET Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  /**
   * Make POST request to API
   */
  post: async <T>(path: string, data: any): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(data),
      });

      return handleResponse<T>(response);
    } catch (error) {
      console.error('API POST Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  /**
   * Make PUT request to API
   */
  put: async <T>(path: string, data: any): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'PUT',
        headers: createHeaders(),
        body: JSON.stringify(data),
      });

      return handleResponse<T>(response);
    } catch (error) {
      console.error('API PUT Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  /**
   * Make DELETE request to API
   */
  delete: async <T>(path: string): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'DELETE',
        headers: createHeaders(),
      });

      return handleResponse<T>(response);
    } catch (error) {
      console.error('API DELETE Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  /**
   * Login/authentication
   * Using the provided token endpoint: /api/dev/token
   */
  login: async (): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/dev/token`, {
        method: 'GET',
        headers: createHeaders(),
      });

      const data = await handleResponse<AuthResponse>(response);
      
      if (data.success && data.data) {
        // Store auth data
        setAuth(data.data.token, data.data.user);
      }

      return data;
    } catch (error) {
      console.error('Login Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  },

  /**
   * Logout
   */

};

export default apiClient;