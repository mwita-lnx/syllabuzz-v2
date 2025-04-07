// src/pages/tutorials/TutorialDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  ChevronLeft, 
  Tag, 
  Share2, 
  Clock, 
  Calendar,
  User,
  Bookmark,
  ThumbsUp,
  MessageSquare,
  Check,
  Play,
  Pause,
  VolumeX,
  Volume2,
  Download,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import RelatedContent from '@/components/RelatedContent';
import toast from 'react-hot-toast';

// Type definitions
interface TutorialSection {
  id: string;
  title: string;
  duration: number;
  isCompleted: boolean;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  content: string;
  videoUrl?: string;
  categories: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  author: string;
  authorInfo?: string;
  views: number;
  rating: number;
  sections: TutorialSection[];
  prerequisites?: string[];
  learningOutcomes?: string[];
  createdAt: string;
  updatedAt?: string;
  thumbnailUrl?: string;
}

// Animation component for transitions
const FadeIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
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

const TutorialDetailPage: React.FC = () => {
  const { tutorialId } = useParams<{ tutorialId: string }>();
  const navigate = useNavigate();
  
  // States
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
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
  };
  
  // Fetch tutorial data
  useEffect(() => {
    const fetchTutorial = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // For now, let's simulate an API call
        setTimeout(() => {
          // Mock tutorial data based on ID
          const mockTutorial: Tutorial = {
            id: tutorialId || 'tutorial-1',
            title: 'Complete Introduction to Calculus',
            description: 'Learn the fundamentals of calculus with clear explanations and practical examples.',
            longDescription: 'This comprehensive tutorial covers all the essential concepts of calculus, from limits and derivatives to integrals and applications. Designed for beginners, this tutorial breaks down complex topics into easy-to-understand segments with clear explanations and visual aids. By the end of this tutorial, you will have a solid foundation in calculus and be prepared for more advanced topics.',
            content: `# Introduction to Calculus

Calculus is the mathematical study of continuous change. It has two major branches:

1. **Differential Calculus** - Concerning rates of change and slopes of curves
2. **Integral Calculus** - Concerning accumulation of quantities and the areas under curves

## Why Study Calculus?

Calculus has applications in virtually every scientific field:

- Physics uses calculus to understand motion, electricity, and magnetism
- Biology uses calculus to model population growth and disease spread
- Economics uses calculus to optimize profit and analyze market trends
- Engineering uses calculus to design structures and analyze systems

## Prerequisites

Before diving into calculus, you should be comfortable with:

- Algebra
- Trigonometry
- Basic function concepts

Let's begin our journey into calculus with the fundamental concept of limits.`,
            categories: ['Mathematics', 'Calculus', 'Fundamentals'],
            difficulty: 'beginner',
            duration: 120, // 2 hours
            author: 'Dr. Sarah Johnson',
            authorInfo: 'Professor of Mathematics with 15 years of teaching experience',
            views: 12500,
            rating: 4.8,
            sections: [
              { id: 'intro', title: 'Introduction to Calculus', duration: 10, isCompleted: true },
              { id: 'limits', title: 'Understanding Limits', duration: 25, isCompleted: true },
              { id: 'derivatives', title: 'Derivatives and Rates of Change', duration: 30, isCompleted: false },
              { id: 'applications', title: 'Applications of Derivatives', duration: 20, isCompleted: false },
              { id: 'integrals', title: 'Introduction to Integrals', duration: 35, isCompleted: false }
            ],
            prerequisites: [
              'Algebra fundamentals',
              'Basic understanding of functions',
              'Familiarity with trigonometry'
            ],
            learningOutcomes: [
              'Understand the concept of limits and continuity',
              'Calculate derivatives using various techniques',
              'Apply derivatives to solve real-world problems',
              'Understand the fundamental theorem of calculus',
              'Evaluate basic integrals'
            ],
            createdAt: '2023-06-15T10:30:00Z',
            updatedAt: '2023-09-10T14:45:00Z',
            videoUrl: 'https://example.com/tutorials/calculus-introduction.mp4'
          };
          
          setTutorial(mockTutorial);
          
          // Set first section as active if not already set
          if (mockTutorial.sections.length > 0 && !activeSection) {
            setActiveSection(mockTutorial.sections[0].id);
          }
          
          // Calculate progress
          const completedSections = mockTutorial.sections.filter(s => s.isCompleted).length;
          const progressPercentage = (completedSections / mockTutorial.sections.length) * 100;
          setProgress(progressPercentage);
          
          setIsLoading(false);
        }, 1500);
      } catch (err) {
        console.error('Error fetching tutorial:', err);
        setError('Failed to load tutorial. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchTutorial();
  }, [tutorialId]);
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  // Get difficulty color
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner':
        return '#4ECDC4'; // teal
      case 'intermediate':
        return '#FFD166'; // yellow
      case 'advanced':
        return '#FF6B6B'; // red
      default:
        return '#4A5568'; // gray
    }
  };
  
  // Handle bookmark toggle
  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(!isBookmarked ? 'Tutorial bookmarked' : 'Bookmark removed');
  };
  
  // Handle section change
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    
    // In a real implementation, this would save progress to the server
    // and possibly update the video source
    
    // Reset player state when changing sections
    setIsPlaying(false);
  };
  
  // Handle playback controls
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Handle next/previous section
  const goToNextSection = () => {
    if (!tutorial) return;
    
    const currentIndex = tutorial.sections.findIndex(s => s.id === activeSection);
    if (currentIndex < tutorial.sections.length - 1) {
      setActiveSection(tutorial.sections[currentIndex + 1].id);
      setIsPlaying(false);
    }
  };
  
  const goToPreviousSection = () => {
    if (!tutorial) return;
    
    const currentIndex = tutorial.sections.findIndex(s => s.id === activeSection);
    if (currentIndex > 0) {
      setActiveSection(tutorial.sections[currentIndex - 1].id);
      setIsPlaying(false);
    }
  };
  
  // Mark section complete
  const markSectionComplete = (sectionId: string) => {
    if (!tutorial) return;
    
    // Update tutorial section
    const updatedSections = tutorial.sections.map(section => 
      section.id === sectionId ? { ...section, isCompleted: true } : section
    );
    
    // Calculate new progress
    const completedSections = updatedSections.filter(s => s.isCompleted).length;
    const progressPercentage = (completedSections / updatedSections.length) * 100;
    
    // Update state
    setTutorial({
      ...tutorial,
      sections: updatedSections
    });
    setProgress(progressPercentage);
    
    // Show toast notification
    toast.success('Section marked as complete');
    
    // In a real implementation, this would save progress to the server
  };
  
  return (
    <MainLayout>
      <FadeIn>
        <div className="space-y-6">
          {/* Back Button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-4 border-2 transition-all flex items-center gap-1"
            onClick={() => navigate('/tutorials')}
            style={{ borderColor: colors.tertiary, color: colors.tertiary }}
          >
            <ChevronLeft className="w-4 h-4" /> Back to Tutorials
          </Button>
          
          {/* Error Message */}
          {error && (
            <Alert 
              className="mb-6 border-2" 
              style={{ 
                backgroundColor: colors.surface, 
                borderColor: colors.primary
              }}
            >
              <AlertTitle className="font-bold">Error Loading Tutorial</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Tutorial Header Card */}
          {isLoading ? (
            <Card style={{ backgroundColor: colors.surface }}>
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                <Skeleton className="h-4 w-1/2" style={{ backgroundColor: `${colors.textSecondary}40` }} />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" style={{ backgroundColor: `${colors.textSecondary}40` }} />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-6 w-full" style={{ backgroundColor: `${colors.textSecondary}40` }} />
              </CardFooter>
            </Card>
          ) : tutorial ? (
            <Card 
              className="border-2 transition-all hover:shadow-md" 
              style={{ 
                backgroundColor: colors.surface,
                borderColor: colors.tertiary, 
                borderLeftWidth: '6px'
              }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="mb-2" style={{ backgroundColor: getDifficultyColor(tutorial.difficulty), color: tutorial.difficulty === 'beginner' ? colors.textPrimary : 'white' }}>
                      {tutorial.difficulty.charAt(0).toUpperCase() + tutorial.difficulty.slice(1)}
                    </Badge>
                    <CardTitle className="text-2xl font-bold" style={{ color: colors.tertiary }}>
                      {tutorial.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-2" style={{ color: colors.textSecondary }}>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" /> {tutorial.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> {formatDate(tutorial.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {formatDuration(tutorial.duration)}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    className={`transition-all ${isBookmarked ? 'bg-tertiary bg-opacity-10' : ''}`}
                    onClick={toggleBookmark}
                    style={{ 
                      borderColor: colors.tertiary, 
                      color: isBookmarked ? colors.tertiary : colors.textSecondary
                    }}
                  >
                    <Bookmark className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4" style={{ color: colors.textSecondary }}>
                  {tutorial.longDescription || tutorial.description}
                </p>
                
                <div className="mb-4">
                  <h3 className="font-bold mb-2" style={{ color: colors.tertiary }}>Categories</h3>
                  <div className="flex flex-wrap gap-1">
                    {tutorial.categories.map((category, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="cursor-pointer"
                        style={{ borderColor: colors.tertiary, color: colors.tertiary }}
                        onClick={() => navigate(`/tutorials?category=${category}`)}
                      >
                        <Tag className="w-3 h-3 mr-1" /> {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {tutorial.prerequisites && tutorial.prerequisites.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-bold mb-2" style={{ color: colors.tertiary }}>Prerequisites</h3>
                    <ul className="list-disc pl-5">
                      {tutorial.prerequisites.map((prereq, idx) => (
                        <li key={idx} style={{ color: colors.textSecondary }}>{prereq}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {tutorial.learningOutcomes && tutorial.learningOutcomes.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-bold mb-2" style={{ color: colors.tertiary }}>What You'll Learn</h3>
                    <ul className="list-disc pl-5">
                      {tutorial.learningOutcomes.map((outcome, idx) => (
                        <li key={idx} style={{ color: colors.textSecondary }}>{outcome}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold" style={{ color: colors.tertiary }}>Your Progress</h3>
                      <Badge style={{ backgroundColor: colors.secondary, color: colors.textPrimary }}>
                        {Math.round(progress)}%
                      </Badge>
                    </div>
                    <span style={{ color: colors.textSecondary }}>
                      {tutorial.sections.filter(s => s.isCompleted).length} of {tutorial.sections.length} completed
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" style={{ backgroundColor: `${colors.tertiary}30` }}>
                    <div className="h-full transition-all" style={{ backgroundColor: colors.tertiary }}></div>
                  </Progress>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                    style={{ borderColor: colors.tertiary, color: colors.tertiary }}
                    onClick={() => navigate(`/tutorials`)}
                  >
                    <BookOpen className="w-4 h-4" /> Browse Similar
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                    style={{ borderColor: colors.tertiary, color: colors.tertiary }}
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied to clipboard');
                    }}
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </Button>
                </div>
                
                {tutorial.videoUrl && (
                  <Button 
                    variant="default" 
                    size="sm"
                    className="flex items-center gap-1"
                    style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}
                  >
                    <Download className="w-4 h-4" /> Download
                  </Button>
                )}
              </CardFooter>
            </Card>
          ) : (
            <Alert 
              className="border-2 animate-pulse" 
              style={{ 
                backgroundColor: colors.surface, 
                borderColor: colors.tertiary,
                color: colors.textPrimary
              }}
            >
              <AlertTitle className="font-bold">Tutorial not found</AlertTitle>
              <AlertDescription>
                The requested tutorial could not be found. Please try another one.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Tutorial Content Section */}
          {tutorial && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left: Sections List */}
              <div className="md:col-span-1">
                <Card style={{ backgroundColor: colors.surface }}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2" style={{ color: colors.tertiary }}>
                      <BookOpen className="w-5 h-5" /> Tutorial Sections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {tutorial.sections.map((section, index) => (
                        <div 
                          key={section.id}
                          className={`p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                            activeSection === section.id ? 'bg-tertiary bg-opacity-10' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => handleSectionChange(section.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                section.isCompleted ? 'bg-green-500 text-white' : 'border border-gray-300'
                              }`}
                            >
                              {section.isCompleted ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <span>{index + 1}</span>
                              )}
                            </div>
                            <div>
                              <div 
                                className={`font-medium ${activeSection === section.id ? 'text-tertiary' : ''}`}
                                style={{ color: activeSection === section.id ? colors.tertiary : undefined }}
                              >
                                {section.title}
                              </div>
                              <div className="text-xs" style={{ color: colors.textSecondary }}>
                                {section.duration} minutes
                              </div>
                            </div>
                          </div>
                          {activeSection === section.id && (
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.tertiary }}></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right: Content and Video */}
              <div className="md:col-span-2">
                <Tabs defaultValue="video" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger 
                      value="video" 
                      style={{ 
                        "[data-state=active]:backgroundColor": colors.tertiary,
                        "[data-state=active]:color": "white"
                      }}
                    >
                      <Play className="w-4 h-4 mr-1" /> Video
                    </TabsTrigger>
                    <TabsTrigger 
                      value="content" 
                      style={{ 
                        "[data-state=active]:backgroundColor": colors.tertiary,
                        "[data-state=active]:color": "white"
                      }}
                    >
                      <BookOpen className="w-4 h-4 mr-1" /> Reading
                    </TabsTrigger>
                    <TabsTrigger 
                      value="discussion" 
                      style={{ 
                        "[data-state=active]:backgroundColor": colors.tertiary,
                        "[data-state=active]:color": "white"
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" /> Discussion
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Video Tab */}
                  <TabsContent value="video">
                    <Card style={{ backgroundColor: colors.surface }}>
                      <CardContent className="p-6">
                        {/* Video Player (mock) */}
                        <div 
                          className="bg-black rounded-lg w-full aspect-video overflow-hidden relative flex items-center justify-center"
                        >
                          <div className="text-white text-center">
                            {tutorial.sections.find(s => s.id === activeSection)?.title || 'Video Player'}
                            <p className="text-sm text-gray-400 mt-2">Video content would play here</p>
                          </div>
                          
                          {/* Video Controls Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                            <div className="flex justify-between items-center text-white">
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-white hover:bg-white hover:bg-opacity-20"
                                  onClick={togglePlayback}
                                >
                                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-white hover:bg-white hover:bg-opacity-20"
                                  onClick={toggleMute}
                                >
                                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </Button>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge className="bg-white bg-opacity-30 text-xs">
                                  HD
                                </Badge>
                                <span className="text-sm">00:00 / {tutorial.sections.find(s => s.id === activeSection)?.duration}:00</span>
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <div className="h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full" style={{ width: '0%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Video Navigation */}
                        <div className="flex justify-between mt-4">
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-1"
                            disabled={!tutorial.sections.find((s, i) => s.id === activeSection && i > 0)}
                            onClick={goToPreviousSection}
                            style={{ borderColor: colors.tertiary, color: colors.tertiary }}
                          >
                            <ArrowLeft className="w-4 h-4" /> Previous
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="flex items-center"
                            style={{ borderColor: colors.tertiary, color: colors.tertiary }}
                            onClick={() => markSectionComplete(activeSection)}
                          >
                            <Check className="w-4 h-4 mr-1" /> Mark as Complete
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-1"
                            disabled={!tutorial.sections.find((s, i) => s.id === activeSection && i < tutorial.sections.length - 1)}
                            onClick={goToNextSection}
                            style={{ borderColor: colors.tertiary, color: colors.tertiary }}
                          >
                            Next <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Content Tab */}
                  <TabsContent value="content">
                    <Card style={{ backgroundColor: colors.surface }}>
                      <CardContent className="p-6">
                        <div className="prose max-w-none">
                          {/* Convert markdown to HTML in a real implementation */}
                          <div className="whitespace-pre-line">
                            {tutorial.content}
                          </div>
                        </div>
                        
                        <Separator className="my-6" />
                        
                        {/* Reading Navigation */}
                        <div className="flex justify-between">
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-1"
                            disabled={!tutorial.sections.find((s, i) => s.id === activeSection && i > 0)}
                            onClick={goToPreviousSection}
                            style={{ borderColor: colors.tertiary, color: colors.tertiary }}
                          >
                            <ArrowLeft className="w-4 h-4" /> Previous
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="flex items-center"
                            style={{ borderColor: colors.tertiary, color: colors.tertiary }}
                            onClick={() => markSectionComplete(activeSection)}
                          >
                            <Check className="w-4 h-4 mr-1" /> Mark as Complete
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-1"
                            disabled={!tutorial.sections.find((s, i) => s.id === activeSection && i < tutorial.sections.length - 1)}
                            onClick={goToNextSection}
                            style={{ borderColor: colors.tertiary, color: colors.tertiary }}
                          >
                            Next <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Discussion Tab */}
                  <TabsContent value="discussion">
                    <Card style={{ backgroundColor: colors.surface }}>
                      <CardContent className="p-6">
                        <div className="text-center p-8">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4" style={{ color: `${colors.tertiary}80` }} />
                          <h3 className="text-lg font-bold mb-2" style={{ color: colors.tertiary }}>Discussion</h3>
                          <p style={{ color: colors.textSecondary }}>
                            Join the conversation about this tutorial. Ask questions, share insights, and connect with other learners.
                          </p>
                          <Button className="mt-4" style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}>
                            Start a New Thread
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
          
          {/* Related Content Section */}
          {tutorial && (
            <div className="mt-8">
              <RelatedContent 
                sourceId={tutorialId || ''}
                sourceType="note"
                primaryColor={colors.tertiary}
              />
            </div>
          )}
        </div>
      </FadeIn>
    </MainLayout>
  );
};

export default TutorialDetailPage;