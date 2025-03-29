import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, Button } from '@/components/ui';
import { Clock } from 'lucide-react';

interface StudyTimerProps {
  formatTime: (seconds: number) => string;
  timer: number;
  isActive: boolean;
  onToggle: () => void;
  onReset: () => void;
  colors: any;
  getFacultyColor: (facultyCode?: string) => string;
  facultyCode?: string;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({ 
  formatTime, 
  timer, 
  isActive, 
  onToggle, 
  onReset, 
  colors,
  getFacultyColor,
  facultyCode
}) => {
  return (
    <Card style={{ backgroundColor: colors.surface }}>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center" style={{ color: getFacultyColor(facultyCode) }}>
          <Clock className="w-4 h-4 mr-2" /> Study Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold font-mono mb-3" style={{ color: getFacultyColor(facultyCode) }}>
            {formatTime(timer)}
          </div>
          <div className="flex gap-2">
            <Button 
              variant={isActive ? 'default' : 'outline'} 
              style={
                isActive 
                  ? { backgroundColor: getFacultyColor(facultyCode), color: 'white' } 
                  : { borderColor: getFacultyColor(facultyCode), color: getFacultyColor(facultyCode) }
              }
              onClick={onToggle}
            >
              {isActive ? 'Pause' : 'Start'}
            </Button>
            <Button 
              variant="outline" 
              style={{ borderColor: getFacultyColor(facultyCode), color: getFacultyColor(facultyCode) }}
              onClick={onReset}
            >
              Reset
            </Button>
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Pomodoro Timer</p>
            <div className="flex gap-1 justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-xs"
                style={{ borderColor: getFacultyColor(facultyCode), color: getFacultyColor(facultyCode) }}
              >
                25m
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-xs"
                style={{ borderColor: getFacultyColor(facultyCode), color: getFacultyColor(facultyCode) }}
              >
                5m
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};