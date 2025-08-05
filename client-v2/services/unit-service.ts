// src/services/unit-service.ts
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from './api';
import { Unit, FileUploadResponse, PaginatedResponse } from '../types';

export interface UnitsFilters {
  faculty?: string;
  search?: string;
  sort?: 'name' | 'code' | 'created' | 'recent';
  limit?: number;
  page?: number;
}

export interface CreateUnitData {
  name: string;
  code: string;
  description: string;
  faculty?: string;
  facultyCode?: string;
  keywords?: string[];
  syllabus?: string[];
  prerequisites?: string[];
  credits?: number;
  level?: string;
}

// Get all units with filters
export const getAllUnits = async (filters: UnitsFilters = {}): Promise<PaginatedResponse<Unit>> => {
  const params: Record<string, string> = {};
  
  if (filters.faculty && filters.faculty !== 'all') {
    params.faculty = filters.faculty;
  }
  if (filters.search) {
    params.search = filters.search;
  }
  if (filters.sort) {
    params.sort = filters.sort;
  }
  if (filters.limit) {
    params.limit = filters.limit.toString();
  }
  if (filters.page) {
    params.page = filters.page.toString();
  }

  const response = await apiGet<PaginatedResponse<Unit>>('/units', params);
  return response;
};

// Get all units for a course
export const getUnitsByCourse = async (courseId: string): Promise<Unit[]> => {
  const response = await apiGet<{ units: Unit[] }>(`/units/course/${courseId}`);
  return response.units;
};

// Get unit by ID
export const getUnitById = async (unitId: string): Promise<Unit> => {
  const response = await apiGet<{ unit: Unit }>(`/units/${unitId}`);
  return response.unit;
};

// Create new unit
export const createUnit = async (unitData: CreateUnitData): Promise<Unit> => {
  const response = await apiPost<{ unit: Unit }>('/units', unitData);
  return response.unit;
};

// Create new unit for a course
export const createUnitForCourse = async (
  courseId: string,
  unitData: Omit<CreateUnitData, 'courseId'>
): Promise<Unit> => {
  const response = await apiPost<{ unit: Unit }>(`/units/course/${courseId}`, unitData);
  return response.unit;
};

// Update unit
export const updateUnit = async (
  unitId: string,
  data: Partial<CreateUnitData>
): Promise<Unit> => {
  const response = await apiPut<{ unit: Unit }>(`/units/${unitId}`, data);
  return response.unit;
};

// Delete unit
export const deleteUnit = async (unitId: string): Promise<void> => {
  await apiDelete(`/units/${unitId}`);
};

// Search units
export const searchUnits = async (query: string, filters?: Omit<UnitsFilters, 'search'>): Promise<Unit[]> => {
  const params: Record<string, string> = { search: query };
  
  if (filters?.faculty && filters.faculty !== 'all') {
    params.faculty = filters.faculty;
  }
  if (filters?.sort) {
    params.sort = filters.sort;
  }
  if (filters?.limit) {
    params.limit = filters.limit.toString();
  }

  const response = await apiGet<{ units: Unit[] }>('/units/search', params);
  return response.units;
};

// Get featured units
export const getFeaturedUnits = async (limit: number = 10): Promise<Unit[]> => {
  const response = await apiGet<{ units: Unit[] }>('/units/featured', { limit: limit.toString() });
  return response.units;
};

// Get units by faculty
export const getUnitsByFaculty = async (facultyCode: string, limit?: number): Promise<Unit[]> => {
  const params: Record<string, string> = { faculty: facultyCode };
  if (limit) {
    params.limit = limit.toString();
  }
  
  const response = await apiGet<{ units: Unit[] }>('/units/faculty', params);
  return response.units;
};

// Upload past paper
export const uploadPastPaper = async (
  unitId: string,
  file: File,
  paperType: 'exam' | 'cat' = 'exam',
  year?: string
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', paperType);
  if (year) {
    formData.append('year', year);
  }
  
  const response = await apiUpload<FileUploadResponse>(`/units/${unitId}/upload-past-paper/`, formData);
  return response;
};