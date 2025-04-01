import React, { useState, useEffect } from 'react';
import { BookCopy, Filter, Newspaper, BookmarkPlus, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import toast from 'react-hot-toast';

// Import API service
import { apiGet } from '@/services/api';

// Import layout and components
import { MainLayout } from '@/components/MainLayout';
import { NoteCard } from '@/components/NoteCard';
import { FacultySelector } from '@/components/FacultySelector';

// Import types
import { Note, Faculty, PaginatedResponse } from '@/types';

// Animation component for transitions
const FadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

const NotesPage: React.FC = () => {
  // State management
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('recent');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [totalNotes, setTotalNotes] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
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
  
  // Fetch faculties on component mount
  useEffect(() => {
    fetchFaculties();
    fetchNotes();
  }, []);
  
  // Apply filters when dependencies change
  useEffect(() => {
    if (notes.length > 0) {
      filterNotes();
    }
  }, [notes, selectedFaculty, selectedType, searchQuery, selectedSort]);
  
  // Fetch faculties from API
  const fetchFaculties = async () => {
    try {
      // Optional: Replace with actual API call if you have a faculties endpoint
      // const response = await apiGet<Faculty[]>('/faculties');
      // setFaculties(response);
      
      // Use mock faculties for now
      setFaculties([
        { id: '1', name: 'Science', code: 'sci', color: '#FF6B6B' },
        { id: '2', name: 'Arts', code: 'arts', color: '#4ECDC4' },
        { id: '3', name: 'Business', code: 'bus', color: '#FFD166' },
        { id: '4', name: 'Engineering', code: 'eng', color: '#6A0572' },
        { id: '5', name: 'Medicine', code: 'med', color: '#06D6A0' }
      ]);
    } catch (err) {
      console.error('Error fetching faculties:', err);
      toast.error('Failed to load faculties.');
    }
  };
  
  // Fetch notes from API
  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (selectedFaculty !== 'all') {
        params.append('faculty', selectedFaculty);
      }
      
      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }
      
      if (searchQuery.trim()) {
        params.append('query', searchQuery.trim());
      }
      
      params.append('sort_by', selectedSort);
      params.append('page', page.toString());
      params.append('limit', '12'); // Adjust limit as needed
      
      // Make API call
      const response = await apiGet<PaginatedResponse<Note>>(`/notes/?${params.toString()}`);
      console.log('API Response:', response);
      
      if (response.status === 'success') {
        setNotes(response.data || []);
        setTotalNotes(response.total || 0);
        setTotalPages(response.pages || 1);
      } else {
        setError(response.error || 'An error occurred while fetching notes.');
        toast.error('Failed to load notes.');
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      setError(err.message || 'An error occurred while fetching notes.');
      toast.error('Failed to load notes. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Filter and sort notes based on current state
  const filterNotes = () => {
    let result = [...notes];
    
    // Apply faculty filter (if not already filtered by API)
    if (selectedFaculty !== 'all') {
      result = result.filter(note => note.facultyCode === selectedFaculty);
    }
    
    // Apply type filter (if not already filtered by API)
    if (selectedType !== 'all') {
      result = result.filter(note => note.type === selectedType);
    }
    
    // Apply search filter (if not already filtered by API)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        note => 
          note.title.toLowerCase().includes(query) || 
          note.description.toLowerCase().includes(query) ||
          (note.categories && note.categories.some(category => category.toLowerCase().includes(query)))
      );
    }
    
    // Apply sorting (if not already sorted by API)
    switch (selectedSort) {
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
    
    setFilteredNotes(result);
  };
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotes(); // Re-fetch with new search parameters
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedFaculty('all');
    setSelectedType('all');
    setSelectedSort('recent');
    setPage(1);
    
    // Re-fetch notes with reset filters
    setTimeout(() => {
      fetchNotes();
    }, 0);
  };
  
  // Get note type color
  const getNoteTypeColor = (type: string): string => {
    switch (type) {
      case 'academic':
        return colors.primary;
      case 'notes':
        return colors.secondary;
      default:
        return colors.tertiary;
    }
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Re-fetch notes for the new page
    setTimeout(() => {
      fetchNotes();
    }, 0);
  };
  
  return (
    <MainLayout>
      <FadeIn>
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold title-font" style={{ color: colors.secondary }}>Notes & Papers</h2>
            
            <Tabs defaultValue="all" className="w-64">
              <TabsList className="w-full" style={{ backgroundColor: `${colors.secondary}33` }}>
                <TabsTrigger 
                  value="all" 
                  onClick={() => {
                    setSelectedType('all');
                    setPage(1);
                    setTimeout(fetchNotes, 0);
                  }}
                  className="data-[state=active]:text-white transition-all"
                  style={{ 
                    backgroundColor: "transparent",
                    "--tw-bg-opacity": "1",
                    "--secondary": colors.secondary,
                    "--tw-text-opacity": "1",
                    "--tw-white": colors.textPrimary,
                    "[data-state=active]:backgroundColor": colors.secondary
                  }}
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="notes" 
                  onClick={() => {
                    setSelectedType('notes');
                    setPage(1);
                    setTimeout(fetchNotes, 0);
                  }}
                  className="data-[state=active]:text-white transition-all"
                  style={{ 
                    backgroundColor: "transparent",
                    "--tw-bg-opacity": "1",
                    "--secondary": colors.secondary,
                    "--tw-text-opacity": "1",
                    "--tw-white": colors.textPrimary,
                    "[data-state=active]:backgroundColor": colors.secondary
                  }}
                >
                  Notes
                </TabsTrigger>
                <TabsTrigger 
                  value="academic" 
                  onClick={() => {
                    setSelectedType('academic');
                    setPage(1);
                    setTimeout(fetchNotes, 0);
                  }}
                  className="data-[state=active]:text-white transition-all"
                  style={{ 
                    backgroundColor: "transparent",
                    "--tw-bg-opacity": "1",
                    "--secondary": colors.secondary,
                    "--tw-text-opacity": "1",
                    "--tw-white": colors.textPrimary,
                    "[data-state=active]:backgroundColor": colors.secondary
                  }}
                >
                  Academic
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Filters Section */}
          <Card className="mb-6" style={{ backgroundColor: colors.surface }}>
            <CardHeader>
              <CardTitle className="flex items-center text-lg" style={{ color: colors.secondary }}>
                <Filter className="w-5 h-5 mr-2" /> Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <form onSubmit={handleSearch} className="relative">
                    <Input
                      type="text"
                      placeholder="Search notes..."
                      className="w-full border-2 focus:ring-2 focus:border-transparent transition-all"
                      style={{ 
                        borderColor: colors.secondary,
                        borderRadius: '0.5rem',
                        color: colors.textPrimary
                      }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </form>
                </div>
                
                {/* Faculty Filter */}
                <div>
                  <FacultySelector 
                    faculties={faculties} 
                    selectedFaculty={selectedFaculty}
                    onSelect={(faculty) => {
                      setSelectedFaculty(faculty);
                      setPage(1);
                      setTimeout(fetchNotes, 0);
                    }}
                  />
                </div>
                
                {/* Sort Filter */}
                <div>
                  <Select 
                    value={selectedSort} 
                    onValueChange={(value) => {
                      setSelectedSort(value);
                      setPage(1);
                      setTimeout(fetchNotes, 0);
                    }}
                  >
                    <SelectTrigger style={{ borderColor: colors.secondary, color: colors.textPrimary }}>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="az">Title (A-Z)</SelectItem>
                      <SelectItem value="za">Title (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <Badge className="mr-2" style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}>
                  {totalNotes} notes found
                </Badge>
                {(selectedFaculty !== 'all' || selectedType !== 'all' || searchQuery || selectedSort !== 'recent') && (
                  <Badge style={{ backgroundColor: colors.quaternary, color: 'white' }}>
                    Filters applied
                  </Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={resetFilters}
                style={{ borderColor: colors.secondary, color: colors.secondary }}
              >
                Reset Filters
              </Button>
            </CardFooter>
          </Card>
          
          {/* Error Alert */}
          {error && (
            <Alert 
              className="mb-6 border-2" 
              style={{ 
                backgroundColor: colors.surface, 
                borderColor: colors.primary,
                color: colors.textPrimary
              }}
            >
              <AlertTitle className="font-bold title-font flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" style={{ color: colors.primary }} />
                Error Loading Notes
              </AlertTitle>
              <AlertDescription>
                {error}. Please try again or contact support if the problem persists.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Notes Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-full" style={{ backgroundColor: colors.surface }}>
                  <CardHeader>
                    <Skeleton className="h-4 w-16 mb-2" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                    <Skeleton className="h-6 w-full mb-2" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                    <Skeleton className="h-4 w-28" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <Alert 
              className="border-2 animate-pulse" 
              style={{ 
                backgroundColor: colors.surface, 
                borderColor: colors.secondary,
                color: colors.textPrimary
              }}
            >
              <AlertTitle className="font-bold title-font">No notes found</AlertTitle>
              <AlertDescription>
                Try adjusting your filters or search query to find notes.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredNotes.map((note, index) => (
                  <div key={note._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                    <NoteCard 
                      note={note}
                      typeColor={getNoteTypeColor(note.type)}
                    />
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                    style={{ borderColor: colors.secondary, color: colors.secondary }}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex space-x-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i}
                        variant={page === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(i + 1)}
                        style={
                          page === i + 1
                            ? { backgroundColor: colors.secondary, color: 'white' }
                            : { borderColor: colors.secondary, color: colors.secondary }
                        }
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    style={{ borderColor: colors.secondary, color: colors.secondary }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
          
          {/* Bookmarked/Saved Notes Section */}
          <div className="mt-12">
            <h2 className="text-xl font-bold title-font mb-4 flex items-center gap-2" style={{ color: colors.tertiary }}>
              <BookmarkPlus className="w-5 h-5" /> Saved Notes
            </h2>
            
            <Card 
              className="border-2 hover:shadow-md transition-all" 
              style={{ 
                backgroundColor: colors.surface,
                borderColor: colors.tertiary,
                borderStyle: 'dashed'
              }}
            >
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookmarkPlus className="w-16 h-16 mb-4" style={{ color: `${colors.tertiary}80` }} />
                <h3 className="text-lg font-bold mb-2 title-font" style={{ color: colors.tertiary }}>
                  No saved notes yet
                </h3>
                <p className="text-center" style={{ color: colors.textSecondary }}>
                  Save notes by clicking the bookmark button on any note card.
                </p>
                <Button 
                  className="mt-4 font-medium"
                  style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}
                  onClick={() => {
                    resetFilters();
                    setSelectedSort('relevance');
                    setTimeout(fetchNotes, 0);
                  }}
                >
                  Explore Popular Notes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </FadeIn>
    </MainLayout>
  );
};

export default NotesPage;