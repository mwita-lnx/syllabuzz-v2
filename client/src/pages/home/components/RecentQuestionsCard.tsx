// src/pages/home/components/RecentQuestionsCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Question } from '../../../types';

interface RecentQuestionsCardProps {
  questions: Question[];
}

const RecentQuestionsCard: React.FC<RecentQuestionsCardProps> = ({ questions }) => {
  const navigate = useNavigate();

  const handleQuestionClick = (questionId: string) => {
    navigate(`/questions/${questionId}`);
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
    <div className="space-y-4">
      {questions.map(question => (
        <div
          key={question._id}
          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => handleQuestionClick(question._id)}
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
            
            {question.frequency > 1 && (
              <span className="flex items-center text-amber-600 text-sm">
                <Star className="h-4 w-4 mr-1 fill-amber-500 text-amber-500" />
                {question.frequency}x
              </span>
            )}
          </div>
          
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
            {question.text}
          </h3>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Unit: {/* You would typically fetch the unit name */}
            </span>
            <span className="text-xs text-indigo-600">
              View Details →
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentQuestionsCard;