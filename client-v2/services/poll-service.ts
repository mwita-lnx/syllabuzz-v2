// pollService.ts - Service for poll-related API calls

import apiClient from './api-backend';
import { Poll, ApiResponse, PollOption } from '../types/index3';

/**
 * Poll service for handling poll-related API calls
 */
const pollService = {
  /**
   * Get polls for a specific room
   */
  getRoomPolls: async (roomId: string, includeInactive: boolean = false): Promise<ApiResponse<Poll[]>> => {
    return apiClient.get<Poll[]>(`/polls/room/${roomId}`, { 
      roomId, 
      includeInactive: includeInactive ? 'true' : 'false' 
    });
  },
  
  /**
   * Get a specific poll by ID
   */
  getPoll: async (pollId: string): Promise<ApiResponse<Poll>> => {
    return apiClient.get<Poll>(`/polls/${pollId}`);
  },
  
  /**
   * Create a new poll
   */
  createPoll: async (pollData: {
    roomId: string;
    question: string;
    options: Omit<PollOption, 'votes'>[];
    expiresIn?: number; // minutes
  }): Promise<ApiResponse<Poll>> => {
    return apiClient.post<Poll>('/polls', pollData);
  },
  
  /**
   * Vote in a poll
   */
  votePoll: async (pollId: string, optionId: string): Promise<ApiResponse<Poll>> => {
    return apiClient.post<Poll>(`/polls/${pollId}/vote`, { optionId });
  },
  
  /**
   * Close a poll early
   */
  closePoll: async (pollId: string): Promise<ApiResponse<Poll>> => {
    return apiClient.put<Poll>(`/polls/${pollId}/close`, {});
  },
  
  /**
   * Get active poll for a room (if any)
   */
  getActivePoll: async (roomId: string): Promise<ApiResponse<Poll>> => {
    return apiClient.get<Poll>(`/polls/active`, { roomId });
  }
};

export default pollService;