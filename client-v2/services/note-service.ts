// src/services/note-service.ts
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from './api';
import { Note, FileUploadResponse } from '../types';

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
  data: { title?: string; content?: string; topic?: string }
): Promise<Note> => {
  const response = await apiPut<{ note: Note }>(`/notes/${noteId}`, data);
  return response.note;
};

// Delete note
export const deleteNote = async (noteId: string): Promise<void> => {
  await apiDelete(`/notes/${noteId}`);
};