import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  Search, 
  Calendar, 
  Clock, 
  Download, 
  Filter, 
  X, 
  ChevronRight,
  ArrowLeft,
  Upload
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import pastPaperService, { PastPaper, PastPaperUnit } from '../../services/pastpaper-service';

// CSS for the DynaPuff font
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DynaPuff:wght@400;600;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Righteous&display=swap');
  
  .dyna-font {
    font-family: 'DynaPuff', cursive;
  }
  
  .righteous-font {
    font-family: 'Righteous', cursive;
  }
  
  .hover-scale {
    transition: transform 0.3s ease;
  }
  
  .hover-scale:hover {
    transform: scale(1.03);
  }
`;

const PapersPage = () => {
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

  const { unitId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedUnit = location.state?.unit || null;

  // State for past papers and UI
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterSemester, setFilterSemester] = useState<string>('');
  const [filterExamType, setFilterExamType] = useState<string>('');
  const [years, setYears] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [examTypes, setExamTypes] = useState<string[]>([]);
  
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

  // Fetch papers for this unit
  useEffect(() => {
    const fetchPapers = async () => {
      if (!unitId) return;
      
      setIsLoading(true);
      try {
        const papers = await pastPaperService.getUnitPastPapers(unitId);
        setPastPapers(papers);
        
        // Extract unique values for filters
        const uniqueYears = [...new Set(papers.map(p => p.year))];
        const uniqueSemesters = [...new Set(papers.map(p => p.semester))];
        const uniqueExamTypes = [...new Set(papers.map(p => p.exam_type))];
        
        setYears(uniqueYears);
        setSemesters(uniqueSemesters);
        setExamTypes(uniqueExamTypes);
      } catch (error) {
        console.error('Error fetching papers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPapers();
  }, [unitId]);

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

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    try {
      const results = await pastPaperService.searchPastPapers(searchQuery);
      setPastPapers(results);
    } catch (error) {
      console.error('Error searching past papers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!unitId || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    // Extract year from filename (assuming format like "COMP311_2020_2021.pdf")
    const filenameMatch = file.name.match(/(\d{4})(_|-)(\d{4})/);
    const yearValue = filenameMatch ? `${filenameMatch[1]}/${filenameMatch[3]}` : '';
    
    formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
    formData.append('year', yearValue);
    formData.append('exam_type', 'Regular');
    formData.append('semester', 'First');
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const result = await pastPaperService.uploadPastPaper(
        unitId,
        formData,
        (progress) => setUploadProgress(progress)
      );
      
      if (result.success) {
        // Reload the papers list
        const papers = await pastPaperService.getUnitPastPapers(unitId);
        setPastPapers(papers);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Apply filters
  const applyFilters = async () => {
    if (!unitId) return;
    
    setIsLoading(true);
    
    try {
      const filteredPapers = await pastPaperService.filterPastPapers(
        unitId,
        {
          year: filterYear || undefined,
          semester: filterSemester || undefined,
          exam_type: filterExamType || undefined
        }
      );
      
      setPastPapers(filteredPapers);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all filters
  const clearFilters = async () => {
    setFilterYear('');
    setFilterSemester('');
    setFilterExamType('');
    
    if (unitId) {
      const papers = await pastPaperService.getUnitPastPapers(unitId);
      setPastPapers(papers);
    }
  };

  // Download past paper
  const downloadPastPaper = async (paperId: string, fileName: string) => {
    try {
      const blob = await pastPaperService.downloadPastPaper(paperId);
      
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'past-paper.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error('Error downloading past paper:', error);
    }
  };

  // Navigate to paper details
  const navigateToPaperDetails = (paper: PastPaper) => {
    navigate(`/papers/${paper._id}/${paper._id}`);
  };

  // Render a past paper card
  const PastPaperCard = ({ paper }: { paper: PastPaper }) => (
    <Card 
      className="h-full border hover:shadow-lg cursor-pointer transition-all duration-300 hover-scale" 
      onClick={() => navigateToPaperDetails(paper)}
      style={{ 
        backgroundColor: colors.surface, 
        borderColor: colors.accent1,
        borderLeftWidth: '4px'
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge 
            variant="secondary"
            className="mb-2"
            style={{ 
              backgroundColor: colors.accent1,
              color: 'white'
            }}
          >
            {paper.exam_type}
          </Badge>
          <Badge 
            variant="outline" 
            style={{ borderColor: colors.tertiary, color: colors.tertiary }}
          >
            {paper.year}
          </Badge>
        </div>
        <CardTitle className="text-lg line-clamp-2 font-bold dyna-font" style={{ color: colors.textPrimary }}>
          {paper.title || `${paper.unit_code} ${paper.exam_type}`}
        </CardTitle>
        <CardDescription className="flex items-center gap-1 text-xs dyna-font" style={{ color: colors.textSecondary }}>
          <Calendar className="w-3 h-3" /> {paper.date || formatDate(paper.created_at)}
          {paper.time && (
            <>
              <span className="mx-1">•</span>
              <Clock className="w-3 h-3" /> {paper.time}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-2">
          {paper.semester && (
            <Badge variant="outline" className="dyna-font" style={{ borderColor: colors.secondary, color: colors.secondary }}>
              {paper.semester} Semester
            </Badge>
          )}
          {paper.stream && (
            <Badge variant="outline" className="dyna-font" style={{ borderColor: colors.primary, color: colors.primary }}>
              {paper.stream}
            </Badge>
          )}
          {paper.session && (
            <Badge variant="outline" className="dyna-font" style={{ borderColor: colors.quaternary, color: colors.quaternary }}>
              {paper.session}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm"
          className="hover:bg-opacity-20 transition-colors dyna-font"
          style={{ color: colors.accent1 }}
          onClick={(e) => {
            e.stopPropagation();
            downloadPastPaper(paper._id, `${paper.unit_code}_${paper.exam_type}_${paper.year}.pdf`);
          }}
        >
          <Download className="w-4 h-4 mr-1" /> Download
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="hover:bg-opacity-20 dyna-font"
          style={{ color: colors.accent1 }}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );

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
                Browse and search past examination papers
              </p>
            </div>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative mt-4 md:mt-0 w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" style={{ color: colors.textSecondary }} />
              <Input
                type="text"
                placeholder="Search past papers..."
                className="w-full pl-10 border-2 focus:ring-2 focus:border-transparent transition-all dyna-font"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: colors.accent1,
                  borderRadius: '0.5rem',
                  color: colors.textPrimary
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
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
                <span style={{ color: colors.textPrimary }}>{selectedUnit.code}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow-sm border p-6" style={{ borderColor: colors.border }}>
          <FadeIn>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold dyna-font" style={{ color: colors.primary }}>
                    {selectedUnit ? `${selectedUnit.code} - Past Papers` : 'Past Papers'}
                  </h2>
                  <p className="text-sm dyna-font" style={{ color: colors.textSecondary }}>
                    {selectedUnit?.name || 'Past examination papers'}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {/* Upload Button */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="flex items-center gap-1 dyna-font"
                        style={{ backgroundColor: colors.primary, color: 'white' }}
                      >
                        <Upload className="w-4 h-4" /> Upload Paper
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="dyna-font" style={{ color: colors.primary }}>Upload Past Paper</DialogTitle>
                        <DialogDescription className="dyna-font">
                          Upload a PDF file of a past examination paper.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="file" className="dyna-font">PDF File</Label>
                          <Input 
                            id="file" 
                            type="file" 
                            accept=".pdf" 
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className="dyna-font"
                          />
                        </div>
                        
                        {isUploading && (
                          <div className="space-y-2">
                            <p className="text-sm dyna-font" style={{ color: colors.textSecondary }}>
                              Uploading... {uploadProgress}%
                            </p>
                            <Progress value={uploadProgress} className="h-2" />
                          </div>
                        )}
                      </div>
                      
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline" className="dyna-font">Cancel</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Filter Button */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-1 border-2 dyna-font"
                        style={{ borderColor: colors.accent1, color: colors.accent1 }}
                      >
                        <Filter className="w-4 h-4" /> Filter
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <h3 className="font-medium dyna-font" style={{ color: colors.accent1 }}>Filter Past Papers</h3>
                        
                        <div className="space-y-2">
                          <Label htmlFor="year" className="dyna-font">Academic Year</Label>
                          <Select value={filterYear} onValueChange={setFilterYear}>
                            <SelectTrigger className="dyna-font">
                              <SelectValue placeholder="Select year" className="dyna-font" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="" className="dyna-font">All Years</SelectItem>
                              {years.map((year) => (
                                <SelectItem key={year} value={year} className="dyna-font">{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="semester" className="dyna-font">Semester</Label>
                          <Select value={filterSemester} onValueChange={setFilterSemester}>
                            <SelectTrigger className="dyna-font">
                              <SelectValue placeholder="Select semester" className="dyna-font" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="" className="dyna-font">All Semesters</SelectItem>
                              {semesters.map((semester) => (
                                <SelectItem key={semester} value={semester} className="dyna-font">{semester}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="examType" className="dyna-font">Exam Type</Label>
                          <Select value={filterExamType} onValueChange={setFilterExamType}>
                            <SelectTrigger className="dyna-font">
                              <SelectValue placeholder="Select exam type" className="dyna-font" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="" className="dyna-font">All Types</SelectItem>
                              {examTypes.map((type) => (
                                <SelectItem key={type} value={type} className="dyna-font">{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex justify-between">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={clearFilters}
                            className="dyna-font"
                          >
                            Clear
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={applyFilters}
                            className="dyna-font"
                            style={{ backgroundColor: colors.accent1, color: 'white' }}
                          >
                            Apply Filters
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Active Filters */}
              {(filterYear || filterSemester || filterExamType) && (
                <div className="flex flex-wrap items-center gap-2 py-2">
                  <span className="text-sm font-medium dyna-font" style={{ color: colors.textSecondary }}>Filters:</span>
                  
                  {filterYear && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-1 dyna-font"
                      style={{ backgroundColor: `${colors.accent1}20`, color: colors.accent1 }}
                    >
                      Year: {filterYear}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => setFilterYear('')}
                      />
                    </Badge>
                  )}
                  
                  {filterSemester && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-1 dyna-font"
                      style={{ backgroundColor: `${colors.accent1}20`, color: colors.accent1 }}
                    >
                      Semester: {filterSemester}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => setFilterSemester('')}
                      />
                    </Badge>
                  )}
                  
                  {filterExamType && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-1 dyna-font"
                      style={{ backgroundColor: `${colors.accent1}20`, color: colors.accent1 }}
                    >
                      Type: {filterExamType}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => setFilterExamType('')}
                      />
                    </Badge>
                  )}
                  
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-xs h-auto p-0 dyna-font"
                    style={{ color: colors.primary }}
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                </div>
              )}
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="h-full" style={{ backgroundColor: colors.surface }}>
                      <CardHeader>
                        <Skeleton className="h-4 w-16 mb-2" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                        <Skeleton className="h-6 w-full mb-2" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                        <Skeleton className="h-4 w-28" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-20 w-full" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                      </CardContent>
                      <CardFooter>
                        <Skeleton className="h-9 w-full" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : pastPapers.length === 0 ? (
                <Alert 
                  className="border-2 animate-pulse" 
                  style={{ 
                    backgroundColor: colors.surface, 
                    borderColor: colors.accent1,
                    color: colors.textPrimary
                  }}
                >
                  <AlertTitle className="font-bold dyna-font">No past papers found</AlertTitle>
                  <AlertDescription className="dyna-font">
                    There are no past papers available for this unit{filterYear || filterSemester || filterExamType ? ' with the selected filters' : ''}. 
                    Try different filters or upload a new past paper.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pastPapers.map((paper, index) => (
                    <FadeIn key={paper._id} delay={index * 0.1}>
                      <PastPaperCard paper={paper} />
                    </FadeIn>
                  ))}
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </>
  );
};

export default PapersPage;