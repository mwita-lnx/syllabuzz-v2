'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  FileText, 
  ExternalLink, 
  BookmarkPlus, 
  Share, 
  Download,
  AlertTriangle,
  Calendar,
  Tag,
  User
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import toast from 'react-hot-toast';

// Import layout and components
import { MainLayout } from '@/components/MainLayout';
import PDFViewer from '@/components/PDFveiwer';

// Import types
import { Note } from '@/types';
import { Reference, Highlight, Bookmark } from '@/types';

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.noteId as string;

  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [references, setReferences] = useState<Reference[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    if (noteId) {
      fetchNoteData();
    }
  }, [noteId]);

  const fetchNoteData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for demonstration
      const mockNote: Note = {
        _id: noteId,
        title: 'Understanding Sorting Algorithms',
        description: 'A comprehensive guide to common sorting algorithms including bubble sort, merge sort, quick sort, and heap sort. This document covers time complexity analysis, space complexity, and practical implementations with examples.',
        url: '#',
        file_path: '/sample-notes.pdf',
        source_name: 'Computer Science Department',
        published_at: '2024-03-10',
        type: 'notes' as const,
        faculty: 'Science',
        facultyCode: 'sci',
        categories: ['algorithms', 'computer science', 'data structures']
      };

      const mockReferences: Reference[] = [
        {
          _id: '1',
          note_id: noteId,
          pageNumber: 5,
          text: 'Introduction to Algorithms by Thomas H. Cormen',
          title: 'Reference to CLRS textbook',
          type: 'citation'
        },
        {
          _id: '2',
          note_id: noteId,
          pageNumber: 12,
          text: 'See section 4.2 for detailed complexity analysis',
          title: 'Internal reference',
          type: 'section'
        }
      ];

      setNote(mockNote);
      setReferences(mockReferences);
    } catch (error) {
      console.error('Error fetching note data:', error);
      toast.error('Failed to load note data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveHighlight = async (highlightData: { pageNumber: number; text: string; color?: string }) => {
    try {
      // Mock implementation
      const newHighlight: Highlight = {
        _id: `highlight_${Date.now()}`,
        user_id: 'current_user',
        note_id: noteId,
        pageNumber: highlightData.pageNumber,
        text: highlightData.text,
        color: highlightData.color || '#ffff00',
        created_at: new Date().toISOString()
      };
      
      setHighlights(prev => [...prev, newHighlight]);
      toast.success('Highlight saved successfully');
    } catch (error) {
      console.error('Error saving highlight:', error);
      toast.error('Failed to save highlight');
    }
  };

  const handleSaveBookmark = async (bookmarkData: { pageNumber: number; title?: string }) => {
    try {
      // Mock implementation
      const newBookmark: Bookmark = {
        _id: `bookmark_${Date.now()}`,
        user_id: 'current_user',
        note_id: noteId,
        pageNumber: bookmarkData.pageNumber,
        title: bookmarkData.title || `Bookmark on page ${bookmarkData.pageNumber}`,
        created_at: new Date().toISOString()
      };
      
      setBookmarks(prev => [...prev, newBookmark]);
      toast.success('Bookmark saved successfully');
    } catch (error) {
      console.error('Error saving bookmark:', error);
      toast.error('Failed to save bookmark');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-96" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!note) {
    return (
      <MainLayout>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Note not found</AlertTitle>
          <AlertDescription>
            The requested note could not be found. Please check the URL or go back to the notes list.
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-10 w-10 p-0 mt-1"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{note.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{note.type}</Badge>
                <Badge variant="outline">{note.faculty}</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Note Information */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-700 leading-relaxed mb-4">{note.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Source:</span>
                  <span className="font-medium">{note.source_name}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Published:</span>
                  <span className="font-medium">
                    {new Date(note.published_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{note.type}</span>
                </div>
              </div>
            </div>
            
            {note.categories && note.categories.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Categories:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {note.categories.map((category, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PDF Viewer */}
        {note.file_path && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Viewer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[800px] border rounded-lg overflow-hidden">
                <PDFViewer
                  pdfUrl={note.file_path}
                  references={references}
                  onSaveHighlight={handleSaveHighlight}
                  onSaveBookmark={handleSaveBookmark}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* External Link */}
        {note.url && note.url !== '#' && (
          <div className="flex justify-center">
            <Button asChild>
              <a href={note.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open External Link
              </a>
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}