// src/services/course-service.ts
import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { Course } from '../types';

// Get all courses
export const getCourses = async (): Promise<Course[]> => {
  const response = await apiGet<{ courses: Course[] }>('/courses/');
  
  return response.courses;
};

// Get course by ID
export const getCourseById = async (courseId: string): Promise<Course> => {
  const response = await apiGet<{ course: Course }>(`/courses/${courseId}`);
  return response.course;
};

// Create new course
export const createCourse = async (
  name: string,
  code: string,
  description: string
): Promise<Course> => {
  const response = await apiPost<{ course: Course }>('/courses/', {
    name,
    code,
    description
  });
  return response.course;
};

// Update course
export const updateCourse = async (
  courseId: string,
  data: Partial<Course>
): Promise<Course> => {
  const response = await apiPut<{ course: Course }>(`/courses/${courseId}`, data);
  return response.course;
};

// Delete course
export const deleteCourse = async (courseId: string): Promise<void> => {
  await apiDelete(`/courses/${courseId}`);
};