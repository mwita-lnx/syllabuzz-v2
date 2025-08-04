'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, SortAsc, AlertTriangle, FileText } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import layout and components
import { MainLayout } from '@/components/MainLayout';
import { NoteCard } from '@/components/NoteCard';
import { FacultySelector } from '@/components/FacultySelector';

// Import types
import { Note, Faculty } from '@/types/index2';
import { SearchResult } from '@/types';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<(Note & { match?: { text: string; page: number; similarity_score: number } })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  useEffect(() => {
    const mockFaculties: Faculty[] = [
      { id: '1', name: 'Science', code: 'sci', color: '#FF6B6B' },
      { id: '2', name: 'Arts', code: 'arts', color: '#4ECDC4' },
      { id: '3', name: 'Business', code: 'bus', color: '#FFD166' },
      { id: '4', name: 'Engineering', code: 'eng', color: '#6A0572' },
      { id: '5', name: 'Medicine', code: 'med', color: '#06D6A0' }
    ];
    setFaculties(mockFaculties);

    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      // Update URL with search query
      const params = new URLSearchParams();
      params.set('q', searchTerm);
      router.push(`/search?${params.toString()}`);

      // Mock search results
      const mockResults = [
        {
          _id: '1',
          title: 'Understanding Sorting Algorithms',
          description: 'A comprehensive guide to common sorting algorithms and their time complexity analysis.',
          url: '#',
          source_name: 'Science Notes',
          published_at: '2024-03-10',
          type: 'notes' as const,
          faculty: 'Science',
          facultyCode: 'sci',
          categories: ['algorithms', 'computer science'],
          match: {
            text: `...${searchTerm} is fundamental in computer science...`,
            page: 5,
            similarity_score: 0.95
          }
        },
        {
          _id: '2',
          title: 'Data Structures Fundamentals',
          description: 'Introduction to basic data structures including arrays, linked lists, and trees.',
          url: '#',
          source_name: 'CS Department',
          published_at: '2024-03-08',
          type: 'academic' as const,
          faculty: 'Science',
          facultyCode: 'sci',
          categories: ['data structures', 'programming'],
          match: {
            text: `...efficient ${searchTerm} implementations require understanding...`,
            page: 12,
            similarity_score: 0.88
          }
        },
        {
          _id: '3',
          title: 'Machine Learning Basics',
          description: 'Introduction to machine learning concepts and algorithms.',
          url: '#',
          source_name: 'AI Research Lab',
          published_at: '2024-03-05',
          type: 'academic' as const,
          faculty: 'Science',
          facultyCode: 'sci',
          categories: ['machine learning', 'AI'],
          match: {
            text: `...${searchTerm} plays a crucial role in optimization...`,
            page: 8,
            similarity_score: 0.82
          }
        }
      ].filter(result => 
        result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.categories?.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      setSearchResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredResults = searchResults.filter(result => {
    if (selectedFaculty !== 'all' && result.facultyCode !== selectedFaculty) {
      return false;
    }
    if (selectedType !== 'all' && result.type !== selectedType) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'relevance':
        return a.title.localeCompare(b.title);
      case 'recent':
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      case 'az':
        return a.title.localeCompare(b.title);
      case 'za':
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Search Academic Resources</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Search through notes, papers, and academic materials across all disciplines
          </p>
        </div>

        {/* Search Input */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search for topics, concepts, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 text-lg h-12"
                  />
                </div>
              </div>
              <Button 
                onClick={() => handleSearch()}
                disabled={!searchQuery.trim() || isLoading}
                size="lg"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {hasSearched && (
          <>
            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="w-48">
                  <FacultySelector
                    faculties={faculties}
                    selectedFaculty={selectedFaculty}
                    onSelect={setSelectedFaculty}
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="notes">Notes</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="az">A-Z</SelectItem>
                    <SelectItem value="za">Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-gray-600">
                {isLoading ? 'Searching...' : `${filteredResults.length} result${filteredResults.length !== 1 ? 's' : ''} found`}
              </div>
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="h-full">
                    <CardHeader>
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-28" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full mb-4" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try different keywords or adjust your filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredResults.map((result) => (
                  <Card key={result._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                                onClick={() => router.push(`/notes/${result._id}`)}>
                              {result.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{result.type}</Badge>
                              <Badge variant="outline">{result.faculty}</Badge>
                              <span className="text-xs text-gray-500">
                                {result.match?.similarity_score && 
                                  `${(result.match.similarity_score * 100).toFixed(0)}% match`
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-700">{result.description}</p>
                        
                        {result.match && (
                          <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-200">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-600">
                                Page {result.match.page}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 italic">
                              {result.match.text}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{result.source_name}</span>
                            <span>{new Date(result.published_at).toLocaleDateString()}</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/notes/${result._id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {!hasSearched && (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Start your search</h3>
            <p className="mt-1 text-sm text-gray-500">
              Enter keywords to search through academic resources.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}