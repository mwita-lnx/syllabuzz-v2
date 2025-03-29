import React from 'react';
import { Check } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Import types
import { Faculty } from '../types/index2';

interface FacultySelectorProps {
  faculties: Faculty[];
  selectedFaculty: string;
  onSelect: (facultyCode: string) => void;
  primaryColor?: string;
}

export const FacultySelector: React.FC<FacultySelectorProps> = ({ 
  faculties, 
  selectedFaculty, 
  onSelect,
  primaryColor = '#FF6B6B'
}) => {
  return (
    <Select value={selectedFaculty} onValueChange={onSelect}>
      <SelectTrigger 
        className="w-full border-2 focus:ring-2 focus:border-transparent transition-all"
        style={{ 
          borderColor: primaryColor,
          borderRadius: '0.5rem',
          color: '#2D3748'
        }}
      >
        <SelectValue placeholder="Select Faculty" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all" className="font-medium cursor-pointer">
            All Faculties
          </SelectItem>
          
          {faculties.map(faculty => (
            <SelectItem 
              key={faculty.id} 
              value={faculty.code}
              className="cursor-pointer relative"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: faculty.color }}
                />
                <span>{faculty.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default FacultySelector;