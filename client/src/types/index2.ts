// Faculty type definition
export interface Faculty {
    id: string;
    name: string;
    code: string;
    color: string;
  }
  
  // Unit type definition (formerly Module)
  export interface Unit {
    _id: string;
    name: string;
    code: string;
    description: string;
    faculty?: string;
    facultyCode?: string;
    keywords?: string[];
    vector_embedding?: number[];
    created_at?: string;
    updated_at?: string;
    
    // Extended properties
    syllabus?: string[];
    prerequisites?: string[];
    instructors?: Instructor[];
    credits?: number;
    level?: string;
  }
  
  // Instructor type definition
  export interface Instructor {
    name: string;
    email: string;
    title?: string;
    department?: string;
  }
  
  // Note type definition (formerly Article)
  export interface Note {
    _id: string;
    title: string;
    description?: string;
    content?: string;
    url: string;
    image_url?: string;
    source_name: string;
    published_at: string;
    updated_at?: string;
    type: 'notes' | 'academic';
    categories?: string[];
    authors?: string[];
    relevance_score?: number;
    vector_embedding?: number[];
    
    // Added properties
    faculty?: string;
    facultyCode?: string;
    unit_id?: string;
    file_path?: string;
  }
  
  // User type definition
  export interface User {
    id: string;
    name: string;
    email: string;
    units?: string[];
    faculty?: string;
    role?: 'student' | 'instructor' | 'admin';
    profile_image?: string;
    bookmarks?: {
      units?: string[];
      notes?: string[];
      papers?: string[];
    };
  }
  
  // Search result type
  export interface SearchResult {
    type: 'unit' | 'note' | 'paper';
    id: string;
    title: string;
    description?: string;
    relevance: number;
    faculty?: string;
    facultyCode?: string;
  }
  
  // Interaction type
  export interface Interaction {
    user_id: string;
    item_id: string;
    item_type: 'unit' | 'note' | 'paper';
    action: 'view' | 'like' | 'bookmark' | 'download';
    timestamp: string;
    unit_id?: string;
  }
  
  // App config type
  export interface AppConfig {
    faculties: Faculty[];
    theme: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
      background: string;
      surface: string;
      textPrimary: string;
      textSecondary: string;
    };
  }