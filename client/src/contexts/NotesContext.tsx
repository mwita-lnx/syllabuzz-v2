// src/contexts/NotesContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useReducer } from 'react';
import toast from 'react-hot-toast';
import { apiGet, apiPost, apiDelete } from '../services/api';
import { useAuth } from './AuthContext';
import {
  Note,
  Reference,
  Highlight,
  Bookmark,
  NotesContextType,
  NotesState,
  NotesAction,
  PaginatedResponse,
  ApiResponse
} from '../types';

// Initial state
const initialState: NotesState = {
  notes: [],
  filteredNotes: [],
  isLoading: true,
  currentNote: null,
  currentReferences: [],
  currentHighlights: [],
  currentBookmarks: [],
  searchQuery: '',
  selectedFaculty: 'all',
  selectedType: 'all',
  selectedSort: 'recent'
};

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_NOTES: 'SET_NOTES',
  SET_FILTERED_NOTES: 'SET_FILTERED_NOTES',
  SET_CURRENT_NOTE: 'SET_CURRENT_NOTE',
  SET_REFERENCES: 'SET_REFERENCES',
  SET_HIGHLIGHTS: 'SET_HIGHLIGHTS',
  SET_BOOKMARKS: 'SET_BOOKMARKS',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_SELECTED_FACULTY: 'SET_SELECTED_FACULTY',
  SET_SELECTED_TYPE: 'SET_SELECTED_TYPE',
  SET_SELECTED_SORT: 'SET_SELECTED_SORT',
  RESET_FILTERS: 'RESET_FILTERS',
  ADD_HIGHLIGHT: 'ADD_HIGHLIGHT',
  REMOVE_HIGHLIGHT: 'REMOVE_HIGHLIGHT',
  ADD_BOOKMARK: 'ADD_BOOKMARK',
  REMOVE_BOOKMARK: 'REMOVE_BOOKMARK'
};

// Reducer function
function notesReducer(state: NotesState, action: NotesAction): NotesState {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ACTIONS.SET_NOTES:
      return { ...state, notes: action.payload };
    case ACTIONS.SET_FILTERED_NOTES:
      return { ...state, filteredNotes: action.payload };
    case ACTIONS.SET_CURRENT_NOTE:
      return { ...state, currentNote: action.payload };
    case ACTIONS.SET_REFERENCES:
      return { ...state, currentReferences: action.payload };
    case ACTIONS.SET_HIGHLIGHTS:
      return { ...state, currentHighlights: action.payload };
    case ACTIONS.SET_BOOKMARKS:
      return { ...state, currentBookmarks: action.payload };
    case ACTIONS.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload };
    case ACTIONS.SET_SELECTED_FACULTY:
      return { ...state, selectedFaculty: action.payload };
    case ACTIONS.SET_SELECTED_TYPE:
      return { ...state, selectedType: action.payload };
    case ACTIONS.SET_SELECTED_SORT:
      return { ...state, selectedSort: action.payload };
    case ACTIONS.RESET_FILTERS:
      return {
        ...state,
        searchQuery: '',
        selectedFaculty: 'all',
        selectedType: 'all',
        selectedSort: 'recent'
      };
    case ACTIONS.ADD_HIGHLIGHT:
      return {
        ...state,
        currentHighlights: [...state.currentHighlights, action.payload]
      };
    case ACTIONS.REMOVE_HIGHLIGHT:
      return {
        ...state,
        currentHighlights: state.currentHighlights.filter(h => h._id !== action.payload)
      };
    case ACTIONS.ADD_BOOKMARK:
      return {
        ...state,
        currentBookmarks: [...state.currentBookmarks, action.payload]
      };
    case ACTIONS.REMOVE_BOOKMARK:
      return {
        ...state,
        currentBookmarks: state.currentBookmarks.filter(b => b._id !== action.payload)
      };
    default:
      return state;
  }
}

// Create context
const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [state, dispatch] = useReducer(notesReducer, initialState);
  
  // Apply filters when dependencies change
  useEffect(() => {
    
    if (state.notes && state.notes.length > 0) {
        applyFilters();
      }
  }, [state.notes, state.selectedFaculty, state.selectedType, state.searchQuery, state.selectedSort]);
  
  // Fetch notes when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes();
    }
  }, [isAuthenticated]);
  
  // Apply filters to notes
  const applyFilters = (): void => {
    
    if (!state.notes) {
        dispatch({ type: ACTIONS.SET_FILTERED_NOTES, payload: [] });
        return;
      }
    let result = [...state.notes];
    
    // Apply faculty filter
    if (state.selectedFaculty !== 'all') {
      result = result.filter(note => note.facultyCode === state.selectedFaculty);
    }
    
    // Apply type filter
    if (state.selectedType !== 'all') {
      result = result.filter(note => note.type === state.selectedType);
    }
    
    // Apply search filter
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      result = result.filter(
        note => 
          note.title.toLowerCase().includes(query) || 
          note.description.toLowerCase().includes(query) ||
          (note.categories && note.categories.some(category => category.toLowerCase().includes(query)))
      );
    }
    
    // Apply sorting
    switch (state.selectedSort) {
      case 'recent':
        result.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
        break;
      case 'relevance':
        result.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
        break;
      case 'az':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'za':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }
    
    dispatch({ type: ACTIONS.SET_FILTERED_NOTES, payload: result });
  };
  
  // Fetch notes from API
  const fetchNotes = async (filters: Record<string, any> = {}): Promise<void> => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.faculty) {
        params.append('faculty', filters.faculty);
      }
      
      if (filters.type) {
        params.append('type', filters.type);
      }
      
      if (filters.query) {
        params.append('query', filters.query);
      }
      
      if (filters.unit_id) {
        params.append('unit_id', filters.unit_id);
      }
      
      if (filters.sort_by) {
        params.append('sort_by', filters.sort_by);
      }
      
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      
      // Call API
      const response = await apiGet<PaginatedResponse<Note>>(`/notes/?${params.toString()}`);
      dispatch({ type: ACTIONS.SET_NOTES, payload: response.items });
      
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes. Please try again.');
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };
  
  // Get note details
  const getNoteDetails = async (noteId: string): Promise<void> => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      // Get note details
      const noteResponse = await apiGet<ApiResponse<Note>>(`/notes/${noteId}`);
      if (noteResponse.status === 'success' && noteResponse.data) {
        dispatch({ type: ACTIONS.SET_CURRENT_NOTE, payload: noteResponse.data });
      }
      
      // Get references
      const referencesResponse = await apiGet<ApiResponse<Reference[]>>(`/notes/references/${noteId}`);
      if (referencesResponse.status === 'success' && referencesResponse.data) {
        dispatch({ type: ACTIONS.SET_REFERENCES, payload: referencesResponse.data });
      }
      
      // Get highlights and bookmarks if authenticated
      if (isAuthenticated) {
        const highlightsResponse = await apiGet<ApiResponse<Highlight[]>>(`/notes/highlights/?note_id=${noteId}`);
        if (highlightsResponse.status === 'success' && highlightsResponse.data) {
          dispatch({ type: ACTIONS.SET_HIGHLIGHTS, payload: highlightsResponse.data });
        }
        
        const bookmarksResponse = await apiGet<ApiResponse<Bookmark[]>>(`/notes/bookmarks/?note_id=${noteId}`);
        if (bookmarksResponse.status === 'success' && bookmarksResponse.data) {
          dispatch({ type: ACTIONS.SET_BOOKMARKS, payload: bookmarksResponse.data });
        }
      }
      
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    } catch (error) {
      console.error('Error fetching note details:', error);
      toast.error('Failed to load note details. Please try again.');
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };
  
  // Add highlight
  const addHighlight = async (noteId: string, highlightData: Partial<Highlight>): Promise<void> => {
    try {
      if (!isAuthenticated) {
        toast.error('Please log in to save highlights.');
        return;
      }
      
      const response = await apiPost<ApiResponse<{ highlight_id: string }>>('/notes/highlights/', {
        note_id: noteId,
        ...highlightData
      });
      
      if (response.status === 'success' && response.data) {
        // Add new highlight to state
        const newHighlight: Highlight = {
          _id: response.data.highlight_id,
          user_id: user?._id || '',
          note_id: noteId,
          pageNumber: highlightData.pageNumber!,
          text: highlightData.text!,
          color: highlightData.color,
          created_at: new Date().toISOString()
        };
        
        dispatch({ type: ACTIONS.ADD_HIGHLIGHT, payload: newHighlight });
        toast.success('Highlight saved successfully.');
      }
    } catch (error) {
      console.error('Error adding highlight:', error);
      toast.error('Failed to save highlight. Please try again.');
    }
  };
  
  // Add bookmark
  const addBookmark = async (noteId: string, bookmarkData: Partial<Bookmark>): Promise<void> => {
    try {
      if (!isAuthenticated) {
        toast.error('Please log in to save bookmarks.');
        return;
      }
      
      const response = await apiPost<ApiResponse<{ bookmark_id: string }>>('/notes/bookmarks/', {
        note_id: noteId,
        ...bookmarkData
      });
      
      if (response.status === 'success' && response.data) {
        // Add new bookmark to state
        const newBookmark: Bookmark = {
          _id: response.data.bookmark_id,
          user_id: user?._id || '',
          note_id: noteId,
          pageNumber: bookmarkData.pageNumber!,
          title: bookmarkData.title || `Bookmark on page ${bookmarkData.pageNumber}`,
          created_at: new Date().toISOString()
        };
        
        dispatch({ type: ACTIONS.ADD_BOOKMARK, payload: newBookmark });
        toast.success('Bookmark saved successfully.');
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
      toast.error('Failed to save bookmark. Please try again.');
    }
  };
  
  // Delete highlight
  const deleteHighlight = async (highlightId: string): Promise<void> => {
    try {
      const response = await apiDelete<ApiResponse<null>>(`/notes/highlights/${highlightId}`);
      
      if (response.status === 'success') {
        dispatch({ type: ACTIONS.REMOVE_HIGHLIGHT, payload: highlightId });
        toast.success('Highlight deleted successfully.');
      }
    } catch (error) {
      console.error('Error deleting highlight:', error);
      toast.error('Failed to delete highlight. Please try again.');
    }
  };
  
  // Delete bookmark
  const deleteBookmark = async (bookmarkId: string): Promise<void> => {
    try {
      const response = await apiDelete<ApiResponse<null>>(`/notes/bookmarks/${bookmarkId}`);
      
      if (response.status === 'success') {
        dispatch({ type: ACTIONS.REMOVE_BOOKMARK, payload: bookmarkId });
        toast.success('Bookmark deleted successfully.');
      }
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast.error('Failed to delete bookmark. Please try again.');
    }
  };
  
  // Upload a new note
  const uploadNote = async (formData: FormData): Promise<string | null> => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const response = await apiPost<ApiResponse<{ note_id: string }>>('/notes/', formData);
      
      if (response.status === 'success' && response.data) {
        // Refresh notes list
        await fetchNotes();
        toast.success('Note uploaded successfully.');
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        return response.data.note_id;
      }
      
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      return null;
    } catch (error) {
      console.error('Error uploading note:', error);
      toast.error('Failed to upload note. Please try again.');
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      return null;
    }
  };
  
  // Helper methods for updating filters
  const setSearchQuery = (query: string): void => {
    dispatch({ type: ACTIONS.SET_SEARCH_QUERY, payload: query });
  };
  
  const setSelectedFaculty = (faculty: string): void => {
    dispatch({ type: ACTIONS.SET_SELECTED_FACULTY, payload: faculty });
  };
  
  const setSelectedType = (type: string): void => {
    dispatch({ type: ACTIONS.SET_SELECTED_TYPE, payload: type });
  };
  
  const setSelectedSort = (sort: string): void => {
    dispatch({ type: ACTIONS.SET_SELECTED_SORT, payload: sort });
  };
  
  const resetFilters = (): void => {
    dispatch({ type: ACTIONS.RESET_FILTERS });
  };
  
  // Context value
  const value: NotesContextType = {
    ...state,
    setSearchQuery,
    setSelectedFaculty,
    setSelectedType,
    setSelectedSort,
    fetchNotes,
    getNoteDetails,
    addHighlight,
    addBookmark,
    deleteHighlight,
    deleteBookmark,
    uploadNote,
    resetFilters
  };
  
  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};

// Custom hook to use the notes context
export const useNotes = (): NotesContextType => {
  const context = useContext(NotesContext);
  
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  
  return context;
};