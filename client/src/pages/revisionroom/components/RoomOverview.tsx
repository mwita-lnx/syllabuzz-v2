import React, { useState } from 'react';
import {
  Card, CardHeader, CardContent, CardFooter, CardTitle,
  Button, Badge, Separator
} from '@/components/ui';
import {
  Info, MessageSquare, ExternalLink, Download, 
  Sparkles, BarChart, Share2, FileText
} from 'lucide-react';
import { RevisionRoom, Poll } from '@/types/index3';
import { AITutorInterface } from '../components/AITutorInterface';
import { useRoomContext } from '../shared/RoomContext';

interface RoomOverviewProps {
  room: RevisionRoom;
  colors: any;
  getFacultyColor: (facultyCode?: string) => string;
  onChatJoin: () => void;
}

export const RoomOverview: React.FC<RoomOverviewProps> = ({
  room,
  colors,
  getFacultyColor,
  onChatJoin
}) => {
  const { currentPoll, votePoll, formatDate } = useRoomContext();
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [showAITutor, setShowAITutor] = useState<boolean>(false);

  const handleVotePoll = async (optionId: string) => {
    try {
      await votePoll(optionId);
      setIsPolling(true);
    } catch (err) {
      console.error('Error voting in poll:', err);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <Card style={{ backgroundColor: colors.surface }}>
        <CardHeader>
          <CardTitle className="flex items-center" style={{ color: getFacultyColor(room.facultyCode) }}>
            <Info className="w-5 h-5 mr-2" /> About This Study Room
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4" style={{ color: colors.textSecondary }}>
            {room.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {room.tags && room.tags.map((tag, index) => (
              <Badge key={index} style={{ backgroundColor: `${getFacultyColor(room.facultyCode)}20`, color: getFacultyColor(room.facultyCode) }}>
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-bold mb-2" style={{ color: getFacultyColor(room.facultyCode) }}>Current Focus</h4>
              <div className="p-3 rounded-lg" style={{ backgroundColor: `${getFacultyColor(room.facultyCode)}10` }}>
                <div className="flex items-center mb-1">
                  <Sparkles className="w-4 h-4 mr-2" style={{ color: getFacultyColor(room.facultyCode) }} />
                  <span className="font-medium" style={{ color: colors.textPrimary }}>{room.current_focus || 'General study'}</span>
                </div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  The group is currently focusing on this topic. Join the discussion in the chat.
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-2" style={{ color: getFacultyColor(room.facultyCode) }}>Room Activity</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textSecondary }}>Members studying:</span>
                  <span className="font-bold" style={{ color: colors.textPrimary }}>{room.activeMembers} students</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textSecondary }}>Created:</span>
                  <span style={{ color: colors.textPrimary }}>{formatDate(room.created_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textSecondary }}>Status:</span>
                  <Badge style={{ backgroundColor: colors.tertiary, color: 'white' }}>
                    Active Session
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button 
            className="flex-1"
            style={{ backgroundColor: getFacultyColor(room.facultyCode), color: 'white' }}
            onClick={onChatJoin}
          >
            <MessageSquare className="w-4 h-4 mr-2" /> Join Chat
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}
            onClick={() => window.open(`https://meet.google.com/room-${room.id}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" /> Join Video Call
          </Button>
        </CardFooter>
      </Card>
      
      {/* Materials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Past Papers */}
        <Card style={{ backgroundColor: colors.surface }}>
          <CardHeader>
            <CardTitle className="flex items-center" style={{ color: getFacultyColor(room.facultyCode) }}>
              <FileText className="w-5 h-5 mr-2" /> Related Past Papers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {room.papers && room.papers.length > 0 ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg border flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: colors.textPrimary }}>Data Structures & Algorithms Final Exam</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>CS202 • 2023 • Final</p>
                  </div>
                  <Button variant="outline" size="sm" style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-3 rounded-lg border flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: colors.textPrimary }}>Data Structures & Algorithms Sample Paper</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>CS202 • 2023 • Sample</p>
                  </div>
                  <Button variant="outline" size="sm" style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-center py-4" style={{ color: colors.textSecondary }}>
                No past papers have been added to this room yet.
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              variant="outline"
              style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}
            >
              <FileText className="w-4 h-4 mr-2" /> Browse Past Papers
            </Button>
          </CardFooter>
        </Card>
        
        {/* Active Poll */}
        <Card style={{ backgroundColor: colors.surface }}>
          <CardHeader>
            <CardTitle className="flex items-center" style={{ color: getFacultyColor(room.facultyCode) }}>
              <BarChart className="w-5 h-5 mr-2" /> Current Poll
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentPoll ? (
              <div>
                <p className="font-medium mb-3" style={{ color: colors.textPrimary }}>{currentPoll.question}</p>
                <div className="space-y-3 mb-4">
                  {currentPoll.options.map((option) => (
                    <div key={option.id} className="relative">
                      <Button 
                        className="w-full justify-between h-auto py-2 px-3 font-normal"
                        variant={isPolling && option.id === 'po2' ? 'default' : 'outline'}
                        style={
                          isPolling && option.id === 'po2' 
                            ? { backgroundColor: getFacultyColor(room.facultyCode), color: 'white' } 
                            : { borderColor: colors.border, color: colors.textPrimary }
                        }
                        onClick={() => handleVotePoll(option.id)}
                        disabled={isPolling}
                      >
                        <span>{option.text}</span>
                        <span>{option.votes} votes</span>
                      </Button>
                      <div 
                        className="absolute left-0 top-0 h-full rounded-l-md transition-all" 
                        style={{ 
                          width: `${Math.round((option.votes / currentPoll.totalVotes) * 100)}%`,
                          backgroundColor: `${getFacultyColor(room.facultyCode)}20`,
                          opacity: 0.5,
                          zIndex: 0
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-center" style={{ color: colors.textSecondary }}>
                  {currentPoll.totalVotes} total votes • Poll ends in 15 minutes
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p style={{ color: colors.textSecondary }}>No active polls at the moment.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}
                >
                  Create Poll
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* AI Tutor Section */}
      <Card style={{ backgroundColor: colors.surface }}>
        <CardHeader>
          <CardTitle className="flex items-center" style={{ color: colors.quaternary }}>
            <Sparkles className="w-5 h-5 mr-2" /> AI Study Tutor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.quaternary }}>
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-medium" style={{ color: colors.textPrimary }}>Get personalized help with your studies</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Ask questions about course material, get explanations, and practice problems.
              </p>
            </div>
          </div>
          <Button 
            className="w-full"
            style={{ backgroundColor: `${colors.quaternary}15`, color: colors.quaternary }}
            onClick={() => setShowAITutor(!showAITutor)}
          >
            <Sparkles className="w-4 h-4 mr-2" /> Ask AI Tutor
          </Button>
        </CardContent>
      </Card>
      
      {/* AI Tutor Expanded Section */}
      {showAITutor && (
        <Card style={{ backgroundColor: colors.surface, borderColor: colors.quaternary, borderWidth: '2px' }}>
          <CardHeader>
            <CardTitle className="flex items-center" style={{ color: colors.quaternary }}>
              <Sparkles className="w-5 h-5 mr-2" /> AI Study Tutor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AITutorInterface 
              colors={colors} 
              roomId={room.id} 
              topic={room.topic || room.name}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};