import React from 'react';
import { FileText, Calendar, ExternalLink, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// Import types
import { PastPaper } from '../services/pastpaper-service';

interface PastPaperCardProps {
  paper: PastPaper;
  facultyColor?: string;
  onClick?: () => void;
}

export const PastPaperCard: React.FC<PastPaperCardProps> = ({ 
  paper, 
  facultyColor = '#FFD166',
  onClick
}) => {
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
  
  // Handle paper download
  const downloadPaper = (e: React.MouseEvent): void => {
    e.stopPropagation();
    console.log('Downloading paper:', paper._id);
    
    // In a real implementation, this would trigger a download
    alert(`Downloading: ${paper.title} - In a real implementation, this would download the file.`);
  };
  
  // View paper online
  const viewPaper = (): void => {
    console.log('Viewing paper:', paper._id);
    
    // In a real implementation, this would open the file in a new tab
    if (paper.file_path) {
      window.open(paper.file_path, '_blank');
    } else {
      alert('Paper file not available for online viewing.');
    }
  };
  
  return (
    <div className="h-full transition-all hover-scale">
      <Card 
        className="h-full border hover:shadow-lg cursor-pointer transition-all duration-300" 
        style={{ 
          backgroundColor: '#F7F9FC', 
          borderColor: facultyColor, 
          borderLeftWidth: '4px' 
        }}
        onClick={onClick}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bold title-font" style={{ color: facultyColor }}>
            <FileText className="w-5 h-5" />
            {paper.title}
          </CardTitle>
          <CardDescription className="flex items-center gap-1 text-xs" style={{ color: '#4A5568' }}>
            <Calendar className="w-3 h-3" /> {formatDate(paper.date)} • {paper.exam_type}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm" style={{ color: '#4A5568' }}>
            <strong>Unit:</strong> {paper.unit_code} - {paper.unit_name}
          </p>
          <p className="text-sm" style={{ color: '#4A5568' }}>
            <strong>Semester:</strong> {paper.semester} • <strong>Year:</strong> {paper.year}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Badge style={{ backgroundColor: facultyColor, color: '#2D3748' }}>
            {paper.faculty}
          </Badge>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="hover:bg-opacity-20"
              style={{ borderColor: facultyColor, color: facultyColor }}
              onClick={downloadPaper}
            >
              <Download className="w-4 h-4 mr-1" /> Download
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="hover:bg-opacity-20"
              style={{ borderColor: facultyColor, color: facultyColor }}
              onClick={viewPaper}
            >
              <ExternalLink className="w-4 h-4 mr-1" /> View
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PastPaperCard;