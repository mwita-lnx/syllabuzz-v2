'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Info,
  List,
  Sparkles,
  FileText
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

// Import layout and components
import { MainLayout } from '@/components/MainLayout';
import { PastPaperCard } from '@/components/PastPaperCard';
import { PastPaperQuestionCard } from '@/components/PastPaperQuestionCard';

// Import services and types
import { pastPaperService, PastPaper } from '@/services/pastpaper-service';
import toast from 'react-hot-toast';

// Animation component for transitions
const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
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


export default function PaperDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const paperId = params?.paperId as string;
  
  // State
  const [paper, setPaper] = useState<PastPaper | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [relatedPapers, setRelatedPapers] = useState<PastPaper[]>([]);
  
  // Theme colors
  const colors = {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    tertiary: '#FFD166',
    quaternary: '#6A0572',
    background: '#FFFFFF',
    surface: '#F7F9FC',
    textPrimary: '#2D3748',
    textSecondary: '#4A5568',
    textMuted: '#718096',
    border: '#E2E8F0',
    accent1: '#9B5DE5',
    accent2: '#00BBF9',
    elevatedSurface: '#FFFFFF',
    error: '#FF5252',
    warning: '#FFB100',
    success: '#06D6A0',
  };
  
  
  // Load paper details
  useEffect(() => {
    const fetchPaperDetails = async () => {
      if (!paperId) return;
      
      setIsLoading(true);
      try {
        // Fetch paper details from API
        const paperDetails = await pastPaperService.getPastPaper(paperId);
        
        if (paperDetails) {
          setPaper(paperDetails);
          
          // Fetch related papers (same unit or exam type)
          const allPapersResult = await pastPaperService.getAllPastPapers({ 
            limit: 10 
          });
          
          const related = allPapersResult.pastpapers.filter(p => 
            p._id !== paperDetails._id && 
            (p.unit_id === paperDetails.unit_id || p.exam_type === paperDetails.exam_type)
          ).slice(0, 3);
          
          setRelatedPapers(related);
        } else {
          toast.error('Paper not found');
        }
      } catch (error) {
        console.error('Error fetching paper details:', error);
        toast.error('Failed to load paper details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaperDetails();
  }, [paperId]);
  
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
      } else {
        toast.error('Paper file not available for download.');
      }
    } catch (error) {
      console.error('Error downloading past paper:', error);
      toast.error('Download failed. Please try again.');
    }
  };
  
  // Delete past paper
  const deletePastPaper = async () => {
    if (!paper) return;
    
    if (window.confirm('Are you sure you want to delete this past paper?')) {
      try {
        const success = await pastPaperService.deletePastPaper(paper._id);
        
        if (success) {
          toast.success('Past paper deleted successfully');
          router.push('/pastpapers');
        } else {
          toast.error('Failed to delete past paper');
        }
      } catch (error) {
        console.error('Error deleting past paper:', error);
        toast.error('Delete failed. Please try again.');
      }
    }
  };
  
  if (isLoading || !paper) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm border p-6" style={{ borderColor: colors.border }}>
            <Alert>
              <AlertTitle>Loading paper details...</AlertTitle>
              <AlertDescription>Please wait while we fetch the paper information.</AlertDescription>
            </Alert>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: colors.accent1 }}>
                <BookOpen className="w-6 h-6" />
                Past Papers
              </h1>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                View past examination paper details
              </p>
            </div>
          </div>
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center text-sm font-medium mb-4" style={{ color: colors.textSecondary }}>
            <Button 
              variant="link" 
              className="p-0 h-auto"
              style={{ color: colors.accent1 }}
              onClick={() => router.push('/')}
            >
              Home
            </Button>
            
            <ChevronRight className="w-4 h-4 mx-1" />
            <Button 
              variant="link" 
              className="p-0 h-auto"
              style={{ color: colors.accent1 }}
              onClick={() => router.push('/pastpapers')}
            >
              Past Papers
            </Button>
            
            <ChevronRight className="w-4 h-4 mx-1" />
            <span style={{ color: colors.textPrimary }}>{paper.title || `${paper.exam_type} - ${paper.year}`}</span>
          </div>
        </div>
        
        {/* Paper Details Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6" style={{ borderColor: colors.border }}>
          <FadeIn>
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                <div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mb-2 flex items-center gap-1 border-2"
                    onClick={() => router.back()}
                    style={{ borderColor: colors.accent1, color: colors.accent1 }}
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Button>
                  
                  <h2 className="text-xl font-bold" style={{ color: colors.accent1 }}>
                    {paper.title || `${paper.exam_type} Examination ${paper.year}`}
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                    <div className="flex items-center gap-1 text-sm" style={{ color: colors.textSecondary }}>
                      <Calendar className="w-4 h-4" /> {paper.date || formatDate(paper.created_at)}
                    </div>
                    
                    {paper.time && (
                      <div className="flex items-center gap-1 text-sm" style={{ color: colors.textSecondary }}>
                        <Clock className="w-4 h-4" /> {paper.time}
                      </div>
                    )}
                    
                    <Badge style={{ backgroundColor: colors.accent1, color: 'white' }}>
                      {paper.exam_type}
                    </Badge>
                    
                    <Badge variant="outline" style={{ borderColor: colors.primary, color: colors.primary }}>
                      {paper.year}
                    </Badge>
                    
                    {paper.semester && (
                      <Badge variant="outline" style={{ borderColor: colors.secondary, color: colors.secondary }}>
                        {paper.semester} Semester
                      </Badge>
                    )}
                    
                    {paper.stream && (
                      <Badge variant="outline" style={{ borderColor: colors.tertiary, color: colors.tertiary }}>
                        {paper.stream}
                      </Badge>
                    )}
                    
                    {paper.difficulty && (
                      <Badge style={{ 
                        backgroundColor: 
                          paper.difficulty === 'Easy' ? colors.secondary : 
                          paper.difficulty === 'Medium' ? colors.tertiary : 
                          colors.primary 
                      }}>
                        {paper.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-1 border-2"
                    style={{ borderColor: colors.accent1, color: colors.accent1 }}
                    onClick={downloadPastPaper}
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-2" style={{ borderColor: colors.accent1, color: colors.accent1 }}>
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Paper Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                        <ExternalLink className="w-4 h-4" /> Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="flex items-center gap-2 cursor-pointer text-red-600" 
                        onClick={deletePastPaper}
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Paper Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card style={{ backgroundColor: colors.surface }}>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold" style={{ color: colors.accent1 }}>
                      {paper.total_questions}
                    </div>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>Questions</p>
                  </CardContent>
                </Card>
                
                <Card style={{ backgroundColor: colors.surface }}>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {paper.total_marks}
                    </div>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>Total Marks</p>
                  </CardContent>
                </Card>
                
                {paper.total_sections && (
                  <Card style={{ backgroundColor: colors.surface }}>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold" style={{ color: colors.secondary }}>
                        {paper.total_sections}
                      </div>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Sections</p>
                    </CardContent>
                  </Card>
                )}
                
                {paper.average_score && (
                  <Card style={{ backgroundColor: colors.surface }}>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold" style={{ color: colors.tertiary }}>
                        {Math.round((paper.average_score / (paper.total_marks || 100)) * 100)}%
                      </div>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Avg Score</p>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Instructions Section */}
              {paper.instructions && paper.instructions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2" style={{ color: colors.quaternary }}>Instructions</h3>
                  <div 
                    className="p-4 rounded-md border-2"
                    style={{ borderColor: `${colors.quaternary}40`, backgroundColor: `${colors.quaternary}05` }}
                  >
                    <ul className="list-decimal pl-5 space-y-1">
                      {paper.instructions.map((instruction, index) => (
                        <li key={index} style={{ color: colors.textPrimary }}>{instruction}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Topics */}
              {paper.topics && paper.topics.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: colors.accent2 }}>
                    Topics Covered
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {paper.topics.map((topic, index) => (
                      <Badge key={index} variant="outline" style={{ borderColor: colors.accent2, color: colors.accent2 }}>
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </FadeIn>
        </div>
        
        {/* Questions Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6" style={{ borderColor: colors.border }}>
          <FadeIn delay={0.2}>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium" style={{ color: colors.accent2 }}>
                  Examination Questions
                </h3>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="flex items-center gap-1"
                      style={{ backgroundColor: colors.accent2, color: 'white' }}
                    >
                      <Plus className="w-4 h-4" /> Add Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle style={{ color: colors.accent1 }}>Add New Question</DialogTitle>
                      <DialogDescription>
                        Add a new question to this past paper.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        Question form UI would be implemented here
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {(!paper.questions || paper.questions.length === 0) && (!paper.sections || paper.sections.length === 0) ? (
                <Alert 
                  className="border-2" 
                  style={{ 
                    backgroundColor: colors.surface, 
                    borderColor: `${colors.accent2}40`,
                    color: colors.textPrimary
                  }}
                >
                  <AlertTitle className="font-bold">No questions available</AlertTitle>
                  <AlertDescription>
                    There are no questions extracted from this past paper yet.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* If paper has sections */}
                  {paper.sections && paper.sections.length > 0 && (
                    <Tabs defaultValue="section-0" className="mt-4">
                      <TabsList>
                        {paper.sections.map((section, index) => (
                          <TabsTrigger 
                            key={index} 
                            value={`section-${index}`}
                          >
                            {section.title || `Section ${section.section || String.fromCharCode(65 + index)}`}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      {paper.sections.map((section, sectionIndex) => (
                        <TabsContent key={sectionIndex} value={`section-${sectionIndex}`} className="space-y-4 mt-4">
                          {section.instructions && section.instructions.length > 0 && (
                            <div className="p-4 rounded-md border" style={{ borderColor: colors.border, backgroundColor: `${colors.accent2}05` }}>
                              <h4 className="font-medium mb-2" style={{ color: colors.textPrimary }}>Section Instructions</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {section.instructions.map((instruction, index) => (
                                  <li key={index} style={{ color: colors.textPrimary }}>{instruction}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {section.questions && section.questions.map((question, index) => (
                            <PastPaperQuestionCard 
                              key={index} 
                              question={question} 
                              index={index} 
                              colors={colors}
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
                        <PastPaperQuestionCard 
                          key={index} 
                          question={question} 
                          index={index} 
                          colors={colors}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </FadeIn>
        </div>
        
        {/* Related Papers */}
        {relatedPapers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6" style={{ borderColor: colors.border }}>
            <FadeIn delay={0.3}>
              <div className="space-y-6">
                <h3 className="text-lg font-medium" style={{ color: colors.accent1 }}>Related Papers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedPapers.map((relatedPaper, index) => (
                    <PastPaperCard 
                      key={relatedPaper._id}
                      paper={relatedPaper} 
                      facultyColor={colors.accent1}
                      onClick={() => router.push(`/pastpapers/${relatedPaper._id}`)}
                    />
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        )}
        
        {/* Bottom CTA */}
        <div className="mt-12">
          <Card className="bg-gradient-to-r from-purple-100 to-blue-100 border-none">
            <CardContent className="flex flex-col md:flex-row items-center justify-between py-6">
              <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-bold mb-2" style={{ color: colors.accent1 }}>
                  Ready to practice with this paper?
                </h3>
                <p className="max-w-md" style={{ color: colors.textSecondary }}>
                  Join a revision room to practice similar questions with other students and get AI-guided help.
                </p>
              </div>
              <Button 
                className="font-medium"
                style={{ backgroundColor: colors.accent1, color: 'white' }}
                onClick={() => router.push('/revision')}
              >
                <Sparkles className="w-4 h-4 mr-2" /> Go to Revision Room
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}