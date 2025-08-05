// src/services/revision-room-service.ts
import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { PaginatedResponse } from '../types';
import { RevisionRoom } from '../types/index3';

export interface RevisionRoomFilters {
  faculty?: string;
  unit_id?: string;
  status?: 'active' | 'inactive' | 'all';
  search?: string;
  sort?: 'recent' | 'popular' | 'alphabetical';
  limit?: number;
  page?: number;
}

export interface CreateRevisionRoomData {
  name: string;
  description?: string;
  facultyCode?: string;
  faculty?: string;
  unit_id: string;
  unit_code?: string;
  unitName?: string;
  topic: string;
  tags?: string[];
  isPrivate?: boolean;
}

// Get all revision rooms with filters
export const getAllRevisionRooms = async (filters: RevisionRoomFilters = {}): Promise<PaginatedResponse<RevisionRoom>> => {
  const params: Record<string, string> = {};
  
  if (filters.faculty && filters.faculty !== 'all') {
    params.faculty = filters.faculty;
  }
  if (filters.unit_id) {
    params.unit_id = filters.unit_id;
  }
  if (filters.status && filters.status !== 'all') {
    params.status = filters.status;
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

  const response = await apiGet<PaginatedResponse<RevisionRoom>>('/revision/rooms', params);
  return response;
};

// Get revision room by ID
export const getRevisionRoomById = async (roomId: string): Promise<RevisionRoom> => {
  const response = await apiGet<{ room: RevisionRoom }>(`/revision/rooms/${roomId}`);
  return response.room;
};

// Create new revision room
export const createRevisionRoom = async (roomData: CreateRevisionRoomData): Promise<RevisionRoom> => {
  const response = await apiPost<{ room: RevisionRoom }>('/revision/rooms', roomData);
  return response.room;
};

// Update revision room
export const updateRevisionRoom = async (
  roomId: string,
  data: Partial<CreateRevisionRoomData>
): Promise<RevisionRoom> => {
  const response = await apiPut<{ room: RevisionRoom }>(`/revision/rooms/${roomId}`, data);
  return response.room;
};

// Delete revision room
export const deleteRevisionRoom = async (roomId: string): Promise<void> => {
  await apiDelete(`/revision/rooms/${roomId}`);
};

// Join revision room
export const joinRevisionRoom = async (roomId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiPost<{ success: boolean; message: string }>(`/revision/rooms/${roomId}/join`, {});
  return response;
};

// Leave revision room
export const leaveRevisionRoom = async (roomId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiPost<{ success: boolean; message: string }>(`/revision/rooms/${roomId}/leave`, {});
  return response;
};

// Get room participants
export const getRoomParticipants = async (roomId: string): Promise<any[]> => {
  const response = await apiGet<{ participants: any[] }>(`/revision/rooms/${roomId}/participants`);
  return response.participants;
};

// Search revision rooms
export const searchRevisionRooms = async (query: string, filters?: Omit<RevisionRoomFilters, 'search'>): Promise<RevisionRoom[]> => {
  const params: Record<string, string> = { search: query };
  
  if (filters?.faculty && filters.faculty !== 'all') {
    params.faculty = filters.faculty;
  }
  if (filters?.unit_id) {
    params.unit_id = filters.unit_id;
  }
  if (filters?.status && filters.status !== 'all') {
    params.status = filters.status;
  }
  if (filters?.sort) {
    params.sort = filters.sort;
  }
  if (filters?.limit) {
    params.limit = filters.limit.toString();
  }

  const response = await apiGet<{ rooms: RevisionRoom[] }>('/revision/rooms/search', params);
  return response.rooms;
};

// Get active revision rooms
export const getActiveRevisionRooms = async (limit: number = 10): Promise<RevisionRoom[]> => {
  const response = await apiGet<{ rooms: RevisionRoom[] }>('/revision/rooms/active', { limit: limit.toString() });
  return response.rooms;
};

// Get popular revision rooms
export const getPopularRevisionRooms = async (limit: number = 10): Promise<RevisionRoom[]> => {
  const response = await apiGet<{ rooms: RevisionRoom[] }>('/revision/rooms/popular', { limit: limit.toString() });
  return response.rooms;
};

// Get user's joined rooms
export const getUserJoinedRooms = async (): Promise<RevisionRoom[]> => {
  const response = await apiGet<{ rooms: RevisionRoom[] }>('/revision/rooms/my-rooms');
  return response.rooms;
};

// Get rooms by faculty
export const getRoomsByFaculty = async (facultyCode: string, limit?: number): Promise<RevisionRoom[]> => {
  const params: Record<string, string> = { faculty: facultyCode };
  if (limit) {
    params.limit = limit.toString();
  }
  
  const response = await apiGet<{ rooms: RevisionRoom[] }>('/revision/rooms/faculty', params);
  return response.rooms;
};

// Get rooms by unit
export const getRoomsByUnit = async (unitId: string, limit?: number): Promise<RevisionRoom[]> => {
  const params: Record<string, string> = { unit_id: unitId };
  if (limit) {
    params.limit = limit.toString();
  }
  
  const response = await apiGet<{ rooms: RevisionRoom[] }>('/revision/rooms/unit', params);
  return response.rooms;
};

// Toggle room active status
export const toggleRoomStatus = async (roomId: string): Promise<RevisionRoom> => {
  const response = await apiPut<{ room: RevisionRoom }>(`/revision/rooms/${roomId}/toggle-status`, {});
  return response.room;
};

// Get room analytics
export const getRoomAnalytics = async (roomId: string): Promise<any> => {
  const response = await apiGet<any>(`/revision/rooms/${roomId}/analytics`);
  return response;
};