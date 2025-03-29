import React, { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter, 
  Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui';
import {
  FileText, Plus, HelpCircle, Sparkles, Edit, CheckCircle, ThumbsUp
} from 'lucide-react';
import { RevisionRoom, FlashcardSet, StudyNote, Quiz, StudyQuestion } from '@/types/index3';

// FlashcardSetCard component definition
interface FlashcardSetCardProps {
  set: FlashcardSet;
  colors: any;
  faculties: any[];
}

const FlashcardSetCard: React.FC<FlashcardSetCardProps> = ({ set, colors, faculties }) => {
  const getFacultyColor = (facultyName?: string): string => {
    if (!facultyName) return colors.tertiary;
    const faculty = faculties.find(f => f.name === facultyName);
    return faculty ? faculty.color : colors.tertiary;
  };

  const facultyColor = getFacultyColor(set.faculty);
  
  return (
    <Card className="hover:shadow-md transition-all" style={{ backgroundColor: colors.surface }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base line-clamp-1" style={{ color: facultyColor }}>
            {set.title}
          </CardTitle>
          <Badge style={{ backgroundColor: facultyColor, color: 'white' }}>
            {set.cardCount} cards
          </Badge>
        </div>
        <CardDescription className="text-xs" style={{ color: colors.textSecondary }}>
          {set.unitName}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm line-clamp-2 mb-2" style={{ color: colors.textSecondary }}>
          {set.description}
        </p>
        <div className="flex flex-wrap gap-1 mb-2">
          {set.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs" style={{ borderColor: facultyColor, color: facultyColor }}>
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" style={{ backgroundColor: facultyColor, color: 'white' }}>
          Study Now
        </Button>
      </CardFooter>
    </Card>
  );
};

// StudyNoteCard component definition
interface StudyNoteCardProps {
  note: StudyNote;
  colors: any;
  faculties: any[];
}

const StudyNoteCard: React.FC<StudyNoteCardProps> = ({ note, colors, faculties }) => {
  const getFacultyColor = (facultyName?: string): string => {
    if (!facultyName) return colors.tertiary;
    const faculty = faculties.find(f => f.name === facultyName);
    return faculty ? faculty.color : colors.tertiary;
  };

  const facultyColor = getFacultyColor(note.faculty);
  
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <Card className="hover:shadow-md transition-all" style={{ backgroundColor: colors.surface }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base line-clamp-1" style={{ color: facultyColor }}>
          {note.title}
        </CardTitle>
        <CardDescription className="flex justify-between text-xs" style={{ color: colors.textSecondary }}>
          <span>Created {formatDate(note.createdAt)}</span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> {note.likes}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm line-clamp-3 mb-2" style={{ color: colors.textSecondary }}>
          {note.content}
        </p>
        <div className="flex flex-wrap gap-1">
          {note.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs" style={{ borderColor: facultyColor, color: facultyColor }}>
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1" style={{ backgroundColor: facultyColor, color: 'white' }}>
          View
        </Button>
        <Button variant="outline" className="flex-1" style={{ borderColor: facultyColor, color: facultyColor }}>
          <Edit className="w-4 h-4 mr-1" /> Edit
        </Button>
      </CardFooter>
    </Card>
  );
};

// QuizCard component definition
interface QuizCardProps {
  quiz: Quiz;
  colors: any;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, colors }) => {
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'Easy':
        return colors.secondary;
      case 'Medium':
        return colors.tertiary;
      case 'Hard':
        return colors.primary;
      default:
        return colors.tertiary;
    }
  };
  
  return (
    <Card className="hover:shadow-md transition-all" style={{ backgroundColor: colors.surface }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base line-clamp-1" style={{ color: colors.tertiary }}>
            {quiz.title}
          </CardTitle>
          <Badge 
            style={{ 
              backgroundColor: getDifficultyColor(quiz.difficulty),
              color: 'white'
            }}
          >
            {quiz.difficulty}
          </Badge>
        </div>
        <CardDescription className="text-xs" style={{ color: colors.textSecondary }}>
          {quiz.topic} • {quiz.questionCount} questions • {quiz.timeLimit} min
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm line-clamp-2 mb-2" style={{ color: colors.textSecondary }}>
          {quiz.description}
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" style={{ backgroundColor: colors.tertiary, color: 'white' }}>
          Start Quiz
        </Button>
      </CardFooter>
    </Card>
  );
};

// QuestionCard component definition
interface QuestionCardProps {
  question: StudyQuestion;
  colors: any;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, colors }) => {
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'Easy':
        return colors.secondary;
      case 'Medium':
        return colors.tertiary;
      case 'Hard':
        return colors.primary;
      default:
        return colors.tertiary;
    }
  };
  
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between">
        <h5 className="font-medium mb-2" style={{ color: colors.textPrimary }}>{question.question}</h5>
        <Badge 
          style={{ 
            backgroundColor: getDifficultyColor(question.difficulty),
            color: 'white'
          }}
        >
          {question.difficulty}
        </Badge>
      </div>
      
      {question.type === 'multiple_choice' && question.options && (
        <div className="space-y-2 mt-2">
          {question.options.map((option, index) => (
            <div 
              key={index} 
              className={`p-2 rounded-md flex items-center gap-2 ${index === question.correctOption ? 'bg-green-50 border-green-200 border' : 'bg-gray-50 border-gray-200 border'}`}
            >
              {index === question.correctOption && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <span style={{ color: colors.textPrimary }}>{option}</span>
            </div>
          ))}
        </div>
      )}
      
      {question.type === 'short_answer' && (
        <div className="mt-2">
          <p className="font-medium" style={{ color: colors.textSecondary }}>Answer:</p>
          <p style={{ color: colors.textPrimary }}>{question.answer}</p>
        </div>
      )}
      
      {question.explanation && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>Explanation:</p>
          <p className="text-sm" style={{ color: colors.textPrimary }}>{question.explanation}</p>
        </div>
      )}
      
      <div className="flex justify-between mt-3 text-xs" style={{ color: colors.textMuted }}>
        <span>Source: {question.source}</span>
        <span>Topic: {question.topic}</span>
      </div>
    </div>
  );
};

// Main ResourcesFeature component
interface ResourcesFeatureProps {
  room: RevisionRoom;
  colors: any;
  getFacultyColor: (facultyCode?: string) => string;
}

export const ResourcesFeature: React.FC<ResourcesFeatureProps> = ({ 
  room, 
  colors, 
  getFacultyColor 
}) => {
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [studyNotes, setStudyNotes] = useState<StudyNote[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  
  // Fetch data when component mounts
  useEffect(() => {
    // In a real implementation, these would be API calls
    // For now, we'll just set some empty arrays
    setFlashcardSets([]);
    setStudyNotes([]);
    setQuizzes([]);
    setQuestions([]);
  }, [room.id]);

  return (
    <div className="mt-6 space-y-4">
      <Card style={{ backgroundColor: colors.surface }}>
        <CardHeader>
          <CardTitle className="flex items-center" style={{ color: getFacultyColor(room.facultyCode) }}>
            <FileText className="w-5 h-5 mr-2" /> Study Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="papers">
            <TabsList>
              <TabsTrigger value="papers">Past Papers</TabsTrigger>
              <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
              <TabsTrigger value="notes">Study Notes</TabsTrigger>
              <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="papers" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium" style={{ color: colors.textPrimary }}>Related Past Papers</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Paper
                </Button>
              </div>
              
              {room.papers && room.papers.length > 0 ? (
                <div className="space-y-2">
                  {/* This would be populated with actual paper data in a real implementation */}
                  <div className="p-3 rounded-lg border flex items-center justify-between">
                    <div>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>
                        {room.unitName} Final Exam
                      </p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        {room.unit_code} • 2023 • Final
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}>
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 border rounded-lg">
                  <p style={{ color: colors.textSecondary }}>No papers have been added to this study room yet.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add First Paper
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="flashcards" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium" style={{ color: colors.textPrimary }}>Flashcard Sets</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Create Set
                </Button>
              </div>
              
              {flashcardSets && flashcardSets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flashcardSets.map((set) => (
                    <FlashcardSetCard key={set.id} set={set} colors={colors} faculties={[]} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 border rounded-lg">
                  <p style={{ color: colors.textSecondary }}>No flashcard sets have been created for this study room yet.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Create Flashcards
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="notes" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium" style={{ color: colors.textPrimary }}>Study Notes</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Note
                </Button>
              </div>
              
              {studyNotes && studyNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studyNotes.map((note) => (
                    <StudyNoteCard key={note.id} note={note} colors={colors} faculties={[]} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 border rounded-lg">
                  <p style={{ color: colors.textSecondary }}>No study notes have been shared in this room yet.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add First Note
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="quizzes" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium" style={{ color: colors.textPrimary }}>Practice Quizzes</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Create Quiz
                </Button>
              </div>
              
              {quizzes && quizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quizzes.map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} colors={colors} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 border rounded-lg">
                  <p style={{ color: colors.textSecondary }}>No quizzes have been created for this study room yet.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Create First Quiz
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Question Bank */}
      <Card style={{ backgroundColor: colors.surface }}>
        <CardHeader>
          <CardTitle className="flex items-center" style={{ color: getFacultyColor(room.facultyCode) }}>
            <HelpCircle className="w-5 h-5 mr-2" /> Questions & Answers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium" style={{ color: colors.textPrimary }}>Study Questions</h4>
            <Button 
              variant="outline" 
              size="sm"
              style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>
          </div>
          
          {questions && questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((question) => (
                <QuestionCard key={question.id} question={question} colors={colors} />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 border rounded-lg">
              <p style={{ color: colors.textSecondary }}>No study questions have been added to this room yet.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}
              >
                <Plus className="w-4 h-4 mr-2" /> Add First Question
              </Button>
            </div>
          )}
        </CardContent>
        <CardContent className="pt-0">
          <Button 
            variant="outline" 
            className="w-full"
            style={{ borderColor: getFacultyColor(room.facultyCode), color: getFacultyColor(room.facultyCode) }}
          >
            <Sparkles className="w-4 h-4 mr-2" /> Generate Practice Questions with AI
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};