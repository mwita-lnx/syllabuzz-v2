'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bookmark, ChevronLeft, ChevronRight, Highlighter, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import toast from 'react-hot-toast';

interface PDFViewerComponentProps {
  pdfUrl: string;
  initialPage?: number;
  references?: any[];
  onSaveHighlight?: (highlight: any) => void;
  onSaveBookmark?: (bookmark: any) => void;
}

const PDFViewerComponent: React.FC<PDFViewerComponentProps> = ({ 
  pdfUrl, 
  initialPage = 1,
  references = [], 
  onSaveHighlight,
  onSaveBookmark 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeReference, setActiveReference] = useState<any>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [pdfInstance, setPdfInstance] = useState<any>(null);
  const [scale, setScale] = useState(1.0);

  // Load the PDF.js library
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        // Check if the PDF.js library is already loaded
        if ((window as any).pdfjsLib) return;
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
        script.crossOrigin = 'anonymous';
        script.async = true;
        document.body.appendChild(script);
        
        // Also load the worker
        const workerScript = document.createElement('script');
        workerScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';      
        workerScript.crossOrigin = 'anonymous';
        workerScript.async = true;
        document.body.appendChild(workerScript);
        
        return new Promise<void>((resolve) => {
          script.onload = () => {
            // Configure worker
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
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
      if (!(window as any).pdfjsLib || !pdfUrl) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Get URL for the PDF, concatenating with VITE_BACKEND_URL if not a full URL
        const absoluteUrl = pdfUrl.startsWith('http') 
          ? pdfUrl 
          : `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'}${pdfUrl}`;
        
        // Load the PDF document
        const loadingTask = (window as any).pdfjsLib.getDocument(absoluteUrl);
        const pdf = await loadingTask.promise;
        
        setTotalPages(pdf.numPages);
        setPdfDocument(pdf);
        setIsLoading(false);
        
        // Render the initial page
        renderPage(pdf, initialPage);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
  }, [pdfUrl, initialPage]);

  // Render a specific page
  const renderPage = async (pdf: any, pageNumber: number) => {
    if (!containerRef.current || !pdf) return;
    
    try {
      // Get the page
      const page = await pdf.getPage(pageNumber);
      
      // Clear previous content
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      
      // Create page container
      const pageContainer = document.createElement('div');
      pageContainer.className = 'pdfPage';
      pageContainer.style.position = 'relative';
      containerRef.current.appendChild(pageContainer);
      
      // Calculate scale to fit the container
      const containerWidth = containerRef.current.clientWidth;
      const viewport = page.getViewport({ scale: 1 });
      const pageScale = containerWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale: pageScale * scale });
      
      // Create canvas for rendering
      const canvas = document.createElement('canvas');
      canvas.className = 'pdfCanvas';
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      pageContainer.style.width = `${scaledViewport.width}px`;
      pageContainer.style.height = `${scaledViewport.height}px`;
      pageContainer.appendChild(canvas);
      
      // Render the page content on canvas
      const context = canvas.getContext('2d');
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };
      
      const renderTask = page.render(renderContext);
      await renderTask.promise;
      
      // Create text layer div
      const textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'textLayer';
      textLayerDiv.style.position = 'absolute';
      textLayerDiv.style.top = '0';
      textLayerDiv.style.left = '0';
      textLayerDiv.style.width = '100%';
      textLayerDiv.style.height = '100%';
      textLayerDiv.style.color = 'transparent';
      textLayerDiv.style.pointerEvents = 'none';
      pageContainer.appendChild(textLayerDiv);
      
      // Get text content for text layer
      const textContent = await page.getTextContent();
      
      // Load text layer builder if available
      if ((window as any).pdfjsLib.renderTextLayer) {
        // Use the built-in text layer renderer from PDF.js
        const textLayer = (window as any).pdfjsLib.renderTextLayer({
          textContent: textContent,
          container: textLayerDiv,
          viewport: scaledViewport,
          textDivs: []
        });
        await textLayer.promise;
      } else {
        // Fallback implementation without rendering library
        // This is a simplified version - in a real app, you'd want to use the full text layer implementation
        textContent.items.forEach((item: any) => {
          const tx = (window as any).pdfjsLib.Util.transform(
            viewport.transform,
            item.transform
          );
          
          const style = textContent.styles[item.fontName];
          const fontSize = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
          
          const textDiv = document.createElement('span');
          textDiv.textContent = item.str;
          textDiv.style.position = 'absolute';
          textDiv.style.transform = `scaleX(${tx[0]}) scaleY(${tx[3]})`;
          textDiv.style.left = `${tx[4]}px`;
          textDiv.style.top = `${tx[5]}px`;
          textDiv.style.fontSize = `${fontSize}px`;
          textDiv.style.fontFamily = style.fontFamily;
          
          textLayerDiv.appendChild(textDiv);
        });
      }
      
      // Add a transparent overlay for text selection
      const textSelectionOverlay = document.createElement('div');
      textSelectionOverlay.className = 'textSelectionOverlay';
      textSelectionOverlay.style.position = 'absolute';
      textSelectionOverlay.style.top = '0';
      textSelectionOverlay.style.left = '0';
      textSelectionOverlay.style.width = '100%';
      textSelectionOverlay.style.height = '100%';
      textSelectionOverlay.style.backgroundColor = 'transparent';
      pageContainer.appendChild(textSelectionOverlay);
      
      // Add styles needed for text selection
      const style = document.createElement('style');
      style.textContent = `
        .textLayer {
          opacity: 0.2;
          line-height: 1.0;
        }
        .textLayer span {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
        .textLayer .highlight {
          margin: -1px;
          padding: 1px;
          background-color: rgba(255, 255, 0, 0.4);
          border-radius: 4px;
        }
        .textLayer ::selection { background: rgba(0, 0, 255, 0.3); }
        .textSelectionOverlay {
          cursor: text;
        }
      `;
      document.head.appendChild(style);
      
      setCurrentPage(pageNumber);
      
      // Store the instance for later use
      setPdfInstance({ 
        pdf, 
        currentPage: pageNumber,
        viewport: scaledViewport,
        page
      });
    } catch (err) {
      console.error('Error rendering page:', err);
      setError(`Failed to render page ${pageNumber}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Navigate to a specific page
  const goToPage = (pageNumber: number) => {
    if (!pdfDocument) return;
    
    const page = Math.min(Math.max(1, pageNumber), totalPages);
    renderPage(pdfDocument, page);
  };

  // Handle reference click
  const handleReferenceClick = (reference: any) => {
    if (!reference.pageNumber) return;
    
    goToPage(reference.pageNumber);
    setActiveReference(reference._id);
    toast.success(`Navigated to page ${reference.pageNumber}`);
  };

  // Enable text highlighting mode
  const enableHighlightMode = () => {
    if (!containerRef.current) return;
    
    toast.success("Highlight mode enabled. Select text to highlight.");
    
    // Setup selection event
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === '') return;
      
      // Get selection details
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString();
      
      // Add highlight class to selected elements
      const selectedSpans = [];
      if (!containerRef.current) return;
      
      const iterator = document.createNodeIterator(
        containerRef.current,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (node) => range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
      );
      
      let currentNode;
      while (currentNode = iterator.nextNode()) {
        const span = currentNode.parentNode;
        if (span && (span as HTMLElement).tagName === 'SPAN') {
          (span as HTMLElement).classList.add('highlight');
          selectedSpans.push(span);
        }
      }
      
      // Call highlight callback
      if (onSaveHighlight) {
        onSaveHighlight({
          pageNumber: currentPage,
          text: selectedText,
          color: "#FFFF00"
        });
      }
      
      // Clear selection after highlighting
      selection.removeAllRanges();
    };
    
    // Add event listener for mouseup to capture selection
    containerRef.current?.addEventListener('mouseup', handleSelection);
    
    // Return cleanup function
    return () => {
      containerRef.current?.removeEventListener('mouseup', handleSelection);
    };
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

  // Zoom controls
  const zoomIn = () => {
    setScale(prevScale => {
      const newScale = Math.min(prevScale + 0.1, 3.0);
      if (pdfDocument) {
        renderPage(pdfDocument, currentPage);
      }
      return newScale;
    });
  };

  const zoomOut = () => {
    setScale(prevScale => {
      const newScale = Math.max(prevScale - 0.1, 0.5);
      if (pdfDocument) {
        renderPage(pdfDocument, currentPage);
      }
      return newScale;
    });
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
            onClick={zoomOut}
          >
            -
          </Button>
          
          <span className="text-sm px-2">
            {Math.round(scale * 100)}%
          </span>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={zoomIn}
          >
            +
          </Button>
          
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