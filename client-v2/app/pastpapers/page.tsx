'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Filter, Calendar, Download, ExternalLink, Search, 
  ArrowUpDown, BookOpen, Lightbulb, BarChart2, List, Grid, PieChart,
  Clock, AlignJustify, Sparkles, Info, GraduationCap, Upload,
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

// Import layout and components
import { MainLayout } from '@/components/MainLayout';
import { FacultySelector } from '@/components/FacultySelector';
import { PastPaperCard } from '@/components/PastPaperCard';
import { PastPaperUploadDialog } from '@/components/PastPaperUploadDialog';

// Import past paper service
import { pastPaperService, PastPaper, PastPaperUnit } from '@/services/pastpaper-service';

// Import types
import { Faculty } from '@/types';
import { getFacultiesWithFallback } from '@/services/faculty-service';
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

export default function PastPapersPage() {
  const router = useRouter();
  
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
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const facultiesData = await getFacultiesWithFallback();
      setFaculties(facultiesData);
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };
  
  // Apply filters when dependencies change
  useEffect(() => {
    filterPastPapers();
  }, [pastPapers, selectedUnit, selectedYear, selectedExamType, searchQuery, selectedFaculty, selectedDifficulty, sortOrder]);
  
  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch past papers and units from API
      const [papersResult, unitsData] = await Promise.all([
        pastPaperService.getAllPastPapers({ 
          limit: 100,
          sort: 'year',
          order: 'desc'
        }),
        pastPaperService.getUnitsWithPastPapers()
      ]);
      
      // Mock AI suggestions for now
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
        }
      ];
      
      setPastPapers(papersResult.pastpapers);
      setUnits(unitsData);
      setAiSuggestions(mockAiSuggestions);
      setIsLoading(false);
      
      // Calculate statistics
      calculatePaperStats(papersResult.pastpapers);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load past papers. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Calculate paper statistics
  const calculatePaperStats = (papers: PastPaper[]) => {
    const stats = {
      totalPapers: papers.length,
      byFaculty: {} as Record<string, number>,
      byYear: {} as Record<string, number>,
      byExamType: {} as Record<string, number>
    };
    
    papers.forEach(paper => {
      // Count by faculty
      if (paper.faculty) {
        stats.byFaculty[paper.faculty] = (stats.byFaculty[paper.faculty] || 0) + 1;
      }
      
      // Count by year
      if (paper.year) {
        stats.byYear[paper.year] = (stats.byYear[paper.year] || 0) + 1;
      }
      
      // Count by exam type
      if (paper.exam_type) {
        stats.byExamType[paper.exam_type] = (stats.byExamType[paper.exam_type] || 0) + 1;
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
          (paper.unit_name && paper.unit_name.toLowerCase().includes(query)) ||
          (paper.unit_code && paper.unit_code.toLowerCase().includes(query)) ||
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
        // Simple relevance sorting based on difficulty
        result.sort((a, b) => {
          const difficultyScore = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
          const scoreA = difficultyScore[a.difficulty as keyof typeof difficultyScore] || 0;
          const scoreB = difficultyScore[b.difficulty as keyof typeof difficultyScore] || 0;
          return scoreB - scoreA;
        });
        break;
    }
    
    setFilteredPapers(result);
  };
  
  // Get unique years from papers
  const getUniqueYears = () => {
    const years = new Set(pastPapers.map(paper => paper.year));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
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
        .filter(paper => paper.difficulty)
        .map(paper => paper.difficulty!)
    );
    return Array.from(difficulties).sort();
  };
  
  // Handle search form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      filterPastPapers();
      return;
    }
    
    setIsLoading(true);
    try {
      const searchResults = await pastPaperService.searchPastPapers(searchQuery);
      setPastPapers(searchResults);
      calculatePaperStats(searchResults);
    } catch (error) {
      console.error('Error searching past papers:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset all filters
  const resetFilters = async () => {
    setSearchQuery('');
    setSelectedUnit('all');
    setSelectedYear('all');
    setSelectedExamType('all');
    setSelectedFaculty('all');
    setSelectedDifficulty('all');
    setSortOrder('newest');
    
    // Refetch all data
    await fetchData();
  };
  
  // View paper details
  const viewPaperDetails = (paper: PastPaper) => {
    router.push(`/pastpapers/${paper._id}`);
  };

  // Handle upload success
  const handleUploadSuccess = () => {
    fetchData(); // Refresh the data
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
    const facultyColor = getFacultyColor(paper.faculty_code || '');
    
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
            <h3 className="font-bold" style={{ color: colors.textPrimary }}>
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
  
  return (
    <MainLayout>
      <FadeIn>
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: colors.tertiary }}>
              <FileText className="w-6 h-6" /> Past Paper Repository
            </h2>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-96">
              <TabsList className="w-full" style={{ backgroundColor: `${colors.tertiary}33` }}>
                <TabsTrigger 
                  value="papers" 
                  className="data-[state=active]:text-white transition-all"
                >
                  Browse Papers
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="data-[state=active]:text-white transition-all"
                >
                  Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="ai-insights" 
                  className="data-[state=active]:text-white transition-all"
                >
                  AI Insights
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* TabsContent for Browsing Papers */}
          {activeTab === 'papers' && (
            <div className="space-y-6">
              {/* Filters Section */}
              <Card className="mb-6" style={{ backgroundColor: colors.surface }}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center text-lg" style={{ color: colors.tertiary }}>
                      <Filter className="w-5 h-5 mr-2" /> Filter Past Papers
                    </CardTitle>
                    <PastPaperUploadDialog 
                      units={units}
                      onUploadSuccess={handleUploadSuccess}
                      triggerButton={
                        <Button 
                          className="flex items-center gap-1"
                          style={{ backgroundColor: colors.primary, color: 'white' }}
                        >
                          <Upload className="w-4 h-4" /> Upload Paper
                        </Button>
                      }
                    />
                  </div>
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
                    
                    {/* Year Filter */}
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
                  <AlertTitle className="font-bold">No past papers found</AlertTitle>
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
                        facultyColor={getFacultyColor(paper.faculty_code || '')}
                        onClick={() => viewPaperDetails(paper)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  {filteredPapers.map((paper) => (
                    <PastPaperListItem key={paper._id} paper={paper} />
                  ))}
                </div>
              )}
            </div>
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
                            />
                            <span style={{ color: colors.textSecondary }}>{count as number}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
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
                      <CardTitle className="text-lg" style={{ color: colors.tertiary }}>
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
                          {suggestion.topics.map((topic: string, index: number) => (
                            <Badge key={index} variant="outline" style={{ borderColor: colors.tertiary, color: colors.tertiary }}>
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-bold" style={{ color: colors.textSecondary }}>EXAMPLE QUESTIONS:</span>
                        <ul className="mt-1 space-y-1 text-sm list-disc pl-4" style={{ color: colors.textPrimary }}>
                          {suggestion.examples.map((example: string, index: number) => (
                            <li key={index}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}
                        onClick={() => router.push('/revision')}
                      >
                        <Sparkles className="w-4 h-4 mr-2" /> Practice Similar Questions
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
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
                  <h3 className="text-lg font-bold mb-2" style={{ color: colors.tertiary }}>
                    Ready to study with these papers?
                  </h3>
                  <p className="max-w-md" style={{ color: colors.textSecondary }}>
                    Join a revision room to practice these papers with other students, get AI-guided help, and track your progress.
                  </p>
                </div>
                <Button 
                  className="font-medium"
                  style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}
                  onClick={() => router.push('/revision')}
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
}