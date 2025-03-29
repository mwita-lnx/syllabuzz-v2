import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, BookA, Filter } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Import layout and components
import { MainLayout } from '@/components/MainLayout';
import { UnitCard } from '@/components/UnitCard';
import { FacultySelector } from '@/components/FacultySelector';

// Import types
import { Unit, Faculty } from '@/types/index2';


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

const UnitsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State management
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
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
    fetchUnits();
    
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
    filterUnits();
  }, [units, selectedFaculty, searchQuery, selectedSort]);
  
  // Fetch units
  const fetchUnits = async () => {
    try {
      // Mock API call
      const mockUnits: Unit[] = [
        {
          _id: '1',
          name: 'Introduction to Computer Science',
          code: 'CS101',
          description: 'Fundamentals of computer science including algorithms, data structures, and programming concepts.',
          faculty: 'Science',
          facultyCode: 'sci',
          keywords: ['programming', 'algorithms', 'data structures'],
          created_at: '2024-01-01'
        },
        {
          _id: '2',
          name: 'Digital Marketing',
          code: 'MKT205',
          description: 'Introduction to digital marketing strategies, social media, and online advertising techniques.',
          faculty: 'Business',
          facultyCode: 'bus',
          keywords: ['marketing', 'digital', 'social media'],
          created_at: '2024-01-15'
        },
        {
          _id: '3',
          name: 'Human Anatomy',
          code: 'MED110',
          description: 'Study of the structure of the human body and its parts and their relationships to one another.',
          faculty: 'Medicine',
          facultyCode: 'med',
          keywords: ['anatomy', 'physiology', 'health'],
          created_at: '2024-02-01'
        },
        {
          _id: '4',
          name: 'Modern Literature',
          code: 'LIT303',
          description: 'Exploration of 20th and 21st century literature across different genres and cultural contexts.',
          faculty: 'Arts',
          facultyCode: 'arts',
          keywords: ['literature', 'fiction', 'poetry'],
          created_at: '2024-02-15'
        },
        {
          _id: '5',
          name: 'Machine Learning',
          code: 'CS405',
          description: 'Introduction to machine learning algorithms, neural networks, and data analysis techniques.',
          faculty: 'Science',
          facultyCode: 'sci',
          keywords: ['AI', 'algorithms', 'data science'],
          created_at: '2024-03-01'
        },
        {
          _id: '6',
          name: 'Structural Engineering',
          code: 'ENG220',
          description: 'Principles of structural analysis, design of buildings and infrastructure.',
          faculty: 'Engineering',
          facultyCode: 'eng',
          keywords: ['structures', 'mechanics', 'design'],
          created_at: '2024-03-15'
        },
        {
          _id: '7',
          name: 'Financial Accounting',
          code: 'ACC201',
          description: 'Introduction to financial accounting principles, financial statements, and reporting standards.',
          faculty: 'Business',
          facultyCode: 'bus',
          keywords: ['accounting', 'finance', 'reporting'],
          created_at: '2024-01-05'
        },
        {
          _id: '8',
          name: 'Renaissance Art History',
          code: 'ART240',
          description: 'Study of Renaissance art, artists, and artistic movements across Europe.',
          faculty: 'Arts',
          facultyCode: 'arts',
          keywords: ['art history', 'renaissance', 'painting'],
          created_at: '2024-02-10'
        },
        {
          _id: '9',
          name: 'Pharmacology',
          code: 'MED330',
          description: 'Study of drugs and their interactions with living systems.',
          faculty: 'Medicine',
          facultyCode: 'med',
          keywords: ['drugs', 'therapeutics', 'molecular'],
          created_at: '2024-03-10'
        }
      ];
      
      setUnits(mockUnits);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching units:', error);
      setIsLoading(false);
    }
  };
  
  // Filter and sort units based on current state
  const filterUnits = () => {
    let result = [...units];
    
    // Apply faculty filter
    if (selectedFaculty !== 'all') {
      result = result.filter(unit => unit.facultyCode === selectedFaculty);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        unit => 
          unit.name.toLowerCase().includes(query) || 
          unit.code.toLowerCase().includes(query) || 
          unit.description.toLowerCase().includes(query) ||
          (unit.keywords && unit.keywords.some(keyword => keyword.toLowerCase().includes(query)))
      );
    }
    
    // Apply sorting
    switch (selectedSort) {
      case 'recent':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'az':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'za':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'code':
        result.sort((a, b) => a.code.localeCompare(b.code));
        break;
    }
    
    setFilteredUnits(result);
  };
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    filterUnits();
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedFaculty('all');
    setSelectedSort('recent');
  };
  
  // Get faculty color
  const getFacultyColor = (facultyCode: string) => {
    const faculty = faculties.find(f => f.code === facultyCode);
    return faculty ? faculty.color : colors.primary;
  };
  
  return (
    <MainLayout>
      <FadeIn>
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold title-font" style={{ color: colors.primary }}>Academic Units</h2>
          </div>
          
          {/* Filters Section */}
          <Card className="mb-6" style={{ backgroundColor: colors.surface }}>
            <CardHeader>
              <CardTitle className="flex items-center text-lg" style={{ color: colors.primary }}>
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
                      placeholder="Search units..."
                      className="w-full border-2 focus:ring-2 focus:border-transparent transition-all"
                      style={{ 
                        borderColor: colors.primary,
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
                    <SelectTrigger style={{ borderColor: colors.primary, color: colors.textPrimary }}>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="az">Name (A-Z)</SelectItem>
                      <SelectItem value="za">Name (Z-A)</SelectItem>
                      <SelectItem value="code">Unit Code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <Badge className="mr-2" style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}>
                  {filteredUnits.length} units found
                </Badge>
                {(selectedFaculty !== 'all' || searchQuery || selectedSort !== 'recent') && (
                  <Badge style={{ backgroundColor: colors.quaternary, color: 'white' }}>
                    Filters applied
                  </Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={resetFilters}
                style={{ borderColor: colors.primary, color: colors.primary }}
              >
                Reset Filters
              </Button>
            </CardFooter>
          </Card>
          
          {/* Units Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-full" style={{ backgroundColor: colors.surface }}>
                  <CardHeader>
                    <Skeleton className="h-6 w-full mb-2" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-4 w-24" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredUnits.length === 0 ? (
            <Alert 
              className="border-2 animate-pulse" 
              style={{ 
                backgroundColor: colors.surface, 
                borderColor: colors.primary,
                color: colors.textPrimary
              }}
            >
              <AlertTitle className="font-bold title-font">No units found</AlertTitle>
              <AlertDescription>
                Try adjusting your filters or search query to find units.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredUnits.map((unit, index) => (
                <div key={unit._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                  <UnitCard 
                    unit={unit} 
                    onClick={() => navigate(`/units/${unit._id}`)}
                    color={getFacultyColor(unit.facultyCode)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </FadeIn>
    </MainLayout>
  );
};

export default UnitsPage;