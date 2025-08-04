// src/services/question-service.ts
import { apiGet, apiPost, apiDelete } from './api';
import { Question, QuestionGroup, QuestionHighlight } from '../types';

// Get questions by unit
export const getQuestionsByUnit = async (
  unitId: string,
  options?: {
    groupBy?: boolean;
    sourceType?: 'exam' | 'cat';
    year?: string;
    minFrequency?: number;
  }
): Promise<{ questions?: Question[]; groups?: QuestionGroup[] }> => {
  let endpoint = `/questions/unit/${unitId}`;
  const params = new URLSearchParams();
  
      if (options) {
    if (options.groupBy) {
      params.append('group_by', 'true');
    }
    if (options.sourceType) {
      params.append('source_type', options.sourceType);
    }
    if (options.year) {
      params.append('year', options.year);
    }
    if (options.minFrequency) {
      params.append('min_frequency', options.minFrequency.toString());
    }
  }
  
  const queryString = params.toString();
  if (queryString) {
    endpoint += `?${queryString}`;
  }
  
  return apiGet(endpoint);
};

// Get question by ID
export const getQuestionById = async (questionId: string): Promise<Question> => {
  const response = await apiGet<{ question: Question }>(`/questions/${questionId}`);
  return response.question;
};

// Get similar questions
export const getSimilarQuestions = async (questionId: string): Promise<Question[]> => {
  const response = await apiGet<{ similar_questions: Question[] }>(`/questions/${questionId}/similar/`);
  return response.similar_questions;
};

// Get question highlights (related notes)
export const getQuestionHighlights = async (questionId: string): Promise<QuestionHighlight[]> => {
  const response = await apiGet<{ highlights: QuestionHighlight[] }>(`/questions/${questionId}/highlights/`);
  return response.highlights;
};

// Get frequent questions
export const getFrequentQuestions = async (minFrequency: number = 2): Promise<Question[]> => {
  const response = await apiGet<{ frequent_questions: Question[] }>(`/questions/frequent?min_frequency=${minFrequency}`);
  return response.frequent_questions;
};

// Delete question
export const deleteQuestion = async (questionId: string): Promise<void> => {
  await apiDelete(`/questions/${questionId}`);
};

// Analyze question
export const analyzeQuestion = async (
  text: string
): Promise<{ topics: string[]; difficulty: 'easy' | 'medium' | 'hard' }> => {
  const response = await apiPost<{ analysis: { topics: string[]; difficulty: 'easy' | 'medium' | 'hard' } }>(
    '/questions/analyze/',
    { text }
  );
  return response.analysis;
};