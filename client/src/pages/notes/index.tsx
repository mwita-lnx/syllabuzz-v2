import React, { useState, useEffect } from 'react';
import { BookCopy, Filter, Newspaper, BookmarkPlus } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Import layout and components
import { MainLayout } from '@/components/MainLayout';
import { NoteCard } from '@/components/NoteCard';
import { FacultySelector } from '@/components/FacultySelector';


// Import types
import { Note, Faculty } from '../../types/index2';

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

const NotesPage: React.FC = () => {
  // State management
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('recent');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  
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
  
  // Fetch data on component mount
  useEffect(() => {
    fetchNotes();
    
    // Mock faculties
    setFaculties([
      { id: '1', name: 'Science', code: 'sci', color: '#FF6B6B' },
      { id: '2', name: 'Arts', code: 'arts', color: '#4ECDC4' },
      { id: '3', name: 'Business', code: 'bus', color: '#FFD166' },
      { id: '4', name: 'Engineering', code: 'eng', color: '#6A0572' },
      { id: '5', name: 'Medicine', code: 'med', color: '#06D6A0' }
    ]);
  }, []);
  
  // Apply filters when dependencies change
  useEffect(() => {
    filterNotes();
  }, [notes, selectedFaculty, selectedType, searchQuery, selectedSort]);
  
  // Fetch notes
  const fetchNotes = async () => {
    try {
      // Mock API call
      const mockNotes: Note[] = [
        {
          _id: '1',
          title: 'Understanding Sorting Algorithms',
          description: 'A comprehensive guide to common sorting algorithms and their time complexity analysis.',
          url: '#',
          source_name: 'Science Notes',
          published_at: '2024-03-10',
          type: 'notes',
          faculty: 'Science',
          facultyCode: 'sci',
          categories: ['algorithms', 'computer science'],
          relevance_score: 0.95
        },
        {
          _id: '2',
          title: 'Customer Journey Mapping in Digital Age',
          description: 'How to effectively map customer journeys across multiple digital touchpoints.',
          url: '#',
          source_name: 'Business Review',
          published_at: '2024-03-08',
          type: 'notes',
          faculty: 'Business',
          facultyCode: 'bus',
          categories: ['marketing', 'customer experience'],
          relevance_score: 0.88
        },
        {
          _id: '3',
          title: 'Cardiac Muscle Physiology',
          description: 'Detailed examination of cardiac muscle structure and function.',
          url: '#',
          source_name: 'Medical Journal',
          published_at: '2024-03-05',
          type: 'academic',
          faculty: 'Medicine',
          facultyCode: 'med',
          categories: ['anatomy', 'physiology'],
          relevance_score: 0.92
        },
        {
          _id: '4',
          title: 'Modernist Poetry Analysis',
          description: 'Critical analysis of key modernist poetic works and their literary significance.',
          url: '#',
          source_name: 'Arts Review',
          published_at: '2024-03-01',
          type: 'notes',
          faculty: 'Arts',
          facultyCode: 'arts',
          categories: ['literature', 'poetry'],
          relevance_score: 0.85
        },
        {
          _id: '5',
          title: 'Neural Networks Fundamentals',
          description: 'Introduction to neural network architectures and applications in machine learning.',
          url: '#',
          source_name: 'CS Research',
          published_at: '2024-02-25',
          type: 'academic',
          faculty: 'Science',
          facultyCode: 'sci',
          categories: ['machine learning', 'AI'],
          relevance_score: 0.96
        },
        {
          _id: '6',
          title: 'Bridge Design Principles',
          description: 'Core principles and methodologies in modern bridge design and construction.',
          url: '#',
          source_name: 'Engineering Today',
          published_at: '2024-02-20',
          type: 'notes',
          faculty: 'Engineering',
          facultyCode: 'eng',
          categories: ['structural engineering', 'civil'],
          relevance_score: 0.89
        },
        {
          _id: '7',
          title: 'Sustainable Business Practices',
          description: 'Analysis of sustainable business models and environmental impact considerations.',
          url: '#',
          source_name: 'Business Ethics Journal',
          published_at: '2024-02-15',
          type: 'academic',
          faculty: 'Business',
          facultyCode: 'bus',
          categories: ['sustainability', 'ethics', 'business'],
          relevance_score: 0.87
        },
        {
          _id: '8',
          title: 'Renaissance Sculpture Techniques',
          description: 'Examination of sculptural methods and materials used during the Renaissance period.',
          url: '#',
          source_name: 'Art History Review',
          published_at: '2024-02-10',
          type: 'academic',
          faculty: 'Arts',
          facultyCode: 'arts',
          categories: ['art history', 'sculpture', 'renaissance'],
          relevance_score: 0.86
        },
        {
          _id: '9',
          title: 'Genetic Engineering Advancements',
          description: 'Recent breakthroughs in genetic engineering and their implications for medicine.',
          url: '#',
          source_name: 'BioTech Review',
          published_at: '2024-02-05',
          type: 'academic',
          faculty: 'Medicine',
          facultyCode: 'med',
          categories: ['genetics', 'biotech', 'medicine'],
          relevance_score: 0.93
        },
        {
          _id: '10',
          title: 'Quantum Computing Basics',
          description: 'Introduction to quantum computing principles and current technological state.',
          url: '#',
          source_name: 'Physics Today',
          published_at: '2024-01-30',
          type: 'notes',
          faculty: 'Science',
          facultyCode: 'sci',
          categories: ['quantum', 'computing', 'physics'],
          relevance_score: 0.91
        },
        {
          _id: '11',
          title: 'Materials Science in Construction',
          description: 'Overview of advanced materials used in modern construction projects.',
          url: '#',
          source_name: 'Engineering Digest',
          published_at: '2024-01-25',
          type: 'notes',
          faculty: 'Engineering',
          facultyCode: 'eng',
          categories: ['materials', 'construction', 'engineering'],
          relevance_score: 0.84
        },
        {
          _id: '12',
          title: 'Investment Portfolio Strategies',
          description: 'Analysis of various investment approaches for different economic conditions.',
          url: '#',
          source_name: 'Finance Quarterly',
          published_at: '2024-01-20',
          type: 'notes',
          faculty: 'Business',
          facultyCode: 'bus',
          categories: ['finance', 'investment', 'economics'],
          relevance_score: 0.90
        }
      ];
      
      setNotes(mockNotes);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setIsLoading(false);
    }
  };
  
  // Filter and sort notes based on current state
  const filterNotes = () => {
    let result = [...notes];
    
    // Apply faculty filter
    if (selectedFaculty !== 'all') {
      result = result.filter(note => note.facultyCode === selectedFaculty);
    }
    
    // Apply type filter
    if (selectedType !== 'all') {
      result = result.filter(note => note.type === selectedType);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        note => 
          note.title.toLowerCase().includes(query) || 
          note.description.toLowerCase().includes(query) ||
          (note.categories && note.categories.some(category => category.toLowerCase().includes(query)))
      );
    }
    
    // Apply sorting
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
    filterNotes();
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedFaculty('all');
    setSelectedType('all');
    setSelectedSort('recent');
  };
  
  // Get note type color
  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'academic':
        return colors.primary;
      case 'notes':
        return colors.secondary;
      default:
        return colors.tertiary;
    }
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
                  onClick={() => setSelectedType('all')}
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
                  onClick={() => setSelectedType('notes')}
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
                  onClick={() => setSelectedType('academic')}
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
                    onSelect={setSelectedFaculty}
                  />
                </div>
                
                {/* Sort Filter */}
                <div>
                  <Select value={selectedSort} onValueChange={setSelectedSort}>
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
                  {filteredNotes.length} notes found
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