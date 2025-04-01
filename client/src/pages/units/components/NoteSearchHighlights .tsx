import React, { useEffect, useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/services/api';

const NoteSearchHighlights = ({ noteId, pdfViewerRef }) => {
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

  // Extract search query from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('query');
    
    if (query && noteId) {
      performSearch(query);
    }
  }, [location.search, noteId]);

  // Function to perform search on the current note
  const performSearch = async (query) => {
    if (!query || !noteId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiGet(`/notes/search?q=${encodeURIComponent(query)}&note_id=${noteId}`);
      
      if (response.status === 'success') {
        // Filter results for the current note only
        const noteResults = response.results.filter(result => result._id === noteId);
        setSearchResults({
          query,
          matches: noteResults
        });
      } else {
        setError('Failed to load search results');
      }
    } catch (err) {
      setError('Error loading search results');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to jump to page in PDF viewer
  const jumpToPage = (pageNumber) => {
    if (pdfViewerRef && pdfViewerRef.current) {
      // This function will depend on your PDF viewer implementation
      // Adjust as needed for your specific PDF viewer component
      pdfViewerRef.current.jumpToPage(pageNumber);
    }
  };

  if (!searchResults && !isLoading) return null;

  return (
    <div className="mb-6 border rounded-lg p-4 bg-gray-50">
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2">Searching...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : searchResults && searchResults.matches.length > 0 ? (
        <div>
          <div className="flex items-center mb-3">
            <Search className="w-5 h-5 mr-2 text-blue-500" />
            <h3 className="font-medium">
              Search results for "{searchResults.query}"
            </h3>
          </div>
          
          <div className="space-y-3">
            {searchResults.matches.map((match, index) => (
              <div key={index} className="p-2 bg-white rounded border">
                <div className="flex justify-between items-center mb-2">
                  <Badge variant="outline" className="text-blue-500 border-blue-500">
                    Page {match.match?.page || '?'}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => jumpToPage(match.match?.page)}
                  >
                    Jump to page
                  </Button>
                </div>
                <p className="text-sm text-gray-700">
                  ...{match.match?.text.substring(0, 200)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-2">
          <p>No matches found for "{searchResults?.query}"</p>
        </div>
      )}
    </div>
  );
};

export default NoteSearchHighlights;