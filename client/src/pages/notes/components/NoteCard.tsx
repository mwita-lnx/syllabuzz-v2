// src/pages/notes/components/NoteCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, FileText, Tag, Download, ExternalLink } from 'lucide-react';
import { Note } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import toast from 'react-hot-toast';

interface NoteCardProps {
  note: Note;
  isInstructor: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, isInstructor }) => {
  const navigate = useNavigate();
  
  const handleViewNote = () => {
    navigate(`/notes/${note._id}`);
  };
  
  const handleEditNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to edit page or open modal
    toast.success('Edit note functionality to be implemented');
  };
  
  const handleDeleteNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Confirm deletion and delete
    toast.success('Delete note functionality to be implemented');
  };
  
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (note.pdf_path) {
      // Download the PDF
      toast.success('Download functionality to be implemented');
    } else {
      toast.error('No PDF available for download');
    }
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewNote}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center">
            <FileText className="h-5 w-5 mr-2 text-indigo-600" />
            {note.title}
          </CardTitle>
          
          {isInstructor && (
            <div className="flex space-x-1">
              <button
                onClick={handleEditNote}
                className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={handleDeleteNote}
                className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-500 line-clamp-3 mb-2">{note.content.substring(0, 150)}...</p>
        
        {note.topic && (
          <div className="flex items-center">
            <Tag className="h-4 w-4 mr-1 text-indigo-500" />
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
              {note.topic}
            </span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {note.page_numbers && note.page_numbers.length > 0 && (
          <div className="text-xs text-gray-500">
            Page{note.page_numbers.length > 1 ? 's' : ''}: {note.page_numbers.join(', ')}
          </div>
        )}
        
        <div className="flex space-x-2">
          {note.pdf_path && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleDownload}
            >
              PDF
            </Button>
          )}
          
          <Button
            variant="secondary"
            size="sm"
            rightIcon={<ExternalLink className="h-4 w-4" />}
          >
            View
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default NoteCard;