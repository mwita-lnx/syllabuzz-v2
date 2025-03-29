import React, { useState, useEffect } from 'react';
import { 
  FileText, Filter, Calendar, Download, ExternalLink, Search, 
  ArrowUpDown, BookOpen, Lightbulb, BarChart2, List, Grid, PieChart,
  Clock, AlignJustify, Sparkles, Info , GraduationCap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

// Import layout and components
import { MainLayout } from '@/components/MainLayout';
import { FacultySelector } from '@/components/FacultySelector';
import { PastPaperCard } from '@/components/PastPaperCard';

// Import past paper service
import { pastPaperService, PastPaper, PastPaperUnit } from '@/services/pastpaper-service';

// Import types
import { Faculty } from '@/types/index2';


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



const PastPaperPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State management
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<string>('papers');
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<PastPaper[]>([]);
  const [units, setUnits] = useState<PastPaperUnit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedExamType, setSelectedExamType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [selectedPaper, setSelectedPaper] = useState<PastPaper | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'relevance'>('newest');
  const [paperStats, setPaperStats] = useState<any>({
    totalPapers: 0,
    byFaculty: {},
    byYear: {},
    byExamType: {}
  });
  
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
    fetchData();
    
    // Mock faculties
    setFaculties([
      { id: '1', name: 'Science', code: 'sci', color: '#FF6B6B' },
      { id: '2', name: 'Arts', code: 'arts', color: '#4ECDC4' },
      { id: '3', name: 'Business', code: 'bus', color: '#FFD166' },
      { id: '4', name: 'Engineering', code: 'eng', color: '#6A0572' },
      { id: '5', name: 'Medicine', code: 'med', color: '#06D6A0' }
    ]);
  }, []);
  
  // Apply filters when dependencies change
  useEffect(() => {
    filterPastPapers();
  }, [pastPapers, selectedUnit, selectedYear, selectedExamType, searchQuery, selectedFaculty, selectedDifficulty, sortOrder]);
  
  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // For demo purposes, using mock data instead of actual API calls
      const mockPastPapers: PastPaper[] = [
        {
          _id: '1',
          title: 'Data Structures & Algorithms Final Exam',
          unit_id: '1',
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
          faculty_code: 'sci',
          difficulty: 'Medium',
          total_questions: 10,
          total_marks: 100,
          average_score: 68,
          topics: ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Sorting']
        },
        {
          _id: '2',
          title: 'Introduction to Marketing Midterm',
          unit_id: '2',
          unit_name: 'Introduction to Marketing',
          unit_code: 'MKT101',
          year: '2023',
          exam_type: 'Midterm',
          semester: 'Fall',
          stream: 'Regular',
          date: '2023-10-20',
          time: '14:00',
          session: 'Afternoon',
          file_path: '/files/MKT101_2023_Midterm.pdf',
          created_at: '2023-11-05',
          updated_at: '2023-11-05',
          faculty: 'Business',
          faculty_code: 'bus',
          difficulty: 'Easy',
          total_questions: 30,
          total_marks: 60,
          average_score: 45,
          topics: ['Marketing Principles', 'Consumer Behavior', 'Market Research']
        },
        {
          _id: '3',
          title: 'Human Physiology Final Exam',
          unit_id: '3',
          unit_name: 'Human Physiology',
          unit_code: 'MED203',
          year: '2023',
          exam_type: 'Final',
          semester: 'Spring',
          stream: 'Regular',
          date: '2023-06-18',
          time: '09:00',
          session: 'Morning',
          file_path: '/files/MED203_2023_Final.pdf',
          created_at: '2023-07-01',
          updated_at: '2023-07-01',
          faculty: 'Medicine',
          faculty_code: 'med',
          difficulty: 'Hard',
          total_questions: 15,
          total_marks: 100,
          average_score: 62,
          topics: ['Cardiovascular', 'Respiratory', 'Nervous System', 'Endocrine']
        },
        {
          _id: '4',
          title: 'Contemporary Literature Quiz',
          unit_id: '4',
          unit_name: 'Contemporary Literature',
          unit_code: 'LIT220',
          year: '2023',
          exam_type: 'Quiz',
          semester: 'Fall',
          stream: 'Regular',
          date: '2023-09-10',
          time: '11:00',
          session: 'Morning',
          file_path: '/files/LIT220_2023_Quiz.pdf',
          created_at: '2023-09-15',
          updated_at: '2023-09-15',
          faculty: 'Arts',
          faculty_code: 'arts',
          difficulty: 'Medium',
          total_questions: 20,
          total_marks: 40,
          average_score: 32,
          topics: ['Poetry', 'Novels', 'Literary Analysis']
        },
        {
          _id: '5',
          title: 'Machine Learning Final Exam',
          unit_id: '5',
          unit_name: 'Machine Learning',
          unit_code: 'CS405',
          year: '2022',
          exam_type: 'Final',
          semester: 'Fall',
          stream: 'Regular',
          date: '2022-12-10',
          time: '14:00',
          session: 'Afternoon',
          file_path: '/files/CS405_2022_Final.pdf',
          created_at: '2023-01-05',
          updated_at: '2023-01-05',
          faculty: 'Science',
          faculty_code: 'sci',
          difficulty: 'Hard',
          total_questions: 8,
          total_marks: 100,
          average_score: 65,
          topics: ['Neural Networks', 'Supervised Learning', 'Clustering', 'Reinforcement Learning']
        },
        {
          _id: '6',
          title: 'Structural Analysis Midterm',
          unit_id: '6',
          unit_name: 'Structural Analysis',
          unit_code: 'ENG302',
          year: '2022',
          exam_type: 'Midterm',
          semester: 'Spring',
          stream: 'Regular',
          date: '2022-03-15',
          time: '09:00',
          session: 'Morning',
          file_path: '/files/ENG302_2022_Midterm.pdf',
          created_at: '2022-04-01',
          updated_at: '2022-04-01',
          faculty: 'Engineering',
          faculty_code: 'eng',
          difficulty: 'Medium',
          total_questions: 12,
          total_marks: 60,
          average_score: 42,
          topics: ['Force Analysis', 'Moments', 'Free Body Diagrams', 'Trusses']
        },
        {
          _id: '7',
          title: 'Financial Accounting Final Exam',
          unit_id: '7',
          unit_name: 'Financial Accounting',
          unit_code: 'ACC201',
          year: '2022',
          exam_type: 'Final',
          semester: 'Fall',
          stream: 'Regular',
          date: '2022-12-12',
          time: '09:00',
          session: 'Morning',
          file_path: '/files/ACC201_2022_Final.pdf',
          created_at: '2023-01-10',
          updated_at: '2023-01-10',
          faculty: 'Business',
          faculty_code: 'bus',
          difficulty: 'Medium',
          total_questions: 25,
          total_marks: 100,
          average_score: 72,
          topics: ['Balance Sheets', 'Income Statements', 'Cash Flow', 'Financial Ratios']
        },
        {
          _id: '8',
          title: 'Data Structures & Algorithms Sample Paper',
          unit_id: '1',
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
          faculty_code: 'sci',
          difficulty: 'Medium',
          total_questions: 10,
          total_marks: 100,
          average_score: null,
          topics: ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Sorting']
        }
      ];
      
      const mockUnits: PastPaperUnit[] = [
        {
          _id: '1',
          name: 'Data Structures and Algorithms',
          code: 'CS202',
          course_id: 'cs',
          description: 'Advanced data structures and algorithm analysis'
        },
        {
          _id: '2',
          name: 'Introduction to Marketing',
          code: 'MKT101',
          course_id: 'bus',
          description: 'Fundamentals of marketing principles and practices'
        },
        {
          _id: '3',
          name: 'Human Physiology',
          code: 'MED203',
          course_id: 'med',
          description: 'Study of human organ systems and their functions'
        },
        {
          _id: '4',
          name: 'Contemporary Literature',
          code: 'LIT220',
          course_id: 'arts',
          description: 'Analysis of contemporary literary works and movements'
        },
        {
          _id: '5',
          name: 'Machine Learning',
          code: 'CS405',
          course_id: 'cs',
          description: 'Principles of machine learning algorithms and applications'
        },
        {
          _id: '6',
          name: 'Structural Analysis',
          code: 'ENG302',
          course_id: 'eng',
          description: 'Analysis of structural systems and components'
        },
        {
          _id: '7',
          name: 'Financial Accounting',
          code: 'ACC201',
          course_id: 'bus',
          description: 'Principles of financial accounting and reporting'
        }
      ];
      
      // Mock AI suggestions
      const mockAiSuggestions = [
        {
          id: 1,
          title: "Time Complexity Analysis",
          description: "Based on past papers, we predict questions about analyzing time complexity of recursive algorithms",
          confidence: 0.89,
          topics: ["Algorithm Analysis", "Big O Notation", "Recursion"],
          examples: [
            "Determine the time complexity of the following recursive function...",
            "Compare the time complexities of merge sort and quick sort in the worst case..."
          ]
        },
        {
          id: 2,
          title: "Implementation of Tree Traversals",
          description: "Expect a question on implementing one or more tree traversal algorithms",
          confidence: 0.82,
          topics: ["Binary Trees", "Depth-First Search", "Tree Traversal"],
          examples: [
            "Implement an in-order traversal of a binary tree without using recursion...",
            "Given a binary tree, write a function to perform a level-order traversal..."
          ]
        },
        {
          id: 3,
          title: "Graph Problem Solving",
          description: "Questions involving shortest path algorithms appear consistently",
          confidence: 0.75,
          topics: ["Graphs", "Dijkstra's Algorithm", "BFS"],
          examples: [
            "Implement Dijkstra's algorithm to find the shortest path between two vertices...",
            "Given a graph G, determine if there exists a path from vertex A to B..."
          ]
        }
      ];
      
      setPastPapers(mockPastPapers);
      setUnits(mockUnits);
      setAiSuggestions(mockAiSuggestions);
      setIsLoading(false);
      
      // Calculate statistics
      calculatePaperStats(mockPastPapers);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };
  
  // Calculate paper statistics
  const calculatePaperStats = (papers: PastPaper[]) => {
    const stats = {
      totalPapers: papers.length,
      byFaculty: {},
      byYear: {},
      byExamType: {}
    };
    
    papers.forEach(paper => {
      // Count by faculty
      if (stats.byFaculty[paper.faculty]) {
        stats.byFaculty[paper.faculty]++;
      } else {
        stats.byFaculty[paper.faculty] = 1;
      }
      
      // Count by year
      if (stats.byYear[paper.year]) {
        stats.byYear[paper.year]++;
      } else {
        stats.byYear[paper.year] = 1;
      }
      
      // Count by exam type
      if (stats.byExamType[paper.exam_type]) {
        stats.byExamType[paper.exam_type]++;
      } else {
        stats.byExamType[paper.exam_type] = 1;
      }
    });
    
    setPaperStats(stats);
  };
  
  // Filter past papers based on current state
  const filterPastPapers = () => {
    let result = [...pastPapers];
    
    // Apply faculty filter
    if (selectedFaculty !== 'all') {
      result = result.filter(paper => paper.faculty_code === selectedFaculty);
    }
    
    // Apply unit filter
    if (selectedUnit !== 'all') {
      result = result.filter(paper => paper.unit_id === selectedUnit);
    }
    
    // Apply year filter
    if (selectedYear !== 'all') {
      result = result.filter(paper => paper.year === selectedYear);
    }
    
    // Apply exam type filter
    if (selectedExamType !== 'all') {
      result = result.filter(paper => paper.exam_type === selectedExamType);
    }
    
    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      result = result.filter(paper => paper.difficulty === selectedDifficulty);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        paper => 
          paper.title.toLowerCase().includes(query) || 
          paper.unit_name.toLowerCase().includes(query) ||
          paper.unit_code.toLowerCase().includes(query) ||
          (paper.topics && paper.topics.some(topic => topic.toLowerCase().includes(query)))
      );
    }
    
    // Apply sorting
    switch (sortOrder) {
      case 'newest':
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'relevance':
        // Sort by a combination of recency and difficulty (just an example)
        result.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          const difficultyScore = {
            'Easy': 1,
            'Medium': 2,
            'Hard': 3
          };
          const scoreA = (dateA / 1000000000) + (difficultyScore[a.difficulty] || 0) * 10;
          const scoreB = (dateB / 1000000000) + (difficultyScore[b.difficulty] || 0) * 10;
          return scoreB - scoreA;
        });
        break;
    }
    
    setFilteredPapers(result);
  };
  
  // Get unique years from papers
  const getUniqueYears = () => {
    const years = new Set(pastPapers.map(paper => paper.year));
    return Array.from(years).sort((a, b) => b.localeCompare(a)); // Sort descending
  };
  
  // Get unique exam types from papers
  const getUniqueExamTypes = () => {
    const types = new Set(pastPapers.map(paper => paper.exam_type));
    return Array.from(types).sort();
  };
  
  // Get unique difficulties
  const getUniqueDifficulties = () => {
    const difficulties = new Set(
      pastPapers
        .filter(paper => paper.difficulty) // Filter out papers without difficulty
        .map(paper => paper.difficulty)
    );
    return Array.from(difficulties).sort();
  };
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    filterPastPapers();
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedUnit('all');
    setSelectedYear('all');
    setSelectedExamType('all');
    setSelectedFaculty('all');
    setSelectedDifficulty('all');
    setSortOrder('newest');
  };
  
  // View paper details
  const viewPaperDetails = (paper: PastPaper) => {
    setSelectedPaper(paper);
    setActiveTab('viewer');
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Get faculty color
  const getFacultyColor = (facultyCode: string) => {
    const faculty = faculties.find(f => f.code === facultyCode);
    return faculty ? faculty.color : colors.tertiary;
  };

  // Enhanced PastPaperListItem for list view
  const PastPaperListItem = ({ paper }: { paper: PastPaper }) => {
    const facultyColor = getFacultyColor(paper.faculty_code);
    
    return (
      <div 
        className="border-b p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => viewPaperDetails(paper)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: facultyColor }}
            ></div>
            <h3 className="font-bold title-font" style={{ color: colors.textPrimary }}>
              {paper.title}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: colors.textSecondary }}>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" /> {paper.unit_code}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(paper.date)}
            </span>
            <span>{paper.exam_type}</span>
            {paper.difficulty && (
              <Badge style={{ 
                backgroundColor: 
                  paper.difficulty === 'Easy' ? '#4ECDC4' : 
                  paper.difficulty === 'Medium' ? '#FFD166' : 
                  '#FF6B6B' 
              }}>
                {paper.difficulty}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex mt-2 md:mt-0 items-center gap-2">
          {paper.topics && paper.topics.length > 0 && (
            <div className="hidden md:flex flex-wrap gap-1 max-w-xs">
              {paper.topics.slice(0, 3).map((topic, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
              {paper.topics.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{paper.topics.length - 3}
                </Badge>
              )}
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm"
            className="hover:bg-opacity-20"
            style={{ borderColor: facultyColor, color: facultyColor }}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Paper detail view component
  const PaperDetailView = ({ paper }: { paper: PastPaper }) => {
    if (!paper) return null;
    
    const facultyColor = getFacultyColor(paper.faculty_code);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="mr-2"
            onClick={() => setActiveTab('papers')}
            style={{ borderColor: facultyColor, color: facultyColor }}
          >
            ← Back to Papers
          </Button>
          <h2 className="text-xl font-bold title-font" style={{ color: facultyColor }}>
            {paper.title}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Paper metadata */}
          <Card className="md:col-span-1" style={{ backgroundColor: colors.surface }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: facultyColor }}>
                <Info className="w-5 h-5" /> Paper Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Unit:</span>
                <p style={{ color: colors.textPrimary }}>{paper.unit_code} - {paper.unit_name}</p>
              </div>
              <div>
                <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Faculty:</span>
                <p style={{ color: colors.textPrimary }}>{paper.faculty}</p>
              </div>
              <div>
                <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Date:</span>
                <p style={{ color: colors.textPrimary }}>{formatDate(paper.date)}</p>
              </div>
              <div>
                <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Exam Type:</span>
                <p style={{ color: colors.textPrimary }}>{paper.exam_type}</p>
              </div>
              <div>
                <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Semester:</span>
                <p style={{ color: colors.textPrimary }}>{paper.semester}</p>
              </div>
              {paper.difficulty && (
                <div>
                  <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Difficulty:</span>
                  <p>
                    <Badge style={{ 
                      backgroundColor: 
                        paper.difficulty === 'Easy' ? '#4ECDC4' : 
                        paper.difficulty === 'Medium' ? '#FFD166' : 
                        '#FF6B6B' 
                    }}>
                      {paper.difficulty}
                    </Badge>
                  </p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Total Questions:</span>
                <p style={{ color: colors.textPrimary }}>{paper.total_questions}</p>
              </div>
              <div>
                <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Total Marks:</span>
                <p style={{ color: colors.textPrimary }}>{paper.total_marks}</p>
              </div>
              {paper.average_score && (
                <div>
                  <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Average Score:</span>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span style={{ color: colors.textPrimary }}>{paper.average_score}/{paper.total_marks}</span>
                      <span style={{ color: colors.textPrimary }}>{Math.round((paper.average_score / paper.total_marks) * 100)}%</span>
                    </div>
                    <Progress value={(paper.average_score / paper.total_marks) * 100} className="h-2" />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                className="w-full"
                style={{ backgroundColor: facultyColor, color: colors.textPrimary }}
                onClick={() => window.open(paper.file_path, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" /> Open Paper
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                style={{ borderColor: facultyColor, color: facultyColor }}
              >
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </Button>
            </CardFooter>
          </Card>
          
          {/* Paper Preview */}
          <Card className="md:col-span-2" style={{ backgroundColor: colors.surface }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: facultyColor }}>
                <FileText className="w-5 h-5" /> Paper Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center bg-gray-100 border-2 border-dashed">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: `${facultyColor}80` }} />
                <p className="text-lg font-bold mb-2" style={{ color: facultyColor }}>Paper Preview</p>
                <p className="text-sm max-w-md mx-auto" style={{ color: colors.textSecondary }}>
                  In a real implementation, a PDF preview would be displayed here.
                </p>
                <Button 
                  className="mt-4"
                  style={{ backgroundColor: facultyColor, color: colors.textPrimary }}
                  onClick={() => window.open(paper.file_path, '_blank')}
                >
                  Open Full Paper
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Topics and AI Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Topics */}
          {paper.topics && paper.topics.length > 0 && (
            <Card style={{ backgroundColor: colors.surface }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: facultyColor }}>
                  <List className="w-5 h-5" /> Topics Covered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {paper.topics.map((topic, index) => (
                    <Badge key={index} className="py-2" style={{ backgroundColor: `${facultyColor}20`, color: facultyColor }}>
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* AI Question Analysis */}
          <Card style={{ backgroundColor: colors.surface }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: facultyColor }}>
                <Sparkles className="w-5 h-5" /> AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold mb-1" style={{ color: facultyColor }}>Question Distribution</h4>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    This paper focuses heavily on {paper.topics?.[0]} and {paper.topics?.[1]}, which together make up approximately 60% of the total marks.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold mb-1" style={{ color: facultyColor }}>Similar Questions</h4>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Questions similar to this paper appear in other {paper.faculty} papers from {parseInt(paper.year) - 1} and {parseInt(paper.year) - 2}.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold mb-1" style={{ color: facultyColor }}>Predicted Topic Importance</h4>
                  <div className="flex gap-1 flex-wrap">
                    {paper.topics?.slice(0, 3).map((topic, index) => (
                      <Badge key={index} variant="outline" style={{ borderColor: facultyColor, color: facultyColor }}>
                        {topic}: {90 - index * 10}% likely
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Separator className="my-4" />
              <Button 
                variant="outline" 
                className="w-full"
                style={{ borderColor: facultyColor, color: facultyColor }}
                onClick={() => navigate('/revision')}
              >
                <Sparkles className="w-4 h-4 mr-2" /> Join a Revision Room for this Paper
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Similar Papers */}
        <div>
          <h3 className="text-lg font-bold mb-4 title-font" style={{ color: facultyColor }}>Similar Papers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pastPapers
              .filter(p => 
                p._id !== paper._id && 
                (p.unit_id === paper.unit_id || p.exam_type === paper.exam_type)
              )
              .slice(0, 3)
              .map((similarPaper, index) => (
                <div key={similarPaper._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                  <PastPaperCard 
                    paper={similarPaper} 
                    facultyColor={getFacultyColor(similarPaper.faculty_code)}
                    onClick={() => viewPaperDetails(similarPaper)}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <MainLayout>
      <FadeIn>
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 title-font" style={{ color: colors.tertiary }}>
              <FileText className="w-6 h-6" /> Past Paper Repository
            </h2>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-96">
              <TabsList className="w-full" style={{ backgroundColor: `${colors.tertiary}33` }}>
                <TabsTrigger 
                  value="papers" 
                  className="data-[state=active]:text-white transition-all"
                  style={{ 
                    backgroundColor: "transparent",
                    "--tw-bg-opacity": "1",
                    "--secondary": colors.tertiary,
                    "--tw-text-opacity": "1",
                    "--tw-white": colors.textPrimary,
                    "[data-state=active]:backgroundColor": colors.tertiary
                  }}
                >
                  Browse Papers
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="data-[state=active]:text-white transition-all"
                  style={{ 
                    backgroundColor: "transparent",
                    "--tw-bg-opacity": "1",
                    "--secondary": colors.tertiary,
                    "--tw-text-opacity": "1",
                    "--tw-white": colors.textPrimary,
                    "[data-state=active]:backgroundColor": colors.tertiary
                  }}
                >
                  Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="ai-insights" 
                  className="data-[state=active]:text-white transition-all"
                  style={{ 
                    backgroundColor: "transparent",
                    "--tw-bg-opacity": "1",
                    "--secondary": colors.tertiary,
                    "--tw-text-opacity": "1",
                    "--tw-white": colors.textPrimary,
                    "[data-state=active]:backgroundColor": colors.tertiary
                  }}
                >
                  AI Insights
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* TabsContent for Browsing Papers */}
          {activeTab === 'papers' && !selectedPaper && (
            <div className="space-y-6">
              {/* Filters Section */}
              <Card className="mb-6" style={{ backgroundColor: colors.surface }}>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg" style={{ color: colors.tertiary }}>
                    <Filter className="w-5 h-5 mr-2" /> Filter Past Papers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Search */}
                    <div className="lg:col-span-2">
                      <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" style={{ color: colors.textSecondary }} />
                        <Input
                          type="text"
                          placeholder="Search paper title, unit, topics..."
                          className="w-full pl-10 border-2 focus:ring-2 focus:border-transparent transition-all"
                          style={{ 
                            borderColor: colors.tertiary,
                            borderRadius: '0.5rem',
                            color: colors.textPrimary
                          }}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </form>
                    </div>
                    
                    {/* Faculty Filter */}
                    <div>
                      <FacultySelector 
                        faculties={faculties} 
                        selectedFaculty={selectedFaculty}
                        onSelect={setSelectedFaculty}
                        primaryColor={colors.tertiary}
                      />
                    </div>
                    
                    {/* Unit Filter */}
                    <div>
                      <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                        <SelectTrigger style={{ borderColor: colors.tertiary, color: colors.textPrimary }}>
                          <SelectValue placeholder="Select Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Units</SelectItem>
                          {units.map(unit => (
                            <SelectItem key={unit._id} value={unit._id}>
                              {unit.code} - {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Year and Exam Type Filters */}
                    <div>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger style={{ borderColor: colors.tertiary, color: colors.textPrimary }}>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Years</SelectItem>
                          {getUniqueYears().map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Exam Type Filter */}
                    <div>
                      <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                        <SelectTrigger style={{ borderColor: colors.tertiary, color: colors.textPrimary }}>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {getUniqueExamTypes().map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Advanced Filters */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Difficulty Filter */}
                    <div>
                      <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                        <SelectTrigger style={{ borderColor: colors.tertiary, color: colors.textPrimary }}>
                          <SelectValue placeholder="Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Difficulties</SelectItem>
                          {getUniqueDifficulties().map(difficulty => (
                            <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Sort Order */}
                    <div>
                      <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                        <SelectTrigger style={{ borderColor: colors.tertiary, color: colors.textPrimary }}>
                          <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="relevance">Relevance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* View Mode Toggle */}
                    <div className="flex justify-end lg:col-span-4 items-center gap-2">
                      <span style={{ color: colors.textSecondary }}>View:</span>
                      <Button 
                        variant={viewMode === 'grid' ? 'default' : 'outline'} 
                        size="sm"
                        className="mr-2"
                        onClick={() => setViewMode('grid')}
                        style={viewMode === 'grid' ? { backgroundColor: colors.tertiary, color: colors.textPrimary } : { borderColor: colors.tertiary, color: colors.tertiary }}
                      >
                        <Grid className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant={viewMode === 'list' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setViewMode('list')}
                        style={viewMode === 'list' ? { backgroundColor: colors.tertiary, color: colors.textPrimary } : { borderColor: colors.tertiary, color: colors.tertiary }}
                      >
                        <AlignJustify className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div>
                    <Badge className="mr-2" style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}>
                      {filteredPapers.length} papers found
                    </Badge>
                    {(selectedFaculty !== 'all' || selectedUnit !== 'all' || selectedYear !== 'all' || selectedExamType !== 'all' || selectedDifficulty !== 'all' || searchQuery) && (
                      <Badge style={{ backgroundColor: colors.quaternary, color: 'white' }}>
                        Filters applied
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                    style={{ borderColor: colors.tertiary, color: colors.tertiary }}
                  >
                    Reset Filters
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Papers Display */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="h-full" style={{ backgroundColor: colors.surface }}>
                      <CardHeader>
                        <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
                        <div className="h-4 w-1/2 bg-gray-200 rounded mt-2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                      </CardContent>
                      <CardFooter>
                        <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : filteredPapers.length === 0 ? (
                <Alert 
                  className="border-2 animate-pulse" 
                  style={{ 
                    backgroundColor: colors.surface, 
                    borderColor: colors.tertiary,
                    color: colors.textPrimary
                  }}
                >
                  <AlertTitle className="font-bold title-font">No past papers found</AlertTitle>
                  <AlertDescription>
                    Try adjusting your filters or search query to find past papers.
                  </AlertDescription>
                </Alert>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPapers.map((paper, index) => (
                    <div key={paper._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                      <PastPaperCard 
                        paper={paper} 
                        facultyColor={getFacultyColor(paper.faculty_code)}
                        onClick={() => viewPaperDetails(paper)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  {filteredPapers.map((paper, index) => (
                    <PastPaperListItem key={paper._id} paper={paper} />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Paper Viewer Tab */}
          {activeTab === 'papers' && selectedPaper && (
            <PaperDetailView paper={selectedPaper} />
          )}
          
          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-all" style={{ backgroundColor: colors.surface }}>
                  <CardHeader>
                    <CardTitle className="flex items-center" style={{ color: colors.tertiary }}>
                      <FileText className="w-5 h-5 mr-2" /> Total Papers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold" style={{ color: colors.tertiary }}>
                      {paperStats.totalPapers}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-all" style={{ backgroundColor: colors.surface }}>
                  <CardHeader>
                    <CardTitle className="flex items-center" style={{ color: colors.tertiary }}>
                      <ArrowUpDown className="w-5 h-5 mr-2" /> Distribution by Year
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(paperStats.byYear || {}).sort((a, b) => b[0].localeCompare(a[0])).map(([year, count]) => (
                        <div key={year} className="flex justify-between items-center">
                          <span style={{ color: colors.textPrimary }}>{year}</span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(count as number / paperStats.totalPapers) * 100} 
                              className="h-2 w-32" 
                              style={{ 
                                backgroundColor: `${colors.tertiary}40`,
                                "--primary": colors.tertiary
                              }}
                            />
                            <span style={{ color: colors.textSecondary }}>{count as number}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-all" style={{ backgroundColor: colors.surface }}>
                  <CardHeader>
                    <CardTitle className="flex items-center" style={{ color: colors.tertiary }}>
                      <PieChart className="w-5 h-5 mr-2" /> Distribution by Exam Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(paperStats.byExamType || {}).sort().map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span style={{ color: colors.textPrimary }}>{type}</span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(count as number / paperStats.totalPapers) * 100} 
                              className="h-2 w-32" 
                              style={{ 
                                backgroundColor: `${colors.tertiary}40`,
                                "--primary": colors.tertiary
                              }}
                            />
                            <span style={{ color: colors.textSecondary }}>{count as number}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card style={{ backgroundColor: colors.surface }}>
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: colors.tertiary }}>
                    <BarChart2 className="w-5 h-5 mr-2" /> Faculty Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      {Object.entries(paperStats.byFaculty || {}).sort().map(([faculty, count]) => {
                        const facultyObj = faculties.find(f => f.name === faculty);
                        const facultyColor = facultyObj ? facultyObj.color : colors.tertiary;
                        
                        return (
                          <div key={faculty} className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: facultyColor }}></div>
                              <span style={{ color: colors.textPrimary }}>{faculty}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={(count as number / paperStats.totalPapers) * 100} 
                                className="h-2 w-32" 
                                style={{ 
                                  backgroundColor: `${facultyColor}40`,
                                  "--primary": facultyColor
                                }}
                              />
                              <span style={{ color: colors.textSecondary }}>{count as number}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-lg font-bold mb-2" style={{ color: colors.tertiary }}>Analytics Dashboard</p>
                        <p className="text-sm max-w-md" style={{ color: colors.textSecondary }}>
                          In a real implementation, an interactive data visualization chart would be displayed here showing the distribution of papers by faculties.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card style={{ backgroundColor: colors.surface }}>
                  <CardHeader>
                    <CardTitle className="flex items-center" style={{ color: colors.tertiary }}>
                      <BookOpen className="w-5 h-5 mr-2" /> Most Popular Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['Data Structures', 'Neural Networks', 'Marketing Principles', 'Financial Analysis', 'Literary Analysis'].map((topic, index) => (
                        <div key={topic} className="flex justify-between items-center">
                          <span style={{ color: colors.textPrimary }}>{topic}</span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={90 - index * 10} 
                              className="h-2 w-32" 
                              style={{ 
                                backgroundColor: `${colors.tertiary}40`,
                                "--primary": colors.tertiary
                              }}
                            />
                            <span style={{ color: colors.textSecondary }}>{90 - index * 10}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card style={{ backgroundColor: colors.surface }}>
                  <CardHeader>
                    <CardTitle className="flex items-center" style={{ color: colors.tertiary }}>
                      <Clock className="w-5 h-5 mr-2" /> Recent Uploads
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pastPapers
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 5)
                        .map((paper) => {
                          const date = new Date(paper.created_at);
                          const daysAgo = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div key={paper._id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer" onClick={() => viewPaperDetails(paper)}>
                              <div>
                                <p className="font-medium" style={{ color: colors.textPrimary }}>{paper.title}</p>
                                <p className="text-sm" style={{ color: colors.textSecondary }}>{paper.unit_code} • {paper.faculty}</p>
                              </div>
                              <Badge variant="outline" style={{ color: colors.textSecondary }}>
                                {daysAgo} days ago
                              </Badge>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="ghost" 
                      className="w-full text-sm"
                      style={{ color: colors.tertiary }}
                      onClick={() => setActiveTab('papers')}
                    >
                      View All Papers →
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
          
          {/* AI Insights Tab */}
          {activeTab === 'ai-insights' && (
            <div className="space-y-6">
              <Alert className="bg-gradient-to-r from-purple-100 to-blue-100 border-2" style={{ borderColor: colors.tertiary }}>
                <Sparkles className="w-5 h-5" style={{ color: colors.tertiary }} />
                <AlertTitle style={{ color: colors.textPrimary }}>AI-Powered Exam Insights</AlertTitle>
                <AlertDescription style={{ color: colors.textSecondary }}>
                  Our AI analyzes patterns across past papers to predict likely exam questions and topics. These predictions are based on historical trends and are designed to help focus your revision efforts.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aiSuggestions.map((suggestion) => (
                  <Card 
                    key={suggestion.id} 
                    className="hover:shadow-lg transition-all border-t-4"
                    style={{ borderTopColor: colors.tertiary, backgroundColor: colors.surface }}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg title-font" style={{ color: colors.tertiary }}>
                        {suggestion.title}
                      </CardTitle>
                      <CardDescription>
                        <Badge className="mt-1" style={{ backgroundColor: `rgba(106, 5, 114, ${suggestion.confidence})` }}>
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3 text-sm" style={{ color: colors.textSecondary }}>
                        {suggestion.description}
                      </p>
                      <div className="mb-2">
                        <span className="text-xs font-bold" style={{ color: colors.textSecondary }}>RELATED TOPICS:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {suggestion.topics.map((topic, index) => (
                            <Badge key={index} variant="outline" style={{ borderColor: colors.tertiary, color: colors.tertiary }}>
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-bold" style={{ color: colors.textSecondary }}>EXAMPLE QUESTIONS:</span>
                        <ul className="mt-1 space-y-1 text-sm list-disc pl-4" style={{ color: colors.textPrimary }}>
                          {suggestion.examples.map((example, index) => (
                            <li key={index}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}
                        onClick={() => navigate('/revision')}
                      >
                        <Sparkles className="w-4 h-4 mr-2" /> Practice Similar Questions
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              <Card style={{ backgroundColor: colors.surface }}>
                <CardHeader>
                  <CardTitle className="flex items-center" style={{ color: colors.tertiary }}>
                    <Lightbulb className="w-5 h-5 mr-2" /> Generated Questions by Topic
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="algorithms">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="algorithms">Algorithms</TabsTrigger>
                      <TabsTrigger value="data-structures">Data Structures</TabsTrigger>
                      <TabsTrigger value="marketing">Marketing</TabsTrigger>
                      <TabsTrigger value="finance">Finance</TabsTrigger>
                      <TabsTrigger value="medical">Medical</TabsTrigger>
                    </TabsList>
                    <TabsContent value="algorithms" className="p-4 border rounded-md mt-2">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold mb-1" style={{ color: colors.tertiary }}>Question 1: Time Complexity Analysis</h3>
                          <p style={{ color: colors.textPrimary }}>
                            Analyze the time and space complexity of the following algorithm and explain your reasoning:
                          </p>
                          <div className="bg-gray-100 p-3 my-2 rounded font-mono text-sm">
                            {`function mystery(n) {
  if (n <= 1) return 1;
  let result = 0;
  for (let i = 0; i < n; i++) {
    result += mystery(n/2);
  }
  return result;
}`}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-bold mb-1" style={{ color: colors.tertiary }}>Question 2: Algorithm Design</h3>
                          <p style={{ color: colors.textPrimary }}>
                            Design an algorithm to find the kth smallest element in an unsorted array. Your solution should have an average time complexity better than O(n log n).
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="font-bold mb-1" style={{ color: colors.tertiary }}>Question 3: Dynamic Programming</h3>
                          <p style={{ color: colors.textPrimary }}>
                            Given a set of items, each with a weight and a value, determine the maximum value you can obtain with a knapsack that can hold a maximum weight W. Implement a dynamic programming solution and explain your approach.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="data-structures" className="p-4 border rounded-md mt-2">
                      <p className="text-center py-4" style={{ color: colors.textSecondary }}>
                        Select a topic to view AI-generated practice questions.
                      </p>
                    </TabsContent>
                    
                    <TabsContent value="marketing" className="p-4 border rounded-md mt-2">
                      <p className="text-center py-4" style={{ color: colors.textSecondary }}>
                        Select a topic to view AI-generated practice questions.
                      </p>
                    </TabsContent>
                    
                    <TabsContent value="finance" className="p-4 border rounded-md mt-2">
                      <p className="text-center py-4" style={{ color: colors.textSecondary }}>
                        Select a topic to view AI-generated practice questions.
                      </p>
                    </TabsContent>
                    
                    <TabsContent value="medical" className="p-4 border rounded-md mt-2">
                      <p className="text-center py-4" style={{ color: colors.textSecondary }}>
                        Select a topic to view AI-generated practice questions.
                      </p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}
                    onClick={() => navigate('/revision')}
                  >
                    Go to Revision Room to Practice These Questions
                  </Button>
                </CardFooter>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card style={{ backgroundColor: colors.surface }}>
                  <CardHeader>
                    <CardTitle className="flex items-center" style={{ color: colors.tertiary }}>
                      <ArrowUpDown className="w-5 h-5 mr-2" /> Question Similarity Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        Our AI has identified similar questions across different papers. Here are some clusters of related questions:
                      </p>
                      
                      <div className="space-y-3">
                        <div className="border p-3 rounded-md">
                          <h4 className="font-bold mb-1" style={{ color: colors.tertiary }}>Cluster: Graph Traversal</h4>
                          <div className="space-y-2 text-sm">
                            <p style={{ color: colors.textPrimary }}>• CS202 (2023): "Implement BFS and DFS algorithms for a given graph..."</p>
                            <p style={{ color: colors.textPrimary }}>• CS202 (2022): "Compare and contrast BFS and DFS traversal methods..."</p>
                            <p style={{ color: colors.textPrimary }}>• CS405 (2022): "Discuss how graph traversal algorithms can be applied to..."</p>
                          </div>
                        </div>
                        
                        <div className="border p-3 rounded-md">
                          <h4 className="font-bold mb-1" style={{ color: colors.tertiary }}>Cluster: Sorting Algorithms</h4>
                          <div className="space-y-2 text-sm">
                            <p style={{ color: colors.textPrimary }}>• CS202 (2023): "Compare the time complexity of merge sort and quick sort..."</p>
                            <p style={{ color: colors.textPrimary }}>• CS202 (2022): "Implement the quick sort algorithm and analyze its complexity..."</p>
                            <p style={{ color: colors.textPrimary }}>• CS202 (2021): "Analyze the best, average, and worst-case time complexity of..."</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card style={{ backgroundColor: colors.surface }}>
                  <CardHeader>
                    <CardTitle className="flex items-center" style={{ color: colors.tertiary }}>
                      <BarChart2 className="w-5 h-5 mr-2" /> Topic Frequency Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        Based on analysis of past papers, here are the most frequently examined topics:
                      </p>
                      
                      <div className="space-y-3">
                        {[
                          { topic: 'Data Structures', frequency: 85, papers: 12 },
                          { topic: 'Sorting Algorithms', frequency: 78, papers: 11 },
                          { topic: 'Dynamic Programming', frequency: 64, papers: 9 },
                          { topic: 'Graph Algorithms', frequency: 57, papers: 8 },
                          { topic: 'Tree Traversal', frequency: 50, papers: 7 }
                        ].map((item) => (
                          <div key={item.topic} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium" style={{ color: colors.textPrimary }}>{item.topic}</p>
                              <p className="text-xs" style={{ color: colors.textSecondary }}>Appears in {item.papers} papers</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={item.frequency} 
                                className="h-2 w-24" 
                                style={{ 
                                  backgroundColor: `${colors.tertiary}40`,
                                  "--primary": colors.tertiary
                                }}
                              />
                              <span style={{ color: colors.textSecondary }}>{item.frequency}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Bottom CTA Section */}
          <div className="mt-12">
            <Card 
              className="bg-gradient-to-r from-tertiary/10 to-quaternary/10 border-none hover:shadow-md transition-all" 
            >
              <CardContent className="flex flex-col md:flex-row items-center justify-between py-6">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-lg font-bold mb-2 title-font" style={{ color: colors.tertiary }}>
                    Ready to study with these papers?
                  </h3>
                  <p className="max-w-md" style={{ color: colors.textSecondary }}>
                    Join a revision room to practice these papers with other students, get AI-guided help, and track your progress.
                  </p>
                </div>
                <Button 
                  className="font-medium"
                  style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}
                  onClick={() => navigate('/revision')}
                >
                  <GraduationCap className="w-4 h-4 mr-2" /> Go to Revision Room
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </FadeIn>
    </MainLayout>
  );
};

export default PastPaperPage;