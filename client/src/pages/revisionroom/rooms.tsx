import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardContent,  CardFooter, CardHeader, CardTitle,
  Input, Button, Badge, Alert, AlertTitle, AlertDescription
} from '@/components/ui';
import {
  GraduationCap, Search, Filter, Activity, TrendingUp, BookOpen,
  Plus, Users, Book, Star, ArrowRight
} from 'lucide-react';
import { FacultySelector } from '@/components/FacultySelector';
import { RoomCard } from './components/RoomCard';
import { CreateRoomForm } from './components/CreateRoomForm';
import { MainLayout } from '@/components/MainLayout';
import roomService from '@/services/room-service';
import { RevisionRoom } from '@/types/index3';
import { getUser } from '@/services/api-backend';

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

const RevisionRoomListPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getUser();
  
  // State management
  const [revisionRooms, setRevisionRooms] = useState<RevisionRoom[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [faculties, setFaculties] = useState<any[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState<boolean>(false);
  const [filteredRooms, setFilteredRooms] = useState<RevisionRoom[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch data on component mount
  useEffect(() => {
    fetchData();
    
    // Set faculties
    setFaculties([
      { id: '1', name: 'Science', code: 'sci', color: '#FF6B6B' },
      { id: '2', name: 'Arts', code: 'arts', color: '#4ECDC4' },
      { id: '3', name: 'Business', code: 'bus', color: '#FFD166' },
      { id: '4', name: 'Engineering', code: 'eng', color: '#6A0572' },
      { id: '5', name: 'Medicine', code: 'med', color: '#06D6A0' }
    ]);
  }, []);
  
  // Filter rooms when dependencies change
  useEffect(() => {
    if (revisionRooms.length) {
      filterRooms();
    }
  }, [revisionRooms, selectedFaculty, searchQuery]);
  
  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch rooms
      const roomsResponse = await roomService.getRooms();
      
      if (roomsResponse.success && roomsResponse.data) {
        setRevisionRooms(roomsResponse.data);
        setFilteredRooms(roomsResponse.data);
      } else {
        setError(roomsResponse.error || 'Failed to fetch study rooms');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('An error occurred while fetching data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter rooms based on search and faculty
  const filterRooms = () => {
    let filtered = [...revisionRooms];
    
    // Apply faculty filter
    if (selectedFaculty !== 'all') {
      filtered = filtered.filter(room => room.facultyCode === selectedFaculty);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room => 
        room.name.toLowerCase().includes(query) || 
        (room.description && room.description.toLowerCase().includes(query)) ||
        room.unit_code.toLowerCase().includes(query) ||
        (room.unitName && room.unitName.toLowerCase().includes(query)) ||
        room.topic.toLowerCase().includes(query) ||
        (room.tags && room.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    setFilteredRooms(filtered);
  };

  // Join a revision room
  const joinRoom = (room: RevisionRoom) => {
    navigate(`/revision/${room._id}`);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <MainLayout>
      <FadeIn>
        <div>
          {/* Header section */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 title-font" style={{ color: colors.tertiary }}>
              <GraduationCap className="w-6 h-6" /> Revision Room
            </h2>
            
            <Button 
              onClick={() => setShowCreateRoom(true)}
              style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}
            >
              <Plus className="w-4 h-4 mr-2" /> Create Study Room
            </Button>
          </div>
          
          {/* Create Room Modal */}
          {showCreateRoom && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4" style={{ color: colors.tertiary }}>Create a New Study Room</h3>
                
                <CreateRoomForm 
                  onCancel={() => {
                    setShowCreateRoom(false);
                    setError(null);
                  }}
                  onSuccess={(newRoom) => {
                    setShowCreateRoom(false);
                    joinRoom(newRoom);
                  }}
                  faculties={faculties}
                  colors={colors}
                />
              </div>
            </div>
          )}
          
          {/* Display error message if any */}
          {error && !showCreateRoom && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-6">
            {/* Room Search and Filters */}
            <Card className="mb-6" style={{ backgroundColor: colors.surface }}>
              <CardHeader>
                <CardTitle className="flex items-center text-lg" style={{ color: colors.tertiary }}>
                  <Filter className="w-5 h-5 mr-2" /> Find a Study Room
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="md:col-span-2">
                    <form className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" style={{ color: colors.textSecondary }} />
                      <Input
                        type="text"
                        placeholder="Search by unit code, topic, tags..."
                        className="w-full pl-10 border-2 focus:ring-2 focus:border-transparent transition-all"
                        style={{ 
                          borderColor: colors.tertiary,
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
                      primaryColor={colors.tertiary}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div>
                  <Badge className="mr-2" style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}>
                    {filteredRooms.length} rooms found
                  </Badge>
                  {(selectedFaculty !== 'all' || searchQuery) && (
                    <Badge style={{ backgroundColor: colors.quaternary, color: 'white' }}>
                      Filters applied
                    </Badge>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFaculty('all');
                  }}
                  style={{ borderColor: colors.tertiary, color: colors.tertiary }}
                >
                  Reset Filters
                </Button>
              </CardFooter>
            </Card>
            
            {/* Room Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br text-white hover:shadow-md transition-all cursor-pointer" style={{ background: `linear-gradient(135deg, ${colors.tertiary}CC, ${colors.quaternary})` }}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" /> Active Rooms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2">Join rooms with active study sessions happening now.</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" />
                    <span>38 students currently studying</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-white text-tertiary font-medium">
                    Browse Active Rooms
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="bg-gradient-to-br text-white hover:shadow-md transition-all cursor-pointer" style={{ background: `linear-gradient(135deg, ${colors.primary}CC, ${colors.tertiary})` }}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" /> Popular Rooms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2">Join the most popular study rooms for your courses.</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4" />
                    <span>Based on student attendance and ratings</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-white text-primary font-medium">
                    Find Popular Rooms
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="bg-gradient-to-br text-white hover:shadow-md transition-all cursor-pointer" style={{ background: `linear-gradient(135deg, ${colors.secondary}CC, ${colors.tertiary})` }}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" /> My Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2">Quick access to study rooms for courses you're enrolled in.</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Book className="w-4 h-4" />
                    <span>5 courses with active study rooms</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-white text-secondary font-medium">
                    My Course Rooms
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Room Listing */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="h-full" style={{ backgroundColor: colors.surface }}>
                    <CardHeader>
                      <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-4 w-1/2 bg-gray-200 rounded mt-2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                    </CardContent>
                    <CardFooter>
                      <div className="h-8 w-full bg-gray-200 rounded"></div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <Alert 
                className="border-2 animate-pulse" 
                style={{ 
                  backgroundColor: colors.surface, 
                  borderColor: colors.tertiary,
                  color: colors.textPrimary
                }}
              >
                <AlertTitle className="font-bold title-font">No study rooms found</AlertTitle>
                <AlertDescription>
                  Try adjusting your filters or create a new study room.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredRooms.map((room, index) => (
                  <div key={room.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                    <RoomCard 
                      room={room} 
                      onJoin={joinRoom} 
                      colors={colors}
                      formatDate={formatDate}
                      faculties={faculties}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </FadeIn>
    </MainLayout>
  );
};

export default RevisionRoomListPage;