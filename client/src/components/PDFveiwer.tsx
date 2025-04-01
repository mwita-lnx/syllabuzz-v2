import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bookmark, ChevronLeft, ChevronRight, Highlighter, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import toast from 'react-hot-toast';
import { PDFViewerProps } from '../types';

// Using Mozilla's PDF.js which is more widely available and easier to set up
// than PDFTron's WebViewer
const PDFViewerComponent = ({ 
  pdfUrl, 
  initialPage = 1,
  references = [], 
  onSaveHighlight,
  onSaveBookmark 
}) => {
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeReference, setActiveReference] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pdfInstance, setPdfInstance] = useState(null);

  // Load the PDF.js library
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        // Check if the PDF.js library is already loaded
        if (window.pdfjsLib) return;
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js';
        script.crossOrigin = 'anonymous';
        script.async = true;
        document.body.appendChild(script);
        
        // Also load the worker
        const workerScript = document.createElement('script');
        workerScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';      
        workerScript.crossOrigin = 'anonymous';
        workerScript.async = true;
        document.body.appendChild(workerScript);
        
        return new Promise((resolve) => {
          script.onload = () => {
            // Configure worker
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
            resolve();
          };
        });
      } catch (err) {
        console.error('Error loading PDF.js library:', err);
        setError('Failed to load PDF viewer library');
        setIsLoading(false);
      }
    };
    
    loadPdfJs();
  }, []);

  // Load the PDF document
  useEffect(() => {
    const loadPdf = async () => {
      if (!window.pdfjsLib || !pdfUrl) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Get absolute URL for the PDF
       // Get URL for the PDF, concatenating with VITE_BACKEND_URL if not a full URL
        const absoluteUrl = pdfUrl.startsWith('http') 
        ? pdfUrl 
        : `${import.meta.env.VITE_SERVER_BASE_URL}${pdfUrl}`;
        
        // Load the PDF document
        const loadingTask = window.pdfjsLib.getDocument(absoluteUrl);
        const pdf = await loadingTask.promise;
        
        setTotalPages(pdf.numPages);
        setPdfDocument(pdf);
        setIsLoading(false);
        
        // Render the initial page
        renderPage(pdf, initialPage);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(`Failed to load PDF: ${err.message}`);
        setIsLoading(false);
      }
    };
    
    loadPdf();
    
    return () => {
      // Clean up
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [pdfUrl, window.pdfjsLib]);

  // Render a specific page
  const renderPage = async (pdf, pageNumber) => {
    if (!containerRef.current || !pdf) return;
    
    try {
      // Get the page
      const page = await pdf.getPage(pageNumber);
      
      // Prepare canvas for rendering
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Clear previous content
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      
      // Add the canvas to the container
      containerRef.current.appendChild(canvas);
      
      // Calculate scale to fit the container
      const containerWidth = containerRef.current.clientWidth;
      const viewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });
      
      // Set canvas dimensions
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      
      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };
      
      const renderTask = page.render(renderContext);
      await renderTask.promise;
      
      setCurrentPage(pageNumber);
      
      // Text layer for highlighting (simplified for now)
      const textContent = await page.getTextContent();
      const textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'textLayer';
      textLayerDiv.style.position = 'absolute';
      textLayerDiv.style.top = '0';
      textLayerDiv.style.left = '0';
      textLayerDiv.style.width = '100%';
      textLayerDiv.style.height = '100%';
      containerRef.current.appendChild(textLayerDiv);
      
      // Store the instance for later use
      setPdfInstance({ 
        pdf, 
        currentPage: pageNumber,
        viewport: scaledViewport
      });
    } catch (err) {
      console.error('Error rendering page:', err);
      setError(`Failed to render page ${pageNumber}: ${err.message}`);
    }
  };

  // Navigate to a specific page
  const goToPage = (pageNumber) => {
    if (!pdfDocument) return;
    
    const page = Math.min(Math.max(1, pageNumber), totalPages);
    renderPage(pdfDocument, page);
  };

  // Handle reference click
  const handleReferenceClick = (reference) => {
    if (!reference.pageNumber) return;
    
    goToPage(reference.pageNumber);
    setActiveReference(reference._id);
    toast.success(`Navigated to page ${reference.pageNumber}`);
  };

  // Enable text highlighting mode
  const enableHighlightMode = () => {
    toast.success("Highlight mode enabled. Select text to highlight.");
    // This would require more complex implementation with PDF.js
    if (onSaveHighlight) {
      onSaveHighlight({
        pageNumber: currentPage,
        text: "Text would be highlighted here in a complete implementation",
        color: "#FFFF00"
      });
    }
  };

  // Save current page as bookmark
  const saveBookmark = () => {
    if (!onSaveBookmark) return;
    
    onSaveBookmark({
      pageNumber: currentPage,
      title: `Bookmark on page ${currentPage}`
    });
    
    toast.success(`Page ${currentPage} bookmarked!`);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading PDF</AlertTitle>
        <AlertDescription>
          {error}. Please try again or download the file instead.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-gray-200 mb-4"></div>
          <p>Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF Viewer Controls */}
      <div className="flex justify-between items-center mb-2 p-2 bg-gray-100 rounded">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={enableHighlightMode}
          >
            <Highlighter className="h-4 w-4 mr-1" />
            Highlight
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={saveBookmark}
          >
            <Bookmark className="h-4 w-4 mr-1" />
            Bookmark
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 gap-4">
        {/* References Panel */}
        {references && references.length > 0 && (
          <Card className="w-64 overflow-auto max-h-[600px]">
            <CardContent className="p-4">
              <h3 className="font-bold mb-2">References</h3>
              <div className="space-y-2">
                {references.map((ref) => (
                  <div 
                    key={ref._id}
                    className={`p-2 text-sm rounded cursor-pointer transition-colors ${
                      activeReference === ref._id 
                        ? 'bg-blue-100 border-l-4 border-blue-500' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleReferenceClick(ref)}
                  >
                    <div className="font-medium">{ref.title || `Page ${ref.pageNumber}`}</div>
                    {ref.text && (
                      <div className="text-gray-600 line-clamp-2">{ref.text}</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* PDF Viewer */}
        <div 
          className="flex-1 border rounded min-h-[600px] relative overflow-auto bg-gray-50"
          ref={containerRef}
        ></div>
      </div>
    </div>
  );
};

export default PDFViewerComponent;