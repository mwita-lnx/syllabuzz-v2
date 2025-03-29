// src/pages/questions/components/QuestionGroup.tsx
import React, { useState } from 'react';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { QuestionGroup as QuestionGroupType } from '../../../types';
import QuestionCard from '../../../components/QuestionCard';

interface QuestionGroupProps {
  group: QuestionGroupType;
}

const QuestionGroup: React.FC<QuestionGroupProps> = ({ group }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  // Sort questions by frequency (highest first)
  const sortedQuestions = [...group.questions].sort((a, b) => b.frequency - a.frequency);
  
  // Get the most frequent question to display as the group representative
  const primaryQuestion = sortedQuestions[0];
  
  // Calculate the average difficulty
  const getDifficultyLabel = () => {
    const difficultyMap: Record<string, number> = {
      'easy': 1,
      'medium': 2,
      'hard': 3
    };
    
    const validQuestions = group.questions.filter(q => q.difficulty);
    if (validQuestions.length === 0) return 'Unknown';
    
    const avgDifficulty = validQuestions.reduce((sum, q) => {
      return sum + (difficultyMap[q.difficulty || 'medium'] || 2);
    }, 0) / validQuestions.length;
    
    if (avgDifficulty < 1.5) return 'Easy';
    if (avgDifficulty < 2.5) return 'Medium';
    return 'Hard';
  };
  
  // Get the color for the difficulty label
  const getDifficultyColor = () => {
    const difficulty = getDifficultyLabel();
    switch(difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  // Get the total number of times this question has appeared
  const getTotalFrequency = () => {
    return group.questions.reduce((sum, q) => sum + q.frequency, 0);
  };
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Group header */}
      <div 
        className="p-4 cursor-pointer border-b border-gray-200 bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor()}`}>
              {getDifficultyLabel()}
            </span>
            <span className="flex items-center text-amber-600 text-sm">
              <Star className="h-4 w-4 mr-1 fill-amber-500 text-amber-500" />
              {getTotalFrequency()} occurrences
            </span>
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
              {group.count} variants
            </span>
          </div>
          
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        <h3 className="font-medium text-gray-900 mt-2">
          {primaryQuestion.text}
        </h3>
      </div>
      
      {/* Group content (similar questions) */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Similar Questions:
          </h4>
          
          {sortedQuestions.map(question => (
            <QuestionCard
              key={question._id}
              question={question}
              showRelated={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionGroup;