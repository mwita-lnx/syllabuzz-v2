'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  ChevronLeft, 
  FileText, 
  BookCopy,
  BookmarkPlus,
  GraduationCap,
  Tag,
  Link2,
  Info,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

// Import layout and components
import { MainLayout } from '@/components/MainLayout';
import { NoteCard } from '@/components/NoteCard';
import { PastPaperCard } from '@/components/PastPaperCard';
import NoteSearchComponent from '@/components/NoteSearchComponent';

// Import types
import { Unit, Note } from '@/types';
import { PastPaper } from '@/types';

const ExternalLink: React.FC<{ className?: string }> = ({ className }) => <Link2 className={className} />;

// Animation component for transitions
const FadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div 
      className="animate-fadeIn opacity-0" 
      style={{ 
        animation: 'fadeIn 0.5s ease forwards',
      }}
    >
      {children}
    </div>
  );
};

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.unitId as string;

  const [unit, setUnit] = useState<Unit | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (unitId) {
      fetchUnitData();
    }
  }, [unitId]);

  const fetchUnitData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for demonstration
      const mockUnit: Unit = {
        _id: unitId,
        name: 'Introduction to Computer Science',
        code: 'CS101',
        description: 'This comprehensive course introduces students to the fundamental concepts of computer science, including programming paradigms, data structures, algorithms, and software development methodologies. Students will gain hands-on experience with various programming languages and tools.',
        faculty: 'Science',
        facultyCode: 'sci',
        keywords: ['programming', 'algorithms', 'data structures', 'software development'],
        created_at: '2024-01-01',
        syllabus: [
          'Introduction to Programming',
          'Data Types and Variables',
          'Control Structures',
          'Functions and Procedures',
          'Data Structures (Arrays, Lists, Trees)',
          'Algorithm Analysis',
          'Object-Oriented Programming',
          'Software Development Life Cycle'
        ],
        prerequisites: ['Basic Mathematics', 'Logical Thinking'],
        instructors: [
          { name: 'Dr. Sarah Johnson', email: 'sarah.johnson@university.edu' },
          { name: 'Prof. Michael Chen', email: 'michael.chen@university.edu' }
        ],
        credits: 3,
        level: 'Undergraduate'
      };

      const mockNotes: Note[] = [
        {
          _id: '1',
          title: 'Introduction to Programming Concepts',
          description: 'Basic programming concepts and paradigms covered in the first module.',
          url: '#',
          source_name: 'CS Dept',
          published_at: '2024-03-10',
          type: 'notes' as const,
          faculty: 'Science',
          facultyCode: 'sci',
          categories: ['programming', 'basics'],
        },
        {
          _id: '2',
          title: 'Data Structures Fundamentals',
          description: 'Comprehensive guide to arrays, linked lists, stacks, and queues.',
          url: '#',
          source_name: 'CS Dept',
          published_at: '2024-03-15',
          type: 'notes' as const,
          faculty: 'Science',
          facultyCode: 'sci',
          categories: ['data structures', 'algorithms'],
        }
      ];

      const mockPastPapers: PastPaper[] = [
        {
          _id: '1',
          title: 'CS101 Final Exam',
          unit_id: unitId,
          unit_name: 'Introduction to Computer Science',
          unit_code: 'CS101',
          year: '2023',
          exam_type: 'Final',
          semester: 'Fall',
          file_path: '/papers/cs101-final-2023.pdf',
          faculty: 'Science',
          faculty_code: 'sci'
        },
        {
          _id: '2',
          title: 'CS101 Midterm Exam',
          unit_id: unitId,
          unit_name: 'Introduction to Computer Science',
          unit_code: 'CS101',
          year: '2023',
          exam_type: 'Midterm',
          semester: 'Fall',
          file_path: '/papers/cs101-midterm-2023.pdf',
          faculty: 'Science',
          faculty_code: 'sci'
        }
      ];

      setUnit(mockUnit);
      setNotes(mockNotes);
      setPastPapers(mockPastPapers);
    } catch (error) {
      console.error('Error fetching unit data:', error);
      toast.error('Failed to load unit data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!unit) {
    return (
      <MainLayout>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unit not found</AlertTitle>
          <AlertDescription>
            The requested unit could not be found. Please check the URL or go back to the units list.
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-10 w-10 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{unit.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{unit.code}</Badge>
              <Badge variant="outline">{unit.faculty}</Badge>
              {unit.level && <Badge variant="outline">{unit.level}</Badge>}
              {unit.credits && <Badge variant="outline">{unit.credits} Credits</Badge>}
            </div>
          </div>
        </div>

        {/* Unit Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              About This Unit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{unit.description}</p>
            
            {unit.keywords && unit.keywords.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Keywords:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {unit.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
            <TabsTrigger value="papers">Past Papers ({pastPapers.length})</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Syllabus */}
              {unit.syllabus && unit.syllabus.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Syllabus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {unit.syllabus.map((topic, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-sm text-gray-400 mt-1 min-w-0">
                            {index + 1}.
                          </span>
                          <span className="text-sm text-gray-700">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Prerequisites & Instructors */}
              <div className="space-y-6">
                {unit.prerequisites && unit.prerequisites.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Prerequisites
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {unit.prerequisites.map((prereq, index) => (
                          <li key={index} className="text-sm text-gray-700">
                            • {prereq}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {unit.instructors && unit.instructors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Instructors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {unit.instructors.map((instructor, index) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium text-gray-900">{instructor.name}</div>
                            {instructor.email && (
                              <div className="text-gray-600">{instructor.email}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            {notes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notes available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Notes for this unit will appear here when available.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((note, index) => (
                  <FadeIn key={note._id}>
                    <div style={{ animationDelay: `${index * 0.1}s` }}>
                      <NoteCard note={note} unitId={unitId} />
                    </div>
                  </FadeIn>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="papers" className="space-y-4">
            {pastPapers.length === 0 ? (
              <div className="text-center py-12">
                <BookCopy className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No past papers available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Past papers for this unit will appear here when available.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastPapers.map((paper, index) => (
                  <FadeIn key={paper._id}>
                    <div style={{ animationDelay: `${index * 0.1}s` }}>
                      <PastPaperCard paper={paper as any} />
                    </div>
                  </FadeIn>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="search">
            <NoteSearchComponent unitId={unitId} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}