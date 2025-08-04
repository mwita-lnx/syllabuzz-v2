// src/hooks/useSavedItems.ts
import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { ApiResponse } from '@/types';

interface UseSavedItemsProps {
  type: 'unit' | 'note' | 'pastpaper';
  itemId?: string;
  autoCheck?: boolean;
}

interface SavedItem {
  id: string;
  item_id: string;
  item_type: string;
  tags?: string[];
  notes?: string;
  saved_at: string;
  details?: any;
}

interface UseSavedItemsReturn {
  isBookmarked: boolean;
  savedItemId: string | null;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
  savedItems: SavedItem[];
  toggleBookmark: () => Promise<void>;
  checkBookmarkStatus: () => Promise<void>;
  getSavedItems: (type?: string) => Promise<void>;
  removeSavedItem: (savedItemId: string) => Promise<void>;
}

/**
 * Hook for handling saved items (bookmarks)
 */
export const useSavedItems = ({ 
  type, 
  itemId, 
  autoCheck = true 
}: UseSavedItemsProps): UseSavedItemsReturn => {
  const { isAuthenticated } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [savedItemId, setSavedItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  // Check bookmark status on mount if autoCheck is true
  useEffect(() => {
    if (autoCheck && isAuthenticated && itemId) {
      checkBookmarkStatus();
    }
  }, [isAuthenticated, itemId, autoCheck]);

  /**
   * Check if an item is bookmarked
   */
  const checkBookmarkStatus = useCallback(async () => {
    if (!isAuthenticated || !itemId) return;
    
    try {
      setError(null);
      
      const response = await apiGet<ApiResponse<{ bookmarked: boolean; saved_item_id: string | null }>>
        (`/saved-items/check?type=${type}&item_id=${itemId}`);
      
      if (response.status === 'success' && response.data) {
        setIsBookmarked(response.data.bookmarked);
        setSavedItemId(response.data.saved_item_id);
      } else {
        setError(response.message || 'Error checking bookmark status');
      }
    } catch (err: any) {
      console.error('Error checking bookmark status:', err);
      setError(err.message || 'Failed to check bookmark status');
    }
  }, [isAuthenticated, itemId, type]);

  /**
   * Toggle bookmark status
   */
  const toggleBookmark = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to bookmark items');
      return;
    }
    
    if (!itemId) {
      toast.error('No item selected');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      if (isBookmarked) {
        // Remove bookmark
        const response = await apiPost<ApiResponse<null>>('/saved-items/remove', {
          type,
          item_id: itemId
        });
        
        if (response.status === 'success') {
          setIsBookmarked(false);
          setSavedItemId(null);
          toast.success('Item removed from bookmarks');
        } else {
          throw new Error(response.message || 'Failed to remove bookmark');
        }
      } else {
        // Add bookmark
        const response = await apiPost<ApiResponse<{ saved_item_id: string }>>('/saved-items/add', {
          type,
          item_id: itemId
        });
        
        if (response.status === 'success' && response.data) {
          setIsBookmarked(true);
          setSavedItemId(response.data.saved_item_id);
          toast.success('Item bookmarked successfully');
        } else {
          throw new Error(response.message || 'Failed to bookmark item');
        }
      }
    } catch (err: any) {
      console.error('Error toggling bookmark:', err);
      setError(err.message || 'Failed to update bookmark');
      toast.error(err.message || 'Failed to update bookmark');
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, itemId, type, isBookmarked]);

  /**
   * Get all saved items
   */
  const getSavedItems = useCallback(async (filterType?: string) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const endpoint = filterType 
        ? `/saved-items?type=${filterType}` 
        : '/saved-items';
      
      const response = await apiGet<ApiResponse<SavedItem[]>>(endpoint);
      
      if (response.status === 'success' && response.data) {
        setSavedItems(response.data);
      } else {
        setError(response.message || 'Error fetching saved items');
      }
    } catch (err: any) {
      console.error('Error fetching saved items:', err);
      setError(err.message || 'Failed to fetch saved items');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Remove a saved item
   */
  const removeSavedItem = useCallback(async (id: string) => {
    if (!isAuthenticated) return;
    
    try {
      setError(null);
      
      const response = await apiPost<ApiResponse<null>>('/saved-items/remove', {
        saved_item_id: id
      });
      
      if (response.status === 'success') {
        // Update saved items list
        setSavedItems(prev => prev.filter(item => item.id !== id));
        
        // Update current bookmark status if this is the current item
        if (savedItemId === id) {
          setIsBookmarked(false);
          setSavedItemId(null);
        }
        
        toast.success('Item removed from bookmarks');
      } else {
        throw new Error(response.message || 'Failed to remove saved item');
      }
    } catch (err: any) {
      console.error('Error removing saved item:', err);
      setError(err.message || 'Failed to remove saved item');
      toast.error(err.message || 'Failed to remove saved item');
    }
  }, [isAuthenticated, savedItemId]);

  return {
    isBookmarked,
    savedItemId,
    isSaving,
    isLoading,
    error,
    savedItems,
    toggleBookmark,
    checkBookmarkStatus,
    getSavedItems,
    removeSavedItem
  };
};