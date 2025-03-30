// src/services/api.ts
import { ApiResponse } from '../types';

const API_URL = process.env.VITE_SERVER_URL || 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'An error occurred');
  }
  
  return response.json();
};

// Generic fetch function with types
export const fetchData = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  return handleResponse<T>(response);
};

// Create a function for API GET requests
export const apiGet = async <T>(endpoint: string): Promise<T> => {
  return fetchData<T>(endpoint, { method: 'GET' });
};

// Create a function for API POST requests
export const apiPost = async <T>(
  endpoint: string,
  data: any
): Promise<T> => {
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

// Create a function for file uploads
export const apiUpload = async <T>(
  endpoint: string,
  formData: FormData
): Promise<T> => {
  const token = localStorage.getItem('token');
  
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData
  });
  
  return handleResponse<T>(response);
};