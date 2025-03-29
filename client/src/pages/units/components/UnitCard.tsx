// src/pages/units/components/UnitCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, HelpCircle, FileText } from 'lucide-react';
import { Unit } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import toast from 'react-hot-toast';

interface UnitCardProps {
  unit: Unit;
  courseCode: string;
  isInstructor: boolean;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit, courseCode, isInstructor }) => {
  const navigate = useNavigate();
  console.log('Unit:', unit);
  
  const handleViewQuestions = () => {
    navigate(`/units/${unit._id}/questions`);
  };
  
  const handleViewNotes = () => {
    navigate(`/units/${unit._id}/notes`);
  };
  
  const handleEditUnit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to edit page or open modal
    toast.success('Edit unit functionality to be implemented');
  };
  
  const handleDeleteUnit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Confirm deletion and delete
    toast.success('Delete unit functionality to be implemented');
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {unit.code}
          </CardTitle>
          
          {isInstructor && (
            <div className="flex space-x-1">
              <button
                onClick={handleEditUnit}
                className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={handleDeleteUnit}
                className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">{courseCode}</p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <h3 className="font-medium text-gray-900 mb-2">{unit.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-3">{unit.description}</p>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-2">
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center text-sm text-gray-500">
            <HelpCircle className="h-4 w-4 mr-1 text-indigo-500" />
            <span>25 Questions</span> {/* This would typically come from your API */}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <FileText className="h-4 w-4 mr-1 text-indigo-500" />
            <span>8 Notes</span> {/* This would typically come from your API */}
          </div>
        </div>
        
        <div className="flex w-full gap-2">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={handleViewQuestions}
          >
            Questions
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={handleViewNotes}
          >
            Notes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default UnitCard;