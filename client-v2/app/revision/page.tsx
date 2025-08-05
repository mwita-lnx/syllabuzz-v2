'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, BookOpen, Clock, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Import layout and components
import { MainLayout } from '@/components/MainLayout';
import { FacultySelector } from '@/components/FacultySelector';

// Import types
import { RevisionRoom, Faculty } from '@/types/index3';

// Import services
import { getAllRevisionRooms, searchRevisionRooms } from '@/services/revision-room-service';
import { getFacultiesWithFallback } from '@/services/faculty-service';

interface RoomCardProps {
  room: RevisionRoom;
  onClick: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{room.name}</CardTitle>
            <CardDescription className="mt-1">
              {room.unit_code} - {room.topic}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={room.is_active ? "default" : "secondary"}>
              {room.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{room.description}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{room.memberCount || 0} members</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{new Date(room.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          {room.faculty && (
            <Badge variant="outline" className="text-xs">
              {room.faculty}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function RevisionRoomListPage() {
  const [rooms, setRooms] = useState<RevisionRoom[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RevisionRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  
  const router = useRouter();

  useEffect(() => {
    fetchRooms();
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const facultiesData = await getFacultiesWithFallback();
      setFaculties(facultiesData);
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const roomsResponse = await getAllRevisionRooms({ limit: 50, sort: 'recent' });
      const roomsData = roomsResponse.data || roomsResponse.items || [];
      setRooms(roomsData);
      setFilteredRooms(roomsData);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
      setFilteredRooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter rooms based on search and filters
  useEffect(() => {
    let filtered = rooms;

    // Filter by faculty
    if (selectedFaculty !== 'all') {
      filtered = filtered.filter(room => room.facultyCode === selectedFaculty);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(room => room.is_active);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(room => !room.is_active);
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room =>
        room.name.toLowerCase().includes(query) ||
        room.description?.toLowerCase().includes(query) ||
        room.topic.toLowerCase().includes(query) ||
        room.unit_code.toLowerCase().includes(query) ||
        room.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredRooms(filtered);
  }, [rooms, selectedFaculty, statusFilter, searchQuery]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revision Rooms</h1>
            <p className="text-gray-600">Join or create study groups for collaborative learning</p>
          </div>
          <Button onClick={() => router.push('/revision/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Room
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search rooms, topics, or unit codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-48">
              <FacultySelector
                faculties={faculties}
                selectedFaculty={selectedFaculty}
                onSelect={setSelectedFaculty}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {isLoading ? 'Loading...' : `${filteredRooms.length} room${filteredRooms.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Rooms Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-full">
                <CardHeader>
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No revision rooms found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or create a new room.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => router.push('/revision/create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Room
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onClick={() => router.push(`/revision/${room.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}