'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Star, ThumbsUp, BookmarkPlus, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'react-hot-toast';
import { Note } from '../types/index2';

interface NoteCardProps {
  note: Note;
  unitId?: string;
  typeColor?: string;
}

export const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  unitId,
  typeColor = note.type === 'academic' ? '#FF6B6B' : '#4ECDC4'
}) => {
  const router = useRouter();
  
  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Handle card click - router.push to note detail page
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior
    
    // Navigate to note detail page using React Router
    router.push(`/notes/${note._id}`);
  };
  
  // Handle like button click
  const handleLike = (e: React.MouseEvent): void => {
    e.stopPropagation(); // Prevent card click event
    toast.success('Note liked!');
    console.log('Liking note:', note._id);
    // In a real implementation, we would call an API to like the note
  };
  
  // Handle bookmark button click
  const handleBookmark = (e: React.MouseEvent): void => {
    e.stopPropagation(); // Prevent card click event
    toast.success('Note saved to bookmarks!');
    console.log('Bookmarking note:', note._id);
    // In a real implementation, we would call an API to bookmark the note
  };
  
  // Handle external view (e.g., opening PDF)
  const handleExternalView = (e: React.MouseEvent): void => {
    e.stopPropagation(); // Prevent card click event
    
    // If note has a URL, open it in a new tab
    if (note.url) {
      window.open(note.url, '_blank');
    } else {
      // Otherwise router.push to note detail page
      router.push(`/notes/${note._id}`);
    }
  };
  
  const hasImage = note.image_url && note.image_url.trim() !== '';
  
  return (
    <div className="h-full transition-all hover-scale">
      <Card 
        className="h-full border hover:shadow-lg cursor-pointer transition-all duration-300" 
        onClick={handleCardClick}
        style={{ 
          backgroundColor: '#F7F9FC', 
          borderColor: typeColor,
          borderWidth: '2px'
        }}
      >
        {hasImage && (
          <div className="w-full h-40 overflow-hidden">
            <img 
              src={note.image_url || '/api/placeholder/400/320'} 
              alt={note.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = '/api/placeholder/400/320';
              }}
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <Badge 
              variant={note.type === 'academic' ? 'secondary' : 'default'} 
              className="mb-2"
              style={{ 
                backgroundColor: typeColor,
                color: '#FFFFFF'
              }}
            >
              {note.type === 'academic' ? 'Academic' : 'Notes'}
            </Badge>
            {note.relevance_score && (
              <Badge 
                variant="outline" 
                className="flex items-center gap-1"
                style={{ borderColor: '#FFD166', color: '#FFD166' }}
              >
                <Star className="w-3 h-3" /> 
                {(note.relevance_score * 100).toFixed(0)}%
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg line-clamp-2 font-bold title-font" style={{ color: '#2D3748' }}>
            {note.title}
          </CardTitle>
          <CardDescription className="flex items-center gap-1 text-xs" style={{ color: '#4A5568' }}>
            <Calendar className="w-3 h-3" /> {formatDate(note.published_at)}
            <span className="mx-1">•</span>
            <span>{note.source_name}</span>
            {note.faculty && (
              <>
                <span className="mx-1">•</span>
                <span>{note.faculty}</span>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm line-clamp-3" style={{ color: '#4A5568' }}>
            {note.description || 'No description available.'}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLike}
            className="hover:bg-opacity-20 transition-colors"
            style={{ color: '#6A0572' }}
          >
            <ThumbsUp className="w-4 h-4 mr-1" /> Like
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBookmark}
            className="hover:bg-opacity-20 transition-colors"
            style={{ color: '#FF6B6B' }}
          >
            <BookmarkPlus className="w-4 h-4 mr-1" /> Save
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="hover:bg-opacity-20 transition-colors"
            style={{ color: '#4ECDC4' }}
            onClick={handleExternalView}
          >
            <ExternalLink className="w-4 h-4 mr-1" /> View
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NoteCard;