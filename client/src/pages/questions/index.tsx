// src/pages/questions/index.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, Filter, Search, Star } from 'lucide-react';
import { User, Unit, Question } from '../../types';
// Rename the type import to avoid collision with the component
import { QuestionGroup as QuestionGroupType } from '../../types';
import { Button } from '../../components/ui/Button';
import Loader from '../../components/Loader';
import QuestionCard from '../../components/QuestionCard';
// Import the component with its original name
import QuestionGroup from './components/QuestionGroup';
import { getUnitById } from '../../services/unit-service';
import { getQuestionsByUnit } from '../../services/question-service';
import toast from 'react-hot-toast';

interface QuestionsPageProps {
  user: User;
}

const QuestionsPage: React.FC<QuestionsPageProps> = ({ user }) => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  
  const [unit, setUnit] = useState<Unit | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [groups, setGroups] = useState<QuestionGroupType[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<QuestionGroupType[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGroupView, setIsGroupView] = useState<boolean>(true);
  const [filterOptions, setFilterOptions] = useState({
    sourceType: 'all', // 'all', 'exam', 'cat'
    difficulty: 'all',  // 'all', 'easy', 'medium', 'hard'
    minFrequency: 1
  });
  
  useEffect(() => {
    if (!unitId) {
      navigate('/courses');
      return;
    }
    
    const fetchUnitAndQuestions = async () => {
      try {
        setIsLoading(true);
        const [unitData, questionsData] = await Promise.all([
          getUnitById(unitId),
          getQuestionsByUnit(unitId, { groupBy: true })
        ]);
        
        setUnit(unitData);
        
        // Assuming questionsData has both individual questions and groups
        if (questionsData.questions) {
          setQuestions(questionsData.questions);
          setFilteredQuestions(questionsData.questions);
        }
        
        if (questionsData.groups) {
          setGroups(questionsData.groups);
          setFilteredGroups(questionsData.groups);
        }
      } catch (error) {
        console.error('Error fetching unit/questions:', error);
        toast.error('Failed to load questions');
        navigate('/courses');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUnitAndQuestions();
  }, [unitId, navigate]);
  
  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterOptions, questions, groups]);
  
  const applyFilters = () => {
    // Filter questions
    let filtered = [...questions];
    
    // Apply source type filter
    if (filterOptions.sourceType !== 'all') {
      filtered = filtered.filter(q => q.source_type === filterOptions.sourceType);
    }
    
    // Apply difficulty filter
    if (filterOptions.difficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === filterOptions.difficulty);
    }
    
    // Apply frequency filter
    filtered = filtered.filter(q => q.frequency >= filterOptions.minFrequency);
    
    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(q => 
        q.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredQuestions(filtered);
    
    // Filter groups similarly
    if (groups.length > 0) {
      let filteredGroupsList = [...groups];
      
      // Apply source type and difficulty filters by checking if ANY question in the group matches
      if (filterOptions.sourceType !== 'all') {
        filteredGroupsList = filteredGroupsList.filter(g => 
          g.questions.some(q => q.source_type === filterOptions.sourceType)
        );
      }
      
      if (filterOptions.difficulty !== 'all') {
        filteredGroupsList = filteredGroupsList.filter(g => 
          g.questions.some(q => q.difficulty === filterOptions.difficulty)
        );
      }
      
      // Apply frequency filter - keep groups where ANY question has sufficient frequency
      filteredGroupsList = filteredGroupsList.filter(g => 
        g.questions.some(q => q.frequency >= filterOptions.minFrequency)
      );
      
      // Apply search query
      if (searchQuery) {
        filteredGroupsList = filteredGroupsList.filter(g => 
          g.questions.some(q => q.text.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      setFilteredGroups(filteredGroupsList);
    }
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleFilterChange = (key: keyof typeof filterOptions, value: any) => {
    setFilterOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleUploadMaterials = () => {
    // Navigate to upload materials page
    toast.success('Upload materials functionality to be implemented');
  };
  
  if (isLoading) {
    return <Loader fullScreen={false} />;
  }
  
  if (!unit) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 mb-4">Unit not found</p>
        <Button variant="primary" onClick={() => navigate('/courses')}>
          Return to Courses
        </Button>
      </div>
    );
  }
  
  const isInstructor = user.role === 'instructor';
  const noQuestionsFound = 
    (isGroupView && filteredGroups.length === 0) || 
    (!isGroupView && filteredQuestions.length === 0);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ChevronLeft className="h-5 w-5" />}
          onClick={() => navigate(`/courses/${unit.course_id}/units`)}
        >
          Back to Units
        </Button>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {unit.code}: {unit.name}
        </h1>
        <p className="text-gray-600">{unit.description}</p>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Questions
          </h2>
          
          <div className="flex border rounded-md overflow-hidden">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                isGroupView 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setIsGroupView(true)}
            >
              Grouped
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                !isGroupView 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setIsGroupView(false)}
            >
              Individual
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search questions..."
              className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          
          {isInstructor && (
            <Button
              variant="primary"
              leftIcon={<Upload className="h-5 w-5" />}
              onClick={handleUploadMaterials}
            >
              Upload Past Paper
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters sidebar */}
        <div className="md:w-64 bg-white border border-gray-200 p-4 rounded-lg h-fit">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Type
              </label>
              <select
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={filterOptions.sourceType}
                onChange={(e) => handleFilterChange('sourceType', e.target.value)}
              >
                <option value="all">All Sources</option>
                <option value="exam">Exam</option>
                <option value="cat">CAT</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={filterOptions.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min. Frequency
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={filterOptions.minFrequency}
                  onChange={(e) => handleFilterChange('minFrequency', parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-sm">
                  <Star className="h-4 w-4 mr-1 fill-amber-500 text-amber-500" />
                  {filterOptions.minFrequency}+
                </span>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => {
                setFilterOptions({
                  sourceType: 'all',
                  difficulty: 'all',
                  minFrequency: 1
                });
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
        
        {/* Questions list */}
        <div className="flex-1">
          {noQuestionsFound ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500 mb-4">No questions found matching your criteria.</p>
              {isInstructor && (
                <Button
                  variant="primary"
                  leftIcon={<Upload className="h-5 w-5" />}
                  onClick={handleUploadMaterials}
                >
                  Upload Past Paper
                </Button>
              )}
            </div>
          ) : isGroupView ? (
            <div className="space-y-6">
              {filteredGroups.map(group => (
                <QuestionGroup
                  key={group.group_id}
                  group={group}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map(question => (
                <QuestionCard
                  key={question._id}
                  question={question}
                  showRelated={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionsPage;