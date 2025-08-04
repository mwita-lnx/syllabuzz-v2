// src/services/savedItemsService.ts
import { apiGet, apiPost, apiPut } from './api';

// Types
export interface SavedItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'unit' | 'note' | 'pastpaper';
  saved_at: string;
  tags: string[];
  notes: string;
  details?: {
    name?: string;
    code?: string;
    faculty?: string;
    title?: string;
    type?: string;
    year?: string;
    exam_type?: string;
  };
}

export interface SavedItemsResponse {
  status: string;
  data: SavedItem[];
  count: number;
}

export interface SaveItemRequest {
  type: 'unit' | 'note' | 'pastpaper';
  item_id: string;
  tags?: string[];
  notes?: string;
}

export interface CheckSavedResponse {
  status: string;
  data: {
    bookmarked: boolean;
    saved_item_id: string | null;
  };
}

export interface UpdateSavedItemRequest {
  tags?: string[];
  notes?: string;
}

// Get all saved items
export const getSavedItems = async (
  type?: string,
  tags?: string
): Promise<SavedItemsResponse> => {
  const params: Record<string, string> = {};
  
  if (type) params.type = type;
  if (tags) params.tags = tags;
  
  return apiGet<SavedItemsResponse>('/saved-items/', params);
};

// Save a new item
export const saveItem = async (data: SaveItemRequest) => {
  return apiPost('/saved-items/add/', data);
};

// Remove a saved item
export const removeItem = async (type: string, item_id: string) => {
  return apiPost('/saved-items/remove/', { type, item_id });
};

// Check if an item is saved
export const checkSavedStatus = async (
  type: string,
  item_id: string
): Promise<CheckSavedResponse> => {
  return apiGet<CheckSavedResponse>('/saved-items/check/', { type, item_id });
};

// Update a saved item (tags or notes)
export const updateSavedItem = async (
  saved_item_id: string,
  data: UpdateSavedItemRequest
) => {
  return apiPut(`/saved-items/update/${saved_item_id}`, data);
};