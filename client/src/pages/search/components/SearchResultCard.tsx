// src/pages/search/components/SearchResultCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, FileText, Star, Calendar, Tag, ArrowRightCircle } from 'lucide-react';
import { SearchResult } from '../../../types';
import { Button } from '../../../components/ui/Button';

interface SearchResultCardProps {
  result: SearchResult;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ result }) => {
  const navigate = useNavigate();
  
  const isQuestion = !!result.text;
  
  const handleClick = () => {
    if (isQuestion) {
      navigate(`/questions/${result.id}`);
    } else {
      navigate(`/notes/${result.id}`);
    }
  };
  
  // Format the similarity percentage
  const similarityPercentage = Math.round(result.similarity * 100);
  
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          {isQuestion ? (
            <div className="bg-indigo-100 p-2 rounded-lg">
              <HelpCircle className="h-5 w-5 text-indigo-600" />
            </div>
          ) : (
            <div className="bg-emerald-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {isQuestion ? 'Question' : result.title || 'Note'}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {result.similarity && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  {similarityPercentage}% match
                </span>
              )}
              
              {result.source_type && (
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                  {result.source_type.toUpperCase()}
                </span>
              )}
              
              {result.year && (
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {result.year}
                </span>
              )}
              
              {result.topic && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full flex items-center">
                  <Tag className="h-3 w-3 mr-1" />
                  {result.topic}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-indigo-600 hover:text-indigo-800"
          rightIcon={<ArrowRightCircle className="h-4 w-4" />}
          onClick={handleClick}
        >
          View
        </Button>
      </div>
      
      <div className="mt-3">
        {isQuestion ? (
          <p className="text-gray-700">{result.text}</p>
        ) : (
          <div>
            <p className="text-gray-700 font-medium mb-1">{result.title}</p>
            {result.highlight && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mt-2">
                <p className="text-sm text-gray-700">{result.highlight}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultCard;