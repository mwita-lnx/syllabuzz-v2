import React from 'react';
import { Calendar, Star, ThumbsUp, BookmarkPlus, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// Import types
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
  
  // Handle note interactions
  const recordView = (): void => {
    console.log('Viewing note:', note._id);
    // In a real implementation, we would record this interaction
    window.open(note.url, '_blank');
  };
  
  const recordLike = (e: React.MouseEvent): void => {
    e.stopPropagation();
    console.log('Liking note:', note._id);
    // In a real implementation, we would record this interaction
  };
  
  const recordBookmark = (e: React.MouseEvent): void => {
    e.stopPropagation();
    console.log('Bookmarking note:', note._id);
    // In a real implementation, we would record this interaction
  };
  
  const hasImage = note.image_url && note.image_url.trim() !== '';
  
  return (
    <div className="h-full transition-all hover-scale">
      <Card 
        className="h-full border hover:shadow-lg cursor-pointer transition-all duration-300" 
        onClick={recordView}
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
            onClick={recordLike}
            className="hover:bg-opacity-20 transition-colors"
            style={{ color: '#6A0572' }}
          >
            <ThumbsUp className="w-4 h-4 mr-1" /> Like
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={recordBookmark}
            className="hover:bg-opacity-20 transition-colors"
            style={{ color: '#FF6B6B' }}
          >
            <BookmarkPlus className="w-4 h-4 mr-1" /> Save
          </Button>
          
          {/* Fixed this button: When using asChild, we need to make sure it has exactly one child */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="hover:bg-opacity-20 transition-colors"
            style={{ color: '#4ECDC4' }}
            onClick={() => window.open(note.url, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-1" /> View
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NoteCard;