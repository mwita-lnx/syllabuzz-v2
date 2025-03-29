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
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Import layout and components
import { MainLayout } from '@/components/MainLayout';
import { NoteCard } from '@/components/NoteCard';
import { PastPaperCard } from '@/components/PastPaperCard';

// Import past paper service
import { PastPaper } from '@/services/pastpaper-service';

// Import types
import { Unit, Note } from '@/types/index2';


const ExternalLink = ({ className }) => <Link2 className={className} />;


// Animation component for transitions
const FadeIn = ({ children }) => {
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
  
  // State management
  const [unit, setUnit] = useState<Unit | null>(null);
  const [relatedNotes, setRelatedNotes] = useState<Note[]>([]);
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
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
      fetchUnitDetails(unitId);
    }
  }, [unitId]);
  
  // Fetch unit details
  const fetchUnitDetails = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Mock API call for unit details
      const mockUnit: Unit = {
        _id: id,
        name: 'Data Structures and Algorithms',
        code: 'CS202',
        description: 'This course covers fundamental data structures and algorithms. Topics include arrays, linked lists, stacks, queues, trees, graphs, sorting, searching, and algorithm analysis.',
        faculty: 'Science',
        facultyCode: 'sci',
        keywords: ['algorithms', 'data structures', 'programming', 'complexity analysis', 'sorting', 'searching'],
        created_at: '2023-01-15',
        syllabus: [
          'Introduction to algorithm analysis',
          'Arrays and linked lists',
          'Stacks and queues',
          'Trees and binary search trees',
          'Heaps and priority queues',
          'Hash tables',
          'Graphs and graph algorithms',
          'Sorting algorithms',
          'Searching algorithms',
          'Dynamic programming'
        ],
        prerequisites: ['CS101', 'MATH201'],
        instructors: [
          { name: 'Dr. Jane Smith', email: 'jane.smith@university.edu' },
          { name: 'Prof. John Doe', email: 'john.doe@university.edu' }
        ],
        credits: 4,
        level: 'Intermediate'
      };
      
      // Mock API call for related notes
      const mockNotes: Note[] = [
        {
          _id: '1',
          title: 'Understanding Sorting Algorithms',
          description: 'A comprehensive guide to common sorting algorithms and their time complexity analysis.',
          url: '#',
          source_name: 'Science Notes',
          published_at: '2024-03-10',
          type: 'notes',
          faculty: 'Science',
          facultyCode: 'sci',
          categories: ['algorithms', 'computer science'],
          relevance_score: 0.95
        },
        {
          _id: '5',
          title: 'Binary Search Trees Implementation',
          description: 'Detailed explanation of binary search tree operations with implementation examples.',
          url: '#',
          source_name: 'CS Research',
          published_at: '2024-02-25',
          type: 'academic',
          faculty: 'Science',
          facultyCode: 'sci',
          categories: ['data structures', 'algorithms'],
          relevance_score: 0.92
        },
        {
          _id: '8',
          title: 'Graph Algorithms and Applications',
          description: 'Overview of common graph algorithms and their real-world applications.',
          url: '#',
          source_name: 'Algorithm Journal',
          published_at: '2024-01-15',
          type: 'academic',
          faculty: 'Science',
          facultyCode: 'sci',
          categories: ['graphs', 'algorithms'],
          relevance_score: 0.89
        },
        {
          _id: '12',
          title: 'Time Complexity Analysis Techniques',
          description: 'Methods for analyzing and determining the time complexity of algorithms.',
          url: '#',
          source_name: 'CS Education',
          published_at: '2023-12-10',
          type: 'notes',
          faculty: 'Science',
          facultyCode: 'sci',
          categories: ['algorithms', 'analysis'],
          relevance_score: 0.87
        }
      ];
      
      // Mock API call for past papers
      const mockPastPapers: PastPaper[] = [
        {
          _id: '1',
          title: 'Data Structures & Algorithms Final Exam',
          unit_id: id,
          unit_name: 'Data Structures and Algorithms',
          unit_code: 'CS202',
          year: '2023',
          exam_type: 'Final',
          semester: 'Spring',
          stream: 'Regular',
          date: '2023-06-15',
          time: '09:00',
          session: 'Morning',
          file_path: '/files/CS202_2023_Final.pdf',
          created_at: '2023-07-01',
          updated_at: '2023-07-01',
          faculty: 'Science',
          faculty_code: 'sci'
        },
        {
          _id: '8',
          title: 'Data Structures & Algorithms Sample Paper',
          unit_id: id,
          unit_name: 'Data Structures and Algorithms',
          unit_code: 'CS202',
          year: '2023',
          exam_type: 'Sample',
          semester: 'Spring',
          stream: 'Regular',
          date: '2023-05-01',
          time: '00:00',
          session: 'N/A',
          file_path: '/files/CS202_2023_Sample.pdf',
          created_at: '2023-05-05',
          updated_at: '2023-05-05',
          faculty: 'Science',
          faculty_code: 'sci'
        },
        {
          _id: '9',
          title: 'Data Structures & Algorithms Midterm',
          unit_id: id,
          unit_name: 'Data Structures and Algorithms',
          unit_code: 'CS202',
          year: '2023',
          exam_type: 'Midterm',
          semester: 'Spring',
          stream: 'Regular',
          date: '2023-03-15',
          time: '09:00',
          session: 'Morning',
          file_path: '/files/CS202_2023_Midterm.pdf',
          created_at: '2023-03-20',
          updated_at: '2023-03-20',
          faculty: 'Science',
          faculty_code: 'sci'
        }
      ];
      
      setUnit(mockUnit);
      setRelatedNotes(mockNotes);
      setPastPapers(mockPastPapers);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching unit details:', error);
      setIsLoading(false);
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
  const handleBookmark = () => {
    console.log('Bookmarking unit:', unit?.code);
    // In a real app, we would implement actual bookmarking functionality
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
                      {unit.code} | {unit.level} | {unit.credits} Credits
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="rounded-full"
                    style={{ borderColor: getFacultyColor(), color: getFacultyColor() }}
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
                          <span style={{ color: colors.textPrimary }}>{instructor.name}</span>
                          <span style={{ color: colors.textSecondary }}>({instructor.email})</span>
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
          {unit && (
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
                      {unit.syllabus ? (
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
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold mb-2" style={{ color: getFacultyColor() }}>Recommended Materials</h3>
                          <ul className="space-y-2" style={{ color: colors.textPrimary }}>
                            <li>Data Structures & Algorithms in Java (6th Edition)</li>
                            <li>Introduction to Algorithms (CLRS, 3rd Edition)</li>
                            <li>Algorithm Design Manual (Skiena)</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h3 className="font-bold mb-2" style={{ color: getFacultyColor() }}>Online Resources</h3>
                          <ul className="space-y-2">
                            <li>
                              <a 
                                href="#" 
                                className="flex items-center gap-2 hover:underline" 
                                style={{ color: getFacultyColor() }}
                              >
                                <ExternalLink className="w-4 h-4" /> Course Website
                              </a>
                            </li>
                            <li>
                              <a 
                                href="#" 
                                className="flex items-center gap-2 hover:underline" 
                                style={{ color: getFacultyColor() }}
                              >
                                <ExternalLink className="w-4 h-4" /> Lecture Recordings
                              </a>
                            </li>
                            <li>
                              <a 
                                href="#" 
                                className="flex items-center gap-2 hover:underline" 
                                style={{ color: getFacultyColor() }}
                              >
                                <ExternalLink className="w-4 h-4" /> Practice Exercises
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Quick Links */}
                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-4 title-font" style={{ color: getFacultyColor() }}>Quick Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center justify-center font-medium transition-all hover-scale"
                      style={{ borderColor: getFacultyColor(), color: getFacultyColor() }}
                      onClick={() => setActiveTab('notes')}
                    >
                      <BookCopy className="w-6 h-6 mb-2" />
                      Related Notes
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center justify-center font-medium transition-all hover-scale"
                      style={{ borderColor: getFacultyColor(), color: getFacultyColor() }}
                      onClick={() => setActiveTab('pastpapers')}
                    >
                      <FileText className="w-6 h-6 mb-2" />
                      Past Papers
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center justify-center font-medium transition-all hover-scale"
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
                    onClick={() => navigate('/notes')}
                  >
                    View All Notes →
                  </Button>
                </div>
                
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
                    onClick={() => navigate('/revision')}
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
              </TabsContent>
            </Tabs>
          )}
        </div>
      </FadeIn>
    </MainLayout>
  );
};

export default UnitDetailPage;