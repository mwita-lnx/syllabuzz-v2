import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Upload, Plus, X, FileText, Search, BookA, ChevronDown, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

// Import API service
import { apiGet, apiUpload } from '@/services/api';

// Import layout and components
import { MainLayout } from '@/components/MainLayout';
import { UnitCard } from '@/components/UnitCard';
import { FacultySelector } from '@/components/FacultySelector';

// Import types
import { Unit, Faculty, Instructor, PaginatedResponse, ApiResponse } from '@/types';

// Animation component for transitions
const FadeIn = ({ children, delay = 0 }) => {
  return (
    <div 
      className="animate-fadeIn opacity-0" 
      style={{ 
        animation: 'fadeIn 0.5s ease forwards',
        animationDelay: `${delay}s`
      }}
    >
      {children}
    </div>
  );
};

// File dropzone component
const FileDropzone = ({ onFileSelect, multiple = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileArray = multiple 
        ? Array.from(e.dataTransfer.files)
        : [e.dataTransfer.files[0]];
      
      setFiles(prevFiles => [...prevFiles, ...fileArray]);
      onFileSelect(multiple ? fileArray : fileArray[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = multiple 
        ? Array.from(e.target.files)
        : [e.target.files[0]];
      
      setFiles(prevFiles => [...prevFiles, ...fileArray]);
      onFileSelect(multiple ? fileArray : fileArray[0]);
    }
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFileSelect(multiple ? newFiles : newFiles[0] || null);
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'
        } transition-colors`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-10 h-10 mx-auto mb-4 text-gray-400" />
        <p className="mb-2 text-sm font-medium">
          Drag and drop {multiple ? 'files' : 'a file'} here, or{' '}
          <label className="text-primary cursor-pointer hover:underline">
            browse
            <input
              type="file"
              className="hidden"
              onChange={handleFileInputChange}
              multiple={multiple}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
            />
          </label>
        </p>
        <p className="text-xs text-gray-500">
          Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT (PDF recommended)
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Selected Files</h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li 
                key={index} 
                className="flex justify-between items-center p-2 bg-gray-50 rounded border"
              >
                <span className="truncate">{file.name}</span>
                <button 
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-500 hover:text-red-500"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Unit form schema
const unitFormSchema = z.object({
  name: z.string().min(3, { message: "Unit name must be at least 3 characters" }),
  code: z.string().min(2, { message: "Unit code is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  faculty: z.string().min(1, { message: "Faculty is required" }),
  facultyCode: z.string().min(1, { message: "Faculty code is required" }),
  keywords: z.array(z.string()).min(1, { message: "At least one keyword is required" }),
  level: z.string().optional(),
  credits: z.number().min(1).optional(),
  syllabus: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  instructors: z.array(
    z.object({
      name: z.string(),
      email: z.string().email(),
      title: z.string().optional()
    })
  ).optional()
});

const UnitsPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // State management
  const [units, setUnits] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [selectedSort, setSelectedSort] = useState('recent');
  const [faculties, setFaculties] = useState([]);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const [syllabusInput, setSyllabusInput] = useState('');
  const [prerequisiteInput, setPrerequisiteInput] = useState('');
  const [instructors, setInstructors] = useState([{ name: '', email: '', title: '' }]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Initialize form with default values
  const form = useForm({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      faculty: '',
      facultyCode: '',
      keywords: [],
      level: 'Beginner',
      credits: 3,
      syllabus: [],
      prerequisites: [],
      instructors: []
    }
  });
  
  // Theme colors
  const colors = {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    tertiary: '#FFD166',
    quaternary: '#6A0572',
    background: '#FFFFFF',
    surface: '#F7F9FC',
    textPrimary: '#2D3748',
    textSecondary: '#4A5568',
    textMuted: '#718096',
    border: '#E2E8F0',
  };
  
  // Fetch data on component mount
  useEffect(() => {
    fetchFaculties();
    fetchUnits();
  }, []);
  
  // Apply filters when dependencies change
  useEffect(() => {
    if (units.length > 0) {
      filterUnits();
    }
  }, [units, selectedFaculty, searchQuery, selectedSort]);
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!isAddUnitOpen) {
      form.reset({
        name: '',
        code: '',
        description: '',
        faculty: '',
        facultyCode: '',
        keywords: [],
        level: 'Beginner',
        credits: 3,
        syllabus: [],
        prerequisites: [],
        instructors: []
      });
      setInstructors([{ name: '', email: '', title: '' }]);
      setUploadedFiles([]);
      setKeywordInput('');
      setSyllabusInput('');
      setPrerequisiteInput('');
    }
  }, [isAddUnitOpen, form]);
  
  // Fetch faculties
  const fetchFaculties = async () => {
    try {
      // Try to fetch faculties from the API
      const response = await apiGet('/faculties/');
      console.log('Faculties response:', response);
      
      if (response.status && response.data) {
        setFaculties(response.data);
      } else {
        // Fallback to mock data if API fails
        setFaculties([
          { id: '1', name: 'Science', code: 'sci', color: '#FF6B6B' },
          { id: '2', name: 'Arts', code: 'arts', color: '#4ECDC4' },
          { id: '3', name: 'Business', code: 'bus', color: '#FFD166' },
          { id: '4', name: 'Engineering', code: 'eng', color: '#6A0572' },
          { id: '5', name: 'Medicine', code: 'med', color: '#06D6A0' }
        ]);
      }
    } catch (err) {
      console.error('Error fetching faculties:', err);
      // Fallback to mock data
      setFaculties([
        { id: '1', name: 'Science', code: 'sci', color: '#FF6B6B' },
        { id: '2', name: 'Arts', code: 'arts', color: '#4ECDC4' },
        { id: '3', name: 'Business', code: 'bus', color: '#FFD166' },
        { id: '4', name: 'Engineering', code: 'eng', color: '#6A0572' },
        { id: '5', name: 'Medicine', code: 'med', color: '#06D6A0' }
      ]);
    }
  };
  
  // Fetch units from API
  const fetchUnits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query parameters
      const params = {};
      
      if (selectedFaculty !== 'all') {
        params.faculty = selectedFaculty;
      }
      
      if (searchQuery.trim()) {
        params.query = searchQuery;
      }
      
      params.sort_by = selectedSort;
      params.page = page.toString();
      params.limit = '12'; // Adjust limit as needed
      
      // Make API call
      const response = await apiGet('/units/', params);
      
      if (response.units) {
        setUnits(response.units || []);
        setTotalUnits(response.total || 0);
        setTotalPages(response.pages || 1);
      } else {
        setError(response.error || 'An error occurred while fetching units');
        toast.error('Failed to load units');
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching units:', err);
      setError(err.message || 'Failed to fetch units');
      toast.error('Failed to load units 😔');
      setIsLoading(false);
    }
  };
  
  // Filter and sort units based on current state
  const filterUnits = () => {
    let result = [...units];
    
    // Apply faculty filter (if not already applied in API)
    if (selectedFaculty !== 'all') {
      result = result.filter(unit => unit.facultyCode === selectedFaculty);
    }
    
    // Apply search filter (if not already applied in API)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        unit => 
          unit.name.toLowerCase().includes(query) || 
          unit.code.toLowerCase().includes(query) || 
          unit.description.toLowerCase().includes(query) ||
          (unit.keywords && unit.keywords.some(keyword => keyword.toLowerCase().includes(query)))
      );
    }
    
    // Apply sorting (if not already sorted by API)
    switch (selectedSort) {
      case 'recent':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'az':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'za':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'code':
        result.sort((a, b) => a.code.localeCompare(b.code));
        break;
    }
    
    setFilteredUnits(result);
  };
  
  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchUnits(); // Re-fetch with new search parameters
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedFaculty('all');
    setSelectedSort('recent');
    setPage(1);
    
    // Re-fetch with reset filters
    setTimeout(() => {
      fetchUnits();
    }, 0);
  };
  
  // Handle file upload
  const handleFileSelect = (files) => {
    if (Array.isArray(files)) {
      setUploadedFiles(files);
    } else if (files) {
      setUploadedFiles([files]);
    }
  };
  
  // Add a new keyword
  const addKeyword = () => {
    if (keywordInput.trim()) {
      const currentKeywords = form.getValues('keywords') || [];
      form.setValue('keywords', [...currentKeywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };
  
  // Remove a keyword
  const removeKeyword = (index) => {
    const currentKeywords = form.getValues('keywords') || [];
    const updatedKeywords = [...currentKeywords];
    updatedKeywords.splice(index, 1);
    form.setValue('keywords', updatedKeywords);
  };
  
  // Add syllabus item
  const addSyllabusItem = () => {
    if (syllabusInput.trim()) {
      const currentSyllabus = form.getValues('syllabus') || [];
      form.setValue('syllabus', [...currentSyllabus, syllabusInput.trim()]);
      setSyllabusInput('');
    }
  };
  
  // Remove syllabus item
  const removeSyllabusItem = (index) => {
    const currentSyllabus = form.getValues('syllabus') || [];
    const updatedSyllabus = [...currentSyllabus];
    updatedSyllabus.splice(index, 1);
    form.setValue('syllabus', updatedSyllabus);
  };
  
  // Add prerequisite
  const addPrerequisite = () => {
    if (prerequisiteInput.trim()) {
      const currentPrerequisites = form.getValues('prerequisites') || [];
      form.setValue('prerequisites', [...currentPrerequisites, prerequisiteInput.trim()]);
      setPrerequisiteInput('');
    }
  };
  
  // Remove prerequisite
  const removePrerequisite = (index) => {
    const currentPrerequisites = form.getValues('prerequisites') || [];
    const updatedPrerequisites = [...currentPrerequisites];
    updatedPrerequisites.splice(index, 1);
    form.setValue('prerequisites', updatedPrerequisites);
  };
  
  // Add instructor
  const addInstructor = () => {
    const newInstructor = { name: '', email: '', title: '' };
    setInstructors([...instructors, newInstructor]);
    
    // Update the form value
    const currentInstructors = form.getValues('instructors') || [];
    form.setValue('instructors', [...currentInstructors, newInstructor]);
  };
  
  // Update instructor
  const updateInstructor = (index, field, value) => {
    const updatedInstructors = [...instructors];
    updatedInstructors[index][field] = value;
    setInstructors(updatedInstructors);
    
    // Update the form value
    form.setValue('instructors', updatedInstructors);
  };
  
  // Remove instructor
  const removeInstructor = (index) => {
    const updatedInstructors = [...instructors];
    updatedInstructors.splice(index, 1);
    setInstructors(updatedInstructors);
    
    // Update the form value
    form.setValue('instructors', updatedInstructors);
  };
  
  // Handle faculty selection
  const handleFacultySelect = (facultyCode) => {
    const faculty = faculties.find(f => f.code === facultyCode);
    
    if (faculty) {
      form.setValue('faculty', faculty.name);
      form.setValue('facultyCode', faculty.code);
    }
  };
  
  // Handle form submission
  const onSubmit = async (formData) => {
    console.log("Form submitted with data:", formData);
    setIsUploading(true);
    
    try {
      // Create FormData object
      const payload = new FormData();
      
      // Add text fields directly
      payload.append('name', formData.name);
      payload.append('code', formData.code);
      payload.append('description', formData.description);
      payload.append('faculty', formData.faculty);
      payload.append('facultyCode', formData.facultyCode);
      payload.append('level', formData.level || 'Beginner');
      payload.append('credits', String(formData.credits || 3));
      
      // Add arrays as JSON strings
      payload.append('keywords', JSON.stringify(formData.keywords || []));
      payload.append('syllabus', JSON.stringify(formData.syllabus || []));
      payload.append('prerequisites', JSON.stringify(formData.prerequisites || []));
      payload.append('instructors', JSON.stringify(formData.instructors || []));
      
      // Add files
      if (uploadedFiles && uploadedFiles.length > 0) {
        uploadedFiles.forEach((file) => {
          payload.append('files', file);
        });
      }
      
      // Log the request payload for debugging
      console.log("FormData prepared for submission");
      
      // Make API request using apiUpload instead of apiPost
      const response = await apiUpload('/units/', payload);
      console.log("API response:", response);
      
      if (response && response.success) {
        toast.success('Unit created successfully! 🎉');
        setIsAddUnitOpen(false);
        fetchUnits(); // Refresh the units list
        
        // Reset form
        form.reset({
          name: '',
          code: '',
          description: '',
          faculty: '',
          facultyCode: '',
          keywords: [],
          level: 'Beginner',
          credits: 3,
          syllabus: [],
          prerequisites: [],
          instructors: []
        });
        setUploadedFiles([]);
      } else {
        const errorMessage = response?.error || 'Failed to create unit';
        console.error("API error:", errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Get faculty color
  const getFacultyColor = (facultyCode) => {
    const faculty = faculties.find(f => f.code === facultyCode);
    return faculty ? faculty.color : colors.primary;
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => fetchUnits(), 0);
  };
  
  return (
    <MainLayout>
      <FadeIn>
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold title-font" style={{ color: colors.primary }}>Academic Units</h2>
            
            {isAuthenticated && (
              <Dialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-1" style={{ backgroundColor: colors.primary }}>
                    <Plus className="w-4 h-4" /> Add New Unit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle style={{ color: colors.primary }}>Add New Unit</DialogTitle>
                    <DialogDescription>
                      Fill in the details to create a new academic unit.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                      <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="mb-4">
                          <TabsTrigger value="basic">Basic Information</TabsTrigger>
                          <TabsTrigger value="syllabus">Syllabus & Prerequisites</TabsTrigger>
                          <TabsTrigger value="instructors">Instructors & Files</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="basic" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. Introduction to Computer Science" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="code"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. CS101" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Provide a detailed description of the unit" 
                                    className="min-h-32"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="facultyCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Faculty</FormLabel>
                                  <Select 
                                    onValueChange={(value) => {
                                      handleFacultySelect(value);
                                      field.onChange(value);
                                    }}
                                    value={field.value}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a faculty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {faculties.map(faculty => (
                                        <SelectItem key={faculty.id} value={faculty.code}>
                                          {faculty.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="level"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Level</FormLabel>
                                    <Select 
                                      onValueChange={field.onChange} 
                                      defaultValue={field.value}
                                      value={field.value}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select level" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Beginner">Beginner</SelectItem>
                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        <SelectItem value="Advanced">Advanced</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="credits"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Credits</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        min="1" 
                                        max="10" 
                                        value={field.value} 
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <FormLabel>Keywords</FormLabel>
                            <div className="flex gap-2 mt-1 mb-2">
                              <Input 
                                placeholder="Add keyword" 
                                value={keywordInput} 
                                onChange={e => setKeywordInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addKeyword();
                                  }
                                }} 
                              />
                              <Button type="button" onClick={addKeyword}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {form.getValues('keywords')?.map((keyword, index) => (
                                <Badge 
                                  key={index} 
                                  className="flex items-center gap-1 px-3 py-1"
                                  style={{ backgroundColor: colors.primary, color: 'white' }}
                                >
                                  {keyword}
                                  <X 
                                    className="w-3 h-3 cursor-pointer" 
                                    onClick={() => removeKeyword(index)} 
                                  />
                                </Badge>
                              ))}
                            </div>
                            <FormMessage>{form.formState.errors.keywords?.message}</FormMessage>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="syllabus" className="space-y-4">
                          <div>
                            <FormLabel>Syllabus Items</FormLabel>
                            <div className="flex gap-2 mt-1 mb-2">
                              <Input 
                                placeholder="Add syllabus item" 
                                value={syllabusInput} 
                                onChange={e => setSyllabusInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSyllabusItem();
                                  }
                                }} 
                              />
                              <Button type="button" onClick={addSyllabusItem}>Add</Button>
                            </div>
                            <div className="mt-2 space-y-2">
                              {form.getValues('syllabus')?.map((item, index) => (
                                <div 
                                  key={index} 
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                                >
                                  <span>{item}</span>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => removeSyllabusItem(index)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <FormLabel>Prerequisites</FormLabel>
                            <div className="flex gap-2 mt-1 mb-2">
                              <Input 
                                placeholder="Add prerequisite (e.g. CS101)" 
                                value={prerequisiteInput} 
                                onChange={e => setPrerequisiteInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addPrerequisite();
                                  }
                                }} 
                              />
                              <Button type="button" onClick={addPrerequisite}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {form.getValues('prerequisites')?.map((prerequisite, index) => (
                                <Badge 
                                  key={index} 
                                  variant="outline"
                                  className="flex items-center gap-1 px-3 py-1"
                                  style={{ borderColor: colors.primary, color: colors.primary }}
                                >
                                  {prerequisite}
                                  <X 
                                    className="w-3 h-3 cursor-pointer" 
                                    onClick={() => removePrerequisite(index)} 
                                  />
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="instructors" className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <FormLabel>Instructors</FormLabel>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={addInstructor}
                              >
                                <Plus className="w-4 h-4 mr-1" /> Add Instructor
                              </Button>
                            </div>
                            
                            <div className="space-y-4">
                              {instructors.map((instructor, index) => (
                                <div 
                                  key={index} 
                                  className="p-4 border rounded-md bg-gray-50"
                                >
                                  <div className="flex justify-between mb-2">
                                    <h4 className="font-medium">Instructor #{index + 1}</h4>
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => removeInstructor(index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <FormLabel>Name</FormLabel>
                                      <Input 
                                        placeholder="Dr. Jane Smith" 
                                        value={instructor.name} 
                                        onChange={e => updateInstructor(index, 'name', e.target.value)} 
                                      />
                                    </div>
                                    <div>
                                      <FormLabel>Email</FormLabel>
                                      <Input 
                                        placeholder="email@university.edu" 
                                        value={instructor.email} 
                                        onChange={e => updateInstructor(index, 'email', e.target.value)} 
                                      />
                                    </div>
                                    <div>
                                      <FormLabel>Title</FormLabel>
                                      <Input 
                                        placeholder="Professor" 
                                        value={instructor.title || ''} 
                                        onChange={e => updateInstructor(index, 'title', e.target.value)} 
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <FormLabel>Upload Files</FormLabel>
                            <FormDescription>
                              Upload syllabus, course materials, or other documents (PDF recommended)
                            </FormDescription>
                            <div className="mt-2">
                              <FileDropzone onFileSelect={handleFileSelect} multiple={true} />
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h4 className="font-medium mb-2">Form Validation Status</h4>
                        <div className="text-sm">
                          {Object.keys(form.formState.errors).length > 0 && (
                            <ul className="text-red-500">
                              {Object.entries(form.formState.errors).map(([field, error]) => (
                                <li key={field}>
                                  {field}: {error.message}
                                </li>
                              ))}
                            </ul>
                          )}
                          {Object.keys(form.formState.errors).length === 0 && (
                            <p className="text-green-600">All required fields are valid</p>
                          )}
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddUnitOpen(false)}
                          disabled={isUploading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          style={{ backgroundColor: colors.primary }}
                          disabled={isUploading || Object.keys(form.formState.errors).length > 0}
                        >
                          {isUploading ? 'Creating...' : 'Create Unit'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {/* Filters Section */}
          <Card className="mb-6" style={{ backgroundColor: colors.surface }}>
            <CardHeader>
              <CardTitle className="flex items-center text-lg" style={{ color: colors.primary }}>
                <Filter className="w-5 h-5 mr-2" /> Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <form onSubmit={handleSearch} className="relative">
                    <Input
                      type="text"
                      placeholder="Search units..."
                      className="w-full border-2 focus:ring-2 focus:border-transparent transition-all"
                      style={{ 
                        borderColor: colors.primary,
                        borderRadius: '0.5rem',
                        color: colors.textPrimary
                      }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </form>
                </div>
                
                {/* Faculty Filter */}
                <div>
                  <FacultySelector 
                    faculties={faculties} 
                    selectedFaculty={selectedFaculty}
                    onSelect={(faculty) => {
                      setSelectedFaculty(faculty);
                      setPage(1);
                      setTimeout(() => fetchUnits(), 0);
                    }}
                  />
                </div>
                
                {/* Sort Filter */}
                <div>
                  <Select 
                    value={selectedSort} 
                    onValueChange={(value) => {
                      setSelectedSort(value);
                      setPage(1);
                      setTimeout(() => fetchUnits(), 0);
                    }}
                  >
                    <SelectTrigger style={{ borderColor: colors.primary, color: colors.textPrimary }}>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="az">Name (A-Z)</SelectItem>
                      <SelectItem value="za">Name (Z-A)</SelectItem>
                      <SelectItem value="code">Unit Code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <Badge className="mr-2" style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}>
                  {totalUnits} units found
                </Badge>
                {(selectedFaculty !== 'all' || searchQuery || selectedSort !== 'recent') && (
                  <Badge style={{ backgroundColor: colors.quaternary, color: 'white' }}>
                    Filters applied
                  </Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={resetFilters}
                style={{ borderColor: colors.primary, color: colors.primary }}
              >
                Reset Filters
              </Button>
            </CardFooter>
          </Card>
          
          {/* Error Alert */}
          {error && (
            <Alert 
              className="mb-6 border-2" 
              style={{ 
                backgroundColor: colors.surface, 
                borderColor: colors.primary,
                color: colors.textPrimary
              }}
            >
              <AlertTitle className="font-bold title-font flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" style={{ color: colors.primary }} />
                Error Loading Units
              </AlertTitle>
              <AlertDescription>
                {error}. Please try again or contact support if the problem persists.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Units Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-full" style={{ backgroundColor: colors.surface }}>
                  <CardHeader>
                    <Skeleton className="h-6 w-full mb-2" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-4 w-24" style={{ backgroundColor: `${colors.textSecondary}40` }} />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredUnits.length === 0 ? (
            <Alert 
              className="border-2 animate-pulse" 
              style={{ 
                backgroundColor: colors.surface, 
                borderColor: colors.primary,
                color: colors.textPrimary
              }}
            >
              <AlertTitle className="font-bold title-font">No units found</AlertTitle>
              <AlertDescription>
                Try adjusting your filters or search query to find units.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredUnits.map((unit, index) => (
                  <div key={unit._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                    <UnitCard 
                      unit={unit} 
                      onClick={() => navigate(`/units/${unit._id}`)}
                      color={getFacultyColor(unit.facultyCode)}
                    />
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                    style={{ borderColor: colors.primary, color: colors.primary }}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex space-x-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i}
                        variant={page === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(i + 1)}
                        style={
                          page === i + 1
                            ? { backgroundColor: colors.primary, color: 'white' }
                            : { borderColor: colors.primary, color: colors.primary }
                        }
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    style={{ borderColor: colors.primary, color: colors.primary }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </FadeIn>
    </MainLayout>
  );
};

export default UnitsPage;