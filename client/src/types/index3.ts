// User types
export interface User {
    id?: string;
    userId: string;
    name: string;
    email?: string;
    role?: string;
    isOnline?: boolean;
    faculty?: string;
    lastActive?: string;
    avatar?: string;
  }
  
  export interface AuthResponse {
    success: boolean;
    token: string;
    expiresIn: string;
    user: User;
  }
  
  // Room participant types
  export interface RoomParticipant {
    user_id: string;
    user_name: string;
    status: 'active' | 'idle' | 'away';
    joined_at: string;
    left_at?: string;
  }
  
  // Room resource types
  export interface RoomResource {
    resource_id?: string;
    type: 'link' | 'document' | 'pastpaper' | 'note' | 'flashcard' | 'quiz';
    title: string;
    url?: string;
    added_by: string;
    added_at: string;
  }
  
  // Chat message types
  export interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    timestamp: string;
    type: 'text' | 'file' | 'system' | 'question' | 'ai';
    likes?: number;
    replies?: ChatMessage[];
    attachmentUrl?: string;
    attachmentType?: string;
  }
  
  // Revision room types
  export interface RevisionRoom {
    id: string;
    _id: string;
    name: string;
    description?: string;
    facultyCode?: string;
    faculty?: string;
    unit_id: string;
    unit_code: string;
    unitName?: string;
    topic: string;
    created_by: string;
    created_at: string;
    is_active: boolean;
    current_focus?: string;
    participants: RoomParticipant[];
    resources?: RoomResource[];
    memberCount?: number;
    activeMembers?: number;
    isPrivate?: boolean;
    tags?: string[];
    sessionActive?: boolean;
    papers?: string[];
    chatMessages?: ChatMessage[];
    faculty_code?: string;
  }
  
  // Faculty types
  export interface Faculty {
    id: string;
    name: string;
    code: string;
    color: string;
  }
  
  // Poll types
  export interface PollOption {
    id: string;
    text: string;
    votes: number;
  }
  
  export interface Poll {
    id: string;
    question: string;
    options: PollOption[];
    createdBy: string;
    createdAt: string;
    expiresAt?: string;
    isActive: boolean;
    totalVotes: number;
    roomId: string;
  }
  
  // API response types
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }
  
  // Study material types
  export interface FlashcardSet {
    id: string;
    title: string;
    description: string;
    createdBy: string;
    createdAt: string;
    cardCount: number;
    tags: string[];
    faculty: string;
    unitId: string;
    unitName: string;
    isPublic: boolean;
  }
  
  export interface StudyNote {
    id: string;
    title: string;
    content: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    isPublic: boolean;
    likes: number;
    unitId: string;
    faculty: string;
  }
  
  export interface Quiz {
    id: string;
    title: string;
    description: string;
    timeLimit: number;
    questionCount: number;
    difficulty: string;
    topic: string;
    createdBy: string;
    createdAt: string;
    unitId: string;
    faculty: string;
  }
  
  export interface StudyQuestion {
    id: string;
    question: string;
    answer?: string;
    explanation?: string;
    options?: string[];
    correctOption?: number;
    difficulty: string;
    topic: string;
    source: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
    unitId: string;
    faculty: string;
  }