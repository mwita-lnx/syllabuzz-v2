'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Upload, Plus, X, FileText, Search, BookA, ChevronDown, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Import layout and components
import { MainLayout } from '@/components/MainLayout';
import { UnitCard } from '@/components/UnitCard';
import { FacultySelector } from '@/components/FacultySelector';

// Import types
import { Unit, Faculty } from '@/types';

// Import services
import { getAllUnits, searchUnits } from '@/services/unit-service';
import { getFacultiesWithFallback } from '@/services/faculty-service';

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  
  const router = useRouter();

  // Fetch initial data
  useEffect(() => {
    fetchUnits();
    fetchFaculties();
  }, []);

  const fetchUnits = async () => {
    try {
      setIsLoading(true);
      const unitsResponse = await getAllUnits({ limit: 50, sort: 'name' });
      const unitsData = unitsResponse.units || unitsResponse.data || unitsResponse.items || [];
      setUnits(unitsData);
      setFilteredUnits(unitsData);
    } catch (error) {
      console.error('Error fetching units:', error);
      setUnits([]);
      setFilteredUnits([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      const facultiesData = await getFacultiesWithFallback();
      setFaculties(facultiesData);
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  // Filter units based on search and faculty
  useEffect(() => {
    let filtered = units;

    // Filter by faculty
    if (selectedFaculty !== 'all') {
      filtered = filtered.filter(unit => unit.facultyCode === selectedFaculty);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(unit =>
        unit.name.toLowerCase().includes(query) ||
        unit.code.toLowerCase().includes(query) ||
        unit.description?.toLowerCase().includes(query) ||
        unit.keywords?.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    setFilteredUnits(filtered);
  }, [units, selectedFaculty, searchQuery]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Academic Units</h1>
            <p className="text-gray-600">Explore units across different faculties</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search units, codes, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-64">
            <FacultySelector
              faculties={faculties}
              selectedFaculty={selectedFaculty}
              onSelect={setSelectedFaculty}
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {isLoading ? 'Loading...' : `${filteredUnits.length} unit${filteredUnits.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Units Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-full">
                <CardHeader>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-4 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="text-center py-12">
            <BookA className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No units found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUnits.map((unit) => (
              <UnitCard
                key={unit._id}
                unit={unit}
                onClick={() => router.push(`/units/${unit._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}