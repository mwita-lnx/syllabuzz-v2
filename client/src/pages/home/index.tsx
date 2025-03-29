import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Menu, 
  X, 
  Home, 
  Sparkles, 
  BookA, 
  GraduationCap, 
  BookCopy,
  BookmarkPlus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigate, useNavigate } from 'react-router-dom';

// Import reusable components
import { MainLayout } from '@/components/MainLayout';
import { UnitCard } from '@/components/UnitCard';
import { NoteCard } from '@/components/NoteCard';
import { FacultySelector } from '@/components/FacultySelector';

// Import types
import { Unit, Note, User, Faculty } from '@/types/index2';

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

const HomePage: React.FC = () => {
  // State management
  const [units, setUnits] = useState<Unit[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [trendingNotes, setTrendingNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  
  const navigate = useNavigate();
  
  // Theme colors
  const colors = {
    primary: '#FF6B6B',         // Coral Red (Energetic, attention-grabbing)
    secondary: '#4ECDC4',       // Turquoise (Fresh, modern)
    tertiary: '#FFD166',        // Golden Yellow (Warm, inviting)
    quaternary: '#6A0572',      // Deep Purple (Rich contrast)
    background: '#FFFFFF',      // Crisp White (Clean background)
    surface: '#F7F9FC',         // Ice Blue (Subtle surface variation)
    elevatedSurface: '#FFFFFF', // White for elevated surfaces
    textPrimary: '#2D3748',     // Deep Blue-Gray (Main text)
    textSecondary: '#4A5568',   // Medium Gray (Secondary text)
    textMuted: '#718096',       // Soft Gray (Hints, placeholders)
    border: '#E2E8F0',          // Soft Gray border
  };
  
  // Fetch initial data
  useEffect(() => {
    fetchData();
    
    // Mock user for demo
    setUser({
      id: '1234',
      name: 'John Doe',
      email: 'john@example.com',
      units: [],
      faculty: 'Science'
    });
    
    // Mock faculties
    setFaculties([
      { id: '1', name: 'Science', code: 'sci', color: '#FF6B6B' },
      { id: '2', name: 'Arts', code: 'arts', color: '#4ECDC4' },
      { id: '3', name: 'Business', code: 'bus', color: '#FFD166' },
      { id: '4', name: 'Engineering', code: 'eng', color: '#6A0572' },
      { id: '5', name: 'Medicine', code: 'med', color: '#06D6A0' }
    ]);
  }, []);
  
  const fetchData = async () => {
    try {
      // Simulate API calls with mock data for demo
      await Promise.all([
        fetchUnits(),
        fetchNotes(),
        fetchTrending()
      ]);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };
  
  // Fetch units
  const fetchUnits = async (): Promise<void> => {
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
        }
      ];
      
      setUnits(mockUnits);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };
  
  // Fetch notes
  const fetchNotes = async (): Promise<void> => {
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
        }
      ];
      
      setNotes(mockNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };
  
  // Fetch trending
  const fetchTrending = async (): Promise<void> => {
    try {
      // Mock API call - for demo, using same notes but different order
      const mockTrending = [
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
        }
      ];
      
      setTrendingNotes(mockTrending);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };
  
  // Filter units by faculty
  const getFilteredUnits = () => {
    if (selectedFaculty === 'all') {
      return units;
    }
    return units.filter(unit => unit.facultyCode === selectedFaculty);
  };
  
  // Filter notes by faculty
  const getFilteredNotes = () => {
    if (selectedFaculty === 'all') {
      return notes;
    }
    return notes.filter(note => note.facultyCode === selectedFaculty);
  };
  
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold title-font" style={{ color: colors.primary }}>
              Welcome to SyllaBuzz
            </h2>
            <FacultySelector 
              faculties={faculties} 
              selectedFaculty={selectedFaculty}
              onSelect={setSelectedFaculty}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="hover-scale transition-all duration-300">
              <Card 
                className="bg-gradient-to-br text-white h-full glow-effect" 
                style={{ 
                  background: `linear-gradient(135deg, ${colors.primary}CC, ${colors.quaternary})`,
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center title-font">
                    <BookA className="w-5 h-5 mr-2" /> Explore Units
                  </CardTitle>
                  <CardDescription className="text-white/90">
                    Discover academic units across disciplines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Browse our collection of units from various faculties to find learning resources tailored to your interests.</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate('/units')}
                    className="font-medium"
                    style={{ backgroundColor: 'white', color: colors.primary }}
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
                  background: `linear-gradient(135deg, ${colors.secondary}CC, ${colors.primary})`,
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center title-font">
                    <BookCopy className="w-5 h-5 mr-2" /> Latest Notes
                  </CardTitle>
                  <CardDescription className="text-white/90">
                    Stay updated with academic materials
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Get the latest notes and academic papers across various disciplines and subjects.</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate('/notes')}
                    className="font-medium"
                    style={{ backgroundColor: 'white', color: colors.secondary }}
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
                  background: `linear-gradient(135deg, ${colors.tertiary}CC, ${colors.quaternary})`,
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
                    onClick={() => navigate('/revision')}
                    className="font-medium"
                    style={{ backgroundColor: 'white', color: colors.tertiary }}
                  >
                    Start Revising
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Recent Notes Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold title-font" style={{ color: colors.secondary }}>Recent Notes</h2>
            <Button 
              variant="link" 
              onClick={() => navigate('/notes')}
              style={{ color: colors.secondary }}
            >
              View All →
            </Button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getFilteredNotes().slice(0, 3).map((note, index) => (
                <div key={note._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                  <NoteCard note={note} />
                </div>
              ))}
            </div>
          )}
        </section>
        
        {/* Featured Units Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold title-font" style={{ color: colors.primary }}>Featured Units</h2>
            <Button 
              variant="link" 
              onClick={() => navigate('/units')}
              style={{ color: colors.primary }}
            >
              View All →
            </Button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getFilteredUnits().slice(0, 3).map((unit, index) => (
                <div key={unit._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                  <UnitCard 
                    unit={unit} 
                    onClick={() => navigate(`/units/${unit._id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
        
        {/* Trending Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 title-font" style={{ color: colors.tertiary }}>
              <Sparkles className="w-5 h-5" /> Trending Now
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchTrending}
              className="border-2 font-medium transition-all"
              style={{ borderColor: colors.tertiary, color: colors.tertiary }}
            >
              Refresh
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trendingNotes.map((note, index) => (
              <div key={note._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                <NoteCard note={note} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default HomePage;