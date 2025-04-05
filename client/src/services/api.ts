// src/services/api.ts
import { ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(errorData.error || errorData.message || 'An error occurred');
    } catch (jsonError) {
      // If the response isn't valid JSON
      console.error('Response error:', response.statusText);
      throw new Error(`${response.status}: ${response.statusText}`);
    }
  }
  
  try {
    return await response.json();
  } catch (error) {
    console.error('Error parsing response JSON:', error);
    throw new Error('Invalid response format');
  }
};

// Get auth token
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Generic fetch function with types
export const fetchData = async <T>(
  endpoint: string,
  options: RequestInit = {}
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