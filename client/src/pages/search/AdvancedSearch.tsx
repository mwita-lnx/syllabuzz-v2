// src/pages/search/AdvancedSearchPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  FileText, 
  BookOpen, 
  BookCopy, 
  GraduationCap, 
  Video, 
  Calendar,
  Tag,
  Filter,
  X,
  Bookmark,
  ChevronRight,
  Clock,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  User,
  LayoutGrid,
  List
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { MainLayout } from '@/components/MainLayout';
import SearchComponent from '@/components/SearchComponent';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import toast from 'react-hot-toast';

// Type definitions
interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'note' | 'pastpaper' | 'tutorial' | 'question' | 'unit';
  faculty?: string;
  facultyCode?: string;
  author?: string;
  date?: string;
  tags?: string[];
  year?: string;
  semester?: string;
  examType?: string;
  difficulty?: string;
  views?: number;
  rating?: number;
  duration?: number;
  matchScore: number;
  matchSnippet?: string;
  unitCode?: string;
  unitName?: string;
  thumbnailUrl?: string;
}

interface SearchFilters {
  types: string[];
  faculties: string[];
  years: string[];
  difficulty: string[];
  tags: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

// Transition animation component
const FadeIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  return (
    <div 
      className="animate-fadeIn opacity-0" 
      style={{ 
        animation: 'fadeIn 0.5s ease forwards',
        animationDelay: `${delay}s`
      }}
    >
      {children}
    </div>
  );
};

const AdvancedSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse query params
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  const initialType = queryParams.get('type') || 'all';
  
  // State management
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearchComplete, setIsSearchComplete] = useState<boolean>(false);
  const [resultCount, setResultCount] = useState<Record<string, number>>({
    all: 0,
    note: 0,
    pastpaper: 0,
    tutorial: 0,
    question: 0,
    unit: 0
  });
  const [activeTab, setActiveTab] = useState<string>(initialType);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    types: [],
    faculties: [],
    years: [],
    difficulty: [],
    tags: [],
    dateRange: {
      start: '',
      end: ''
    }
  });
  
  // Theme colors
  const colors = {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    tertiary: '#FFD166',
    quaternary: '#6A0572',
    background: '#FFFFFF',
    surface: '#F7F9FC',
    textPrimary: '#2D3748',
    textSecondary: '#4A5568',
    textMuted: '#718096',
    border: '#E2E8F0',
  };
  
  // Load search based on URL params
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
    loadRecentSearches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);
  
  // Filter results when activeTab or sortBy changes
  useEffect(() => {
    applyTabAndSortFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sortBy, searchResults]);
  
  // Load recent searches from localStorage
  const loadRecentSearches = () => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  };
  
  // Save a search term to recent searches
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    // Get existing searches, remove duplicates, and add new one at the beginning
    let searches = [...recentSearches];
    searches = searches.filter(s => s !== query);
    searches.unshift(query);
    
    // Keep only the most recent 5 searches
    if (searches.length > 5) {
      searches = searches.slice(0, 5);
    }
    
    // Update state and localStorage
    setRecentSearches(searches);
    localStorage.setItem('recentSearches', JSON.stringify(searches));
  };
  
  // Perform the search operation
  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setIsSearchComplete(false);
    
    try {
      // In a real implementation, this would call your search API
      // For now, let's simulate a network request
      setTimeout(() => {
        // Generate mock search results
        const mockResults = generateMockResults(query);
        
        // Set results and update counts
        setSearchResults(mockResults);
        updateResultCounts(mockResults);
        
        // Update recent searches
        saveRecentSearch(query);
        
        // Generate suggestions based on the query
        setSearchSuggestions(generateSearchSuggestions(query));
        
        setIsLoading(false);
        setIsSearchComplete(true);
      }, 1500);
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle search event
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    navigate(`/search?q=${encodeURIComponent(query)}&type=${activeTab}`);
    performSearch(query);
  };
  
  // Update result counts by type
  const updateResultCounts = (results: SearchResult[]) => {
    const counts = {
      all: results.length,
      note: 0,
      pastpaper: 0,
      tutorial: 0,
      question: 0,
      unit: 0
    };
    
    // Count results by type
    results.forEach(result => {
      if (counts[result.type] !== undefined) {
        counts[result.type]++;
      }
    });
    
    setResultCount(counts);
  };
  
  // Apply tab filters and sorting
  const applyTabAndSortFilters = () => {
    let filtered = [...searchResults];
    
    // Apply type filter based on active tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(result => result.type === activeTab);
    }
    
    // Apply custom filters
    if (filters.faculties.length > 0) {
      filtered = filtered.filter(result => 
        !result.facultyCode || filters.faculties.includes(result.facultyCode)
      );
    }
    
    if (filters.types.length > 0) {
      filtered = filtered.filter(result => filters.types.includes(result.type));
    }
    
    if (filters.years.length > 0) {
      filtered = filtered.filter(result => 
        !result.year || filters.years.includes(result.year)
      );
    }
    
    if (filters.difficulty.length > 0) {
      filtered = filtered.filter(result => 
        !result.difficulty || filters.difficulty.includes(result.difficulty)
      );
    }
    
    if (filters.tags.length > 0) {
      filtered = filtered.filter(result => 
        !result.tags || result.tags.some(tag => filters.tags.includes(tag))
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'relevance':
        filtered.sort((a, b) => b.matchScore - a.matchScore);
        break;
      case 'newest':
        filtered.sort((a, b) => {
          if (!a.date || !b.date) return 0;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        break;
      case 'oldest':
        filtered.sort((a, b) => {
          if (!a.date || !b.date) return 0;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        break;
      case 'popular':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }
    
    setFilteredResults(filtered);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      types: [],
      faculties: [],
      years: [],
      difficulty: [],
      tags: [],
      dateRange: {
        start: '',
        end: ''
      }
    });
  };
  
  // Toggle a filter value
  const toggleFilter = (category: keyof SearchFilters, value: string) => {
    if (category === 'dateRange') return;
    
    setFilters(prev => {
      const currentValues = [...prev[category]];
      const index = currentValues.indexOf(value);
      
      if (index >= 0) {
        currentValues.splice(index, 1);
      } else {
        currentValues.push(value);
      }
      
      return {
        ...prev,
        [category]: currentValues
      };
    });
  };
  
  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Format duration
  const formatDuration = (minutes?: number): string => {
    if (!minutes) return '';
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  // Get icon for result type
  const getResultTypeIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <FileText className="w-5 h-5" style={{ color: colors.secondary }} />;
      case 'pastpaper':
        return <BookCopy className="w-5 h-5" style={{ color: colors.primary }} />;
      case 'tutorial':
        return <Video className="w-5 h-5" style={{ color: colors.tertiary }} />;
      case 'question':
        return <BookOpen className="w-5 h-5" style={{ color: colors.quaternary }} />;
      case 'unit':
        return <GraduationCap className="w-5 h-5" style={{ color: '#6366f1' }} />;
      default:
        return <Search className="w-5 h-5" />;
    }
  };
  
  // Get color for result type
  const getResultTypeColor = (type: string): string => {
    switch (type) {
      case 'note':
        return colors.secondary;
      case 'pastpaper':
        return colors.primary;
      case 'tutorial':
        return colors.tertiary;
      case 'question':
        return colors.quaternary;
      case 'unit':
        return '#6366f1';
      default:
        return colors.textPrimary;
    }
  };
  
  // Get badge label for result type
  const getResultTypeLabel = (type: string): string => {
    switch (type) {
      case 'note':
        return 'Note';
      case 'pastpaper':
        return 'Past Paper';
      case 'tutorial':
        return 'Tutorial';
      case 'question':
        return 'Question';
      case 'unit':
        return 'Unit';
      default:
        return type;
    }
  };
  
  // Get difficulty color
  const getDifficultyColor = (difficulty?: string): string => {
    if (!difficulty) return colors.textSecondary;
    
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return '#4ECDC4'; // teal
      case 'intermediate':
        return '#FFD166'; // yellow
      case 'advanced':
        return '#FF6B6B'; // red
      case 'easy':
        return '#4ECDC4'; // teal
      case 'medium':
        return '#FFD166'; // yellow
      case 'hard':
        return '#FF6B6B'; // red
      default:
        return colors.textSecondary;
    }
  };
  
  // Navigate to result
  const navigateToResult = (result: SearchResult) => {
    switch (result.type) {
      case 'note':
        navigate(`/notes/${result.id}`);
        break;
      case 'pastpaper':
        navigate(`/pastpapers/${result.id}`);
        break;
      case 'tutorial':
        navigate(`/tutorials/${result.id}`);
        break;
      case 'question':
        navigate(`/pastpapers/questions/${result.id}`);
        break;
      case 'unit':
        navigate(`/units/${result.id}`);
        break;
    }
  };
  
  // Bookmark a result
  const bookmarkResult = (result: SearchResult, event: React.MouseEvent) => {
    event.stopPropagation();
    toast.success(`Added ${result.title} to bookmarks`);
  };
  
  // Render a result card (grid view)
  const renderResultCard = (result: SearchResult, index: number) => (
    <FadeIn key={result.id} delay={index * 0.05}>
      <Card 
        className="h-full hover:shadow-md transition-all cursor-pointer"
        onClick={() => navigateToResult(result)}
        style={{
          borderLeftColor: getResultTypeColor(result.type),
          borderLeftWidth: '4px'
        }}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <Badge style={{
              backgroundColor: getResultTypeColor(result.type),
              color: result.type === 'tutorial' ? colors.textPrimary : 'white'
            }}>
              {getResultTypeLabel(result.type)}
            </Badge>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={(e) => bookmarkResult(result, e)}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-lg line-clamp-2 mt-1">
            {result.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result.matchSnippet && (
            <div className="mb-3 p-2 bg-yellow-50 border-l-4 border-yellow-200 text-sm">
              <div dangerouslySetInnerHTML={{ __html: result.matchSnippet }} />
            </div>
          )}
          
          {result.description && (
            <p className="text-sm line-clamp-2 mb-3" style={{ color: colors.textSecondary }}>
              {result.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-1 mb-2">
            {result.tags && result.tags.map((tag, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className="text-xs"
                style={{ borderColor: getResultTypeColor(result.type), color: getResultTypeColor(result.type) }}
              >
                {tag}
              </Badge>
            ))}
            
            {result.difficulty && (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ borderColor: getDifficultyColor(result.difficulty), color: getDifficultyColor(result.difficulty) }}
              >
                {result.difficulty}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs" style={{ color: colors.textSecondary }}>
            <div className="flex items-center gap-1">
              {result.author && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {result.author}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {result.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {formatDate(result.date)}
                </span>
              )}
              
              {result.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDuration(result.duration)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="w-full">
            <div className="flex justify-between items-center">
              <div style={{ color: colors.textSecondary }}>
                {result.unitCode && result.unitName && (
                  <Badge variant="outline" className="text-xs">
                    {result.unitCode}: {result.unitName}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center">
                <span className="text-xs mr-2" style={{ color: colors.textSecondary }}>
                  {Math.round(result.matchScore * 100)}% match
                </span>
                <ChevronRight className="w-4 h-4" style={{ color: getResultTypeColor(result.type) }} />
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </FadeIn>
  );
  
  // Render a result row (list view)
  const renderResultRow = (result: SearchResult, index: number) => (
    <FadeIn key={result.id} delay={index * 0.05}>
      <div 
        className="p-4 border-b hover:bg-gray-50 cursor-pointer transition-all"
        onClick={() => navigateToResult(result)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <Badge className="mr-2" style={{
                backgroundColor: getResultTypeColor(result.type),
                color: result.type === 'tutorial' ? colors.textPrimary : 'white'
              }}>
                {getResultTypeLabel(result.type)}
              </Badge>
              
              {result.difficulty && (
                <Badge 
                  variant="outline" 
                  className="text-xs mr-2"
                  style={{ borderColor: getDifficultyColor(result.difficulty), color: getDifficultyColor(result.difficulty) }}
                >
                  {result.difficulty}
                </Badge>
              )}
              
              {result.unitCode && (
                <Badge variant="outline" className="text-xs">
                  {result.unitCode}
                </Badge>
              )}
            </div>
            
            <h3 className="text-lg font-medium mb-1">{result.title}</h3>
            
            {result.matchSnippet && (
              <div className="mb-2 p-2 bg-yellow-50 border-l-4 border-yellow-200 text-sm">
                <div dangerouslySetInnerHTML={{ __html: result.matchSnippet }} />
              </div>
            )}
            
            {result.description && (
              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                {result.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center text-xs gap-3" style={{ color: colors.textSecondary }}>
              {result.author && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {result.author}
                </span>
              )}
              
              {result.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {formatDate(result.date)}
                </span>
              )}
              
              {result.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDuration(result.duration)}
                </span>
              )}
              
              <div className="flex items-center ml-auto">
                <span className="flex items-center" style={{ color: getResultTypeColor(result.type) }}>
                  {Math.round(result.matchScore * 100)}% match
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end ml-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 mb-2"
              onClick={(e) => bookmarkResult(result, e)}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
            
            <ChevronRight className="h-5 w-5 mt-auto" style={{ color: getResultTypeColor(result.type) }} />
          </div>
        </div>
      </div>
    </FadeIn>
  );
  
  // Generate mock search results for demo purposes
  const generateMockResults = (query: string): SearchResult[] => {
    // Array of possible tags
    const tagOptions = [
      'Calculus', 'Algebra', 'Programming', 'Physics', 'Chemistry',
      'Database', 'Algorithms', 'Web Development', 'Machine Learning',
      'Data Structures', 'Organic Chemistry', 'Mechanics', 'Statistics'
    ];
    
    // Array of possible faculties
    const facultyOptions = [
      { name: 'Science', code: 'sci' },
      { name: 'Engineering', code: 'eng' },
      { name: 'Business', code: 'bus' },
      { name: 'Arts', code: 'arts' },
      { name: 'Medicine', code: 'med' }
    ];
    
    // Generate 20-30 mock results
    const count = Math.floor(Math.random() * 11) + 20;
    const results: SearchResult[] = [];
    
    for (let i = 0; i < count; i++) {
      // Determine result type with weighted distribution
      const typeRand = Math.random();
      let type: SearchResult['type'];
      
      if (typeRand < 0.3) {
        type = 'note';
      } else if (typeRand < 0.55) {
        type = 'pastpaper';
      } else if (typeRand < 0.75) {
        type = 'tutorial';
      } else if (typeRand < 0.9) {
        type = 'question';
      } else {
        type = 'unit';
      }
      
      // Generate random faculty
      const faculty = facultyOptions[Math.floor(Math.random() * facultyOptions.length)];
      
      // Generate random tags (2-4)
      const tagCount = Math.floor(Math.random() * 3) + 2;
      const tags: string[] = [];
      for (let j = 0; j < tagCount; j++) {
        const tag = tagOptions[Math.floor(Math.random() * tagOptions.length)];
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      }
      
      // Generate a match score between 0.5 and 1.0
      const matchScore = Math.random() * 0.5 + 0.5;
      
      // Generate a date within the last 2 years
      const date = new Date();
      date.setFullYear(date.getFullYear() - Math.floor(Math.random() * 2));
      date.setMonth(Math.floor(Math.random() * 12));
      date.setDate(Math.floor(Math.random() * 28) + 1);
      
      // Base result object
      const baseResult: SearchResult = {
        id: `result-${i}`,
        title: `${query} ${type === 'unit' ? 'Course' : type === 'tutorial' ? 'Tutorial' : type === 'question' ? 'Question' : type === 'pastpaper' ? 'Exam' : 'Notes'} ${i + 1}`,
        description: `This ${type} covers topics related to ${query} and includes comprehensive ${tags.join(', ')} content.`,
        type,
        faculty: faculty.name,
        facultyCode: faculty.code,
        author: ['Dr. Smith', 'Prof. Johnson', 'Jane Doe', 'John Edwards'][Math.floor(Math.random() * 4)],
        date: date.toISOString(),
        tags,
        matchScore,
        matchSnippet: `...content related to <strong>${query}</strong> and its applications in ${tags[0]}...`,
        views: Math.floor(Math.random() * 1000) + 100,
        rating: Math.floor(Math.random() * 5) + 1
      };
      
      // Add type-specific properties
      let result: SearchResult;
      
      switch (type) {
        case 'pastpaper':
          result = {
            ...baseResult,
            year: `${2018 + Math.floor(Math.random() * 6)}`,
            semester: Math.random() > 0.5 ? 'First' : 'Second',
            examType: ['Final', 'Midterm', 'CAT'][Math.floor(Math.random() * 3)]
          };
          break;
          
        case 'tutorial':
          result = {
            ...baseResult,
            difficulty: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
            duration: Math.floor(Math.random() * 120) + 10
          };
          break;
          
        case 'question':
          result = {
            ...baseResult,
            difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)]
          };
          break;
          
        case 'unit':
          result = {
            ...baseResult,
            unitCode: `${faculty.code.toUpperCase()}${100 + Math.floor(Math.random() * 400)}`,
            unitName: baseResult.title
          };
          break;
          
        default:
          result = baseResult;
      }
      
      results.push(result);
    }
    
    return results;
  };
  
  // Generate search suggestions
  const generateSearchSuggestions = (query: string): string[] => {
    const suggestions = [
      `${query} advanced topics`,
      `${query} for beginners`,
      `${query} practical applications`,
      `${query} theory`,
      `${query} examples`,
      `${query} practice problems`,
      `${query} study guide`
    ];
    
    // Shuffle and return 3-5 suggestions
    return shuffle(suggestions).slice(0, 3 + Math.floor(Math.random() * 3));
  };
  
  // Shuffle array helper
  const shuffle = <T extends unknown>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Search Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Search</CardTitle>
            <CardDescription>
              Find notes, past papers, tutorials, questions, and more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar */}
              <SearchComponent
                placeholder="Search for anything..."
                onSearch={handleSearch}
                initialQuery={searchQuery}
                primaryColor={colors.quaternary}
                debounceTime={500}
                fullWidth
              />
              
              {/* Recent and Suggested Searches */}
              {(!isSearchComplete || searchResults.length === 0) && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                        Recent Searches
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((search, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="cursor-pointer"
                            onClick={() => handleSearch(search)}
                          >
                            <Search className="w-3 h-3 mr-1" /> {search}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Popular Categories */}
                  <div>
                    <h3 className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                      Popular Categories
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer"
                        style={{ borderColor: colors.secondary, color: colors.secondary }}
                        onClick={() => handleSearch('calculus')}
                      >
                        <Tag className="w-3 h-3 mr-1" /> Calculus
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer"
                        style={{ borderColor: colors.primary, color: colors.primary }}
                        onClick={() => handleSearch('programming')}
                      >
                        <Tag className="w-3 h-3 mr-1" /> Programming
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer"
                        style={{ borderColor: colors.tertiary, color: colors.tertiary }}
                        onClick={() => handleSearch('physics')}
                      >
                        <Tag className="w-3 h-3 mr-1" /> Physics
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer"
                        style={{ borderColor: colors.quaternary, color: colors.quaternary }}
                        onClick={() => handleSearch('database')}
                      >
                        <Tag className="w-3 h-3 mr-1" /> Database
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer"
                        style={{ borderColor: '#6366f1', color: '#6366f1' }}
                        onClick={() => handleSearch('algorithms')}
                      >
                        <Tag className="w-3 h-3 mr-1" /> Algorithms
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Search Suggestions */}
              {isSearchComplete && searchResults.length > 0 && searchSuggestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    Suggested Searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {searchSuggestions.map((suggestion, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="cursor-pointer"
                        onClick={() => handleSearch(suggestion)}
                      >
                        <Search className="w-3 h-3 mr-1" /> {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {isSearchComplete && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Left: Filters Panel */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      <Filter className="w-4 h-4 mr-2" /> Filters
                    </CardTitle>
                    {(filters.types.length > 0 || filters.faculties.length > 0 || filters.years.length > 0 || 
                      filters.difficulty.length > 0 || filters.tags.length > 0) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearFilters}
                        className="h-8 px-2"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  
                  {/* Active Filters */}
                  {(filters.types.length > 0 || filters.faculties.length > 0 || filters.years.length > 0 || 
                    filters.difficulty.length > 0 || filters.tags.length > 0) && (
                    <div className="mt-2">
                      <h3 className="text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                        Active Filters
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {filters.types.map((type, idx) => (
                          <Badge 
                            key={`type-${idx}`} 
                            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer"
                            onClick={() => toggleFilter('types', type)}
                          >
                            {getResultTypeLabel(type)}
                            <X className="w-3 h-3" />
                          </Badge>
                        ))}
                        {filters.faculties.map((faculty, idx) => (
                          <Badge 
                            key={`faculty-${idx}`} 
                            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer"
                            onClick={() => toggleFilter('faculties', faculty)}
                          >
                            {faculty.toUpperCase()}
                            <X className="w-3 h-3" />
                          </Badge>
                        ))}
                        {filters.years.map((year, idx) => (
                          <Badge 
                            key={`year-${idx}`} 
                            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer"
                            onClick={() => toggleFilter('years', year)}
                          >
                            {year}
                            <X className="w-3 h-3" />
                          </Badge>
                        ))}
                        {filters.difficulty.map((diff, idx) => (
                          <Badge 
                            key={`diff-${idx}`} 
                            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer"
                            onClick={() => toggleFilter('difficulty', diff)}
                          >
                            {diff}
                            <X className="w-3 h-3" />
                          </Badge>
                        ))}
                        {filters.tags.map((tag, idx) => (
                          <Badge 
                            key={`tag-${idx}`} 
                            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer"
                            onClick={() => toggleFilter('tags', tag)}
                          >
                            {tag}
                            <X className="w-3 h-3" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pb-6">
                  <Accordion type="multiple" className="w-full">
                    {/* Content Type Filter */}
                    <AccordionItem value="type">
                      <AccordionTrigger className="text-sm font-medium">
                        Content Type
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        {[
                          { id: 'note', label: 'Notes' },
                          { id: 'pastpaper', label: 'Past Papers' },
                          { id: 'tutorial', label: 'Tutorials' },
                          { id: 'question', label: 'Questions' },
                          { id: 'unit', label: 'Units' }
                        ].map((type) => (
                          <div key={type.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`type-${type.id}`}
                              checked={filters.types.includes(type.id)}
                              onCheckedChange={() => toggleFilter('types', type.id)}
                            />
                            <Label 
                              htmlFor={`type-${type.id}`}
                              className="flex items-center text-sm cursor-pointer"
                            >
                              {getResultTypeIcon(type.id)}
                              <span className="ml-2">{type.label}</span>
                              <Badge className="ml-auto text-[10px] min-w-[20px] h-4 py-0 px-1">
                                {resultCount[type.id]}
                              </Badge>
                            </Label>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                    
                    {/* Faculty Filter */}
                    <AccordionItem value="faculty">
                      <AccordionTrigger className="text-sm font-medium">
                        Faculty
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        {[
                          { id: 'sci', label: 'Science' },
                          { id: 'eng', label: 'Engineering' },
                          { id: 'bus', label: 'Business' },
                          { id: 'arts', label: 'Arts' },
                          { id: 'med', label: 'Medicine' }
                        ].map((faculty) => (
                          <div key={faculty.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`faculty-${faculty.id}`}
                              checked={filters.faculties.includes(faculty.id)}
                              onCheckedChange={() => toggleFilter('faculties', faculty.id)}
                            />
                            <Label 
                              htmlFor={`faculty-${faculty.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {faculty.label}
                            </Label>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                    
                    {/* Year Filter */}
                    <AccordionItem value="year">
                      <AccordionTrigger className="text-sm font-medium">
                        Year
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        {[
                          '2023', '2022', '2021', '2020', '2019'
                        ].map((year) => (
                          <div key={year} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`year-${year}`}
                              checked={filters.years.includes(year)}
                              onCheckedChange={() => toggleFilter('years', year)}
                            />
                            <Label 
                              htmlFor={`year-${year}`}
                              className="text-sm cursor-pointer"
                            >
                              {year}
                            </Label>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                    
                    {/* Difficulty Filter */}
                    <AccordionItem value="difficulty">
                      <AccordionTrigger className="text-sm font-medium">
                        Difficulty
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        {[
                          { id: 'beginner', label: 'Beginner' },
                          { id: 'intermediate', label: 'Intermediate' },
                          { id: 'advanced', label: 'Advanced' },
                          { id: 'easy', label: 'Easy' },
                          { id: 'medium', label: 'Medium' },
                          { id: 'hard', label: 'Hard' }
                        ].map((diff) => (
                          <div key={diff.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`diff-${diff.id}`}
                              checked={filters.difficulty.includes(diff.id)}
                              onCheckedChange={() => toggleFilter('difficulty', diff.id)}
                            />
                            <Label 
                              htmlFor={`diff-${diff.id}`}
                              className="text-sm cursor-pointer"
                              style={{ color: getDifficultyColor(diff.id) }}
                            >
                              {diff.label}
                            </Label>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                    
                    {/* Tags Filter */}
                    <AccordionItem value="tags">
                      <AccordionTrigger className="text-sm font-medium">
                        Popular Tags
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-1">
                          {[
                            'Calculus', 'Programming', 'Algorithms', 'Physics', 
                            'Chemistry', 'Database', 'Web Development'
                          ].map((tag) => (
                            <Badge 
                              key={tag}
                              variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => toggleFilter('tags', tag)}
                              style={filters.tags.includes(tag) ? { backgroundColor: colors.quaternary, color: 'white' } : {}}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
            
            {/* Right: Results Panel */}
            <div className="md:col-span-3">
              {isLoading ? (
                // Loading state
                <Card>
                  <CardHeader>
                    <div className="flex justify-between">
                      <Skeleton className="h-8 w-40" />
                      <Skeleton className="h-8 w-28" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="border-b pb-4">
                          <div className="flex justify-between">
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-6 w-20" />
                          </div>
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : searchResults.length > 0 ? (
                <div className="space-y-6">
                  {/* Results Header */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div>
                          <CardTitle className="text-lg">
                            {resultCount.all} results for "{searchQuery}"
                          </CardTitle>
                          <Progress 
                            value={100} 
                            className="h-1 mt-1 w-full md:w-40"
                            style={{ backgroundColor: `${colors.quaternary}20` }}
                          >
                            <div className="h-full" style={{ backgroundColor: colors.quaternary }} />
                          </Progress>
                        </div>
                        
                        <div className="flex flex-wrap justify-between md:justify-end items-center gap-2">
                          {/* View Mode Toggle */}
                          <div className="flex items-center border rounded-md overflow-hidden">
                            <Button 
                              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                              size="sm"
                              className="rounded-none"
                              onClick={() => setViewMode('grid')}
                              style={viewMode === 'grid' ? { backgroundColor: colors.quaternary, color: 'white' } : {}}
                            >
                              <LayoutGrid className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant={viewMode === 'list' ? 'default' : 'ghost'} 
                              size="sm"
                              className="rounded-none"
                              onClick={() => setViewMode('list')}
                              style={viewMode === 'list' ? { backgroundColor: colors.quaternary, color: 'white' } : {}}
                            >
                              <List className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {/* Sort Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline">
                                {sortBy === 'relevance' && <Search className="w-4 h-4 mr-2" />}
                                {sortBy === 'newest' && <ArrowUp className="w-4 h-4 mr-2" />}
                                {sortBy === 'oldest' && <ArrowDown className="w-4 h-4 mr-2" />}
                                Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSortBy('relevance')}>
                                <Search className="w-4 h-4 mr-2" /> Relevance
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSortBy('newest')}>
                                <ArrowUp className="w-4 h-4 mr-2" /> Newest First
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                                <ArrowDown className="w-4 h-4 mr-2" /> Oldest First
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setSortBy('popular')}>
                                Most Popular
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSortBy('rating')}>
                                Highest Rated
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {/* Tab Navigation */}
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                        <TabsList className="grid grid-cols-6 w-full bg-gray-100">
                          <TabsTrigger 
                            value="all" 
                            className="data-[state=active]:bg-quaternary data-[state=active]:text-white whitespace-nowrap"
                            style={{ 
                              "--state-active-bg": colors.quaternary 
                            }}
                          >
                            All ({resultCount.all})
                          </TabsTrigger>
                          <TabsTrigger 
                            value="note" 
                            className="data-[state=active]:bg-quaternary data-[state=active]:text-white whitespace-nowrap"
                            style={{ 
                              "--state-active-bg": colors.quaternary 
                            }}
                          >
                            Notes ({resultCount.note})
                          </TabsTrigger>
                          <TabsTrigger 
                            value="pastpaper" 
                            className="data-[state=active]:bg-quaternary data-[state=active]:text-white whitespace-nowrap"
                            style={{ 
                              "--state-active-bg": colors.quaternary 
                            }}
                          >
                            Papers ({resultCount.pastpaper})
                          </TabsTrigger>
                          <TabsTrigger 
                            value="tutorial" 
                            className="data-[state=active]:bg-quaternary data-[state=active]:text-white whitespace-nowrap"
                            style={{ 
                              "--state-active-bg": colors.quaternary 
                            }}
                          >
                            Tutorials ({resultCount.tutorial})
                          </TabsTrigger>
                          <TabsTrigger 
                            value="question" 
                            className="data-[state=active]:bg-quaternary data-[state=active]:text-white whitespace-nowrap"
                            style={{ 
                              "--state-active-bg": colors.quaternary 
                            }}
                          >
                            Questions ({resultCount.question})
                          </TabsTrigger>
                          <TabsTrigger 
                            value="unit" 
                            className="data-[state=active]:bg-quaternary data-[state=active]:text-white whitespace-nowrap"
                            style={{ 
                              "--state-active-bg": colors.quaternary 
                            }}
                          >
                            Units ({resultCount.unit})
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </CardHeader>
                  </Card>
                  
                  {/* Search Results */}
                  {filteredResults.length === 0 ? (
                    <Alert 
                      className="border-2" 
                      style={{ 
                        backgroundColor: colors.surface, 
                        borderColor: colors.quaternary,
                        color: colors.textPrimary
                      }}
                    >
                      <AlertTitle className="font-bold flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" style={{ color: colors.quaternary }} />
                        No matching results
                      </AlertTitle>
                      <AlertDescription className="mt-1">
                        Try adjusting your search terms or filters to find what you're looking for.
                      </AlertDescription>
                      <div className="mt-3">
                        <Button onClick={clearFilters} style={{ backgroundColor: colors.quaternary, color: 'white' }}>
                          Clear All Filters
                        </Button>
                      </div>
                    </Alert>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredResults.map((result, index) => renderResultCard(result, index))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-0">
                        {filteredResults.map((result, index) => renderResultRow(result, index))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Alert 
                  className="border-2" 
                  style={{ 
                    backgroundColor: colors.surface, 
                    borderColor: colors.quaternary,
                    color: colors.textPrimary
                  }}
                >
                  <AlertTitle className="font-bold flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" style={{ color: colors.quaternary }} />
                    No results found
                  </AlertTitle>
                  <AlertDescription className="mt-1">
                    Sorry, we couldn't find any matching results for "{searchQuery}".
                    <br />Try different keywords or check your spelling.
                  </AlertDescription>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2" style={{ color: colors.quaternary }}>
                        Try These Popular Searches
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer"
                          style={{ borderColor: colors.quaternary, color: colors.quaternary }}
                          onClick={() => handleSearch('calculus')}
                        >
                          <Search className="w-3 h-3 mr-1" /> calculus
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer"
                          style={{ borderColor: colors.quaternary, color: colors.quaternary }}
                          onClick={() => handleSearch('programming basics')}
                        >
                          <Search className="w-3 h-3 mr-1" /> programming basics
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer"
                          style={{ borderColor: colors.quaternary, color: colors.quaternary }}
                          onClick={() => handleSearch('database design')}
                        >
                          <Search className="w-3 h-3 mr-1" /> database design
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2" style={{ color: colors.quaternary }}>
                        Browse by Category
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          style={{ borderColor: colors.quaternary, color: colors.quaternary }}
                          onClick={() => navigate('/notes')}
                        >
                          <FileText className="w-4 h-4 mr-1" /> Browse Notes
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          style={{ borderColor: colors.quaternary, color: colors.quaternary }}
                          onClick={() => navigate('/pastpapers')}
                        >
                          <BookCopy className="w-4 h-4 mr-1" /> Browse Past Papers
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          style={{ borderColor: colors.quaternary, color: colors.quaternary }}
                          onClick={() => navigate('/tutorials')}
                        >
                          <Video className="w-4 h-4 mr-1" /> Browse Tutorials
                        </Button>
                      </div>
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdvancedSearchPage;