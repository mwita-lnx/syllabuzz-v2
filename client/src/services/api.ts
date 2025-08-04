// src/services/api.ts
import { ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      
      // Handle different error formats
      const errorMessage = errorData.error?.message || errorData.error || errorData.message || 'An error occurred';
      const errorCode = errorData.error?.code || 'UNKNOWN_ERROR';
      
      const apiError = new Error(errorMessage) as any;
      apiError.code = errorCode;
      apiError.status = response.status;
      apiError.details = errorData.error?.details;
      
      throw apiError;
    } catch (jsonError) {
      // If the response isn't valid JSON
      console.error('Response error:', response.statusText);
      const error = new Error(`${response.status}: ${response.statusText}`) as any;
      error.status = response.status;
      throw error;
    }
  }
  
  try {
    const data = await response.json();
    // Handle standardized response format
    if (data.success === false) {
      const errorMessage = data.error?.message || data.error || 'An error occurred';
      const error = new Error(errorMessage) as any;
      error.code = data.error?.code || 'API_ERROR';
      error.details = data.error?.details;
      throw error;
    }
    
    // Return data field if it exists, otherwise return the whole response
    return data.data !== undefined ? data.data : data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unexpected token')) {
      console.error('Error parsing response JSON:', error);
      throw new Error('Invalid response format');
    }
    throw error;
  }
};

// Get auth token
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Get refresh token
const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

// Token refresh logic
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  
  failedQueue = [];
};

const refreshAuthToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }
  
  isRefreshing = true;
  
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    const newToken = data.data?.token || data.token;
    
    if (!newToken) {
      throw new Error('No token in refresh response');
    }
    
    localStorage.setItem('token', newToken);
    processQueue(null, newToken);
    
    return newToken;
  } catch (error) {
    processQueue(error as Error);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    throw error;
  } finally {
    isRefreshing = false;
  }
};

// Generic fetch function with types and token refresh
export const fetchData = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> => {
  const token = getToken();
  
  // Don't set content-type for FormData requests
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers
  };
  
  // Log request details (for debugging)
  console.log(`Making ${options.method || 'GET'} request to: ${API_URL}${endpoint}`);
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    // If unauthorized and we have a refresh token, try to refresh
    if (response.status === 401 && retryCount === 0 && getRefreshToken()) {
      try {
        console.log('Token expired, attempting refresh...');
        const newToken = await refreshAuthToken();
        
        // Retry the request with new token
        const newHeaders = {
          ...headers,
          Authorization: `Bearer ${newToken}`
        };
        
        const retryResponse = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: newHeaders
        });
        
        return handleResponse<T>(retryResponse);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Redirect to login or emit auth error event
        window.dispatchEvent(new CustomEvent('auth:error', { 
          detail: { message: 'Session expired, please login again' }
        }));
        throw refreshError;
      }
    }
    
    return handleResponse<T>(response);
  } catch (error) {
    console.error(`Request to ${endpoint} failed:`, error);
    throw error;
  }
};

// Create a function for API GET requests
export const apiGet = async <T>(endpoint: string, params?: Record<string, string>): Promise<T> => {
  // Handle query parameters
  const url = params 
    ? `${endpoint}?${new URLSearchParams(params).toString()}`
    : endpoint;
    
  return fetchData<T>(url, { method: 'GET' });
};

// Create a function for API POST requests with JSON data
export const apiPost = async <T>(
  endpoint: string,
  data: any
): Promise<T> => {
  console.log('POST with JSON data:', data);
  
  return fetchData<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Create a function for API PUT requests
export const apiPut = async <T>(
  endpoint: string,
  data: any
): Promise<T> => {
  return fetchData<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// Create a function for API DELETE requests
export const apiDelete = async <T>(endpoint: string): Promise<T> => {
  return fetchData<T>(endpoint, { method: 'DELETE' });
};

// Create a function for file uploads and form data
export const apiUpload = async <T>(
  endpoint: string,
  formData: FormData
): Promise<T> => {
  const token = getToken();
  
  // Log FormData contents for debugging
  console.log('FormData entries:');
  for (const pair of formData.entries()) {
    const value = pair[1] instanceof File 
      ? `File: ${pair[1].name} (${pair[1].size} bytes)` 
      : pair[1];
    console.log(`${pair[0]}: ${value}`);
  }
  
  try {
    // Use fetchData but with FormData body
    return fetchData<T>(endpoint, {
      method: 'POST',
      body: formData
    });
  } catch (error) {
    console.error(`Upload to ${endpoint} failed:`, error);
    throw error;
  }
};