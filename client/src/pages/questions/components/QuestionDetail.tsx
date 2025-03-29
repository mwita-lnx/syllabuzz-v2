// src/pages/questions/components/QuestionDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  FileText, 
  Star, 
  BookOpen,
  Calendar,
  Tag,
  BookmarkPlus,
  Share2
} from 'lucide-react';
import { Question, QuestionHighlight } from '../../../types';
import { Button } from '../../../components/ui/Button';
import Loader from '../../../components/Loader';
import { getQuestionById, getQuestionHighlights, getSimilarQuestions } from '../../../services/question-service';
import { getUnitById } from '../../../services/unit-service';
import toast from 'react-hot-toast';

const QuestionDetail: React.FC = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [unitName, setUnitName] = useState<string>('');
  const [highlights, setHighlights] = useState<QuestionHighlight[]>([]);
  const [similarQuestions, setSimilarQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'similar'>('notes');
  
  useEffect(() => {
    if (!questionId) {
      navigate('/courses');
      return;
    }
    
    const fetchQuestionData = async () => {
      try {
        setIsLoading(true);
        const questionData = await getQuestionById(questionId);
        setQuestion(questionData);
        
        // Fetch additional data in parallel
        const [highlightsData, similarQuestionsData, unitData] = await Promise.all([
          getQuestionHighlights(questionId),
          getSimilarQuestions(questionId),
          getUnitById(questionData.unit_id)
        ]);
        
        setHighlights(highlightsData);
        setSimilarQuestions(similarQuestionsData);
        setUnitName(unitData.name);
      } catch (error) {
        console.error('Error fetching question details:', error);
        toast.error('Failed to load question details');
        navigate('/courses');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuestionData();
  }, [questionId, navigate]);
  
  const handleBookmark = () => {
    toast.success('Question bookmarked successfully');
  };
  
  const handleShare = () => {
    // Copy link to clipboard
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };
  
  if (isLoading) {
    return <Loader fullScreen={false} />;
  }
  
  if (!question) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 mb-4">Question not found</p>
        <Button variant="primary" onClick={() => navigate('/courses')}>
          Return to Courses
        </Button>
      </div>
    );
  }
  
  // Now that we've verified question is not null, we can safely access its properties
  const difficultyText = question.difficulty 
    ? question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1) 
    : 'Unknown';
    
  // Function to get the difficulty styling class
  const getDifficultyClass = () => {
    if (!question.difficulty) return 'text-gray-600 bg-gray-100';
    
    switch(question.difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ChevronLeft className="h-5 w-5" />}
          onClick={() => navigate(`/units/${question.unit_id}/questions`)}
        >
          Back to Questions
        </Button>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        {/* Question header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyClass()}`}>
                {difficultyText} Difficulty
              </span>
              
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full flex items-center">
                <Tag className="h-3 w-3 mr-1" />
                {question.source_type.toUpperCase()}
              </span>
              
              {question.year && (
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {question.year}
                </span>
              )}
              
              {question.frequency > 1 && (
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  Appeared {question.frequency} times
                </span>
              )}
              
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full flex items-center">
                <BookOpen className="h-3 w-3 mr-1" />
                {unitName}
              </span>
            </div>
            
            <h1 className="text-xl font-bold text-gray-900">
              {question.text}
            </h1>
          </div>
          
          <div className="flex gap-2 self-end md:self-start">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<BookmarkPlus className="h-4 w-4" />}
              onClick={handleBookmark}
            >
              Save
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Share2 className="h-4 w-4" />}
              onClick={handleShare}
            >
              Share
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <div className="flex space-x-8">
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notes'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('notes')}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Related Notes
            </button>
            
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'similar'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('similar')}
            >
              <Star className="h-4 w-4 inline mr-2" />
              Similar Questions
            </button>
          </div>
        </div>
        
        {/* Tab content */}
        {activeTab === 'notes' ? (
          <div>
            {highlights.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No related notes found for this question.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {highlights.map((highlight, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{highlight.title}</h3>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => navigate(`/notes/${highlight.note_id}`)}
                      >
                        View Note
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {highlight.highlights.map((text, idx) => (
                        <p key={idx} className="text-sm text-gray-700 bg-yellow-50 border-l-4 border-yellow-400 p-2">
                          {text}
                        </p>
                      ))}
                    </div>
                    
                    {highlight.page_numbers && highlight.page_numbers.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Page{highlight.page_numbers.length > 1 ? 's' : ''}: {highlight.page_numbers.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {similarQuestions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No similar questions found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {similarQuestions.map(similar => {
                  // Get difficulty class for similar question
                  const similarDifficultyClass = () => {
                    if (!similar.difficulty) return 'text-gray-600 bg-gray-100';
                    
                    switch(similar.difficulty) {
                      case 'easy': return 'text-green-600 bg-green-100';
                      case 'medium': return 'text-yellow-600 bg-yellow-100';
                      case 'hard': return 'text-red-600 bg-red-100';
                      default: return 'text-gray-600 bg-gray-100';
                    }
                  };
                  
                  // Get formatted difficulty text
                  const similarDifficultyText = similar.difficulty 
                    ? similar.difficulty.charAt(0).toUpperCase() + similar.difficulty.slice(1) 
                    : 'Unknown';
                    
                  return (
                    <div
                      key={similar._id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/questions/${similar._id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${similarDifficultyClass()}`}>
                            {similarDifficultyText}
                          </span>
                          
                          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                            {similar.source_type.toUpperCase()}
                          </span>
                          
                          {similar.year && (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                              {similar.year}
                            </span>
                          )}
                        </div>
                        
                        {similar.frequency > 1 && (
                          <span className="flex items-center text-amber-600 text-sm">
                            <Star className="h-4 w-4 mr-1 fill-amber-500 text-amber-500" />
                            {similar.frequency}x
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-900">{similar.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetail;