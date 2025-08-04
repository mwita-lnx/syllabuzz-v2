// src/services/search-service.ts
import { apiPost } from './api';
import { SearchResult } from '../types';

// Search questions
export const searchQuestions = async (
  query: string,
  options?: {
    sourceType?: 'all' | 'exam' | 'cat';
    minSimilarity?: number;
    minFrequency?: number;
  }
): Promise<SearchResult[]> => {
  const data = {
    query,
    ...options
  };
  
  const response = await apiPost<{ results: SearchResult[] }>('/questions/search/', data);
  return response.results;
};

// Search notes
export const searchNotes = async (
  query: string,
  options?: {
    sourceType?: 'all' | 'exam' | 'cat';
    minSimilarity?: number;
    topic?: string;
  }
): Promise<SearchResult[]> => {
  const data = {
    query,
    ...options
  };
  
  const response = await apiPost<{ results: SearchResult[] }>('/notes/search/', data);
  return response.results;
};