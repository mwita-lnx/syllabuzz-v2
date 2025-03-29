// src/types/index.ts

// User types
export interface User {
    _id: string;
    email: string;
    name: string;
    role: 'student' | 'instructor';
  }
  
  export interface AuthResponse {
    user: User;
    tokens: {
      access: string;
      refresh: string;
    };
  }
  
  // Course types
  export interface Course {
    _id: string;
    id: string;
    name: string;
    code: string;
    description: string;
    instructor_id: string;
    created_at: string;
    updated_at: string;
  }
  
  // Unit types
  export interface Unit {
    _id: string;
    name: string;
    code: string;
    description: string;
    course_id: string;
    created_at: string;
    updated_at: string;
  }
  
  // Question types
  export interface Question {
    _id: string;
    text: string;
    unit_id: string;
    source_type: 'exam' | 'cat';
    source_id: string;
    year?: string;
    embedding?: number[];
    related_sections?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    frequency: number;
    group_id?: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface QuestionGroup {
    group_id: string;
    questions: Question[];
    count: number;
  }
  
  export interface QuestionHighlight {
    note_id: string;
    title: string;
    highlights: string[];
    page_numbers: number[];
  }
  
  // Note types
  export interface Note {
    _id: string;
    title: string;
    content: string;
    unit_id: string;
    topic?: string;
    pdf_path?: string;
    page_numbers?: number[];
    embeddings?: number[];
    section_id?: string;
    created_at: string;
    updated_at: string;
  }
  
  // Search types
  export interface SearchResult {
    id: string;
    text?: string;
    title?: string;
    highlight?: string;
    similarity: number;
    source_type?: 'exam' | 'cat';
    year?: string;
    topic?: string;
  }
  
  // File upload response
  export interface FileUploadResponse {
    message: string;
    questions_count?: number;
    notes_count?: number;
  }
  
  // API response types
  export interface ApiResponse<T> {
    data?: T;
    error?: string;
    status: number;
  }