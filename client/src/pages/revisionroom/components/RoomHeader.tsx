import React from 'react';
import { Card, CardContent, Badge, Avatar, AvatarFallback } from '@/components/ui';
import { RevisionRoom } from '@/types/index3';
import { getUser } from '@/services/api-backend';

interface RoomHeaderProps {
  room: RevisionRoom;
  colors: any;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({ room, colors }) => {
  const currentUser = getUser();

  // Get faculty color
  const getFacultyColor = (facultyCode?: string): string => {
    if (!facultyCode) return colors.tertiary;
    return colors.tertiary; // Use a default for now, would be replaced with actual faculty color
  };

  return (
    <Card className="mb-6" style={{ backgroundColor: colors.surface }}>
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge style={{ backgroundColor: getFacultyColor(room.facultyCode), color: 'white' }}>
                {room.faculty}
              </Badge>
              <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                {room.name}
              </h3>
            </div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {room.unit_code} - {room.unitName} • {room.topic}
            </p>
          </div>
          <div className="flex items-center">
            <div className="flex -space-x-2 mr-3">
              {room.participants.slice(0, 3).map((participant, index) => (
                <Avatar key={participant.user_id} className="border-2 border-white w-8 h-8">
                  <AvatarFallback style={{ backgroundColor: [colors.primary, colors.secondary, colors.tertiary][index % 3], color: 'white' }}>
                    {participant.user_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {room.participants.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs" style={{ color: colors.textSecondary }}>
                  +{room.participants.length - 3}
                </div>
              )}
            </div>
            <div className="text-sm" style={{ color: colors.textSecondary }}>
              <span className="font-bold">{room.activeMembers}</span> active / <span>{room.memberCount || room.participants.length}</span> total
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};