import React from 'react';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  Badge, Button 
} from '@/components/ui';
import { Users } from 'lucide-react';
import { RevisionRoom } from '@/types/index3';

interface RoomCardProps {
  room: RevisionRoom;
  onJoin: (room: RevisionRoom) => void;
  colors: any;
  formatDate: (dateString: string) => string;
  faculties: any[];
}

export const RoomCard: React.FC<RoomCardProps> = ({ 
  room, 
  onJoin, 
  colors, 
  formatDate,
  faculties 
}) => {
  const getFacultyColor = (facultyCode?: string): string => {
    if (!facultyCode) return colors.tertiary;
    const faculty = faculties.find(f => f.code === facultyCode);
    return faculty ? faculty.color : colors.tertiary;
  };

  const facultyColor = getFacultyColor(room.facultyCode);
  
  return (
    <Card 
      className="h-full border hover:shadow-lg cursor-pointer transition-all duration-300" 
      style={{ 
        backgroundColor: colors.surface, 
        borderColor: facultyColor, 
        borderLeftWidth: '4px' 
      }}
      onClick={() => onJoin(room)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2 font-bold title-font" style={{ color: facultyColor }}>
            {room.name}
          </CardTitle>
          <Badge style={{ backgroundColor: facultyColor, color: 'white' }}>
            {room.faculty}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1 text-xs" style={{ color: colors.textSecondary }}>
          <span>{room.unit_code}</span>
          <span className="mx-1">•</span>
          <span>{room.topic}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm line-clamp-2 mb-2" style={{ color: colors.textSecondary }}>
          {room.description}
        </p>
        <div className="flex flex-wrap gap-1 mb-3">
          {room.tags && room.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs" style={{ borderColor: facultyColor, color: facultyColor }}>
              {tag}
            </Badge>
          ))}
          {room.tags && room.tags.length > 3 && (
            <Badge variant="outline" className="text-xs" style={{ borderColor: facultyColor, color: facultyColor }}>
              +{room.tags.length - 3}
            </Badge>
          )}
        </div>
        <div className="flex justify-between items-center text-xs" style={{ color: colors.textSecondary }}>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {room.activeMembers}/{room.memberCount} online
          </div>
          <div className="flex items-center gap-1">
            <span>Created: {formatDate(room.created_at).slice(0, 6)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          className="w-full"
          style={{ backgroundColor: facultyColor, color: 'white' }}
        >
          Join Room
        </Button>
      </CardFooter>
    </Card>
  );
};