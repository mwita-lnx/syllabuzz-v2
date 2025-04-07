// src/pages/tutorials/index.tsx
import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Filter, 
  Tag, 
  Layers, 
  Clock, 
  BarChart, 
  Play,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MainLayout } from '@/components/MainLayout';
import SearchComponent from '@/components/SearchComponent';
import { useNavigate } from 'react-router-dom';

// Define interfaces for tutorial data
interface Tutorial {
  id: string;
  title: string;
  description: string;
  categories: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  author: string;
  views: number;
  rating: number;
  createdAt: string;
  thumbnailUrl?: string;
  videoUrl?: string;
}

// Animation component for transitions
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

const TutorialsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State management
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [filteredTutorials, setFilteredTutorials] = useState<Tutorial[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('newest');
  
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
  
  // Fetch tutorials on component mount
  useEffect(() => {
    fetchTutorials();
  }, []);
  
  // Apply filters when dependencies change
  useEffect(() => {
    if (tutorials.length > 0) {
      applyFilters();
    }
  }, [tutorials, selectedCategory, selectedDifficulty, searchQuery, selectedSort]);
  
  // Fetch tutorials
  const fetchTutorials = async () => {
    setIsLoading(true);
    
    // In a real implementation, this would be an API call
    // For now, let's simulate a delay and use mock data
    setTimeout(() => {
      // Mock tutorials data
      const mockTutorials: Tutorial[] = Array.from({ length: 12 }, (_, i) => ({
        id: `tutorial-${i + 1}`,
        title: `Tutorial ${i + 1}: ${['Introduction to', 'Advanced', 'Mastering', 'Learning'][i % 4]} ${['Calculus', 'Physics', 'Programming', 'Data Analysis'][i % 4]}`,
        description: 'This tutorial covers the essential concepts and provides practical examples to help you understand the topic thoroughly.',
        categories: [
          ['Mathematics', 'Calculus', 'Basics'][i % 3],
          ['Physics', 'Mechanics', 'Quantum'][i % 3],
          ['Computer Science', 'Programming', 'Algorithms'][i % 3]
        ],
        difficulty: ['beginner', 'intermediate', 'advanced'][i % 3] as 'beginner' | 'intermediate' | 'advanced',
        duration: 15 + (i * 5), // 15-75 minutes
        author: ['Dr. Smith', 'Prof. Johnson', 'Jane Doe', 'John Smith'][i % 4],
        views: Math.floor(Math.random() * 10000),
        rating: 3 + Math.random() * 2, // 3-5 rating
        createdAt: new Date(Date.now() - (i * 86400000)).toISOString(), // Last few days
        thumbnailUrl: `/tutorial-thumbnail-${i + 1}.jpg`
      }));
      
      setTutorials(mockTutorials);
      setFilteredTutorials(mockTutorials);
      setIsLoading(false);
    }, 1500);
  };
  
  // Apply filters to tutorials
  const applyFilters = () => {
    let result = [...tutorials];
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(tutorial => 
        tutorial.categories.some(category => 
          category.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    }
    
    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      result = result.filter(tutorial => 
        tutorial.difficulty === selectedDifficulty
      );
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        tutorial => 
          tutorial.title.toLowerCase().includes(query) || 
          tutorial.description.toLowerCase().includes(query) ||
          tutorial.categories.some(category => category.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    switch (selectedSort) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'popular':
        result.sort((a, b) => b.views - a.views);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'duration-asc':
        result.sort((a, b) => a.duration - b.duration);
        break;
      case 'duration-desc':
        result.sort((a, b) => b.duration - a.duration);
        break;
    }
    
    setFilteredTutorials(result);
  };
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setSelectedSort('newest');
  };
  
  // Get difficulty color
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner':
        return '#4ECDC4'; // teal
      case 'intermediate':
        return '#FFD166'; // yellow
      case 'advanced':
        return '#FF6B6B'; // red
      default:
        return '#4A5568'; // gray
    }
  };
  
  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Render tutorial card
  const renderTutorialCard = (tutorial: Tutorial, index: number) => (
    <FadeIn key={tutorial.id} delay={index * 0.1}>
      <Card 
        className="h-full border hover:shadow-lg cursor-pointer transition-all hover-scale" 
        onClick={() => navigate(`/tutorials/${tutorial.id}`)}
        style={{ 
          backgroundColor: colors.surface,
          borderColor: colors.border
        }}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <Badge 
              style={{ 
                backgroundColor: getDifficultyColor(tutorial.difficulty),
                color: tutorial.difficulty === 'beginner' ? colors.textPrimary : 'white'
              }}
            >
              {tutorial.difficulty.charAt(0).toUpperCase() + tutorial.difficulty.slice(1)}
            </Badge>
            <Badge variant="outline" style={{ borderColor: colors.quaternary, color: colors.quaternary }}>
              <Clock className="w-3 h-3 mr-1" /> {formatDuration(tutorial.duration)}
            </Badge>
          </div>
          <CardTitle className="text-lg line-clamp-2" style={{ color: colors.textPrimary }}>
            {tutorial.title}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {tutorial.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1 mb-2">
            {tutorial.categories.map((category, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                style={{ borderColor: colors.secondary, color: colors.secondary }}
              >
                {category}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs mt-2" style={{ color: colors.textSecondary }}>
            <span>{tutorial.author}</span>
            <span>{formatDate(tutorial.createdAt)}</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex items-center" style={{ color: colors.textSecondary }}>
              <BarChart className="w-4 h-4 mr-1" />
              {tutorial.views.toLocaleString()} views
            </span>
            <span className="flex items-center" style={{ color: colors.textSecondary }}>
              <Star rating={tutorial.rating} />
              {tutorial.rating.toFixed(1)}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            style={{ color: colors.primary }}
          >
            <Play className="w-4 h-4 mr-1" /> Start
          </Button>
        </CardFooter>
      </Card>
    </FadeIn>
  );
  
  // Star rating component
  const Star: React.FC<{ rating: number }> = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center mr-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="text-yellow-400">
            {i < fullStars ? '★' : (i === fullStars && hasHalfStar ? '★' : '☆')}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <MainLayout>
      <FadeIn>
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold title-font" style={{ color: colors.tertiary }}>Tutorials & Learning Resources</h2>
            
            <Tabs defaultValue="all" className="w-64">
              <TabsList className="w-full" style={{ backgroundColor: `${colors.tertiary}33` }}>
                <TabsTrigger 
                  value="all" 
                  onClick={() => setSelectedDifficulty('all')}
                  className="data-[state=active]:text-white transition-all"
                  style={{ 
                    backgroundColor: "transparent",
                    "--tw-bg-opacity": "1",
                    "--secondary": colors.tertiary,
                    "--tw-text-opacity": "1",
                    "--tw-white": colors.textPrimary,
                    "[data-state=active]:backgroundColor": colors.tertiary
                  }}
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="beginner" 
                  onClick={() => setSelectedDifficulty('beginner')}
                  className="data-[state=active]:text-white transition-all"
                  style={{ 
                    backgroundColor: "transparent",
                    "--tw-bg-opacity": "1",
                    "--secondary": colors.tertiary,
                    "--tw-text-opacity": "1",
                    "--tw-white": colors.textPrimary,
                    "[data-state=active]:backgroundColor": colors.tertiary
                  }}
                >
                  Beginner
                </TabsTrigger>
                <TabsTrigger 
                  value="advanced" 
                  onClick={() => setSelectedDifficulty('advanced')}
                  className="data-[state=active]:text-white transition-all"
                  style={{ 
                    backgroundColor: "transparent",
                    "--tw-bg-opacity": "1",
                    "--secondary": colors.tertiary,
                    "--tw-text-opacity": "1",
                    "--tw-white": colors.textPrimary,
                    "[data-state=active]:backgroundColor": colors.tertiary
                  }}
                >
                  Advanced
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Filters Section */}
          <Card className="mb-6" style={{ backgroundColor: colors.surface }}>
            <CardHeader>
              <CardTitle className="flex items-center text-lg" style={{ color: colors.tertiary }}>
                <Filter className="w-5 h-5 mr-2" /> Find Tutorials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <SearchComponent
                    placeholder="Search tutorials..."
                    onSearch={handleSearch}
                    initialQuery={searchQuery}
                    primaryColor={colors.tertiary}
                    fullWidth
                  />
                </div>
                
                {/* Category Filter */}
                <div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger style={{ borderColor: colors.tertiary, color: colors.textPrimary }}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="computer science">Computer Science</SelectItem>
                      <SelectItem value="programming">Programming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Sort Filter */}
                <div>
                  <Select value={selectedSort} onValueChange={setSelectedSort}>
                    <SelectTrigger style={{ borderColor: colors.tertiary, color: colors.textPrimary }}>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="duration-asc">Duration (Shortest)</SelectItem>
                      <SelectItem value="duration-desc">Duration (Longest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <Badge className="mr-2" style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}>
                  {filteredTutorials.length} tutorials found
                </Badge>
                {(selectedCategory !== 'all' || selectedDifficulty !== 'all' || searchQuery || selectedSort !== 'newest') && (
                  <Badge style={{ backgroundColor: colors.quaternary, color: 'white' }}>
                    Filters applied
                  </Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={resetFilters}
                style={{ borderColor: colors.tertiary, color: colors.tertiary }}
              >
                Reset Filters
              </Button>
            </CardFooter>
          </Card>
          
          {/* Tutorials Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-full" style={{ backgroundColor: colors.surface }}>
                  <CardHeader>
                    <Skeleton className="h-4 w-16 mb-2" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                    <Skeleton className="h-6 w-full mb-2" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                    <Skeleton className="h-4 w-3/4" style={{ backgroundColor: `${colors.textSecondary}40` }} />
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
          ) : filteredTutorials.length === 0 ? (
            <Alert 
              className="border-2 animate-pulse" 
              style={{ 
                backgroundColor: colors.surface, 
                borderColor: colors.tertiary,
                color: colors.textPrimary
              }}
            >
              <AlertTitle className="font-bold title-font">No tutorials found</AlertTitle>
              <AlertDescription>
                Try adjusting your filters or search query to find tutorials.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredTutorials.map((tutorial, index) => renderTutorialCard(tutorial, index))}
            </div>
          )}
          
          {/* Featured Collections Section */}
          <div className="mt-12">
            <h2 className="text-xl font-bold title-font mb-4 flex items-center gap-2" style={{ color: colors.quaternary }}>
              <Layers className="w-5 h-5" /> Featured Learning Paths
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Collection 1 */}
              <Card 
                className="border-2 hover:shadow-md transition-all cursor-pointer" 
                style={{ 
                  backgroundColor: colors.surface,
                  borderColor: colors.quaternary
                }}
                onClick={() => navigate('/tutorials/paths/math-fundamentals')}
              >
                <CardHeader>
                  <CardTitle style={{ color: colors.quaternary }}>Mathematics Fundamentals</CardTitle>
                  <CardDescription>
                    A comprehensive path from basic algebra to calculus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm flex items-center" style={{ color: colors.textSecondary }}>
                      <GraduationCap className="w-4 h-4 mr-1" /> 12 Tutorials
                    </span>
                    <span className="text-sm flex items-center" style={{ color: colors.textSecondary }}>
                      <Clock className="w-4 h-4 mr-1" /> 8 hours total
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" style={{ borderColor: colors.quaternary, color: colors.quaternary }}>
                      Algebra
                    </Badge>
                    <Badge variant="outline" style={{ borderColor: colors.quaternary, color: colors.quaternary }}>
                      Geometry
                    </Badge>
                    <Badge variant="outline" style={{ borderColor: colors.quaternary, color: colors.quaternary }}>
                      Calculus
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    style={{ backgroundColor: colors.quaternary, color: 'white' }}
                  >
                    Start Learning Path <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Collection 2 */}
              <Card 
                className="border-2 hover:shadow-md transition-all cursor-pointer" 
                style={{ 
                  backgroundColor: colors.surface,
                  borderColor: colors.primary
                }}
                onClick={() => navigate('/tutorials/paths/programming-basics')}
              >
                <CardHeader>
                  <CardTitle style={{ color: colors.primary }}>Programming Basics</CardTitle>
                  <CardDescription>
                    Learn the fundamentals of programming with hands-on exercises
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm flex items-center" style={{ color: colors.textSecondary }}>
                      <GraduationCap className="w-4 h-4 mr-1" /> 15 Tutorials
                    </span>
                    <span className="text-sm flex items-center" style={{ color: colors.textSecondary }}>
                      <Clock className="w-4 h-4 mr-1" /> 10 hours total
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" style={{ borderColor: colors.primary, color: colors.primary }}>
                      Python
                    </Badge>
                    <Badge variant="outline" style={{ borderColor: colors.primary, color: colors.primary }}>
                      Variables
                    </Badge>
                    <Badge variant="outline" style={{ borderColor: colors.primary, color: colors.primary }}>
                      Functions
                    </Badge>
                    <Badge variant="outline" style={{ borderColor: colors.primary, color: colors.primary }}>
                      Loops
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    style={{ backgroundColor: colors.primary, color: 'white' }}
                  >
                    Start Learning Path <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
          
          {/* Contribute Section */}
          <Card 
            className="mt-8 border-2" 
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.secondary
            }}
          >
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-2 title-font" style={{ color: colors.secondary }}>
                    Contribute Your Knowledge
                  </h3>
                  <p style={{ color: colors.textSecondary }}>
                    Share your expertise by creating tutorials to help others learn.
                  </p>
                </div>
                <Button 
                  style={{ backgroundColor: colors.secondary, color: colors.textPrimary }}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Create a Tutorial
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>
    </MainLayout>
  );
};

export default TutorialsPage;