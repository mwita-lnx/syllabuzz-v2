// src/types/index.ts

// User types
export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  profile?: UserProfile;
  email_verified?: boolean;
  created_at?: string;
  last_login?: string;
}

export interface UserProfile {
  faculty?: string;
  institution?: string;
  bio?: string;
  avatar_url?: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

// Note types
export interface Note {
  _id: string;
  title: string;
  description: string;
  url?: string;
  file_path?: string;
  source_name?: string;
  published_at: string;
  type: 'notes' | 'academic';
  faculty?: string;
  facultyCode?: string;
  unit_id?: string;
  unit_name?: string;
  unit_code?: string;
  categories?: string[];
  author?: string;
  institution?: string;
  total_pages?: number;
  created_at?: string;
  created_by?: string;
  image_url?: string;
  relevance_score?: number;
  metadata?: NoteMetadata;
  references?: Reference[];
}

export interface NoteMetadata {
  citation?: string;
  doi?: string;
  keywords?: string[];
  [key: string]: any;
}

export interface Reference {
  _id: string;
  note_id: string;
  pageNumber: number;
  text: string;
  title?: string;
  type?: 'citation' | 'footnote' | 'section' | 'bibliography';
  created_at?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface Highlight {
  _id: string;
  user_id: string;
  note_id: string;
  pageNumber: number;
  text: string;
  color?: string;
  created_at?: string;
}

export interface Bookmark {
  _id: string;
  user_id: string;
  note_id: string;
  pageNumber: number;
  title?: string;
  created_at?: string;
}

// Unit types
export interface Unit {
  _id: string;
  name: string;
  code: string;
  description?: string;
  faculty?: string;
  facultyCode?: string;
  keywords?: string[];
  created_at?: string;
  created_by?: string;
  syllabus?: string[];
  prerequisites?: string[];
  instructors?: Instructor[];
  credits?: number;
  level?: string;
}

export interface Instructor {
  name: string;
  email?: string;
}

// Course type
export interface Course {
  _id: string;
  name: string;
  code: string;
  description?: string;
  faculty?: string;
  facultyCode?: string;
  created_at?: string;
  created_by?: string;
}

// Faculty type
export interface Faculty {
  id: string;
  name: string;
  code: string;
  color: string;
}

// Past Paper types
export interface PastPaper {
  _id: string;
  title: string;
  unit_id: string;
  unit_name: string;
  unit_code: string;
  year: string;
  exam_type: string;
  semester?: string;
  stream?: string;
  date?: string;
  time?: string;
  session?: string;
  file_path: string;
  created_at?: string;
  updated_at?: string;
  faculty?: string;
  faculty_code?: string;
}

// Search types
export interface SearchResult {
  note_id: string;
  page: number;
  text: string;
  title?: string;
  similarity_score: number;
}

export interface SearchResponse {
  status: string;
  query: string;
  results_count: number;
  results: (Note & { match?: { text: string; page: number; similarity_score: number } })[];
}

// Rating types
export interface Rating {
  _id: string;
  user_id: string;
  item_id: string;
  item_type: 'note' | 'pastpaper';
  rating: number;
  comment?: string;
  created_at?: string;
  updated_at?: string;
}

// Saved Item types
export interface SavedItem {
  _id: string;
  user_id: string;
  item_id: string;
  item_type: 'note' | 'pastpaper' | 'unit';
  created_at?: string;
}

// API Response types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  error?: string;
}

export interface FileUploadResponse {
  file_id: string;
  filename: string;
  url: string;
}

// Question types
export interface Question {
  _id: string;
  text: string;
  type: string;
  difficulty?: string;
  source_type: string;
  year?: string;
  frequency: number;
  related_sections?: string[];
  unit_id?: string;
  faculty?: string;
  created_at?: string;
}

export interface QuestionGroup {
  _id: string;
  title: string;
  questions: Question[];
  unit_id: string;
  created_at?: string;
}

export interface QuestionHighlight {
  _id: string;
  user_id: string;
  question_id: string;
  text: string;
  color?: string;
  created_at?: string;
}

export interface PaginatedResponse<T> {
  status: 'success' | 'error';
  items: T[];
  notes: T[];
  data: T[];
  units: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Component Props types
export interface NoteCardProps {
  note: Note;
  unitId?: string;
  typeColor?: string;
}

export interface PastPaperCardProps {
  paper: PastPaper;
  facultyColor?: string;
}

export interface FacultySelectorProps {
  faculties: Faculty[];
  selectedFaculty: string;
  onSelect: (faculty: string) => void;
}

export interface PDFViewerProps {
  pdfUrl: string;
  initialPage?: number;
  references?: Reference[];
  onSaveHighlight?: (highlightData: {
    pageNumber: number;
    text: string;
    color?: string;
  }) => void;
  onSaveBookmark?: (bookmarkData: {
    pageNumber: number;
    title?: string;
  }) => void;
}

// State management types
export interface NotesState {
  notes: Note[];
  filteredNotes: Note[];
  isLoading: boolean;
  currentNote: Note | null;
  currentReferences: Reference[];
  currentHighlights: Highlight[];
  currentBookmarks: Bookmark[];
  searchQuery: string;
  selectedFaculty: string;
  selectedType: string;
  selectedSort: string;
}

export interface NotesAction {
  type: string;
  payload?: any;
}

export interface NotesContextType extends NotesState {
  setSearchQuery: (query: string) => void;
  setSelectedFaculty: (faculty: string) => void;
  setSelectedType: (type: string) => void;
  setSelectedSort: (sort: string) => void;
  fetchNotes: (filters?: Record<string, any>) => Promise<void>;
  getNoteDetails: (noteId: string) => Promise<void>;
  addHighlight: (noteId: string, highlightData: Partial<Highlight>) => Promise<void>;
  addBookmark: (noteId: string, bookmarkData: Partial<Bookmark>) => Promise<void>;
  deleteHighlight: (highlightId: string) => Promise<void>;
  deleteBookmark: (bookmarkId: string) => Promise<void>;
  uploadNote: (formData: FormData) => Promise<string | null>;
  resetFilters: () => void;
}