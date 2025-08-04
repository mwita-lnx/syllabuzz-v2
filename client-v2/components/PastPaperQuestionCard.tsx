import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// Types for questions
interface PastPaperSubPart {
  id: string;
  text: string;
  marks: number;
}

interface PastPaperSubQuestion {
  id: string;
  text: string;
  marks: number;
  subparts?: PastPaperSubPart[];
}

interface PastPaperQuestion {
  id: string;
  question_number: string;
  text: string;
  marks: number;
  compulsory?: boolean;
  subquestions?: PastPaperSubQuestion[];
}

interface PastPaperQuestionCardProps {
  question: PastPaperQuestion;
  index: number;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent1: string;
    accent2: string;
    textPrimary: string;
    textSecondary: string;
    surface: string;
    border: string;
  };
}

export const PastPaperQuestionCard: React.FC<PastPaperQuestionCardProps> = ({ 
  question, 
  index, 
  colors 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <Card 
      className="question-card transition-all duration-300 hover:shadow-md" 
      style={{ 
        backgroundColor: colors.surface, 
        borderColor: colors.border,
        borderLeft: `4px solid ${colors.accent2}`
      }}
    >
      <CardHeader 
        className="cursor-pointer hover:bg-opacity-50 transition-colors" 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          backgroundColor: `${colors.accent2}10`,
          borderBottom: isExpanded ? `1px solid ${colors.border}` : 'none'
        }}
      >
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold" style={{ color: colors.accent2 }}>
            Question {question.question_number || (index + 1)}
            {question.marks && (
              <span className="ml-2 text-sm font-normal">
                ({question.marks} marks)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {question.compulsory && (
              <Badge 
                className="text-xs"
                style={{ backgroundColor: colors.primary, color: 'white' }}
              >
                Compulsory
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="p-1">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" style={{ color: colors.accent2 }} />
              ) : (
                <ChevronRight className="w-4 h-4" style={{ color: colors.accent2 }} />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-4 space-y-4">
          {/* Main question text */}
          <div className="prose prose-sm max-w-none">
            <p 
              className="text-base font-medium leading-relaxed"
              style={{ color: colors.textPrimary }}
            >
              {question.text}
            </p>
          </div>
          
          {/* Sub-questions */}
          {question.subquestions && question.subquestions.length > 0 && (
            <div className="ml-4 space-y-4">
              {question.subquestions.map((subq, subIndex) => (
                <div 
                  key={subIndex} 
                  className="border-l-2 pl-4 py-2" 
                  style={{ borderColor: colors.secondary }}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <h4 
                      className="font-semibold text-sm"
                      style={{ color: colors.secondary }}
                    >
                      {String.fromCharCode(97 + subIndex)})
                    </h4>
                    <div className="flex-1">
                      {subq.marks && (
                        <Badge 
                          variant="outline" 
                          className="text-xs mb-2"
                          style={{ 
                            borderColor: colors.secondary, 
                            color: colors.secondary 
                          }}
                        >
                          {subq.marks} marks
                        </Badge>
                      )}
                      <p 
                        className="text-sm leading-relaxed"
                        style={{ color: colors.textPrimary }}
                      >
                        {subq.text}
                      </p>
                    </div>
                  </div>
                  
                  {/* Sub-parts */}
                  {subq.subparts && subq.subparts.length > 0 && (
                    <div className="ml-4 mt-3 space-y-2">
                      {subq.subparts.map((part, partIndex) => (
                        <div 
                          key={partIndex} 
                          className="border-l-2 pl-3 py-1" 
                          style={{ borderColor: colors.tertiary }}
                        >
                          <div className="flex items-start gap-2">
                            <h5 
                              className="font-medium text-xs"
                              style={{ color: colors.tertiary }}
                            >
                              {partIndex + 1}.
                            </h5>
                            <div className="flex-1">
                              {part.marks && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs mb-1"
                                  style={{ 
                                    borderColor: colors.tertiary, 
                                    color: colors.tertiary 
                                  }}
                                >
                                  {part.marks} marks
                                </Badge>
                              )}
                              <p 
                                className="text-xs leading-relaxed"
                                style={{ color: colors.textPrimary }}
                              >
                                {part.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Question metadata */}
          <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: colors.border }}>
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ borderColor: colors.accent2, color: colors.accent2 }}
            >
              Question {question.question_number || (index + 1)}
            </Badge>
            {question.marks && (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ borderColor: colors.primary, color: colors.primary }}
              >
                {question.marks} marks total
              </Badge>
            )}
            {question.compulsory !== undefined && (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  borderColor: question.compulsory ? colors.primary : colors.textSecondary,
                  color: question.compulsory ? colors.primary : colors.textSecondary
                }}
              >
                {question.compulsory ? 'Compulsory' : 'Optional'}
              </Badge>
            )}
          </div>
          
          {/* Action buttons - for future features */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs"
              style={{ borderColor: colors.accent2, color: colors.accent2 }}
            >
              Practice Similar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs"
              style={{ borderColor: colors.secondary, color: colors.secondary }}
            >
              Get AI Help
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default PastPaperQuestionCard;