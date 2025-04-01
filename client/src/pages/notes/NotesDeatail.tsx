import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  ChevronLeft, 
  FileText, 
  BookmarkPlus,
  Highlighter,
  Calendar,
  User,
  Building,
  Link2,
  Clock,
  MessageSquare,
  Share2,
  Download,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import toast from 'react-hot-toast';

// Import PDF Viewer component
import PDFViewerComponent from '@/components/PDFveiwer';

// Import layout
import { MainLayout } from '@/components/MainLayout';

// Import API service
import { apiGet } from '@/services/api';

// Import types
import { Note, Reference } from '@/types';

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

const NoteDetailPage: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  
  // State management
  const [note, setNote] = useState<Note | null>(null);
  const [references, setReferences] = useState<Reference[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('viewer');
  
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
  
  // Fetch note data on component mount
  useEffect(() => {
    if (noteId) {
      fetchNoteDetails(noteId);
    }
  }, [noteId]);
  
  // Fetch note details
  const fetchNoteDetails = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch note details
      const response = await apiGet<{ status: string; note: Note; error?: string }>(`/notes/${id}`);
      
      console.log('Note details response:', response);
      
      if (response.status === 'success' && response.note) {
        setNote(response.note);
        
        // If references are included in the note response
        if (response.note.references) {
          setReferences(response.note.references);
        } else {
          // Otherwise fetch references separately
          try {
            const referencesResponse = await apiGet<{ status: string; references: Reference[]; error?: string }>(`/notes/references/${id}`);
            if (referencesResponse.status === 'success') {
              setReferences(referencesResponse.references || []);
            }
          } catch (refError) {
            console.error('Error fetching references:', refError);
          }
        }
      } else {
        setError(response.error || 'Failed to load note details');
        toast.error('Failed to load note details');
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error fetching note details:', err);
      setError(err.message || 'Failed to load note details');
      toast.error('Failed to load note details. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Get faculty color for styling
  const getFacultyColor = (): string => {
    if (!note) return colors.primary;
    
    switch (note.facultyCode) {
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
  
  // Handle downloading the PDF
  const handleDownload = () => {
    if (!note || !note.url) return;
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = note.url;
    link.download = note.title.replace(/\s+/g, '_') + '.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Download started');
  };
  
  // Handle sharing the note
  const handleShare = () => {
    if (!note) return;
    
    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: note.title,
        text: note.description,
        url: window.location.href
      }).then(() => {
        console.log('Shared successfully');
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast.success('Link copied to clipboard');
      });
    }
  };
  
  // Handle highlighter events (would connect to your highlighting system)
  const handleHighlight = (highlight: any) => {
    console.log('Highlight created:', highlight);
    toast.success('Highlight created');
    // In a real app, you would save this to your database
  };
  
  // Handle bookmark events
  const handleBookmark = (bookmark: any) => {
    console.log('Bookmark created:', bookmark);
    toast.success('Page bookmarked');
    // In a real app, you would save this to your database
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
            onClick={() => navigate(-1)}
            style={{ borderColor: getFacultyColor(), color: getFacultyColor() }}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          
          {/* Error Message */}
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
                Error Loading Note
              </AlertTitle>
              <AlertDescription>
                {error}. Please try again or contact support if the problem persists.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Note Header Card */}
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
          ) : note ? (
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
                      {note.facultyCode && note.facultyCode.toUpperCase()} - {note.type === 'academic' ? 'Academic' : 'Notes'}
                    </Badge>
                    <CardTitle className="text-2xl font-bold title-font" style={{ color: getFacultyColor() }}>
                      {note.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-2" style={{ color: colors.textSecondary }}>
                      {note.author && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" /> {note.author}
                        </div>
                      )}
                      
                      {note.institution && (
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" /> {note.institution}
                        </div>
                      )}
                      
                      {note.published_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> {formatDate(note.published_at)}
                        </div>
                      )}
                      
                      {note.source_name && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" /> {note.source_name}
                        </div>
                      )}
                      
                      {note.total_pages && (
                        <div className="flex items-center gap-1 ml-auto">
                          <BookOpen className="w-4 h-4" /> {note.total_pages} pages
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4" style={{ color: colors.textSecondary }}>
                  {note.description || note.content || 'No description available.'}
                </p>
                
                {note.unit_id && note.unit_name && (
                  <div className="mb-4">
                    <h3 className="font-bold mb-2" style={{ color: getFacultyColor() }}>Course</h3>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className="font-medium cursor-pointer"
                        style={{ borderColor: getFacultyColor(), color: getFacultyColor() }}
                        onClick={() => navigate(`/units/${note.unit_id}`)}
                      >
                        {note.unit_code || ''} - {note.unit_name}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {note.metadata && note.metadata.citation && (
                  <div className="mb-4">
                    <h3 className="font-bold mb-2" style={{ color: getFacultyColor() }}>Citation</h3>
                    <p className="text-sm p-2 bg-gray-100 rounded" style={{ color: colors.textSecondary }}>
                      {note.metadata.citation}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between flex-wrap gap-2">
                <div className="flex flex-wrap gap-2">
                  {note.categories && note.categories.length > 0 && note.categories.map((category, idx) => (
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
                      {category}
                    </Badge>
                  ))}
                  
                  {note.topic && (
                    <Badge 
                      variant="outline" 
                      className="animate-fadeIn border-2 font-medium"
                      style={{ 
                        borderColor: getFacultyColor(),
                        color: getFacultyColor()
                      }}
                    >
                      {note.topic}
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                    style={{ borderColor: getFacultyColor(), color: getFacultyColor() }}
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </Button>
                  
                  {note.url && (
                    <Button 
                      variant="default" 
                      size="sm"
                      className="flex items-center gap-1"
                      style={{ backgroundColor: getFacultyColor(), color: 'white' }}
                      onClick={handleDownload}
                    >
                      <Download className="w-4 h-4" /> Download
                    </Button>
                  )}
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
              <AlertTitle className="font-bold title-font">Note not found</AlertTitle>
              <AlertDescription>
                The requested note could not be found. Please try another note.
              </AlertDescription>
            </Alert>
          )}
          
          {/* PDF Viewer and Tabs Section */}
          {note && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList 
                className="w-full max-w-md mx-auto grid grid-cols-3" 
                style={{ backgroundColor: `${getFacultyColor()}20` }}
              >
                <TabsTrigger 
                  value="viewer" 
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
                  <BookOpen className="w-4 h-4 mr-2" /> Content
                </TabsTrigger>
                <TabsTrigger 
                  value="references" 
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
                  <Link2 className="w-4 h-4 mr-2" /> References
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
                  <MessageSquare className="w-4 h-4 mr-2" /> My Notes
                </TabsTrigger>
              </TabsList>
              
              {/* Content Tab */}
              <TabsContent value="viewer" className="mt-6">
                <div className="bg-white rounded-lg shadow-lg p-4 min-h-[600px]">
                  {note.url ? (
                    // If note has a URL, show PDF viewer
                    <PDFViewerComponent 
                      pdfUrl={note.url}
                      initialPage={1}
                      references={references}
                      onSaveHighlight={handleHighlight}
                      onSaveBookmark={handleBookmark}
                    />
                  ) : (
                    // Otherwise show content as text
                    <div className="prose max-w-none">
                      {note.content ? (
                        <div className="whitespace-pre-line">{note.content}</div>
                      ) : (
                        <div className="text-center p-10 text-gray-500">
                          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p>No content available for this note</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* References Tab */}
              <TabsContent value="references" className="mt-6">
                <Card style={{ backgroundColor: colors.surface }}>
                  <CardHeader>
                    <CardTitle className="flex items-center title-font" style={{ color: getFacultyColor() }}>
                      <Link2 className="w-5 h-5 mr-2" /> Document References
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {references.length === 0 ? (
                      <Alert style={{ backgroundColor: `${getFacultyColor()}10` }}>
                        <AlertTitle>No references found</AlertTitle>
                        <AlertDescription>
                          This document doesn't have any extracted references yet.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid gap-4">
                        {references.map((reference) => (
                          <Card 
                            key={reference._id}
                            className="cursor-pointer hover:shadow-md transition-all"
                            onClick={() => {
                              // Handle reference click, e.g., navigate to specific page
                              setActiveTab('viewer');
                            }}
                          >
                            <CardHeader className="py-3">
                              <div className="flex justify-between items-center">
                                <h3 className="font-medium text-lg" style={{ color: getFacultyColor() }}>
                                  {reference.title || 'Reference'}
                                </h3>
                                {reference.pageNumber && (
                                  <Badge style={{ backgroundColor: getFacultyColor(), color: 'white' }}>
                                    Page {reference.pageNumber}
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="py-2">
                              <p className="text-sm" style={{ color: colors.textSecondary }}>
                                {reference.text}
                              </p>
                            </CardContent>
                            <CardFooter className="py-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="ml-auto"
                                style={{ color: getFacultyColor() }}
                              >
                                View in Document →
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* My Notes Tab */}
              <TabsContent value="notes" className="mt-6">
                <Card style={{ backgroundColor: colors.surface }}>
                  <CardHeader>
                    <CardTitle className="flex items-center title-font" style={{ color: getFacultyColor() }}>
                      <MessageSquare className="w-5 h-5 mr-2" /> My Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Highlights Section */}
                      <div>
                        <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: getFacultyColor() }}>
                          <Highlighter className="w-4 h-4" /> Highlights
                        </h3>
                        
                        <Alert style={{ backgroundColor: `${getFacultyColor()}10` }}>
                          <AlertDescription>
                            You haven't added any highlights yet. Use the highlight tool in the PDF viewer to highlight important text.
                          </AlertDescription>
                        </Alert>
                      </div>
                      
                      <Separator />
                      
                      {/* Notes Section */}
                      <div>
                        <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: getFacultyColor() }}>
                          <MessageSquare className="w-4 h-4" /> Personal Notes
                        </h3>
                        
                        <div className="flex flex-col space-y-4">
                          <textarea 
                            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={5}
                            placeholder="Add your personal notes about this document here..."
                          />
                          <Button 
                            className="self-end"
                            style={{ backgroundColor: getFacultyColor(), color: 'white' }}
                          >
                            Save Notes
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
          
          {/* Related Content Section */}
          {note && note.unit_id && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4 title-font" style={{ color: getFacultyColor() }}>
                Related Content
              </h2>
              
              <Card style={{ backgroundColor: colors.surface, borderColor: getFacultyColor(), borderWidth: '1px' }}>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="mb-4" style={{ color: colors.textSecondary }}>
                      Want to explore more content related to this note?
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button 
                        variant="outline"
                        style={{ borderColor: getFacultyColor(), color: getFacultyColor() }}
                        onClick={() => navigate(`/units/${note.unit_id}`)}
                      >
                        View Course Materials
                      </Button>
                      
                      <Button 
                        variant="outline"
                        style={{ borderColor: getFacultyColor(), color: getFacultyColor() }}
                        onClick={() => navigate('/notes')}
                      >
                        Browse All Notes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </FadeIn>
    </MainLayout>
  );
};

export default NoteDetailPage;