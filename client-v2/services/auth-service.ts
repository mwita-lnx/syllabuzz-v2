// src/services/auth-service.ts
import { apiPost, apiGet } from './api';
import { AuthResponse, User } from '../types';

// Login function
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await apiPost<AuthResponse>('/auth/login', { email, password });
  
  // Store tokens in localStorage
  localStorage.setItem('token', response.tokens.access);
  localStorage.setItem('refreshToken', response.tokens.refresh);
  
  return response;
};

// Register function
export const register = async (
  name: string,
  email: string,
  password: string,
  role: 'student' | 'instructor'
): Promise<AuthResponse> => {
  const response = await apiPost<AuthResponse>('/auth/register', {
    name,
    email,
    password,
    role
  });
  
  // Store tokens in localStorage
  localStorage.setItem('token', response.tokens.access);
  localStorage.setItem('refreshToken', response.tokens.refresh);
  
  return response;
};

// Logout function
export const logout = async (): Promise<void> => {
  try {
    // Call logout endpoint to invalidate refresh token
    await apiPost('/auth/logout', {});
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear localStorage regardless of API call success
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
};

// Check if user is authenticated
export const checkAuth = async (): Promise<User> => {
  try {
    const response = await apiGet<{ user: User }>('/auth/me');
    return response.user;
  } catch (error) {
    // Clear tokens if authentication fails
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    throw error;
  }
};

// Refresh token
export const refreshToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await apiPost<{ access: string }>('/auth/refresh', {});
  
  // Update access token in localStorage
  localStorage.setItem('token', response.access);
  
  return response.access;
};