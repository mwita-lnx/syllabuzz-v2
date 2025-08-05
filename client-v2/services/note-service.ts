// src/services/note-service.ts
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from './api';
import { Note, FileUploadResponse, PaginatedResponse } from '../types';

export interface NotesFilters {
  faculty?: string;
  type?: 'notes' | 'academic' | 'all';
  search?: string;
  sort?: 'recent' | 'relevance' | 'az' | 'za';
  limit?: number;
  page?: number;
}

export interface CreateNoteData {
  title: string;
  description?: string;
  content?: string;
  url?: string;
  source_name?: string;
  type: 'notes' | 'academic';
  faculty?: string;
  facultyCode?: string;
  unit_id?: string;
  categories?: string[];
  authors?: string[];
}

// Get all notes with filters
export const getAllNotes = async (filters: NotesFilters = {}): Promise<PaginatedResponse<Note>> => {
  const params: Record<string, string> = {};
  
  if (filters.faculty && filters.faculty !== 'all') {
    params.faculty = filters.faculty;
  }
  if (filters.type && filters.type !== 'all') {
    params.type = filters.type;
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

  const response = await apiGet<PaginatedResponse<Note>>('/notes', params);
  return response;
};

// Get all notes for a unit
export const getNotesByUnit = async (
  unitId: string,
  topic?: string
): Promise<Note[]> => {
  let endpoint = `/notes/unit/${unitId}`;
  if (topic) {
    endpoint += `?topic=${encodeURIComponent(topic)}`;
  }
  
  const response = await apiGet<{ notes: Note[] }>(endpoint);
  return response.notes;
};

// Get note by ID
export const getNoteById = async (noteId: string): Promise<Note> => {
  const response = await apiGet<{ note: Note }>(`/notes/${noteId}`);
  return response.note;
};

// Create new note
export const createNote = async (noteData: CreateNoteData): Promise<Note> => {
  const response = await apiPost<{ note: Note }>('/notes', noteData);
  return response.note;
};

// Get topics for a unit
export const getUnitTopics = async (unitId: string): Promise<string[]> => {
  const response = await apiGet<{ topics: string[] }>(`/notes/unit/${unitId}/topics`);
  return response.topics;
};

// Upload notes
export const uploadNotes = async (
  unitId: string,
  file: File,
  topic?: string
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  if (topic) {
    formData.append('topic', topic);
  }
  
  const response = await apiUpload<FileUploadResponse>(`/notes/unit/${unitId}/upload/`, formData);
  return response;
};

// Update note
export const updateNote = async (
  noteId: string,
  data: { title?: string; content?: string; topic?: string; description?: string; categories?: string[] }
): Promise<Note> => {
  const response = await apiPut<{ note: Note }>(`/notes/${noteId}`, data);
  return response.note;
};

// Delete note
export const deleteNote = async (noteId: string): Promise<void> => {
  await apiDelete(`/notes/${noteId}`);
};

// Search notes
export const searchNotes = async (query: string, filters?: Omit<NotesFilters, 'search'>): Promise<Note[]> => {
  const params: Record<string, string> = { search: query };
  
  if (filters?.faculty && filters.faculty !== 'all') {
    params.faculty = filters.faculty;
  }
  if (filters?.type && filters.type !== 'all') {
    params.type = filters.type;
  }
  if (filters?.sort) {
    params.sort = filters.sort;
  }
  if (filters?.limit) {
    params.limit = filters.limit.toString();
  }

  const response = await apiGet<{ notes: Note[] }>('/notes/search', params);
  return response.notes;
};

// Get trending notes
export const getTrendingNotes = async (limit: number = 10): Promise<Note[]> => {
  const response = await apiGet<{ notes: Note[] }>('/notes/trending', { limit: limit.toString() });
  return response.notes;
};

// Get related notes
export const getRelatedNotes = async (noteId: string, limit: number = 5): Promise<Note[]> => {
  const response = await apiGet<{ notes: Note[] }>(`/notes/${noteId}/related`, { limit: limit.toString() });
  return response.notes;
};