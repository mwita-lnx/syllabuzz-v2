// src/components/RelatedContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  BookOpen, 
  Book, 
  ChevronRight, 
  Link, 
  ExternalLink, 
  Search 
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SearchComponent from './SearchComponent';

interface RelatedItem {
  id: string;
  title: string;
  type: 'note' | 'pastpaper' | 'question';
  similarity?: number;
  description?: string;
  tags?: string[];
  year?: string;
  exam_type?: string;
  unit_name?: string;
  unit_code?: string;
}

interface RelatedContentProps {
  sourceId: string;
  sourceType: 'note' | 'pastpaper' | 'question';
  primaryColor?: string;
  maxItems?: number;
  showSearch?: boolean;
  onSelect?: (item: RelatedItem) => void;
}

const RelatedContent: React.FC<RelatedContentProps> = ({
  sourceId,
  sourceType,
  primaryColor = '#FF6B6B',
  maxItems = 5,
  showSearch = true,
  onSelect
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [relatedNotes, setRelatedNotes] = useState<RelatedItem[]>([]);
  const [relatedPastPapers, setRelatedPastPapers] = useState<RelatedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>(sourceType === 'note' ? 'pastpapers' : 'notes');
  const router = useRouter();
  
  // Fetch related content on component mount
  useEffect(() => {
    fetchRelatedContent();
  }, [sourceId, sourceType]);
  
  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In a real implementation, you would search across content here
    // For now we'll just simulate loading
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };
  
  // Fetch related content (simulated API call)
  const fetchRelatedContent = async () => {
    setIsLoading(true);
    
    // In a real implementation, you would fetch data from your API
    // For now, let's simulate an API call with setTimeout
    setTimeout(() => {
      // Generate mock related notes
      if (sourceType !== 'note') {
        const mockNotes = Array.from({ length: Math.floor(Math.random() * 5) + 2 }, (_, i) => ({
          id: `note-${i}`,
          title: `Related Note ${i + 1} about ${sourceType === 'pastpaper' ? 'this past paper' : 'this question'}`,
          type: 'note' as const,
          similarity: Math.random() * 0.5 + 0.5, // 0.5-1.0
          description: 'This note contains content related to this material...',
          tags: ['Topic 1', 'Topic 2']
        }));
        setRelatedNotes(mockNotes);
      }
      
      // Generate mock related past papers
      if (sourceType !== 'pastpaper') {
        const mockPapers = Array.from({ length: Math.floor(Math.random() * 5) + 2 }, (_, i) => ({
          id: `paper-${i}`,
          title: `${Math.round(2015 + Math.random() * 8)} ${['Final', 'Midterm', 'CAT'][Math.floor(Math.random() * 3)]} Exam`,
          type: 'pastpaper' as const,
          similarity: Math.random() * 0.5 + 0.5, // 0.5-1.0
          year: `${Math.round(2015 + Math.random() * 8)}`,
          exam_type: ['Final', 'Midterm', 'CAT'][Math.floor(Math.random() * 3)],
          unit_name: 'Course Name',
          unit_code: 'CS101'
        }));
        setRelatedPastPapers(mockPapers);
      }
      
      setIsLoading(false);
    }, 1000);
  };
  
  // Handle item selection
  const handleItemClick = (item: RelatedItem) => {
    if (onSelect) {
      onSelect(item);
    } else {
      // Default navigation behavior
      if (item.type === 'note') {
        router.push(`/notes/${item.id}`);
      } else if (item.type === 'pastpaper') {
        router.push(`/pastpapers/${item.id}`);
      } else if (item.type === 'question') {
        router.push(`/questions/${item.id}`);
      }
    }
  };
  
  // Helper function to get icon for item type
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <FileText className="h-4 w-4" />;
      case 'pastpaper':
        return <BookOpen className="h-4 w-4" />;
      case 'question':
        return <Search className="h-4 w-4" />;
      default:
        return <Book className="h-4 w-4" />;
    }
  };
  
  // Render a related item card
  const renderItemCard = (item: RelatedItem) => (
    <Card 
      key={item.id} 
      className="mb-3 hover:shadow-md transition-all cursor-pointer hover-scale"
      onClick={() => handleItemClick(item)}
      style={{ borderLeftWidth: '4px', borderLeftColor: primaryColor }}
    >
      <CardHeader className="py-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getItemIcon(item.type)}
            {item.title}
          </CardTitle>
          {item.similarity && (
            <Badge style={{ backgroundColor: primaryColor, color: 'white' }}>
              {Math.round(item.similarity * 100)}% match
            </Badge>
          )}
        </div>
        {item.description && (
          <CardDescription className="text-xs line-clamp-2">
            {item.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardFooter className="py-2 flex justify-between">
        <div className="flex flex-wrap gap-1">
          {item.type === 'pastpaper' && (
            <>
              {item.year && (
                <Badge variant="outline" className="text-xs">
                  {item.year}
                </Badge>
              )}
              {item.exam_type && (
                <Badge variant="outline" className="text-xs">
                  {item.exam_type}
                </Badge>
              )}
            </>
          )}
          {item.tags && item.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-0 h-auto"
          style={{ color: primaryColor }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2" style={{ color: primaryColor }}>
          <Link className="h-5 w-5" />
          Related Content
        </CardTitle>
        {showSearch && (
          <div className="mt-2">
            <SearchComponent 
              placeholder="Search related content..."
              onSearch={handleSearch}
              debounceTime={400}
              primaryColor={primaryColor}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Tabs for different related content types */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger 
              value="notes" 
              disabled={sourceType === 'note'}
              className="text-sm"
            >
              <FileText className="h-4 w-4 mr-1" /> Notes
            </TabsTrigger>
            <TabsTrigger 
              value="pastpapers" 
              disabled={sourceType === 'pastpaper'}
              className="text-sm"
            >
              <BookOpen className="h-4 w-4 mr-1" /> Past Papers
            </TabsTrigger>
          </TabsList>
          
          {/* Notes Tab Content */}
          <TabsContent value="notes" className="mt-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="mb-3">
                  <CardHeader className="py-3">
                    <Skeleton className="h-5 w-3/4" />
                  </CardHeader>
                  <CardFooter className="py-2">
                    <Skeleton className="h-4 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : relatedNotes.length > 0 ? (
              relatedNotes.slice(0, maxItems).map(note => renderItemCard(note))
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No related notes found</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  style={{ color: primaryColor }}
                  onClick={() => router.push('/notes')}
                >
                  Browse all notes
                </Button>
              </div>
            )}
            
            {relatedNotes.length > maxItems && (
              <div className="text-center mt-2">
                <Button 
                  variant="outline" 
                  className="text-sm"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  View all {relatedNotes.length} related notes <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Past Papers Tab Content */}
          <TabsContent value="pastpapers" className="mt-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="mb-3">
                  <CardHeader className="py-3">
                    <Skeleton className="h-5 w-3/4" />
                  </CardHeader>
                  <CardFooter className="py-2">
                    <Skeleton className="h-4 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : relatedPastPapers.length > 0 ? (
              relatedPastPapers.slice(0, maxItems).map(paper => renderItemCard(paper))
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No related past papers found</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  style={{ color: primaryColor }}
                  onClick={() => router.push('/pastpapers')}
                >
                  Browse all past papers
                </Button>
              </div>
            )}
            
            {relatedPastPapers.length > maxItems && (
              <div className="text-center mt-2">
                <Button 
                  variant="outline" 
                  className="text-sm"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  View all {relatedPastPapers.length} related papers <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RelatedContent;