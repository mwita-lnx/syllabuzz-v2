// src/components/SearchComponent.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface SearchComponentProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  initialQuery?: string;
  debounceTime?: number;
  showInline?: boolean;
  actionButton?: React.ReactNode;
  primaryColor?: string;
  className?: string;
  fullWidth?: boolean;
  onClear?: () => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  placeholder = "Search...",
  onSearch,
  initialQuery = "",
  debounceTime = 500,
  showInline = false,
  actionButton,
  primaryColor = "#FF6B6B",
  className = "",
  fullWidth = false,
  onClear
}) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for debounce
    if (value.trim()) {
      setIsSearching(true);
      timeoutRef.current = setTimeout(() => {
        if (onSearch) {
          onSearch(value);
        }
        setIsSearching(false);
      }, debounceTime);
    } else {
      setIsSearching(false);
      if (onClear) {
        onClear();
      }
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim()) {
      if (onSearch) {
        onSearch(query);
      } else {
        // Default behavior: navigate to search page
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }
    }
  };
  
  // Clear search
  const clearSearch = () => {
    setQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
    if (onClear) {
      onClear();
    }
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Update if initialQuery changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <SearchIcon 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" 
          style={{ color: isSearching ? primaryColor : undefined }}
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className={`w-full pl-10 pr-${query ? '10' : '4'} border-2 focus:ring-2 focus:border-transparent transition-all`}
          style={{ 
            borderColor: primaryColor,
            borderRadius: '0.5rem'
          }}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowResults(true)}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="animate-spin h-4 w-4" style={{ color: primaryColor }} />
          </div>
        )}
        {!isSearching && query && (
          <Button
            type="button"
            variant="ghost" 
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-1"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>
      
      {/* Action button if provided */}
      {actionButton && (
        <div className="mt-2 flex justify-end">
          {actionButton}
        </div>
      )}

      {/* Inline search results */}
      {showInline && showResults && query.trim() && (
        <Card className="mt-1 p-2 max-h-60 overflow-y-auto absolute z-10 w-full shadow-lg">
          {/* This area would be populated with search results */}
          <div className="text-sm text-gray-500 p-2 text-center">
            {isSearching ? 'Searching...' : `Search results for "${query}" would appear here`}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SearchComponent;