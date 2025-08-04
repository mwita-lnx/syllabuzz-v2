'use client';

import React from 'react';
import { AlertTriangle, Download, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

// A simple fallback component for when the PDF viewer can't load
interface SimplePDFViewProps {
  pdfUrl: string;
  title?: string;
}

const SimplePDFView: React.FC<SimplePDFViewProps> = ({ pdfUrl, title }) => {
  const handleDownload = () => {
    if (!pdfUrl) return;
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = (title || 'document').replace(/\s+/g, '_') + '.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Download started');
  };

  // Try to display PDF in an iframe first
  return (
    <div className="flex flex-col h-full">
      <Alert className="mb-4">
        <FileText className="h-4 w-4" />
        <AlertTitle>PDF Viewer</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          <span>If the PDF doesn't load properly, you can download it directly.</span>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1 ml-4"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </AlertDescription>
      </Alert>
      
      <div className="flex-1 min-h-[600px] border rounded overflow-hidden">
        {pdfUrl ? (
          <iframe 
            src={`${pdfUrl}#toolbar=0&navpanes=0`}
            title={title || "PDF Document"}
            className="w-full h-full"
            frameBorder="0"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center p-6">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
              <h3 className="text-lg font-medium mb-2">PDF Not Available</h3>
              <p className="text-gray-600">
                The PDF file could not be loaded. Please try downloading it instead.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplePDFView;