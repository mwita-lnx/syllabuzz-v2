import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  ChevronLeft, 
  FileText, 
  BookCopy,
  BookmarkPlus,
  GraduationCap,
  Tag,
  Link2,
  Info,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

// Import API service
import { apiGet, apiPost } from '@/services/api';

// Import layout and components
import { MainLayout } from '@/components/MainLayout';
import { NoteCard } from '@/components/NoteCard';
import { PastPaperCard } from '@/components/PastPaperCard';

import  NoteSearchComponent  from '@/components/NoteSearchComponent';

// Import types
import { Unit, Note, PastPaper, ApiResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const ExternalLink: React.FC<{ className?: string }> = ({ className }) => <Link2 className={className} />;

// Animation component for transitions
const FadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div 
      className="animate-fadeIn opacity-0" 
      style={{ 
        animation: 'fadeIn 0.5s ease forwards',
      }}
    >
      {children}
    </div>
  );
};

const UnitDetailPage: React.FC = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // State management
  const [unit, setUnit] = useState<Unit | null>(null);
  const [relatedNotes, setRelatedNotes] = useState<Note[]>([]);
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  
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
  
  // Fetch data on component mount
  useEffect(() => {
    if (unitId) {
      fetchUnitDetails();
      fetchRelatedNotes();
      fetchPastPapers();
      if (isAuthenticated) {
        checkBookmarkStatus();
      }
    }
  }, [unitId, isAuthenticated]);
  
  // Fetch unit details
  const fetchUnitDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!unitId) {
        setError('Unit ID is missing');
        setIsLoading(false);
        return;
      }
      
      // Make API call to get unit details
      const response = await apiGet<ApiResponse<Unit>>(`/units/${unitId}`);
      
      if (response.status && response.data) {
        setUnit(response.data);
      } else {
        setError(response.error || 'Failed to load unit details');
        toast.error('Failed to load unit details');
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error fetching unit details:', err);
      setError(err.message || 'Failed to fetch unit details');
      toast.error('Failed to load unit details');
      setIsLoading(false);
    }
  };
  
  // Fetch related notes
  const fetchRelatedNotes = async () => {
    try {
      if (!unitId) return;
      
      // Make API call to get related notes
      const response = await apiGet<ApiResponse<Note[]>>(`/notes/?unit_id=${unitId}&limit=4`);
      
      if (response.status && response.data) {
        setRelatedNotes(response.data);
      } else {
        console.error('Error fetching related notes:', response.error);
      }
    } catch (err) {
      console.error('Error fetching related notes:', err);
    }
  };
  
  // Fetch past papers
  const fetchPastPapers = async () => {
    try {
      if (!unitId) return;
      
      // Make API call to get past papers
      const response = await apiGet<ApiResponse<PastPaper[]>>(`/pastpapers/?unit_id=${unitId}&limit=4`);
      
      if (response.status === "success" && response.data) {
        setPastPapers(response.data);
      } else {
        console.error('Error fetching past papers:', response.error);
      }
    } catch (err) {
      console.error('Error fetching past papers:', err);
    }
  };
  
  // Check if the unit is bookmarked
  const checkBookmarkStatus = async () => {
    try {
      if (!unitId || !isAuthenticated) return;
      
      // Make API call to check bookmark status
      const response = await apiGet<ApiResponse<{ bookmarked: boolean }>>(`/saved-items/check/?type=unit&item_id=${unitId}`);
      
      if (response.status === "success" && response.data) {
        setIsBookmarked(response.data.bookmarked);
      }
    } catch (err) {
      console.error('Error checking bookmark status:', err);
    }
  };
  
  // Get faculty color for styling
  const getFacultyColor = () => {
    if (!unit) return colors.primary;
    
    switch (unit.facultyCode) {
      case 'sci':
        return colors.primary;
      case 'arts':
        return colors.secondary;
      case 'bus':
        return colors.tertiary;
      case 'eng':
        return colors.quaternary;
      case 'med':
        return '#06D6A0';
      default:
        return colors.primary;
    }
  };
  
  // Bookmark unit for later
  const handleBookmark = async () => {
    try {
      if (!unitId || !isAuthenticated) {
        toast.error('Please log in to bookmark units');
        return;
      }
      
      if (isBookmarked) {
        // Remove bookmark
        const response = await apiPost<ApiResponse<null>>('/saved-items/remove/', {
          type: 'unit',
          item_id: unitId
        });
        
        if (response.status === 'success') {
          setIsBookmarked(false);
          toast.success('Unit removed from bookmarks');
        } else {
          toast.error(response.error || 'Failed to remove bookmark');
        }
      } else {
        // Add bookmark
        const response = await apiPost<ApiResponse<{ saved_item_id: string }>>('/saved-items/add/', {
          type: 'unit',
          item_id: unitId
        });
        
        if (response.status === 'success') {
          setIsBookmarked(true);
          toast.success('Unit bookmarked successfully');
        } else {
          toast.error(response.error || 'Failed to bookmark unit');
        }
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      toast.error('Failed to update bookmark');
    }
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
            onClick={() => navigate('/units')}
            style={{ borderColor: getFacultyColor(), color: getFacultyColor() }}
          >
            <ChevronLeft className="w-4 h-4" /> Back to Units
          </Button>
          
          {/* Error Alert */}
          {error && (
            <Alert 
              className="mb-6 border-2" 
              style={{ 
                backgroundColor: colors.surface, 
                borderColor: colors.primary,
                color: colors.textPrimary
              }}
            >
              <AlertTitle className="font-bold title-font flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" style={{ color: colors.primary }} />
                Error Loading Unit
              </AlertTitle>
              <AlertDescription>
                {error}. Please try again or contact support if the problem persists.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Unit Header Card */}
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
          ) : unit ? (
            <Card 
              className="border-2 transition-all hover:shadow-md" 
              style={{ 
                backgroundColor: colors.surface,
                borderColor: getFacultyColor(), 
                borderLeftWidth: '6px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="mb-2" style={{ backgroundColor: getFacultyColor(), color: 'white' }}>
                      {unit.faculty}
                    </Badge>
                    <CardTitle className="text-2xl font-bold title-font" style={{ color: getFacultyColor() }}>
                      {unit.name}
                    </CardTitle>
                    <CardDescription className="text-lg" style={{ color: colors.textSecondary }}>
                      {unit.code} {unit.level && `| ${unit.level}`} {unit.credits && `| ${unit.credits} Credits`}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="rounded-full"
                    style={{ 
                      borderColor: getFacultyColor(), 
                      color: getFacultyColor(),
                      backgroundColor: isBookmarked ? `${getFacultyColor()}20` : 'transparent' 
                    }}
                    onClick={handleBookmark}
                  >
                    <BookmarkPlus className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4" style={{ color: colors.textSecondary }}>{unit.description}</p>
                
                {unit.prerequisites && unit.prerequisites.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-bold mb-2" style={{ color: getFacultyColor() }}>Prerequisites</h3>
                    <div className="flex flex-wrap gap-2">
                      {unit.prerequisites.map((prereq, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="font-medium"
                          style={{ borderColor: getFacultyColor(), color: getFacultyColor() }}
                        >
                          {prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {unit.instructors && unit.instructors.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-2" style={{ color: getFacultyColor() }}>Instructors</h3>
                    <div>
                      {unit.instructors.map((instructor, idx) => (
                        <div key={idx} className="flex items-center gap-2 mb-1">
                          <span style={{ color: colors.textPrimary }}>
                            {instructor.title && `${instructor.title} `}{instructor.name}
                          </span>
                          {instructor.email && (
                            <span style={{ color: colors.textSecondary }}>({instructor.email})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="flex flex-wrap gap-2">
                  {unit.keywords && unit.keywords.map((keyword, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="animate-fadeIn border-2 font-medium"
                      style={{ 
                        animationDelay: `${idx * 0.1}s`,
                        borderColor: getFacultyColor(),
                        color: getFacultyColor()
                      }}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Alert 
              className="border-2 animate-pulse" 
              style={{ 
                backgroundColor: colors.surface, 
                borderColor: colors.primary,
                color: colors.textPrimary
              }}
            >
              <AlertTitle className="font-bold title-font">Unit not found</AlertTitle>
              <AlertDescription>
                The requested unit could not be found. Please try another unit.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Tabs Section */}
          {unit && !error && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList 
                className="w-full max-w-md mx-auto grid grid-cols-3" 
                style={{ backgroundColor: `${getFacultyColor()}20` }}
              >
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:text-white transition-all"
                  style={{ 
                    backgroundColor: "transparent",
                    "--tw-bg-opacity": "1",
                    "--secondary": getFacultyColor(),
                    "--tw-text-opacity": "1",
                    "--tw-white": colors.textPrimary,
                    "[data-state=active]:backgroundColor": getFacultyColor()
                  }}
                >
                  <Info className="w-4 h-4 mr-2" /> Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="notes" 
                  className="data-[state=active]:text-white transition-all"
                  style={{ 
                    backgroundColor: "transparent",
                    "--tw-bg-opacity": "1",
                    "--secondary": getFacultyColor(),
                    "--tw-text-opacity": "1",
                    "--tw-white": colors.textPrimary,
                    "[data-state=active]:backgroundColor": getFacultyColor()
                  }}
                >
                  <BookCopy className="w-4 h-4 mr-2" /> Notes
                </TabsTrigger>
                <TabsTrigger 
                  value="pastpapers" 
                  className="data-[state=active]:text-white transition-all"
                  style={{ 
                    backgroundColor: "transparent",
                    "--tw-bg-opacity": "1",
                    "--secondary": getFacultyColor(),
                    "--tw-text-opacity": "1",
                    "--tw-white": colors.textPrimary,
                    "[data-state=active]:backgroundColor": getFacultyColor()
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" /> Past Papers
                </TabsTrigger>
              </TabsList>
              
              {/* Overview Tab Content */}
              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Syllabus Card */}
                  <Card style={{ backgroundColor: colors.surface }}>
                    <CardHeader>
                      <CardTitle className="flex items-center title-font" style={{ color: getFacultyColor() }}>
                        <BookOpen className="w-5 h-5 mr-2" /> Syllabus
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {unit.syllabus && unit.syllabus.length > 0 ? (
                        <ul className="space-y-2">
                          {unit.syllabus.map((item, idx) => (
                            <li 
                              key={idx} 
                              className="flex items-start gap-2"
                              style={{ color: colors.textPrimary }}
                            >
                              <span className="font-bold" style={{ color: getFacultyColor() }}>{idx + 1}.</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ color: colors.textSecondary }}>No syllabus information available.</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Resources Card */}
                  <Card style={{ backgroundColor: colors.surface }}>
                    <CardHeader>
                      <CardTitle className="flex items-center title-font" style={{ color: getFacultyColor() }}>
                        <Link2 className="w-5 h-5 mr-2" /> Resources
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {unit.resources && unit.resources.length > 0 ? (
                        <div className="space-y-4">
                          {unit.resources.map((resource, idx) => (
                            <div key={idx}>
                              <h3 className="font-bold mb-2" style={{ color: getFacultyColor() }}>
                                {resource.category || 'Resource'}
                              </h3>
                              <ul className="space-y-2" style={{ color: colors.textPrimary }}>
                                {resource.items.map((item, itemIdx) => (
                                  <li key={itemIdx}>
                                    {item.url ? (
                                      <a 
                                        href={item.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 hover:underline" 
                                        style={{ color: getFacultyColor() }}
                                      >
                                        <ExternalLink className="w-4 h-4" /> {item.name}
                                      </a>
                                    ) : (
                                      item.name
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-bold mb-2" style={{ color: getFacultyColor() }}>Recommended Materials</h3>
                            <p className="text-sm" style={{ color: colors.textSecondary }}>
                              No recommended materials have been added for this unit.
                            </p>
                          </div>
                          
                          <div>
                            <h3 className="font-bold mb-2" style={{ color: getFacultyColor() }}>Online Resources</h3>
                            <p className="text-sm" style={{ color: colors.textSecondary }}>
                              No online resources have been added for this unit.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Quick Links */}
                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-4 title-font" style={{ color: getFacultyColor() }}>Quick Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center justify-center font-medium transition-all hover:scale-105"
                      style={{ borderColor: getFacultyColor(), color: getFacultyColor() }}
                      onClick={() => setActiveTab('notes')}
                    >
                      <BookCopy className="w-6 h-6 mb-2" />
                      Related Notes
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center justify-center font-medium transition-all hover:scale-105"
                      style={{ borderColor: getFacultyColor(), color: getFacultyColor() }}
                      onClick={() => setActiveTab('pastpapers')}
                    >
                      <FileText className="w-6 h-6 mb-2" />
                      Past Papers
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center justify-center font-medium transition-all hover:scale-105"
                      style={{ borderColor: getFacultyColor(), color: getFacultyColor() }}
                      onClick={() => navigate('/revision')}
                    >
                      <GraduationCap className="w-6 h-6 mb-2" />
                      Revision Room
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              {/* Notes Tab Content */}
              <TabsContent value="notes" className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold title-font flex items-center gap-2" style={{ color: getFacultyColor() }}>
                    <BookCopy className="w-5 h-5" /> Related Notes & Materials
                  </h2>
                  <Button 
                    variant="outline"
                    style={{ borderColor: getFacultyColor(), color: getFacultyColor() }}
                    onClick={() => navigate('/notes?unit_id=' + unitId)}
                  >
                    View All Notes →
                  </Button>
                </div>
                
                {/* Add the search component here */}
                <NoteSearchComponent 
                  unitId={unitId} 
                  facultyColor={getFacultyColor()} 
                />
                
                {relatedNotes.length === 0 ? (
                  <Alert 
                    className="border-2" 
                    style={{ 
                      backgroundColor: colors.surface, 
                      borderColor: getFacultyColor(),
                      color: colors.textPrimary
                    }}
                  >
                    <AlertTitle className="font-bold title-font">No related notes found</AlertTitle>
                    <AlertDescription>
                      We couldn't find any notes related to this unit. Check back later for updates.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relatedNotes.map((note, index) => (
                      <div key={note._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                        <NoteCard 
                          note={note} 
                          typeColor={note.type === 'academic' ? getFacultyColor() : colors.secondary}
                          unitId={unitId}
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {isAuthenticated && (
                  <div className="mt-6 text-center">
                    <Button
                      style={{ backgroundColor: getFacultyColor(), color: 'white' }}
                      onClick={() => navigate('/upload?unit_id=' + unitId)}
                    >
                      Upload Notes for This Unit
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              {/* Past Papers Tab Content */}
              <TabsContent value="pastpapers" className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold title-font flex items-center gap-2" style={{ color: getFacultyColor() }}>
                    <FileText className="w-5 h-5" /> Past Exam Papers
                  </h2>
                  <Button 
                    variant="outline"
                    style={{ borderColor: getFacultyColor(), color: getFacultyColor() }}
                    onClick={() => navigate('/pastpapers?unit_id=' + unitId)}
                  >
                    View All Papers →
                  </Button>
                </div>
                
                {pastPapers.length === 0 ? (
                  <Alert 
                    className="border-2" 
                    style={{ 
                      backgroundColor: colors.surface, 
                      borderColor: getFacultyColor(),
                      color: colors.textPrimary
                    }}
                  >
                    <AlertTitle className="font-bold title-font">No past papers found</AlertTitle>
                    <AlertDescription>
                      We couldn't find any past papers for this unit. Check back later for updates.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pastPapers.map((paper, index) => (
                      <div key={paper._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                        <PastPaperCard 
                          paper={paper} 
                          facultyColor={getFacultyColor()}
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {isAuthenticated && (
                  <div className="mt-6 text-center">
                    <Button
                      style={{ backgroundColor: getFacultyColor(), color: 'white' }}
                      onClick={() => navigate('/upload?type=pastpaper&unit_id=' + unitId)}
                    >
                      Upload Past Paper
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </FadeIn>
    </MainLayout>
  );
};

export default UnitDetailPage;