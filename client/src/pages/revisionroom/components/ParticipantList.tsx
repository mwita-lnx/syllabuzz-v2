import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, Avatar, AvatarFallback } from '@/components/ui';
import { Users } from 'lucide-react';
import { RevisionRoom } from '@/types/index3';
import { getUser } from '@/services/api-backend';

interface ParticipantsListProps {
  room: RevisionRoom;
  colors: any;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({ room, colors }) => {
  const currentUser = getUser();
  
  // Get faculty color
  const getFacultyColor = (facultyCode?: string): string => {
    if (!facultyCode) return colors.tertiary;
    return colors.tertiary; // Use a default for now, would be replaced with actual faculty color
  };

  return (
    <Card style={{ backgroundColor: colors.surface }}>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center" style={{ color: getFacultyColor(room.facultyCode) }}>
          <Users className="w-4 h-4 mr-2" /> Participants ({room.activeMembers}/{room.participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {room.participants.map((participant) => (
            <div key={participant.user_id} className="flex items-center gap-2 py-1">
              <div className={`w-2 h-2 rounded-full ${participant.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <Avatar className="h-6 w-6">
                <AvatarFallback style={{ backgroundColor: participant.user_id === currentUser?.userId ? colors.primary : colors.secondary, color: 'white' }}>
                  {participant.user_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span 
                className={participant.user_id === currentUser?.userId ? 'font-semibold' : ''}
                style={{ color: colors.textPrimary }}
              >
                {participant.user_name} {participant.user_id === currentUser?.userId && '(You)'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};