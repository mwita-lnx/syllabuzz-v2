'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, SortAsc, FileText, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Import layout and components
import { MainLayout } from '@/components/MainLayout';
import { NoteCard } from '@/components/NoteCard';
import { FacultySelector } from '@/components/FacultySelector';

// Import types
import { Note, Faculty } from '@/types/index2';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  
  const router = useRouter();

  // Mock data for demonstration
  useEffect(() => {
    const mockNotes: Note[] = [
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
      },
      {
        _id: '2',
        title: 'Customer Journey Mapping in Digital Age',
        description: 'How to effectively map customer journeys across multiple digital touchpoints.',
        url: '#',
        source_name: 'Business Review',
        published_at: '2024-03-08',
        type: 'notes' as const,
        faculty: 'Business',
        facultyCode: 'bus',
        categories: ['marketing', 'customer experience'],
      },
      {
        _id: '3',
        title: 'Cardiac Muscle Physiology',
        description: 'Detailed examination of cardiac muscle structure and function.',
        url: '#',
        source_name: 'Medical Journal',
        published_at: '2024-03-05',
        type: 'academic' as const,
        faculty: 'Medicine',
        facultyCode: 'med',
        categories: ['anatomy', 'physiology'],
      },
      {
        _id: '4',
        title: 'Modernist Poetry Analysis',
        description: 'Critical analysis of key modernist poetic works and their literary significance.',
        url: '#',
        source_name: 'Arts Review',
        published_at: '2024-03-01',
        type: 'notes' as const,
        faculty: 'Arts',
        facultyCode: 'arts',
        categories: ['literature', 'poetry'],
      },
      {
        _id: '5',
        title: 'Neural Networks Fundamentals',
        description: 'Introduction to neural network architectures and applications in machine learning.',
        url: '#',
        source_name: 'CS Research',
        published_at: '2024-02-25',
        type: 'academic' as const,
        faculty: 'Science',
        facultyCode: 'sci',
        categories: ['machine learning', 'AI'],
      },
      {
        _id: '6',
        title: 'Bridge Design Principles',
        description: 'Core principles and methodologies in modern bridge design and construction.',
        url: '#',
        source_name: 'Engineering Today',
        published_at: '2024-02-20',
        type: 'notes' as const,
        faculty: 'Engineering',
        facultyCode: 'eng',
        categories: ['structural engineering', 'civil'],
      }
    ];

    const mockFaculties: Faculty[] = [
      { id: '1', name: 'Science', code: 'sci', color: '#FF6B6B' },
      { id: '2', name: 'Arts', code: 'arts', color: '#4ECDC4' },
      { id: '3', name: 'Business', code: 'bus', color: '#FFD166' },
      { id: '4', name: 'Engineering', code: 'eng', color: '#6A0572' },
      { id: '5', name: 'Medicine', code: 'med', color: '#06D6A0' }
    ];

    setNotes(mockNotes);
    setFilteredNotes(mockNotes);
    setFaculties(mockFaculties);
    setIsLoading(false);
  }, []);

  // Filter and sort notes
  useEffect(() => {
    let filtered = [...notes];

    // Filter by faculty
    if (selectedFaculty !== 'all') {
      filtered = filtered.filter(note => note.facultyCode === selectedFaculty);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(note => note.type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.description?.toLowerCase().includes(query) ||
        note.categories?.some(category => category.toLowerCase().includes(query))
      );
    }

    // Sort notes
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
        break;
      case 'relevance':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'az':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'za':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    setFilteredNotes(filtered);
  }, [notes, selectedFaculty, selectedType, searchQuery, sortBy]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Academic Notes</h1>
            <p className="text-gray-600">Browse notes and resources across different disciplines</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search notes, titles, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-40">
                <FacultySelector
                  faculties={faculties}
                  selectedFaculty={selectedFaculty}
                  onSelect={setSelectedFaculty}
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex gap-4">
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
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="az">A-Z</SelectItem>
                  <SelectItem value="za">Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {isLoading ? 'Loading...' : `${filteredNotes.length} note${filteredNotes.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Notes Grid */}
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
                  <Skeleton className="h-20 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}