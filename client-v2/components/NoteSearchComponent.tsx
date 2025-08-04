'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookCopy, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';

interface NoteSearchComponentProps {
  unitId?: string;
  facultyColor?: string;
}

const NoteSearchComponent: React.FC<NoteSearchComponentProps> = ({ unitId, facultyColor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [resultsCount, setResultsCount] = useState(0);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Perform search when debounced search term changes
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchTerm.trim().length < 3) {
        setSearchResults([]);
        setResultsCount(0);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const response = await apiGet<any>(`/notes/search?q=${encodeURIComponent(debouncedSearchTerm)}&unit_id=${unitId}`);
        
        if (response.status === 'success') {
          // Use the new response structure
          setSearchResults(response.results || []);
          setResultsCount(response.results_count || 0);
        } else {
          console.error('Search failed:', response.message);
          setSearchResults([]);
          setResultsCount(0);
        }
      } catch (error) {
        console.error('Error searching notes:', error);
        setSearchResults([]);
        setResultsCount(0);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm, unitId]);

  // Show suggestions when input is focused
  const handleFocus = () => {
    if (searchTerm.trim().length >= 3) {
      setShowSuggestions(true);
    }
  };

  // Clear search and suggestions
  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setResultsCount(0);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Navigate to note details with query and match info
  const handleNoteClick = (noteId: string, matchIndex: number = 0) => {
    router.push(`/notes/${noteId}?query=${encodeURIComponent(searchTerm)}&matchIndex=${matchIndex}`);
    setShowSuggestions(false);
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(
      regex, 
      '<mark style="background-color: rgba(255, 255, 0, 0.4); padding: 0 2px;">$1</mark>'
    );
  };

  // Get top match for a result
  const getTopMatch = (result: any) => {
    if (!result.matches || result.matches.length === 0) return null;
    
    // Sort matches by similarity score descending and return the top match
    return [...result.matches].sort((a, b) => b.similarity_score - a.similarity_score)[0];
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-6">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search notes content with semantic search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleFocus}
          className="pl-10 pr-10 py-2 w-full border-2 transition-all focus:ring-2"
          style={{ 
            borderColor: facultyColor,
            boxShadow: showSuggestions ? `0 0 0 2px ${facultyColor}40` : 'none'
          }}
        />
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 rounded-full"
            onClick={handleClearSearch}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search suggestions dropdown */}
      {showSuggestions && (searchResults.length > 0 || isSearching) && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg border-2 overflow-hidden"
          style={{ borderColor: facultyColor }}
        >
          <div className="max-h-96 overflow-y-auto">
            {isSearching ? (
              // Loading skeletons
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              // Search results
              <div>
                <div className="p-2 bg-gray-100 text-sm font-medium" style={{ color: facultyColor }}>
                  Found {resultsCount} {resultsCount === 1 ? 'match' : 'matches'}
                </div>
                {searchResults.map((result) => {
                  const topMatch = getTopMatch(result);
                  
                  return (
                    <Card 
                      key={result._id} 
                      className="m-2 cursor-pointer hover:bg-gray-50 transition-colors border-l-4"
                      style={{ borderLeftColor: facultyColor }}
                      onClick={() => handleNoteClick(result._id, 0)} // Pass index 0 for top match
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <BookCopy className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: facultyColor }} />
                          <div>
                            <div className="font-medium">{result.title}</div>
                            {result.unit_name && result.unit_code && (
                              <div className="text-xs text-gray-500">
                                {result.unit_name} ({result.unit_code})
                              </div>
                            )}
                            
                            {topMatch && (
                              <div className="mt-1 text-sm text-gray-600">
                                <div>
                                  <Badge variant="outline" className="mr-2 text-xs">
                                    Page {topMatch.page}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {Math.round(topMatch.similarity_score * 100)}% match
                                  </span>
                                </div>
                                <div className="mt-1 text-sm" 
                                  dangerouslySetInnerHTML={{ 
                                    __html: highlightMatch(
                                      // Show a snippet around the matched text
                                      `...${topMatch.text.substring(0, 150)}...`, 
                                      searchTerm
                                    )
                                  }} 
                                />
                              </div>
                            )}
                            
                            {/* Show additional matches count if more than one */}
                            {result.matches && result.matches.length > 1 && (
                              <div className="mt-1 text-xs text-gray-500">
                                +{result.matches.length - 1} more {result.matches.length - 1 === 1 ? 'match' : 'matches'} in this document
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteSearchComponent;