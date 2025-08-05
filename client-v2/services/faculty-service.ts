// src/services/faculty-service.ts
import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { Faculty } from '../types';

export interface CreateFacultyData {
  name: string;
  code: string;
  color: string;
  description?: string;
}

// Get all faculties
export const getAllFaculties = async (): Promise<Faculty[]> => {
  const response = await apiGet<{ faculties: Faculty[] }>('/faculties');
  return response.faculties;
};

// Get faculty by ID
export const getFacultyById = async (facultyId: string): Promise<Faculty> => {
  const response = await apiGet<{ faculty: Faculty }>(`/faculties/${facultyId}`);
  return response.faculty;
};

// Get faculty by code
export const getFacultyByCode = async (code: string): Promise<Faculty> => {
  const response = await apiGet<{ faculty: Faculty }>(`/faculties/code/${code}`);
  return response.faculty;
};

// Create new faculty
export const createFaculty = async (facultyData: CreateFacultyData): Promise<Faculty> => {
  const response = await apiPost<{ faculty: Faculty }>('/faculties', facultyData);
  return response.faculty;
};

// Update faculty
export const updateFaculty = async (
  facultyId: string,
  data: Partial<CreateFacultyData>
): Promise<Faculty> => {
  const response = await apiPut<{ faculty: Faculty }>(`/faculties/${facultyId}`, data);
  return response.faculty;
};

// Delete faculty
export const deleteFaculty = async (facultyId: string): Promise<void> => {
  await apiDelete(`/faculties/${facultyId}`);
};

// Get faculty statistics
export const getFacultyStats = async (facultyCode: string): Promise<any> => {
  const response = await apiGet<any>(`/faculties/${facultyCode}/stats`);
  return response;
};

// Default faculties fallback (for when API is not available or during development)
export const getDefaultFaculties = (): Faculty[] => {
  return [
    { id: '1', name: 'Science', code: 'sci', color: '#FF6B6B' },
    { id: '2', name: 'Arts', code: 'arts', color: '#4ECDC4' },
    { id: '3', name: 'Business', code: 'bus', color: '#FFD166' },
    { id: '4', name: 'Engineering', code: 'eng', color: '#6A0572' },
    { id: '5', name: 'Medicine', code: 'med', color: '#06D6A0' }
  ];
};

// Get faculties with fallback to default
export const getFacultiesWithFallback = async (): Promise<Faculty[]> => {
  try {
    return await getAllFaculties();
  } catch (error) {
    console.warn('Failed to fetch faculties from API, using default faculties:', error);
    return getDefaultFaculties();
  }
};