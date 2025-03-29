import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const QuestionItem = ({ question, index, colors, fonts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { questionFont, subQuestionFont, subPartFont } = fonts;
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border rounded-md mb-4 overflow-hidden transition-all"
      style={{ borderColor: colors.border }}
    >
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-opacity-10 transition-colors"
           style={{ backgroundColor: isOpen ? `${colors.accent1}10` : 'transparent' }}
           onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-2">
          <Badge style={{ backgroundColor: colors.accent1, color: 'white' }}>
            Q{question.question_number || index + 1}
          </Badge>
          <span className={`font-medium ${questionFont}`} style={{ color: colors.textPrimary }}>
            {question.text || `Question ${question.question_number || index + 1}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" style={{ borderColor: colors.tertiary, color: colors.tertiary }}>
            {question.marks} marks
          </Badge>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-0 h-8 w-8 rounded-full">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent className="p-4 pt-0">
        {question.subquestions && question.subquestions.length > 0 ? (
          <div className="space-y-3 mt-2">
            {question.subquestions.map((subq, subIndex) => (
              <div key={subIndex} className="ml-6 border-l-2 pl-4" style={{ borderColor: colors.accent1 }}>
                <div className="flex items-start gap-2 mb-1">
                  <Badge variant="outline" className="mt-0.5" style={{ borderColor: colors.accent1, color: colors.accent1 }}>
                    {subq.id || String.fromCharCode(97 + subIndex)}
                  </Badge>
                  <div className="flex-1">
                    <p className={subQuestionFont} style={{ color: colors.textPrimary }}>{subq.text}</p>
                    {subq.marks > 0 && (
                      <Badge variant="outline" className="mt-1" style={{ borderColor: colors.tertiary, color: colors.tertiary }}>
                        {subq.marks} marks
                      </Badge>
                    )}
                    
                    {subq.subparts && subq.subparts.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {subq.subparts.map((part, partIndex) => (
                          <div key={partIndex} className="ml-6 border-l-2 pl-4" style={{ borderColor: `${colors.accent1}80` }}>
                            <div className="flex items-start gap-2">
                              <Badge variant="outline" className="mt-0.5" style={{ borderColor: `${colors.accent1}80`, color: `${colors.accent1}` }}>
                                {part.id || `${subIndex + 1}.${partIndex + 1}`}
                              </Badge>
                              <div className="flex-1">
                                <p className={subPartFont} style={{ color: colors.textPrimary }}>{part.text}</p>
                                {part.marks > 0 && (
                                  <Badge variant="outline" className="mt-1" style={{ borderColor: colors.tertiary, color: colors.tertiary }}>
                                    {part.marks} marks
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm italic dyna-font" style={{ color: colors.textSecondary }}>No subquestions available.</p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default QuestionItem;