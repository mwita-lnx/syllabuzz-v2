import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  BookmarkPlus, 
  ChevronRight, 
  Code, 
  FileText, 
  Newspaper, 
  Search, 
  Star, 
  TrendingUp, 
  User,
  Menu,
  X,
  Calendar,
  Clock,
  ThumbsUp,
  ExternalLink,
  Home,
  Sparkles,
  BookA,
  GraduationCap,
  BookCopy
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Define types for our data models - renamed Module to Unit
interface Unit {
  _id: string;
  name: string;
  code: string;
  description: string;
  keywords?: string[];
  vector_embedding?: number[];
  created_at?: string;
  updated_at?: string;
}

// Renamed Article to Note
interface Note {
  _id: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  image_url?: string;
  source_name: string;
  published_at: string;
  updated_at?: string;
  type: 'notes' | 'academic'; // Changed 'news' to 'notes'
  categories?: string[];
  authors?: string[];
  pdf_url?: string;
  arxiv_id?: string;
  relevance_score?: number;
  vector_embedding?: number[];
}

interface User {
  id: string;
  name: string;
  email: string;
  units: string[]; // Changed from modules to units
}

// Updated tab types to include revision room
type TabType = 'home' | 'units' | 'notes' | 'trending' | 'search' | 'unit' | 'revision';
type InteractionType = 'view' | 'like' | 'bookmark';

// Props interface for NoteCard component (renamed from ArticleCard)
interface NoteCardProps {
  note: Note;
  unitId?: string;
}

// Props interface for UnitCard component (renamed from ModuleCard)
interface UnitCardProps {
  unit: Unit;
  onClick: (unitId: string) => void;
}

// Animation component for transitions
const FadeIn = ({ children }) => {
  return (
    <div 
      className="animate-fadeIn opacity-0" 
      style={{ 
        animation: 'fadeIn 0.5s ease forwards',
      }}
    >
      {children}
    </div>
  );
};

// Enhanced version of the Landing component with dark mode and fun font
const Landing: React.FC = () => {
  // State management with TypeScript types - renamed variables for units and notes
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [units, setUnits] = useState<Unit[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [trendingNotes, setTrendingNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
  const [unitRecommendations, setUnitRecommendations] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Past Paper state (from the second file)
  const [pastPapers, setPastPapers] = useState<any[]>([]);
  
  // Dark mode theme colors - kept the same
  const darkColors =  {
    primary: '#FF6B6B',         // Coral Red (Energetic, attention-grabbing)
    secondary: '#4ECDC4',       // Turquoise (Fresh, modern)
    tertiary: '#FFD166',        // Golden Yellow (Warm, inviting)
    quaternary: '#6A0572',      // Deep Purple (Rich contrast)
    background: '#FFFFFF',      // Crisp White (Clean background)
    surface: '#F7F9FC',         // Ice Blue (Subtle surface variation)
    elevatedSurface: '#FFFFFF', // White for elevated surfaces
    error: '#FF5252',           // Bright Red (Error)
    warning: '#FFB100',         // Golden Orange (Warning)
    success: '#06D6A0',         // Mint Green (Success)
    textPrimary: '#2D3748',     // Deep Blue-Gray (Main text)
    textSecondary: '#4A5568',   // Medium Gray (Secondary text)
    textMuted: '#718096',       // Soft Gray (Hints, placeholders)
    border: '#E2E8F0',          // Soft Gray border
    cardHover: '#EDF2F7',       // Lightest Blue on hover
    gradientOverlay: 'rgba(74, 85, 104, 0.05)', // Subtle overlay
    shadow: 'rgba(0, 0, 0, 0.1)',               // Light shadow
    focus: '#3182CE',           // Blue Focus (Accessibility)
    accent1: '#9B5DE5',         // Lavender (Playful accent)
    accent2: '#00BBF9',         // Sky Blue (Fresh accent)
  };
  
  // Fetch initial data
  useEffect(() => {
    fetchUnits();
    fetchNotes();
    fetchTrending();
    fetchPastPapers();
    
    // Mock user for demo
    setUser({
      id: '1234',
      name: 'John Doe',
      email: 'john@example.com',
      units: []
    });
    
    // Add custom CSS for animations and custom font
    const style = document.createElement('style');
    style.innerHTML = `

      @import url('https://fonts.googleapis.com/css2?family=DynaPuff:wght@400;600;800&display=swap');
       @import url('https://fonts.googleapis.com/css2?family=Kablammo:wght@400;600;800&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Righteous&display=swap');
      
      /* Apply custom fonts */
 body {
  font-family: 'DynaPuff';
  background-color: ${darkColors.background};
  color: ${darkColors.textPrimary};
}

h1, h2, h3, .title-font {
  font-family: 'DynaPuff', sans-serif;
  font-weight: 700;
}
      /* Custom animations */
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slideIn {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      @keyframes glowPulse {
        0% { box-shadow: 0 0 5px ${darkColors.primary}80; }
        50% { box-shadow: 0 0 15px ${darkColors.primary}; }
        100% { box-shadow: 0 0 5px ${darkColors.primary}80; }
      }
      
      .animate-fadeIn {
        animation: fadeIn 0.5s ease forwards;
      }
      
      .animate-slideIn {
        animation: slideIn 0.5s ease forwards;
      }
      
      .hover-scale {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .hover-scale:hover {
        transform: scale(1.03);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      }
      
      .pulse {
        animation: pulse 2s infinite;
      }
      
      .glow-effect {
        animation: glowPulse 2s infinite;
      }
    `;
    document.head.appendChild(style);
    
    // Force dark mode for whole app
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = darkColors.background;
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Fetch units (renamed from modules)
  const fetchUnits = async (): Promise<void> => {
    try {
      const response = await fetch('/api/units');
      const data = await response.json();
      setUnits(data.units); // Changed from modules to units
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching units:', error);
      setIsLoading(false);
    }
  };
  
  // Fetch notes (renamed from articles)
  const fetchNotes = async (category: string | null = null): Promise<void> => {
    try {
      let url = '/api/notes'; // Changed from articles to notes
      if (category) {
        url += `?category=${category}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setNotes(data.notes); // Changed from articles to notes
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };
  
  // Fetch trending notes (renamed from trending articles)
  const fetchTrending = async (): Promise<void> => {
    try {
      const response = await fetch('/api/trending');
      const data = await response.json();
      setTrendingNotes(data.trending); // Changed from trending articles to trending notes
    } catch (error) {
      console.error('Error fetching trending notes:', error);
    }
  };
  
  // Fetch past papers (new function)
  const fetchPastPapers = async (): Promise<void> => {
    try {
      const response = await fetch('/api/pastpapers');
      const data = await response.json();
      setPastPapers(data.pastpapers);
    } catch (error) {
      console.error('Error fetching past papers:', error);
    }
  };
  
  // Search notes (renamed from search articles)
  const handleSearch = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.notes); // Changed from articles to notes
      setActiveTab('search');
    } catch (error) {
      console.error('Error searching notes:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Load unit details (renamed from module details)
  const loadUnitDetails = async (unitId: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Fetch unit details
      const unitResponse = await fetch(`/api/units/${unitId}`);
      const unitData = await unitResponse.json();
      setCurrentUnit(unitData.unit);
      
      // Fetch unit recommendations
      const recommendationsResponse = await fetch(`/api/units/${unitId}/recommendations`);
      const recommendationsData = await recommendationsResponse.json();
      setUnitRecommendations(recommendationsData.recommendations);
      
      setActiveTab('unit');
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading unit details:', error);
      setIsLoading(false);
    }
  };
  
  // Record user interaction with a note (renamed from article)
  const recordInteraction = async (
    noteId: string, 
    type: InteractionType = 'view', 
    unitId: string | null = null
  ): Promise<void> => {
    if (!user) return;
    
    try {
      await fetch('/api/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          note_id: noteId, // Changed from article_id to note_id
          unit_id: unitId, // Changed from module_id to unit_id
          type: type
        })
      });
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Note Card Component (renamed from Article Card)
  const NoteCard: React.FC<NoteCardProps> = ({ note, unitId }) => {
    const recordView = (): void => {
      recordInteraction(note._id, 'view', unitId || null);
      window.open(note.url, '_blank');
    };
    
    const recordLike = (e: React.MouseEvent): void => {
      e.stopPropagation();
      recordInteraction(note._id, 'like', unitId || null);
    };
    
    const recordBookmark = (e: React.MouseEvent): void => {
      e.stopPropagation();
      recordInteraction(note._id, 'bookmark', unitId || null);
    };
    
    const hasImage = note.image_url && note.image_url.trim() !== '';
    
    return (
      <div className="h-full transition-all hover-scale">
        <Card 
          className="h-full border hover:shadow-lg cursor-pointer transition-all duration-300" 
          onClick={recordView}
          style={{ 
            backgroundColor: darkColors.surface, 
            borderColor: note.type === 'academic' ? darkColors.primary : darkColors.secondary,
            borderWidth: '2px'
          }}
        >
          {hasImage && (
            <div className="w-full h-40 overflow-hidden">
              <img 
                src={note.image_url || '/api/placeholder/400/320'} 
                alt={note.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/api/placeholder/400/320';
                }}
              />
            </div>
          )}
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <Badge 
                variant={note.type === 'academic' ? 'secondary' : 'default'} 
                className="mb-2"
                style={{ 
                  backgroundColor: note.type === 'academic' ? darkColors.primary : darkColors.secondary,
                  color: darkColors.textPrimary
                }}
              >
                {note.type === 'academic' ? 'Academic' : 'Notes'}
              </Badge>
              {note.relevance_score && (
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1"
                  style={{ borderColor: darkColors.tertiary, color: darkColors.tertiary }}
                >
                  <Star className="w-3 h-3" /> 
                  {(note.relevance_score * 100).toFixed(0)}%
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg line-clamp-2 font-bold title-font" style={{ color: darkColors.textPrimary }}>
              {note.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs" style={{ color: darkColors.textSecondary }}>
              <Calendar className="w-3 h-3" /> {formatDate(note.published_at)}
              <span className="mx-1">•</span>
              <span>{note.source_name}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm line-clamp-3" style={{ color: darkColors.textSecondary }}>
              {note.description || 'No description available.'}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={recordLike}
              className="hover:bg-opacity-20 transition-colors"
              style={{ color: darkColors.quaternary }}
            >
              <ThumbsUp className="w-4 h-4 mr-1" /> Like
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={recordBookmark}
              className="hover:bg-opacity-20 transition-colors"
              style={{ color: darkColors.primary }}
            >
              <BookmarkPlus className="w-4 h-4 mr-1" /> Save
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="hover:bg-opacity-20 transition-colors"
              style={{ color: darkColors.secondary }}
            >
              <a href={note.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" /> View
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  // Unit Card Component (renamed from Module Card)
  const UnitCard: React.FC<UnitCardProps> = ({ unit, onClick }) => (
    <div className="h-full transition-all hover-scale">
      <Card 
        className="h-full border hover:shadow-lg cursor-pointer transition-all duration-300" 
        onClick={() => onClick(unit._id)}
        style={{ 
          backgroundColor: darkColors.surface, 
          borderColor: darkColors.primary, 
          borderLeftWidth: '4px' 
        }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bold title-font" style={{ color: darkColors.primary }}>
            <BookA className="w-5 h-5" />
            {unit.name } - {unit.code}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm line-clamp-3" style={{ color: darkColors.textSecondary }}>{unit.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center text-sm" style={{ color: darkColors.textSecondary }}>
            <FileText className="w-4 h-4 mr-1" />
            <span>{unit.keywords?.length || 0} keywords</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="hover:bg-opacity-20"
            style={{ color: darkColors.primary }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
  
  // Past Paper Card Component (new component)
  const PastPaperCard = ({ pastPaper }) => (
    <div className="h-full transition-all hover-scale">
      <Card 
        className="h-full border hover:shadow-lg cursor-pointer transition-all duration-300" 
        onClick={() => window.open(pastPaper.file_path, '_blank')}
        style={{ 
          backgroundColor: darkColors.surface, 
          borderColor: darkColors.tertiary, 
          borderLeftWidth: '4px' 
        }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bold title-font" style={{ color: darkColors.tertiary }}>
            <FileText className="w-5 h-5" />
            {pastPaper.title}
          </CardTitle>
          <CardDescription className="flex items-center gap-1 text-xs" style={{ color: darkColors.textSecondary }}>
            <Calendar className="w-3 h-3" /> {pastPaper.year} • {pastPaper.exam_type}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm" style={{ color: darkColors.textSecondary }}>
            Unit: {pastPaper.unit_code} - {pastPaper.unit_name}
          </p>
          <p className="text-sm" style={{ color: darkColors.textSecondary }}>
            Semester: {pastPaper.semester} • {pastPaper.date}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Badge style={{ backgroundColor: darkColors.tertiary, color: darkColors.textPrimary }}>
            {pastPaper.stream}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            className="hover:bg-opacity-20"
            style={{ color: darkColors.tertiary }}
          >
            <ExternalLink className="w-4 h-4 mr-1" /> View
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
  
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: darkColors.background }}>
      {/* Header */}
      <header 
        className="border-b sticky top-0 z-10" 
        style={{ 
          backgroundColor: darkColors.surface,
          borderColor: darkColors.border,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}
      >
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 animate-slideIn">
            <BookOpen className="w-6 h-6" style={{ color: darkColors.primary }} />
            <h1 className="text-xl font-bold title-font" style={{ color: darkColors.primary }}>CS Content Hub</h1>
          </div>
          
          <div className="hidden md:block w-1/3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" style={{ color: darkColors.textSecondary }} />
              <Input
                type="text"
                placeholder="Search notes and papers..."
                className="w-full pl-10 border-2 focus:ring-2 focus:border-transparent transition-all"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: darkColors.primary,
                  borderRadius: '0.5rem',
                  color: darkColors.textPrimary
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ color: darkColors.textPrimary }}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            
            <div className="hidden md:flex items-center gap-2">
              <Avatar className="border-2" style={{ borderColor: darkColors.primary }}>
                <AvatarFallback style={{ backgroundColor: darkColors.primary, color: darkColors.textPrimary }}>
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium" style={{ color: darkColors.textPrimary }}>{user?.name || 'Guest'}</span>
            </div>
          </div>
        </div>
        
        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" style={{ color: darkColors.textSecondary }} />
            <Input
              type="text"
              placeholder="Search notes and papers..."
              className="w-full pl-10 border-2 focus:ring-2 focus:border-transparent transition-all"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: darkColors.primary,
                borderRadius: '0.5rem',
                color: darkColors.textPrimary
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div 
            className="md:hidden border-t p-4 flex flex-col gap-2 animate-fadeIn" 
            style={{ 
              backgroundColor: darkColors.surface,
              borderColor: darkColors.border 
            }}
          >
            <Button 
              variant="ghost" 
              className="justify-start hover:bg-opacity-20 transition-colors" 
              onClick={() => {setActiveTab('home'); setIsMenuOpen(false);}}
              style={{ color: activeTab === 'home' ? darkColors.primary : darkColors.textPrimary }}
            >
              <Home className="w-4 h-4 mr-2" /> Home
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start hover:bg-opacity-20 transition-colors" 
              onClick={() => {setActiveTab('units'); setIsMenuOpen(false);}}
              style={{ color: activeTab === 'units' ? darkColors.primary : darkColors.textPrimary }}
            >
              <BookA className="w-4 h-4 mr-2" /> Units
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start hover:bg-opacity-20 transition-colors" 
              onClick={() => {setActiveTab('notes'); setIsMenuOpen(false);}}
              style={{ color: activeTab === 'notes' ? darkColors.primary : darkColors.textPrimary }}
            >
              <BookCopy className="w-4 h-4 mr-2" /> Notes
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start hover:bg-opacity-20 transition-colors" 
              onClick={() => {setActiveTab('trending'); setIsMenuOpen(false);}}
              style={{ color: activeTab === 'trending' ? darkColors.primary : darkColors.textPrimary }}
            >
              <TrendingUp className="w-4 h-4 mr-2" /> Trending
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start hover:bg-opacity-20 transition-colors" 
              onClick={() => {setActiveTab('revision'); setIsMenuOpen(false);}}
              style={{ color: activeTab === 'revision' ? darkColors.primary : darkColors.textPrimary }}
            >
              <GraduationCap className="w-4 h-4 mr-2" /> Revision Room
            </Button>
            <Separator className="my-2" style={{ backgroundColor: darkColors.border }} />
            <div className="flex items-center gap-2 p-2">
              <Avatar className="border-2" style={{ borderColor: darkColors.primary }}>
                <AvatarFallback style={{ backgroundColor: darkColors.primary, color: darkColors.textPrimary }}>
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium" style={{ color: darkColors.textPrimary }}>{user?.name || 'Guest'}</p>
                <p className="text-xs" style={{ color: darkColors.textSecondary }}>{user?.email || ''}</p>
              </div>
            </div>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation (Desktop) */}
          <aside className="hidden md:block w-64 space-y-2 animate-slideIn">
            <Button 
              variant={activeTab === 'home' ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors font-medium"
              onClick={() => setActiveTab('home')}
              style={{ 
                backgroundColor: activeTab === 'home' ? darkColors.primary : 'transparent',
                color: activeTab === 'home' ? darkColors.textPrimary : darkColors.textPrimary
              }}
            >
              <Home className="w-4 h-4 mr-2" /> Home
            </Button>
            <Button 
              variant={activeTab === 'units' ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors font-medium"
              onClick={() => setActiveTab('units')}
              style={{ 
                backgroundColor: activeTab === 'units' ? darkColors.primary : 'transparent',
                color: activeTab === 'units' ? darkColors.textPrimary : darkColors.textPrimary
              }}
            >
              <BookA className="w-4 h-4 mr-2" /> Units
            </Button>
            <Button 
  variant={activeTab === 'notes' ? 'default' : 'ghost'} 
  className="w-full justify-start transition-colors font-medium"
  onClick={() => setActiveTab('notes')}
  style={{ 
    backgroundColor: activeTab === 'notes' ? darkColors.primary : 'transparent',
    color: activeTab === 'notes' ? darkColors.textPrimary : darkColors.textPrimary
  }}
>
  <BookCopy className="w-4 h-4 mr-2" /> Notes
</Button>
<Button 
  variant={activeTab === 'trending' ? 'default' : 'ghost'} 
  className="w-full justify-start transition-colors font-medium"
  onClick={() => {
    setActiveTab('trending');
    fetchTrending();
  }}
  style={{ 
    backgroundColor: activeTab === 'trending' ? darkColors.primary : 'transparent',
    color: activeTab === 'trending' ? darkColors.textPrimary : darkColors.textPrimary
  }}
>
  <TrendingUp className="w-4 h-4 mr-2" /> Trending
</Button>
<Button 
  variant={activeTab === 'revision' ? 'default' : 'ghost'} 
  className="w-full justify-start transition-colors font-medium"
  onClick={() => setActiveTab('revision')}
  style={{ 
    backgroundColor: activeTab === 'revision' ? darkColors.primary : 'transparent',
    color: activeTab === 'revision' ? darkColors.textPrimary : darkColors.textPrimary
  }}
>
  <GraduationCap className="w-4 h-4 mr-2" /> Revision Room
</Button>

<Separator className="my-4" style={{ backgroundColor: darkColors.border }} />

<div 
  className="p-4 rounded-lg border-2" 
  style={{ 
    borderColor: darkColors.primary, 
    backgroundColor: darkColors.surface,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
  }}
>
  <h3 className="font-bold mb-2 title-font" style={{ color: darkColors.primary }}>Units</h3>
  <div className="space-y-1 overflow-auto " style={{ maxHeight: '20rem' }}>
    {units.map((unit, index) => (
      <Button 
        key={unit._id} 
        variant="ghost" 
        className="w-full justify-start transition-colors font-medium"
        onClick={() => loadUnitDetails(unit._id)}
        style={{ color: darkColors.textPrimary }}
      >
        {unit.code}
      </Button>
    ))}               
  </div>
</div>
</aside>

{/* Main Content Area */}
<div className="flex-1">
{/* Home Tab */}
{activeTab === 'home' && (
  <FadeIn>
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold title-font" style={{ color: darkColors.primary }}>
            Welcome to CS Content Hub
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="hover-scale transition-all duration-300">
            <Card 
              className="bg-gradient-to-br text-white h-full glow-effect" 
              style={{ 
                background: `linear-gradient(135deg, ${darkColors.primary}CC, ${darkColors.quaternary})`,
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center title-font">
                  <BookA className="w-5 h-5 mr-2" /> Explore CS Units
                </CardTitle>
                <CardDescription className="text-white/90">
                  Discover computer science topics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Browse our collection of CS units to find learning resources tailored to your interests.</p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="secondary" 
                  onClick={() => setActiveTab('units')}
                  className="font-medium"
                  style={{ backgroundColor: 'white', color: darkColors.primary }}
                >
                  Browse Units
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="hover-scale transition-all duration-300">
            <Card 
              className="bg-gradient-to-br text-white h-full glow-effect"
              style={{ 
                background: `linear-gradient(135deg, ${darkColors.secondary}CC, ${darkColors.primary})`,
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center title-font">
                  <BookCopy className="w-5 h-5 mr-2" /> Latest Notes
                </CardTitle>
                <CardDescription className="text-white/90">
                  Stay updated with CS notes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Get the latest notes and academic papers in computer science and technology.</p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="secondary" 
                  onClick={() => setActiveTab('notes')}
                  className="font-medium"
                  style={{ backgroundColor: 'white', color: darkColors.secondary }}
                >
                  Read Notes
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="hover-scale transition-all duration-300">
            <Card 
              className="bg-gradient-to-br text-white h-full glow-effect"
              style={{ 
                background: `linear-gradient(135deg, ${darkColors.tertiary}CC, ${darkColors.quaternary})`,
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center title-font">
                  <GraduationCap className="w-5 h-5 mr-2" /> Revision Room
                </CardTitle>
                <CardDescription className="text-white/90">
                  Practice with past papers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Access past exam papers, practice questions, and revision materials to boost your grades.</p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="secondary" 
                  onClick={() => setActiveTab('revision')}
                  className="font-medium"
                  style={{ backgroundColor: 'white', color: darkColors.tertiary }}
                >
                  Start Revising
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
      
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold title-font" style={{ color: darkColors.secondary }}>Recent Notes</h2>
          <Button 
            variant="link" 
            onClick={() => setActiveTab('notes')}
            style={{ color: darkColors.secondary }}
          >
            View All →
          </Button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-full" style={{ backgroundColor: darkColors.surface }}>
                <CardHeader>
                  <Skeleton className="h-4 w-16 mb-2" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
                  <Skeleton className="h-6 w-full mb-2" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
                  <Skeleton className="h-4 w-28" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {notes.slice(0, 6).map((note, index) => (
              <div key={note._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                <NoteCard note={note} />
              </div>
            ))}
          </div>
        )}
      </section>
      
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold title-font" style={{ color: darkColors.primary }}>Featured Units</h2>
          <Button 
            variant="link" 
            onClick={() => setActiveTab('units')}
            style={{ color: darkColors.primary }}
          >
            View All →
          </Button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-full" style={{ backgroundColor: darkColors.surface }}>
                <CardHeader>
                  <Skeleton className="h-6 w-full mb-2" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-4 w-24" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {units.slice(0, 6).map((unit, index) => (
              <div key={unit._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                <UnitCard 
                  unit={unit} 
                  onClick={loadUnitDetails} 
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  </FadeIn>
)}

{/* Units Tab */}
{activeTab === 'units' && (
  <FadeIn>
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold title-font" style={{ color: darkColors.primary }}>CS Units</h2>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-full" style={{ backgroundColor: darkColors.surface }}>
              <CardHeader>
                <Skeleton className="h-6 w-full mb-2" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-24" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {units.map((unit, index) => (
            <div key={unit._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
              <UnitCard 
                unit={unit} 
                onClick={loadUnitDetails} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  </FadeIn>
)}

{/* Notes Tab */}
{activeTab === 'notes' && (
  <FadeIn>
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold title-font" style={{ color: darkColors.secondary }}>Notes & Papers</h2>
        
        <Tabs defaultValue="all" className="w-64">
          <TabsList className="w-full" style={{ backgroundColor: `${darkColors.secondary}33` }}>
            <TabsTrigger 
              value="all" 
              onClick={() => fetchNotes()}
              className="data-[state=active]:text-white transition-all"
              style={{ 
                backgroundColor: "transparent",
                "--tw-bg-opacity": "1",
                "--secondary": darkColors.secondary,
                "--tw-text-opacity": "1",
                "--tw-white": darkColors.textPrimary,
                "[data-state=active]:backgroundColor": darkColors.secondary
              }}
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              onClick={() => fetchNotes('technology')}
              className="data-[state=active]:text-white transition-all"
              style={{ 
                backgroundColor: "transparent",
                "--tw-bg-opacity": "1",
                "--secondary": darkColors.secondary,
                "--tw-text-opacity": "1",
                "--tw-white": darkColors.textPrimary,
                "[data-state=active]:backgroundColor": darkColors.secondary
              }}
            >
              Notes
            </TabsTrigger>
            <TabsTrigger 
              value="academic" 
              onClick={() => fetchNotes('academic')}
              className="data-[state=active]:text-white transition-all"
              style={{ 
                backgroundColor: "transparent",
                "--tw-bg-opacity": "1",
                "--secondary": darkColors.secondary,
                "--tw-text-opacity": "1",
                "--tw-white": darkColors.textPrimary,
                "[data-state=active]:backgroundColor": darkColors.secondary
              }}
            >
              Academic
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {notes.length === 0 ? (
        <Alert 
          className="border-2 animate-pulse" 
          style={{ 
            backgroundColor: darkColors.surface, 
            borderColor: darkColors.secondary,
            color: darkColors.textPrimary
          }}
        >
          <AlertTitle className="font-bold title-font">No notes found</AlertTitle>
          <AlertDescription>
            Try a different category or check back later for new content.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {notes.map((note, index) => (
            <div key={note._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
              <NoteCard note={note} />
            </div>
          ))}
        </div>
      )}
    </div>
  </FadeIn>
)}

{/* Trending Tab */}
{activeTab === 'trending' && (
  <FadeIn>
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 title-font" style={{ color: darkColors.tertiary }}>
          <Sparkles className="w-6 h-6" /> Trending Content
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchTrending}
          className="border-2 font-medium transition-all"
          style={{ borderColor: darkColors.tertiary, color: darkColors.tertiary }}
        >
          Refresh
        </Button>
      </div>
      
      {trendingNotes.length === 0 ? (
        <Alert 
          className="border-2 animate-pulse" 
          style={{ 
            backgroundColor: darkColors.surface, 
            borderColor: darkColors.tertiary,
            color: darkColors.textPrimary
          }}
        >
          <AlertTitle className="font-bold title-font">No trending notes yet</AlertTitle>
          <AlertDescription>
            Check back later for trending content based on user interactions.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trendingNotes.map((note, index) => (
            <div key={note._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
              <NoteCard note={note} />
            </div>
          ))}
        </div>
      )}
    </div>
  </FadeIn>
)}

{/* Revision Room Tab (New) */}
{activeTab === 'revision' && (
  <FadeIn>
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 title-font" style={{ color: darkColors.tertiary }}>
          <GraduationCap className="w-6 h-6" /> Revision Room
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchPastPapers}
          className="border-2 font-medium transition-all"
          style={{ borderColor: darkColors.tertiary, color: darkColors.tertiary }}
        >
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="hover-scale transition-all duration-300">
          <Card 
            className="bg-gradient-to-br text-white h-full" 
            style={{ 
              background: `linear-gradient(135deg, ${darkColors.tertiary}CC, ${darkColors.quaternary})`,
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center title-font">
                <FileText className="w-5 h-5 mr-2" /> Past Papers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Access previous exam papers for all units.</p>
            </CardContent>
            <CardFooter>
              <Badge className="bg-white text-black">
                {pastPapers.length} Papers Available
              </Badge>
            </CardFooter>
          </Card>
        </div>

        <div className="hover-scale transition-all duration-300">
          <Card 
            className="bg-gradient-to-br text-white h-full" 
            style={{ 
              background: `linear-gradient(135deg, ${darkColors.secondary}CC, ${darkColors.tertiary})`,
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center title-font">
                <BookCopy className="w-5 h-5 mr-2" /> Practice Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Solve practice questions organized by topic.</p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="secondary"
                className="font-medium"
                style={{ backgroundColor: 'white', color: darkColors.secondary }}
              >
                Start Practice
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="hover-scale transition-all duration-300">
          <Card 
            className="bg-gradient-to-br text-white h-full" 
            style={{ 
              background: `linear-gradient(135deg, ${darkColors.primary}CC, ${darkColors.tertiary})`,
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center title-font">
                <Clock className="w-5 h-5 mr-2" /> Timed Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Test your knowledge under exam conditions.</p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="secondary"
                className="font-medium"
                style={{ backgroundColor: 'white', color: darkColors.primary }}
              >
                Take Quiz
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <h3 className="text-xl font-bold mb-4 title-font" style={{ color: darkColors.tertiary }}>Past Papers</h3>
      
      {pastPapers.length === 0 ? (
        <Alert 
          className="border-2 animate-pulse" 
          style={{ 
            backgroundColor: darkColors.surface, 
            borderColor: darkColors.tertiary,
            color: darkColors.textPrimary
          }}
        >
          <AlertTitle className="font-bold title-font">No past papers available</AlertTitle>
          <AlertDescription>
            Check back later for past exam papers and practice materials.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pastPapers.map((paper, index) => (
            <div key={index} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
              <PastPaperCard pastPaper={paper} />
            </div>
          ))}
        </div>
      )}
    </div>
  </FadeIn>
)}

{/* Search Results Tab */}
{activeTab === 'search' && (
  <FadeIn>
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold title-font" style={{ color: darkColors.tertiary }}>Search Results</h2>
        <p style={{ color: darkColors.textSecondary }} className="flex items-center">
          <Search className="w-4 h-4 mr-1" />
          Found <span className="font-bold mx-1">{searchResults.length}</span> results for "{searchQuery}"
        </p>
      </div>
      
      {isSearching ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-full" style={{ backgroundColor: darkColors.surface }}>
              <CardHeader>
                <Skeleton className="h-4 w-16 mb-2" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
                <Skeleton className="h-6 w-full mb-2" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
                <Skeleton className="h-4 w-28" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" style={{ backgroundColor: `${darkColors.textSecondary}40` }} />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : searchResults.length === 0 ? (
        <Alert 
          className="border-2 animate-pulse" 
          style={{ 
            backgroundColor: darkColors.surface, 
            borderColor: darkColors.tertiary,
            color: darkColors.textPrimary
          }}
        >
          <AlertTitle className="font-bold title-font">No results found</AlertTitle>
          <AlertDescription>
            Try a different search term or browse our content categories.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {searchResults.map((note, index) => (
            <div key={note._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
              <NoteCard note={note} />
            </div>
          ))}
        </div>
      )}
    </div>
  </FadeIn>
)}

{/* Unit Detail Tab */}
{activeTab === 'unit' && currentUnit && (
  <FadeIn>
    <div className="space-y-6">
      <Button 
        variant="outline" 
        size="sm" 
        className="mb-4 border-2 transition-all flex items-center gap-1"
        onClick={() => setActiveTab('units')}
        style={{ borderColor: darkColors.primary, color: darkColors.primary }}
      >
        ← Back to Units
      </Button>
      
      <div 
        className="rounded-lg border-2 p-6 transition-all hover:shadow-md" 
        style={{ 
          backgroundColor: darkColors.surface,
          borderColor: darkColors.primary, 
          borderLeftWidth: '6px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
        }}
      >
        <h1 className="text-2xl font-bold mb-2 title-font" style={{ color: darkColors.primary }}>{currentUnit.name}</h1>
        <p style={{ color: darkColors.textSecondary }} className="mb-4">{currentUnit.description}</p>
        
        {currentUnit.keywords && currentUnit.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {currentUnit.keywords.map((keyword, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="animate-fadeIn border-2 font-medium"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  borderColor: darkColors.primary,
                  color: darkColors.primary
                }}
              >
                {keyword}
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 title-font" style={{ color: darkColors.secondary }}>
          <BookOpen className="w-5 h-5" /> Recommended Notes
        </h2>
        
        {unitRecommendations.length === 0 ? (
          <Alert 
            className="border-2 animate-pulse" 
            style={{ 
              backgroundColor: darkColors.surface, 
              borderColor: darkColors.secondary,
              color: darkColors.textPrimary
            }}
          >
            <AlertTitle className="font-bold title-font">No recommendations yet</AlertTitle>
            <AlertDescription>
              We're still finding relevant content for this unit. Check back soon!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {unitRecommendations.map((note, index) => (
              <div key={note._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                <NoteCard 
                  note={note} 
                  unitId={currentUnit._id} 
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </FadeIn>
)}
</div>
</div>
</main>

{/* Footer */}
<footer 
className="border-t mt-8" 
style={{ 
  backgroundColor: darkColors.surface,
  borderColor: darkColors.border
}}
>
<div className="container mx-auto px-4 py-6">
  <div className="flex flex-col md:flex-row justify-between items-center">
    <div className="flex items-center gap-2 mb-4 md:mb-0">
      <BookOpen className="w-5 h-5" style={{ color: darkColors.primary }} />
      <span className="font-bold title-font" style={{ color: darkColors.primary }}>CS Content Hub</span>
    </div>
    
    <div className="text-sm" style={{ color: darkColors.textSecondary }}>
      © {new Date().getFullYear()} CS Content Hub. All rights reserved.
    </div>
  </div>
</div>
</footer>
</div>
);
};

export default Landing;