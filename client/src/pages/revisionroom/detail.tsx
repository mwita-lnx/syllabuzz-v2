import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui';
import {
  Info, MessageSquare, FileText, BarChart, Clock,
  PanelRight, GraduationCap
} from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';
import { FadeIn } from './components/FadeIn';
import { RoomHeader } from './components/RoomHeader';
import { RoomOverview } from './components/RoomOverview';
import { ChatFeature } from './components/ChatFeature';
import { ResourcesFeature } from './components/ResourceFeature';
import { ProgressFeature } from './components/ProgressFeature';
import { ParticipantsList } from './components/ParticipantList';
import { RoomProvider, useRoomContext } from './shared/RoomContext';
import { StudyTimer } from './components/StudyTImer';

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

// Wrapper component that uses the context
const RoomDetail: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentRoom, loadRoom, leaveRoom, error, 
    isLoading, updateStatus, roomUserStatus
  } = useRoomContext();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);
  const [studyTimer, setStudyTimer] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const { roomId } = useParams<{ roomId: string }>();

  // Effect for handling roomId from URL parameters
  useEffect(() => {
    if (roomId) {
      loadRoom(roomId);
    }
  }, [roomId, loadRoom]);

  // Handle study timer
  useEffect(() => {
    if (timerActive) {
      const interval = setInterval(() => {
        setStudyTimer(prevTimer => prevTimer + 1);
      }, 1000);
      
      setTimerInterval(interval);
      
      return () => clearInterval(interval);
    } else if (timerInterval) {
      clearInterval(timerInterval);
    }
  }, [timerActive]);

  // Format timer display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Toggle timer
  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  // Reset timer
  const resetTimer = () => {
    setStudyTimer(0);
    setTimerActive(false);
  };

  // Get faculty color
  const getFacultyColor = (facultyCode?: string): string => {
    if (!facultyCode) return colors.tertiary;
    return colors.tertiary; // Use a default for now, would be replaced with actual faculty color
  };

  if (!currentRoom || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tertiary mx-auto mb-4" style={{ borderColor: colors.tertiary }}></div>
          <p style={{ color: colors.textSecondary }}>Loading room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <div className="mt-3">
          <Button
            onClick={() => navigate('/revision')}
            style={{ backgroundColor: colors.tertiary, color: 'white' }}
          >
            Back to Rooms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <FadeIn>
        <div>
          {/* Header section */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 title-font" style={{ color: colors.tertiary }}>
              <GraduationCap className="w-6 h-6" /> Revision Room
            </h2>
            
            <div className="flex items-center gap-4">
              {/* Study Timer */}
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold font-mono" style={{ color: colors.tertiary }}>
                  {formatTime(studyTimer)}
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={toggleTimer}
                    style={{ 
                      borderColor: colors.tertiary, 
                      color: timerActive ? colors.tertiary : colors.textSecondary 
                    }}
                  >
                    {timerActive ? (
                      <span className="h-3 w-3 bg-tertiary" style={{ backgroundColor: colors.tertiary }}></span>
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={resetTimer}
                    style={{ borderColor: colors.tertiary, color: colors.textSecondary }}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
                style={{ 
                  borderColor: colors.tertiary, 
                  color: colors.tertiary,
                  backgroundColor: roomUserStatus === 'studying' ? `${colors.tertiary}20` : undefined
                }}
                onClick={() => updateStatus(roomUserStatus === 'studying' ? 'idle' : 'studying')}
              >
                <div className={`h-2 w-2 rounded-full ${roomUserStatus === 'studying' ? 'animate-pulse' : ''}`} style={{ backgroundColor: roomUserStatus === 'studying' ? colors.tertiary : '#9CA3AF' }}></div>
                {roomUserStatus === 'studying' ? 'Studying' : 'Set Status'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowRightPanel(!showRightPanel)}
                style={{ borderColor: colors.tertiary, color: colors.tertiary }}
              >
                <PanelRight className="w-4 h-4 mr-2" /> {showRightPanel ? 'Hide' : 'Show'} Panel
              </Button>
              
              <Button 
                variant="outline" 
                className="gap-2 text-red-500 border-red-500 hover:bg-red-50"
                onClick={() => {
                  leaveRoom();
                  navigate('/revision');
                }}
              >
                Leave Room
              </Button>
            </div>
          </div>

          {/* Room Header */}
          <RoomHeader room={currentRoom} colors={colors} />
          
          {/* Room Tabs and Content */}
          <div className="flex gap-6">
            <div className="flex-1">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-4" style={{ backgroundColor: `${colors.tertiary}20` }}>
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:text-white transition-all"
                    style={{ 
                      "--tw-bg-opacity": "1",
                      "--secondary": colors.tertiary,
                      "--tw-text-opacity": "1",
                      "--tw-white": colors.textPrimary,
                      "[data-state=active]:backgroundColor": colors.tertiary
                    }}
                  >
                    <Info className="w-4 h-4 mr-2" /> Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="chat" 
                    className="data-[state=active]:text-white transition-all"
                    style={{ 
                      "--tw-bg-opacity": "1",
                      "--secondary": colors.tertiary,
                      "--tw-text-opacity": "1",
                      "--tw-white": colors.textPrimary,
                      "[data-state=active]:backgroundColor": colors.tertiary
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Chat
                  </TabsTrigger>
                  <TabsTrigger 
                    value="resources" 
                    className="data-[state=active]:text-white transition-all"
                    style={{ 
                      "--tw-bg-opacity": "1",
                      "--secondary": colors.tertiary,
                      "--tw-text-opacity": "1",
                      "--tw-white": colors.textPrimary,
                      "[data-state=active]:backgroundColor": colors.tertiary
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" /> Resources
                  </TabsTrigger>
                  <TabsTrigger 
                    value="progress" 
                    className="data-[state=active]:text-white transition-all"
                    style={{ 
                      "--tw-bg-opacity": "1",
                      "--secondary": colors.tertiary,
                      "--tw-text-opacity": "1",
                      "--tw-white": colors.textPrimary,
                      "[data-state=active]:backgroundColor": colors.tertiary
                    }}
                  >
                    <BarChart className="w-4 h-4 mr-2" /> Progress
                  </TabsTrigger>
                </TabsList>
                
                {/* Overview Tab */}
                <TabsContent value="overview">
                  <RoomOverview 
                    room={currentRoom} 
                    colors={colors} 
                    getFacultyColor={getFacultyColor}
                    onChatJoin={() => setActiveTab('chat')}
                  />
                </TabsContent>
                
                {/* Chat Tab */}
                <TabsContent value="chat">
                  <ChatFeature 
                    room={currentRoom} 
                    colors={colors} 
                    getFacultyColor={getFacultyColor}
                  />
                </TabsContent>
                
                {/* Resources Tab */}
                <TabsContent value="resources">
                  <ResourcesFeature 
                    room={currentRoom} 
                    colors={colors} 
                    getFacultyColor={getFacultyColor}
                  />
                </TabsContent>
                
                {/* Progress Tab */}
                <TabsContent value="progress">
                  <ProgressFeature 
                    room={currentRoom} 
                    colors={colors} 
                    getFacultyColor={getFacultyColor}
                  />
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right Panel (Participants, Timer, etc.) */}
            {showRightPanel && (
              <div className="hidden md:block w-64 space-y-4">
                {/* Participants */}
                <ParticipantsList room={currentRoom} colors={colors} />
                
                {/* Timer */}
                <StudyTimer 
                  formatTime={formatTime} 
                  timer={studyTimer} 
                  isActive={timerActive} 
                  onToggle={toggleTimer} 
                  onReset={resetTimer} 
                  colors={colors}
                  getFacultyColor={getFacultyColor}
                  facultyCode={currentRoom.facultyCode}
                />
                
                {/* Quick Actions */}
                <Card style={{ backgroundColor: colors.surface }}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center" style={{ color: getFacultyColor(currentRoom.facultyCode) }}>
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      style={{ borderColor: getFacultyColor(currentRoom.facultyCode), color: getFacultyColor(currentRoom.facultyCode) }}
                    >
                      Ask AI Tutor
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      style={{ borderColor: getFacultyColor(currentRoom.facultyCode), color: getFacultyColor(currentRoom.facultyCode) }}
                    >
                      Create Poll
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      style={{ borderColor: getFacultyColor(currentRoom.facultyCode), color: getFacultyColor(currentRoom.facultyCode) }}
                    >
                      Share Room
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </FadeIn>
    </MainLayout>
  );
};

// The page component wraps the detail component with the context provider
const RevisionRoomDetailPage: React.FC = () => {
  return (
    <RoomProvider>
      <RoomDetail />
    </RoomProvider>
  );
};

export default RevisionRoomDetailPage;