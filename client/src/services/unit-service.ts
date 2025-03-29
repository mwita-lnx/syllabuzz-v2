// src/services/unit-service.ts
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from './api';
import { Unit, FileUploadResponse } from '../types';

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
export const createUnit = async (
  courseId: string,
  name: string,
  code: string,
  description: string
): Promise<Unit> => {
  const response = await apiPost<{ unit: Unit }>(`/units/course/${courseId}`, {
    name,
    code,
    description
  });
  return response.unit;
};

// Update unit
export const updateUnit = async (
  unitId: string,
  data: Partial<Unit>
): Promise<Unit> => {
  const response = await apiPut<{ unit: Unit }>(`/units/${unitId}`, data);
  return response.unit;
};

// Delete unit
export const deleteUnit = async (unitId: string): Promise<void> => {
  await apiDelete(`/units/${unitId}`);
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