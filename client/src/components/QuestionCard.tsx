// src/components/QuestionCard.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Bookmark, MessageCircle, Star, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Question } from '../types';
import toast from 'react-hot-toast';

interface QuestionCardProps {
  question: Question;
  showRelated?: boolean;
  isDetailed?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  showRelated = false,
  isDetailed = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(isDetailed);
  const navigate = useNavigate();
  
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/questions/${question._id}`);
  };
  
  const handleViewNotes = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (question.related_sections && question.related_sections.length > 0) {
      navigate(`/questions/${question._id}/notes`);
    } else {
      toast.error('No related notes found for this question.');
    }
  };
  
  const handleSaveQuestion = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success('Question saved to your bookmarks!');
    // Here you would call your API to save the question
  };
  
  // Format the question difficulty with a color
  const getDifficultyColor = (difficulty?: string) => {
    switch(difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  return (
    <div 
      className={`bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 ${
        isDetailed ? 'border-indigo-300' : 'border-gray-200'
      }`}
    >
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty || 'Unknown'}
            </span>
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
              {question.source_type.toUpperCase()}
            </span>
            {question.year && (
              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                {question.year}
              </span>
            )}
          </div>
          
          <div className="flex items-center">
            {question.frequency > 1 && (
              <span className="flex items-center text-amber-600 mr-2 text-sm">
                <Star className="h-4 w-4 mr-1 fill-amber-500 text-amber-500" />
                {question.frequency}x
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
        
        <h3 className="font-medium text-gray-900 mb-2">
          {isExpanded ? question.text : question.text.length > 100 
            ? `${question.text.substring(0, 100)}...` 
            : question.text
          }
        </h3>
        
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={handleViewNotes}
              className="flex items-center text-xs text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <FileText className="h-4 w-4 mr-1" />
              View Notes
            </button>
            
            <button
              onClick={handleSaveQuestion}
              className="flex items-center text-xs text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <Bookmark className="h-4 w-4 mr-1" />
              Save
            </button>
          </div>
          
          <button
            onClick={handleViewDetails}
            className="flex items-center text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View Details
          </button>
        </div>
      </div>
      
      {isExpanded && showRelated && question.related_sections && question.related_sections.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <MessageCircle className="h-4 w-4 mr-1 text-indigo-600" />
            Related Notes
          </h4>
          <div className="space-y-2">
            {question.related_sections.map((section, index) => (
              <div 
                key={index} 
                className="text-xs bg-white p-2 rounded border border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors"
                onClick={() => navigate(`/notes/${section}`)}
              >
                Section #{index + 1}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;