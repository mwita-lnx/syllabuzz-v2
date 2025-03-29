import React from 'react';
import {
  Card, CardHeader, CardContent, CardFooter, CardTitle,
  Button, Progress, Avatar, AvatarFallback
} from '@/components/ui';
import {
  BarChart, ArrowRight, CheckCircle, Clock, FileText, CheckSquare,
  MessageSquare, Activity, Award, Star
} from 'lucide-react';
import { RevisionRoom } from '@/types/index3';
import { getUser } from '@/services/api-backend';

interface ProgressFeatureProps {
  room: RevisionRoom;
  colors: any;
  getFacultyColor: (facultyCode?: string) => string;
}

export const ProgressFeature: React.FC<ProgressFeatureProps> = ({ 
  room, 
  colors, 
  getFacultyColor 
}) => {
  const currentUser = getUser();
  
  return (
    <div className="mt-6 space-y-4">
      <Card style={{ backgroundColor: colors.surface }}>
        <CardHeader>
          <CardTitle className="flex items-center" style={{ color: getFacultyColor(room.facultyCode) }}>
            <BarChart className="w-5 h-5 mr-2" /> Study Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2" style={{ color: getFacultyColor(room.facultyCode) }}>Your Current Progress</h4>
              <div className="flex items-center mb-2">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm" style={{ color: colors.textSecondary }}>Overall Progress</span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>65%</span>
                  </div>
                  <Progress value={65} className="h-2" style={{ backgroundColor: `${getFacultyColor(room.facultyCode)}20` }} />
                </div>
              </div>
              <div className="space-y-3 mt-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm" style={{ color: colors.textSecondary }}>Topic 1</span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>80%</span>
                  </div>
                  <Progress value={80} className="h-1.5" style={{ backgroundColor: `${colors.secondary}20` }} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm" style={{ color: colors.textSecondary }}>Topic 2</span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>70%</span>
                  </div>
                  <Progress value={70} className="h-1.5" style={{ backgroundColor: `${colors.tertiary}20` }} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm" style={{ color: colors.textSecondary }}>Topic 3</span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>45%</span>
                  </div>
                  <Progress value={45} className="h-1.5" style={{ backgroundColor: `${colors.primary}20` }} />
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2" style={{ color: getFacultyColor(room.facultyCode) }}>Study Activity</h4>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: colors.tertiary }} />
                    <span style={{ color: colors.textSecondary }}>Total study time</span>
                  </div>
                  <span className="font-bold" style={{ color: colors.textPrimary }}>12h 45m</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: colors.tertiary }} />
                    <span style={{ color: colors.textSecondary }}>Resources accessed</span>
                  </div>
                  <span className="font-bold" style={{ color: colors.textPrimary }}>8</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" style={{ color: colors.tertiary }} />
                    <span style={{ color: colors.textSecondary }}>Quizzes taken</span>
                  </div>
                  <span className="font-bold" style={{ color: colors.textPrimary }}>3</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" style={{ color: colors.tertiary }} />
                    <span style={{ color: colors.textSecondary }}>Chat participation</span>
                  </div>
                  <span className="font-bold" style={{ color: colors.textPrimary }}>High</span>
                </div>
              </div>
            </div>
          </div>
          
          <h4 className="font-medium mb-4" style={{ color: getFacultyColor(room.facultyCode) }}>Skills Assessment</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm" style={{ color: colors.textSecondary }}>Skill Area 1</span>
                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Good</span>
              </div>
              <Progress value={75} className="h-1.5" style={{ backgroundColor: `${colors.tertiary}20` }} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm" style={{ color: colors.textSecondary }}>Skill Area 2</span>
                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Very Good</span>
              </div>
              <Progress value={85} className="h-1.5" style={{ backgroundColor: `${colors.tertiary}20` }} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm" style={{ color: colors.textSecondary }}>Skill Area 3</span>
                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Needs Work</span>
              </div>
              <Progress value={35} className="h-1.5" style={{ backgroundColor: `${colors.tertiary}20` }} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm" style={{ color: colors.textSecondary }}>Skill Area 4</span>
                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Average</span>
              </div>
              <Progress value={60} className="h-1.5" style={{ backgroundColor: `${colors.tertiary}20` }} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}
          >
            <ArrowRight className="w-4 h-4 mr-2" /> Improve Skill Area 3
          </Button>
          <Button 
            className="flex-1"
            style={{ backgroundColor: getFacultyColor(room.facultyCode), color: 'white' }}
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Take Skill Assessment
          </Button>
        </CardFooter>
      </Card>
      
      {/* Gamification */}
      <Card style={{ backgroundColor: colors.surface }}>
        <CardHeader>
          <CardTitle className="flex items-center" style={{ color: getFacultyColor(room.facultyCode) }}>
            <Award className="w-5 h-5 mr-2" /> Achievements & Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
              <div 
                className="w-16 h-16 rounded-full mb-3 flex items-center justify-center" 
                style={{ backgroundColor: `${colors.tertiary}20` }}
              >
                <Clock className="w-8 h-8" style={{ color: colors.tertiary }} />
              </div>
              <h5 className="font-bold text-center" style={{ color: colors.textPrimary }}>Study Streak</h5>
              <div className="text-2xl font-bold" style={{ color: colors.tertiary }}>5 days</div>
              <p className="text-xs text-center mt-1" style={{ color: colors.textSecondary }}>
                Keep your streak going by studying daily
              </p>
            </div>
            
            <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
              <div 
                className="w-16 h-16 rounded-full mb-3 flex items-center justify-center" 
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Award className="w-8 h-8" style={{ color: colors.primary }} />
              </div>
              <h5 className="font-bold text-center" style={{ color: colors.textPrimary }}>Badges Earned</h5>
              <div className="text-2xl font-bold" style={{ color: colors.primary }}>7</div>
              <p className="text-xs text-center mt-1" style={{ color: colors.textSecondary }}>
                Keep learning to unlock more badges
              </p>
            </div>
            
            <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
              <div 
                className="w-16 h-16 rounded-full mb-3 flex items-center justify-center" 
                style={{ backgroundColor: `${colors.secondary}20` }}
              >
                <Star className="w-8 h-8" style={{ color: colors.secondary }} />
              </div>
              <h5 className="font-bold text-center" style={{ color: colors.textPrimary }}>Experience Points</h5>
              <div className="text-2xl font-bold" style={{ color: colors.secondary }}>1,250 XP</div>
              <p className="text-xs text-center mt-1" style={{ color: colors.textSecondary }}>
                Level 5 - 250 XP to next level
              </p>
            </div>
          </div>
          
          <h4 className="font-medium mb-3" style={{ color: getFacultyColor(room.facultyCode) }}>Room Leaderboard</h4>
          <div className="space-y-2">
            {room.participants
              .sort((a, b) => (a.user_id === currentUser?.userId ? -1 : b.user_id === currentUser?.userId ? 1 : 0))
              .map((participant, index) => (
                <div 
                  key={participant.user_id} 
                  className={`flex items-center justify-between p-3 rounded-md ${participant.user_id === currentUser?.userId ? 'bg-yellow-50 border border-yellow-200' : 'border'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold" style={{ color: colors.textSecondary }}>
                      {index + 1}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback style={{ backgroundColor: [colors.primary, colors.secondary, colors.tertiary, colors.quaternary][index % 4], color: 'white' }}>
                        {participant.user_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>
                        {participant.user_name} {participant.user_id === currentUser?.userId && '(You)'}
                      </p>
                      <div className="flex items-center gap-1 text-xs" style={{ color: colors.textSecondary }}>
                        <div className={`h-1.5 w-1.5 rounded-full ${participant.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>{participant.status === 'active' ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {(1000 + index * 100 * (index === 0 ? 2.5 : 1)).toLocaleString()} XP
                    </div>
                    {index === 0 && (
                      <div className="w-6 h-6" style={{ color: '#FFD700' }}>👑</div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};