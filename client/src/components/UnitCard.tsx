import React from 'react';
import { BookA, ChevronRight, FileText } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// Import types
import { Unit } from '../types/index2';

interface UnitCardProps {
  unit: Unit;
  onClick: (unitId: string) => void;
  color?: string;
}

export const UnitCard: React.FC<UnitCardProps> = ({ unit, onClick, color = '#FF6B6B' }) => {
  return (
    <div className="h-full transition-all hover-scale">
      <Card 
        className="h-full border hover:shadow-lg cursor-pointer transition-all duration-300" 
        onClick={() => onClick(unit._id)}
        style={{ 
          backgroundColor: '#F7F9FC', 
          borderColor: color, 
          borderLeftWidth: '4px' 
        }}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2 font-bold title-font" style={{ color }}>
              <BookA className="w-5 h-5" />
              {unit.name}
            </CardTitle>
            <Badge style={{ backgroundColor: color, color: '#FFFFFF' }}>
              {unit.faculty}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            {unit.code} {unit.level && `• ${unit.level}`} {unit.credits && `• ${unit.credits} Credits`}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm line-clamp-3 text-gray-600">{unit.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <FileText className="w-4 h-4 mr-1" />
            <span>{unit.keywords?.length || 0} keywords</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="hover:bg-opacity-20"
            style={{ color }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UnitCard;