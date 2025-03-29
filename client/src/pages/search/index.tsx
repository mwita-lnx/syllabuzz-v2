// src/pages/search/index.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, FileText, HelpCircle, Filter, SlidersHorizontal } from 'lucide-react';
import { User, SearchResult } from '../../types';
import { Button } from '../../components/ui/Button';
import Loader from '../../components/Loader';
import SearchResultCard from './components/SearchResultCard';
import { searchQuestions, searchNotes } from '../../services/search-service';
import toast from 'react-hot-toast';

interface SearchPageProps {
  user: User;
}

const SearchPage: React.FC<SearchPageProps> = ({ user: currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [questionResults, setQuestionResults] = useState<SearchResult[]>([]);
  const [noteResults, setNoteResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'questions' | 'notes'>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterOptions, setFilterOptions] = useState({
    sourceType: 'all' as 'all' | 'exam' | 'cat',
    minSimilarity: 0.6
  });
  
  useEffect(() => {
    // Get search query from URL params
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    const frequency = params.get('frequency');
    
    if (query) {
      setSearchQuery(query);
      handleSearch(query);
    } else if (frequency) {
      // If frequency parameter is present, search for frequent questions
      searchFrequentQuestions(parseInt(frequency, 10));
    }
  }, [location.search]);
  
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      // Perform search in parallel
      const [questionsData, notesData] = await Promise.all([
        searchQuestions(query, filterOptions),
        searchNotes(query, filterOptions)
      ]);
      
      setQuestionResults(questionsData);
      setNoteResults(notesData);
    } catch (error) {
      console.error('Error performing search:', error);
      toast.error('Failed to perform search');
    } finally {
      setIsLoading(false);
    }
  };
  
  const searchFrequentQuestions = async (minFrequency: number = 2) => {
    setIsLoading(true);
    try {
      const questionsData = await searchQuestions('', { 
        ...filterOptions, 
        minFrequency 
      });
      
      setQuestionResults(questionsData);
      setNoteResults([]);
      setActiveTab('questions');
    } catch (error) {
      console.error('Error fetching frequent questions:', error);
      toast.error('Failed to fetch frequent questions');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      handleSearch(searchQuery);
    }
  };
  
  const handleFilterChange = (key: keyof typeof filterOptions, value: any) => {
    setFilterOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const applyFilters = () => {
    handleSearch(searchQuery);
    setShowFilters(false);
  };
  
  // Get filtered results based on active tab
  const getDisplayedResults = () => {
    if (activeTab === 'questions') return questionResults;
    if (activeTab === 'notes') return noteResults;
    return [...questionResults, ...noteResults];
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {searchQuery 
            ? `Search Results for "${searchQuery}"`
            : 'Search Questions and Notes'
          }
        </h1>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for questions, topics, keywords..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<SearchIcon className="h-5 w-5" />}
          >
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            leftIcon={<SlidersHorizontal className="h-5 w-5" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
        </form>
        
        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Search Filters
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Type
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={filterOptions.sourceType}
                  onChange={(e) => handleFilterChange('sourceType', e.target.value as 'all' | 'exam' | 'cat')}
                >
                  <option value="all">All Sources</option>
                  <option value="exam">Exam</option>
                  <option value="cat">CAT</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Similarity (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.5"
                    max="0.9"
                    step="0.05"
                    value={filterOptions.minSimilarity}
                    onChange={(e) => handleFilterChange('minSimilarity', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-sm min-w-[50px] text-center">
                    {Math.round(filterOptions.minSimilarity * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={applyFilters}
                  fullWidth
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mt-6">
          <div className="flex space-x-8">
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All Results
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {questionResults.length + noteResults.length}
              </span>
            </button>
            
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'questions'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('questions')}
            >
              <HelpCircle className="h-4 w-4 inline mr-1" />
              Questions
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {questionResults.length}
              </span>
            </button>
            
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notes'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('notes')}
            >
              <FileText className="h-4 w-4 inline mr-1" />
              Notes
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {noteResults.length}
              </span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Results */}
      {isLoading ? (
        <Loader fullScreen={false} message="Searching..." />
      ) : (
        <div className="space-y-4">
          {getDisplayedResults().length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500 mb-4">No results found matching your criteria.</p>
              <p className="text-sm text-gray-500">
                Try adjusting your search terms or filters.
              </p>
            </div>
          ) : (
            getDisplayedResults().map((result, index) => (
              <SearchResultCard 
                key={`${result.id}-${index}`} 
                result={result}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;