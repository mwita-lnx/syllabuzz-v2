'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  BookA, 
  GraduationCap, 
  BookCopy
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

// Import reusable components
import { MainLayout } from '@/components/MainLayout';
import { UnitCard } from '@/components/UnitCard';
import { NoteCard } from '@/components/NoteCard';
import { FacultySelector } from '@/components/FacultySelector';

// Import types
import { Unit, Note, User, Faculty } from '@/types';

// Import services
import { getAllNotes, getTrendingNotes } from '@/services/note-service';
import { getAllUnits, getFeaturedUnits } from '@/services/unit-service';
import { getFacultiesWithFallback } from '@/services/faculty-service';

export default function Home() {
  // State management
  const [units, setUnits] = useState<Unit[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [trendingNotes, setTrendingNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  
  const router = useRouter();
  
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
    fetchFaculties();
    
    // Mock user for demo (TODO: Replace with actual user authentication)
    setUser({
      _id: '1234',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'student'
    });
  }, []);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
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

  const fetchFaculties = async () => {
    try {
      const facultiesData = await getFacultiesWithFallback();
      setFaculties(facultiesData);
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };
  
  // Fetch units
  const fetchUnits = async (): Promise<void> => {
    try {
      const featuredUnitsData = await getFeaturedUnits(6);
      setUnits(featuredUnitsData);
    } catch (error) {
      console.error('Error fetching units:', error);
      // Fallback to empty array
      setUnits([]);
    }
  };
  
  // Fetch notes
  const fetchNotes = async (): Promise<void> => {
    try {
      const notesResponse = await getAllNotes({ limit: 6, sort: 'recent' });
      setNotes(notesResponse.notes || notesResponse.data || notesResponse.items || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      // Fallback to empty array
      setNotes([]);
    }
  };
  
  // Fetch trending
  const fetchTrending = async (): Promise<void> => {
    try {
      const trendingNotesData = await getTrendingNotes(4);
      setTrendingNotes(trendingNotesData);
    } catch (error) {
      console.error('Error fetching trending:', error);
      // Fallback to empty array
      setTrendingNotes([]);
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
            <Card 
              className="bg-gradient-to-br text-white h-full cursor-pointer transition-transform hover:scale-105" 
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary}CC, ${colors.quaternary})`,
              }}
              onClick={() => router.push('/units')}
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
                  className="font-medium"
                  style={{ backgroundColor: 'white', color: colors.primary }}
                >
                  Browse Units
                </Button>
              </CardFooter>
            </Card>
            
            <Card 
              className="bg-gradient-to-br text-white h-full cursor-pointer transition-transform hover:scale-105"
              style={{ 
                background: `linear-gradient(135deg, ${colors.secondary}CC, ${colors.primary})`,
              }}
              onClick={() => router.push('/notes')}
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
                  className="font-medium"
                  style={{ backgroundColor: 'white', color: colors.secondary }}
                >
                  Read Notes
                </Button>
              </CardFooter>
            </Card>
            
            <Card 
              className="bg-gradient-to-br text-white h-full cursor-pointer transition-transform hover:scale-105"
              style={{ 
                background: `linear-gradient(135deg, ${colors.tertiary}CC, ${colors.quaternary})`,
              }}
              onClick={() => router.push('/revision')}
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
                  className="font-medium"
                  style={{ backgroundColor: 'white', color: colors.tertiary }}
                >
                  Start Revising
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
        
        {/* Recent Notes Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold title-font" style={{ color: colors.secondary }}>Recent Notes</h2>
            <Button 
              variant="link" 
              onClick={() => router.push('/notes')}
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
              onClick={() => router.push('/units')}
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
                    onClick={() => router.push(`/units/${unit._id}`)}
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
}
