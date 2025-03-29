import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Download, 
  ArrowLeft,
  ExternalLink,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import pastPaperService, { PastPaper } from '../../services/pastpaper-service';
import QuestionItem from './components/Questions';

// CSS for the fonts - Added more fonts for questions
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DynaPuff:wght@400;600;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Righteous&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Architects+Daughter&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap');
  
  .dyna-font {
    font-family: 'DynaPuff', cursive;
  }
  
  .righteous-font {
    font-family: 'Righteous', cursive;
  }
  
  .pacifico-font {
    font-family: 'Pacifico', cursive;
  }
  
  .architect-font {
    font-family: 'Architects Daughter', cursive;
  }
  
  .patrick-font {
    font-family: 'Patrick Hand', cursive;
  }
  
  .fredoka-font {
    font-family: 'Fredoka One', cursive;
  }
  
  .comic-font {
    font-family: 'Comic Neue', cursive;
  }
  
  .question-card {
    margin-top: 1.5rem;
    border-radius: 0.5rem;
    overflow: hidden;
  }
  
  .question-card-header {
    padding: 1rem;
    border-bottom: 2px solid;
  }
`;

const PaperDetailsPage = () => {
  // Colors from the original app
  const colors = {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    tertiary: '#FFD166',
    quaternary: '#6A0572',
    background: '#FFFFFF',
    surface: '#F7F9FC',
    elevatedSurface: '#FFFFFF',
    error: '#FF5252',
    warning: '#FFB100',
    success: '#06D6A0',
    textPrimary: '#2D3748',
    textSecondary: '#4A5568',
    textMuted: '#718096',
    border: '#E2E8F0',
    cardHover: '#EDF2F7',
    gradientOverlay: 'rgba(74, 85, 104, 0.05)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    focus: '#3182CE',
    accent1: '#9B5DE5',
    accent2: '#00BBF9',
  };

  const { unitId, paperId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Try to get paper from location state, otherwise fetch it
  const [paper, setPaper] = useState<PastPaper | null>(location.state?.paper || null);
  const [isLoading, setIsLoading] = useState(!location.state?.paper);
  const selectedUnit = location.state?.unit || null;

  // Define font assignments for different question levels
  const fonts = {
    questionFont: "righteous-font",
    subQuestionFont: "patrick-font",
    subPartFont: "comic-font"
  };

  // Animation component for transitions
  const FadeIn = ({ children, delay = 0 }) => {
    return (
      <div 
        className="animate-fadeIn opacity-0" 
        style={{ 
          animation: 'fadeIn 0.5s ease forwards',
          animationDelay: `${delay}s`
        }}
      >
        {children}
      </div>
    );
  };

  // Load paper details if not provided in location state
  useEffect(() => {
    const fetchPaperDetails = async () => {
      if (!paperId || paper) return;
      
      setIsLoading(true);
      try {
        const paperDetails = await pastPaperService.getPastPaper(paperId);
        console.log(paperDetails);
        setPaper(paperDetails);
      } catch (error) {
        console.error('Error fetching paper details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaperDetails();
  }, [paperId, paper]);

  // Format date helper
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  // Download past paper
  const downloadPastPaper = async () => {
    if (!paper) return;
    
    try {
      const blob = await pastPaperService.downloadPastPaper(paper._id);
      
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${paper.unit_code}_${paper.exam_type}_${paper.year}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error('Error downloading past paper:', error);
    }
  };

  // Delete past paper
  const deletePastPaper = async () => {
    if (!paper || !unitId) return;
    
    if (window.confirm('Are you sure you want to delete this past paper?')) {
      try {
        const success = await pastPaperService.deletePastPaper(paper._id);
        
        if (success) {
          navigate(`/papers/${unitId}`);
        }
      } catch (error) {
        console.error('Error deleting past paper:', error);
      }
    }
  };

  if (isLoading || !paper) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6" style={{ borderColor: colors.border }}>
          <Alert>
            <AlertTitle className="dyna-font">Loading paper details...</AlertTitle>
            <AlertDescription className="dyna-font">Please wait while we fetch the paper information.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2 dyna-font" style={{ color: colors.accent1 }}>
                <BookOpen className="w-6 h-6" />
                Past Papers
              </h1>
              <p className="text-sm dyna-font" style={{ color: colors.textSecondary }}>
                View past examination paper details
              </p>
            </div>
          </div>
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center text-sm font-medium mb-4 dyna-font" style={{ color: colors.textSecondary }}>
            <Button 
              variant="link" 
              className="p-0 h-auto dyna-font"
              style={{ color: colors.accent1 }}
              onClick={() => navigate('/')}
            >
              Units
            </Button>
            
            {selectedUnit && (
              <>
                <ChevronRight className="w-4 h-4 mx-1" />
                <Button 
                  variant="link" 
                  className="p-0 h-auto dyna-font"
                  style={{ color: colors.accent1 }}
                  onClick={() => navigate(`/papers/${unitId}`)}
                >
                  {selectedUnit.code}
                </Button>
              </>
            )}
            
            <ChevronRight className="w-4 h-4 mx-1" />
            <span style={{ color: colors.textPrimary }}>{paper.title || `${paper.exam_type} - ${paper.year}`}</span>
          </div>
        </div>
        
        {/* First Card: Paper Details and Instructions */}
        <div className="bg-white rounded-lg shadow-sm border p-6" style={{ borderColor: colors.border }}>
          <FadeIn>
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                <div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mb-2 flex items-center gap-1 border-2 dyna-font"
                    onClick={() => navigate(`/papers/${unitId}`)}
                    style={{ borderColor: colors.accent1, color: colors.accent1 }}
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Papers
                  </Button>
                  
                  <h2 className="text-xl font-bold dyna-font" style={{ color: colors.accent1 }}>
                    {paper.title || `${paper.exam_type} Examination ${paper.year}`}
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                    <div className="flex items-center gap-1 text-sm dyna-font" style={{ color: colors.textSecondary }}>
                      <Calendar className="w-4 h-4" /> {paper.date || formatDate(paper.created_at)}
                    </div>
                    
                    {paper.time && (
                      <div className="flex items-center gap-1 text-sm dyna-font" style={{ color: colors.textSecondary }}>
                        <Clock className="w-4 h-4" /> {paper.time}
                      </div>
                    )}
                    
                    <Badge className="dyna-font" style={{ backgroundColor: colors.accent1, color: 'white' }}>
                      {paper.exam_type}
                    </Badge>
                    
                    <Badge variant="outline" className="dyna-font" style={{ borderColor: colors.primary, color: colors.primary }}>
                      {paper.year}
                    </Badge>
                    
                    {paper.semester && (
                      <Badge variant="outline" className="dyna-font" style={{ borderColor: colors.secondary, color: colors.secondary }}>
                        {paper.semester} Semester
                      </Badge>
                    )}
                    
                    {paper.stream && (
                      <Badge variant="outline" className="dyna-font" style={{ borderColor: colors.tertiary, color: colors.tertiary }}>
                        {paper.stream}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-1 border-2 dyna-font"
                    style={{ borderColor: colors.accent1, color: colors.accent1 }}
                    onClick={downloadPastPaper}
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-2 dyna-font" style={{ borderColor: colors.accent1, color: colors.accent1 }}>
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel className="dyna-font">Paper Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="flex items-center gap-2 cursor-pointer dyna-font">
                        <ExternalLink className="w-4 h-4" /> Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="flex items-center gap-2 cursor-pointer text-red-600 dyna-font" 
                        onClick={deletePastPaper}
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Instructions Section */}
              {paper.instructions && paper.instructions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2 dyna-font" style={{ color: colors.quaternary }}>Instructions</h3>
                  <div 
                    className="p-4 rounded-md border-2"
                    style={{ borderColor: `${colors.quaternary}40`, backgroundColor: `${colors.quaternary}05` }}
                  >
                    <ul className="list-decimal pl-5 space-y-1">
                      {paper.instructions.map((instruction, index) => (
                        <li key={index} className="dyna-font" style={{ color: colors.textPrimary }}>{instruction}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </FadeIn>
        </div>
        
        {/* Second Card: Questions Section */}
        <div className="question-card bg-white rounded-lg shadow-sm border p-6 mt-6" style={{ borderColor: colors.border }}>
          <FadeIn delay={0.2}>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium pacifico-font" style={{ color: colors.accent2 }}>
                  Examination Questions
                </h3>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="flex items-center gap-1 fredoka-font"
                      style={{ backgroundColor: colors.accent2, color: 'white' }}
                    >
                      <Plus className="w-4 h-4" /> Add Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="dyna-font" style={{ color: colors.accent1 }}>Add New Question</DialogTitle>
                      <DialogDescription className="dyna-font">
                        Add a new question to this past paper.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Question form would go here */}
                      <p className="text-sm dyna-font" style={{ color: colors.textSecondary }}>
                        Question form UI would be implemented here
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {(paper.questions?.length === 0 && (!paper.sections || paper.sections.length === 0)) ? (
                <Alert 
                  className="border-2" 
                  style={{ 
                    backgroundColor: colors.surface, 
                    borderColor: `${colors.accent2}40`,
                    color: colors.textPrimary
                  }}
                >
                  <AlertTitle className="font-bold fredoka-font">No questions available</AlertTitle>
                  <AlertDescription className="comic-font">
                    There are no questions extracted from this past paper yet.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* If paper has sections */}
                  {paper.sections && paper.sections.length > 0 && (
                    <Tabs defaultValue={`section-0`} className="mt-4">
                      <TabsList>
                        {paper.sections.map((section, index) => (
                          <TabsTrigger 
                            key={index} 
                            value={`section-${index}`}
                            className="architect-font"
                            style={{ 
                              "[data-state=active]:backgroundColor": colors.accent2,
                              "[data-state=active]:color": "white",
                            }}
                          >
                            {section.title || `Section ${section.section || String.fromCharCode(65 + index)}`}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      {paper.sections.map((section, sectionIndex) => (
                        <TabsContent key={sectionIndex} value={`section-${sectionIndex}`} className="space-y-4 mt-4">
                          {section.instructions && section.instructions.length > 0 && (
                            <div className="p-4 rounded-md border" style={{ borderColor: colors.border, backgroundColor: `${colors.accent2}05` }}>
                              <h4 className="font-medium mb-2 patrick-font" style={{ color: colors.textPrimary }}>Section Instructions</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {section.instructions.map((instruction, index) => (
                                  <li key={index} className="dyna-font" style={{ color: colors.textPrimary }}>{instruction}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {section.questions && section.questions.map((question, index) => (
                            <QuestionItem 
                              key={index} 
                              question={question} 
                              index={index} 
                              colors={colors}
                              fonts={fonts}
                            />
                          ))}
                        </TabsContent>
                      ))}
                    </Tabs>
                  )}
                  
                  {/* If paper has questions without sections */}
                  {paper.questions && paper.questions.length > 0 && (
                    <div className="space-y-4 mt-4">
                      {paper.questions.map((question, index) => (
                        <QuestionItem 
                          key={index} 
                          question={question} 
                          index={index} 
                          colors={colors}
                          fonts={fonts}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </>
  );
};

export default PaperDetailsPage;