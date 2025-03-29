// roomService.ts - Service for room-related API calls

import apiClient from './api-backend';
import { 
  RevisionRoom, 
  RoomParticipant, 
  RoomResource, 
  ChatMessage, 
  ApiResponse 
} from '../types/index3';

/**
 * Room service for handling room-related API calls
 */
const roomService = {
  /**
   * Get all active revision rooms with optional filtering
   */
  getRooms: async (params?: {
    page?: number,
    limit?: number,
    search?: string,
    faculty?: string
  }): Promise<ApiResponse<RevisionRoom[]>> => {
    return apiClient.get<RevisionRoom[]>('/rooms', params as Record<string, string>);
  },
  
  /**
   * Get rooms by unit ID
   */
  getRoomsByUnit: async (unitId: string): Promise<ApiResponse<RevisionRoom[]>> => {
    return apiClient.get<RevisionRoom[]>(`/rooms/unit/${unitId}`);
  },
  
  /**
   * Get rooms where the current user is a participant
   */
  getMyRooms: async (): Promise<ApiResponse<RevisionRoom[]>> => {
    return apiClient.get<RevisionRoom[]>('/rooms/my-rooms');
  },
  
  /**
   * Get a specific revision room by ID
   */
  getRoom: async (roomId: string): Promise<ApiResponse<RevisionRoom>> => {
    return apiClient.get<RevisionRoom>(`/rooms/${roomId}`);
  },
  
  /**
   * Create a new revision room
   */
  createRoom: async (roomData: {
    name: string;
    description?: string;
    unit_id: string;
    unit_code: string;
    faculty_code?: string;
    topic: string;
    user_name?: string;
    tags?: string[];
  }): Promise<ApiResponse<RevisionRoom>> => {
    return apiClient.post<RevisionRoom>('/rooms', roomData);
  },
  
  /**
   * Update a revision room
   */
  updateRoom: async (
    roomId: string,
    updates: {
      name?: string;
      description?: string;
      topic?: string;
      current_focus?: string;
      tags?: string[];
    }
  ): Promise<ApiResponse<RevisionRoom>> => {
    return apiClient.put<RevisionRoom>(`/rooms/${roomId}`, updates);
  },
  
  /**
   * Close a revision room
   */
  closeRoom: async (roomId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/rooms/${roomId}`);
  },
  
  /**
   * Get participants in a room
   */
  getRoomParticipants: async (roomId: string): Promise<ApiResponse<RoomParticipant[]>> => {
    return apiClient.get<RoomParticipant[]>(`/rooms/${roomId}/participants`);
  },
  
  /**
   * Get resources in a room
   */
  getRoomResources: async (roomId: string): Promise<ApiResponse<RoomResource[]>> => {
    return apiClient.get<RoomResource[]>(`/rooms/${roomId}/resources`);
  },
  
  /**
   * Add a resource to a room
   */
  addResource: async (
    roomId: string,
    resource: {
      type: 'link' | 'document' | 'pastpaper' | 'note' | 'flashcard' | 'quiz';
      resource_id?: string;
      title: string;
      url?: string;
      user_name?: string;
    }
  ): Promise<ApiResponse<RoomResource>> => {
    return apiClient.post<RoomResource>(`/rooms/${roomId}/resources`, resource);
  },

  /**
   * Get messages in a room
   */
  getRoomMessages: async (
    roomId: string,
    params?: {
      page?: number;
      limit?: number;
      before?: string; // timestamp
    }
  ): Promise<ApiResponse<ChatMessage[]>> => {
    return apiClient.get<ChatMessage[]>(
      `/rooms/${roomId}/messages`,
      params as Record<string, string>
    );
  },

  /**
   * Send a message to a room
   */
  sendMessage: async (
    roomId: string,
    message: {
      content: string;
      type?: 'text' | 'file' | 'system' | 'question';
      attachmentUrl?: string;
      attachmentType?: string;
    }
  ): Promise<ApiResponse<ChatMessage>> => {
    return apiClient.post<ChatMessage>(`/rooms/${roomId}/messages`, message);
  }
};

export default roomService;