import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FileUp, 
  ChevronLeft, 
  BookOpen, 
  FileText, 
  Info, 
  Check, 
  AlertTriangle, 
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import toast from 'react-hot-toast';

// Import API service
import { apiGet, apiUpload } from '@/services/api';

// Import layout
import { MainLayout } from '@/components/MainLayout';

// Import hooks
import { useAuth } from '@/contexts/AuthContext';

// Import types
import { Unit, Faculty, ApiResponse } from '@/types';

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

interface FormData {
  title: string;
  description: string;
  type: string;
  faculty: string;
  facultyCode: string;
  unitId: string;
  unitName: string;
  unitCode: string;
  categories: string[];
  author: string;
  institution: string;
  source: string;
  published_at: string;
}

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get initial type and unit from URL parameters
  const initialType = searchParams.get('type') || 'note';
  const preselectedUnitId = searchParams.get('unit_id');

  console.log(preselectedUnitId)
  
  // State management
  const [uploadType, setUploadType] = useState<string>(initialType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: 'notes', // 'notes' or 'academic' for notes; 'final', 'midterm', etc. for pastpapers
    faculty: '',
    facultyCode: '',
    unitId: '',
    unitName: '',
    unitCode: '',
    categories: [],
    author: user?.name || '',
    institution: '',
    source: '',
    published_at: new Date().toISOString().split('T')[0]
  });
  
  // Categories input
  const [categoryInput, setCategoryInput] = useState<string>('');

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
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to upload files');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Fetch faculties and units on component mount
  useEffect(() => {
    fetchFaculties();
    fetchUnits();
  }, []);
  
  // Update filtered units when faculty changes
  useEffect(() => {
    if (formData.facultyCode) {
      const filtered = units.filter(unit => unit.facultyCode === formData.facultyCode);
      setFilteredUnits(filtered);
    } else {
      setFilteredUnits(units);
    }
  }, [formData.facultyCode, units]);
  
  // Set preselected unit if provided
  useEffect(() => {
    if (preselectedUnitId && units.length > 0) {
      const unit = units.find(u => u._id === preselectedUnitId);
      if (unit) {
        setSelectedUnit(unit);
        setFormData(prev => ({
          ...prev,
          unitId: unit._id,
          unitName: unit.name,
          unitCode: unit.code,
          faculty: unit.faculty,
          facultyCode: unit.facultyCode
        }));
      }
    }
  }, [preselectedUnitId, units]);
  
  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Fetch faculties from API
  const fetchFaculties = async () => {
    try {
      // Optional: Replace with actual API call if you have a faculties endpoint
      // const response = await apiGet<ApiResponse<Faculty[]>>('/faculties');
      // if (response.status === 'success' && response.data) {
      //   setFaculties(response.data);
      // }
      
      // Use mock faculties for now
      setFaculties([
        { id: '1', name: 'Science', code: 'sci', color: colors.primary },
        { id: '2', name: 'Arts', code: 'arts', color: colors.secondary },
        { id: '3', name: 'Business', code: 'bus', color: colors.tertiary },
        { id: '4', name: 'Engineering', code: 'eng', color: colors.quaternary },
        { id: '5', name: 'Medicine', code: 'med', color: '#06D6A0' }
      ]);
    } catch (err) {
      console.error('Error fetching faculties:', err);
      toast.error('Failed to load faculties');
    }
  };
  
  // Fetch units from API
  const fetchUnits = async () => {
    try {
      const response = await apiGet<ApiResponse<Unit[]>>('/units/');
      if (response.status === 'success' && response.data) {
        setUnits(response.data);
        setFilteredUnits(response.data);
      } else {
        toast.error('Failed to load units');
      }
    } catch (err) {
      console.error('Error fetching units:', err);
      toast.error('Failed to load units');
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    
    // Check file type
    if (uploadType === 'note' || uploadType === 'pastpaper') {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
    }
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB');
      return;
    }
    
    // Create preview URL for PDF
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
    
    // Extract title from filename if not set
    if (!formData.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setFormData(prev => ({ ...prev, title: fileName }));
    }
  };
  
  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If faculty changes, update faculty name as well
    if (name === 'facultyCode') {
      const faculty = faculties.find(f => f.code === value);
      if (faculty) {
        setFormData(prev => ({ ...prev, faculty: faculty.name }));
      }
    }
  };
  
  // Handle unit selection
  const handleUnitChange = (unitId: string) => {
    if (unitId === 'none') {
      setSelectedUnit(null);
      setFormData(prev => ({
        ...prev,
        unitId: '',
        unitName: '',
        unitCode: ''
      }));
      return;
    }
    
    const unit = units.find(u => u._id === unitId);
    if (unit) {
      setSelectedUnit(unit);
      setFormData(prev => ({
        ...prev,
        unitId: unit._id,
        unitName: unit.name,
        unitCode: unit.code,
        faculty: unit.faculty,
        facultyCode: unit.facultyCode
      }));
    } else {
      setSelectedUnit(null);
      setFormData(prev => ({
        ...prev,
        unitId: '',
        unitName: '',
        unitCode: ''
      }));
    }
  };
  
  // Add a category
  const handleAddCategory = () => {
    if (categoryInput.trim() && !formData.categories.includes(categoryInput.trim())) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, categoryInput.trim()]
      }));
      setCategoryInput('');
    }
  };
  
  // Remove a category
  const handleRemoveCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }));
  };
  
  // Handle category input keypress
  const handleCategoryKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };
  
  // Clear form data
  const clearForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'notes',
      faculty: '',
      facultyCode: '',
      unitId: '',
      unitName: '',
      unitCode: '',
      categories: [],
      author: user?.name || '',
      institution: '',
      source: '',
      published_at: new Date().toISOString().split('T')[0]
    });
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploadProgress(0);
    setUploadError(null);
  };
  
  // Trigger file input
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    if (!formData.facultyCode) {
      toast.error('Please select a faculty');
      return;
    }
    
    // Create form data for upload
    const uploadFormData = new FormData();
    uploadFormData.append('file', selectedFile);
    
    // Add metadata
    const metadata = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      faculty: formData.faculty,
      facultyCode: formData.facultyCode,
      unit_id: preselectedUnitId || undefined,
      unit_name: formData.unitName || undefined,
      unit_code: formData.unitCode || undefined,
      categories: formData.categories,
      author: formData.author,
      institution: formData.institution,
      source_name: formData.source,
      published_at: formData.published_at
    };
    
    uploadFormData.append('data', JSON.stringify(metadata));
    
    // Start upload
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) {
            return prev + 10;
          }
          return prev;
        });
      }, 500);
      
      // Make API call
      const endpoint = uploadType === 'note' ? '/notes/' : '/pastpapers/';
      const response = await apiUpload<ApiResponse<{ note_id?: string, paper_id?: string }>>(endpoint, uploadFormData);
      
      // Clear interval
      clearInterval(progressInterval);
      
      if (response.status === 'success') {
        setUploadProgress(100);
        
        // Success message
        toast.success(`${uploadType === 'note' ? 'Note' : 'Past paper'} uploaded successfully!`);
        
        // Redirect after short delay
        setTimeout(() => {
          if (uploadType === 'note' && response.data?.note_id) {
            navigate(`/notes/${response.data.note_id}`);
          } else if (uploadType === 'pastpaper' && response.data?.paper_id) {
            navigate(`/pastpapers/${response.data.paper_id}`);
          } else if (formData.unitId) {
            navigate(`/units/${formData.unitId}`);
          } else {
            navigate(uploadType === 'note' ? '/notes' : '/pastpapers');
          }
        }, 1500);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (err: any) {
      setUploadProgress(0);
      setUploadError(err.message || 'An error occurred during upload');
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Get color based on upload type
  const getTypeColor = () => {
    return uploadType === 'note' ? colors.secondary : colors.tertiary;
  };
  
  return (
    <MainLayout>
      <FadeIn>
        <div className="space-y-6">
          {/* Back Button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-4 border-2 transition-all flex items-center gap-1"
            onClick={() => navigate(-1)}
            style={{ borderColor: getTypeColor(), color: getTypeColor() }}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold title-font flex items-center gap-2" style={{ color: getTypeColor() }}>
              <FileUp className="w-6 h-6" /> Upload {uploadType === 'note' ? 'Study Notes' : 'Past Paper'}
            </h2>
            
            <Tabs value={uploadType} onValueChange={setUploadType} className="w-64">
              <TabsList className="w-full" style={{ backgroundColor: `${getTypeColor()}20` }}>
                <TabsTrigger 
                  value="note" 
                  className="data-[state=active]:text-white transition-all"
                  style={{ 
                    backgroundColor: "transparent",
                    "--tw-bg-opacity": "1",
                    "--secondary": colors.secondary,
                    "--tw-text-opacity": "1",
                    "--tw-white": colors.textPrimary,
                    "[data-state=active]:backgroundColor": colors.secondary
                  }}
                >
                  <BookOpen className="w-4 h-4 mr-2" /> Notes
                </TabsTrigger>
                <TabsTrigger 
                  value="pastpaper" 
                  className="data-[state=active]:text-white transition-all"
                  style={{ 
                    backgroundColor: "transparent",
                    "--tw-bg-opacity": "1",
                    "--secondary": colors.tertiary,
                    "--tw-text-opacity": "1",
                    "--tw-white": colors.textPrimary,
                    "[data-state=active]:backgroundColor": colors.tertiary
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" /> Past Paper
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Upload Instructions */}
          <Alert 
            className="border-2" 
            style={{ 
              backgroundColor: colors.surface, 
              borderColor: getTypeColor(),
              color: colors.textPrimary
            }}
          >
            <AlertTitle className="font-bold title-font flex items-center">
              <Info className="w-5 h-5 mr-2" style={{ color: getTypeColor() }} />
              Upload Guidelines
            </AlertTitle>
            <AlertDescription>
              {uploadType === 'note' ? (
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Upload your study notes, lecture summaries, or academic papers in PDF format</li>
                  <li>Maximum file size: 10MB</li>
                  <li>Make sure to associate your notes with the correct course unit</li>
                  <li>Add relevant tags to help others find your notes</li>
                </ul>
              ) : (
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Upload past exam papers, sample questions, or practice tests in PDF format</li>
                  <li>Maximum file size: 10MB</li>
                  <li>Specify the exam year and type (midterm, final, etc.)</li>
                  <li>Make sure to associate the paper with the correct course unit</li>
                </ul>
              )}
            </AlertDescription>
          </Alert>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Upload Section */}
              <Card style={{ backgroundColor: colors.surface }}>
                <CardHeader>
                  <CardTitle style={{ color: getTypeColor() }}>
                    Upload PDF File
                  </CardTitle>
                  <CardDescription>
                    Select a PDF file to upload
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className={`
                      border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                      hover:bg-gray-50 transition-colors flex flex-col items-center justify-center
                      ${selectedFile ? 'border-green-500' : `border-${getTypeColor()}`}
                    `}
                    style={{ 
                      borderColor: selectedFile ? '#10B981' : getTypeColor(),
                      minHeight: '200px'
                    }}
                    onClick={triggerFileInput}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept=".pdf" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                    
                    {selectedFile ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                          <Check className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="font-medium text-lg mb-1">{selectedFile.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PDF
                        </p>
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            if (previewUrl) {
                              URL.revokeObjectURL(previewUrl);
                              setPreviewUrl(null);
                            }
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                        >
                          Change File
                        </Button>
                      </>
                    ) : (
                      <>
                        <FileUp className="w-16 h-16 mb-4" style={{ color: getTypeColor() }} />
                        <h3 className="font-medium text-lg mb-1">Click to select a PDF file</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          or drag and drop a file here
                        </p>
                        <Badge style={{ backgroundColor: getTypeColor(), color: 'white' }}>
                          Max 10MB
                        </Badge>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Form Fields Section */}
              <Card style={{ backgroundColor: colors.surface }}>
                <CardHeader>
                  <CardTitle style={{ color: getTypeColor() }}>
                    Document Details
                  </CardTitle>
                  <CardDescription>
                    Provide information about your {uploadType === 'note' ? 'notes' : 'past paper'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input 
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder={`Enter a title for your ${uploadType === 'note' ? 'notes' : 'past paper'}`}
                      required
                      className="border-2"
                      style={{ borderColor: getTypeColor() }}
                    />
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Briefly describe the content"
                      className="border-2 min-h-[80px]"
                      style={{ borderColor: getTypeColor() }}
                    />
                  </div>
                  
                  {/* Type Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="type">
                      {uploadType === 'note' ? 'Note Type' : 'Exam Type'} *
                    </Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => handleSelectChange('type', value)}
                    >
                      <SelectTrigger 
                        className="border-2"
                        style={{ borderColor: getTypeColor() }}
                      >
                        <SelectValue placeholder={
                          uploadType === 'note' 
                            ? "Select note type"
                            : "Select exam type"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {uploadType === 'note' ? (
                          <>
                            <SelectItem value="notes">Study Notes</SelectItem>
                            <SelectItem value="academic">Academic Paper</SelectItem>
                            <SelectItem value="lecture">Lecture Notes</SelectItem>
                            <SelectItem value="summary">Summary</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="final">Final Exam</SelectItem>
                            <SelectItem value="midterm">Midterm Exam</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="sample">Sample Exam</SelectItem>
                            <SelectItem value="practice">Practice Questions</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Faculty Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="facultyCode">Faculty *</Label>
                    <Select 
                      value={formData.facultyCode} 
                      onValueChange={(value) => handleSelectChange('facultyCode', value)}
                    >
                      <SelectTrigger 
                        className="border-2"
                        style={{ borderColor: getTypeColor() }}
                      >
                        <SelectValue placeholder="Select faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map((faculty) => (
                          <SelectItem key={faculty.id} value={faculty.code}>
                            {faculty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Unit Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="unitId">Course Unit</Label>
                    <Select 
                      value={formData.unitId} 
                      onValueChange={handleUnitChange}
                    >
                      <SelectTrigger 
                        className="border-2"
                        style={{ borderColor: getTypeColor() }}
                      >
                        <SelectValue placeholder="Select course unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {filteredUnits.map((unit) => (
                          <SelectItem key={unit._id} value={unit._id}>
                            {unit.code} - {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Author (prefilled with user's name) */}
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input 
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      placeholder="Enter author name"
                      className="border-2"
                      style={{ borderColor: getTypeColor() }}
                    />
                  </div>
                  
                  {/* Additional fields based on type */}
                  {uploadType === 'note' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="source">Source</Label>
                        <Input 
                          id="source"
                          name="source"
                          value={formData.source}
                          onChange={handleInputChange}
                          placeholder="Enter source (e.g., textbook, journal)"
                          className="border-2"
                          style={{ borderColor: getTypeColor() }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="published_at">Date Published</Label>
                        <Input 
                          id="published_at"
                          name="published_at"
                          type="date"
                          value={formData.published_at}
                          onChange={handleInputChange}
                          className="border-2"
                          style={{ borderColor: getTypeColor() }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="published_at">Exam Date</Label>
                      <Input 
                        id="published_at"
                        name="published_at"
                        type="date"
                        value={formData.published_at}
                        onChange={handleInputChange}
                        className="border-2"
                        style={{ borderColor: getTypeColor() }}
                      />
                    </div>
                  )}
                  
                  {/* Institution */}
                  <div className="space-y-2">
                    <Label htmlFor="institution">Institution</Label>
                    <Input 
                      id="institution"
                      name="institution"
                      value={formData.institution}
                      onChange={handleInputChange}
                      placeholder="Enter institution name"
                      className="border-2"
                      style={{ borderColor: getTypeColor() }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Categories Section */}
            <Card style={{ backgroundColor: colors.surface }}>
              <CardHeader>
                <CardTitle style={{ color: getTypeColor() }}>
                  Categories & Tags
                </CardTitle>
                <CardDescription>
                  Add categories to help others find your {uploadType === 'note' ? 'notes' : 'past paper'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <div className="flex-grow">
                    <Input 
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      onKeyPress={handleCategoryKeyPress}
                      placeholder="Add a category (e.g., algorithms, midterm prep)"
                      className="border-2"
                      style={{ borderColor: getTypeColor() }}
                    />
                  </div>
                  <Button 
                    type="button"
                    onClick={handleAddCategory}
                    style={{ backgroundColor: getTypeColor(), color: 'white' }}
                  >
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {formData.categories.length === 0 ? (
                    <p className="text-sm text-gray-500">No categories added yet</p>
                  ) : (
                    formData.categories.map((category, index) => (
                      <Badge 
                        key={index}
                        className="flex items-center gap-1 px-3 py-1"
                        style={{ backgroundColor: getTypeColor(), color: 'white' }}
                      >
                        {category}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveCategory(category)}
                          className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Upload Progress */}
            {isUploading && (
              <Card style={{ backgroundColor: colors.surface }}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between mb-1">
                      <Label>Upload Progress</Label>
                      <span className="text-sm">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full h-2" style={{ 
                      backgroundColor: '#E2E8F0',
                      '& > div': { backgroundColor: getTypeColor() } 
                    }} />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Error Message */}
            {uploadError && (
              <Alert 
                className="border-2" 
                style={{ 
                  backgroundColor: colors.surface, 
                  borderColor: colors.primary,
                  color: colors.textPrimary
                }}
              >
                <AlertTitle className="font-bold title-font flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" style={{ color: colors.primary }} />
                  Upload Error
                </AlertTitle>
                <AlertDescription>
                  {uploadError}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Form Actions */}
            <div className="flex justify-between pt-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={clearForm}
                disabled={isUploading}
                style={{ borderColor: getTypeColor(), color: getTypeColor() }}
              >
                Clear Form
              </Button>
              
              <div className="flex space-x-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  disabled={isUploading}
                  style={{ borderColor: getTypeColor(), color: getTypeColor() }}
                >
                  Cancel
                </Button>
                
                <Button 
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  style={{ backgroundColor: getTypeColor(), color: 'white' }}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </FadeIn>
    </MainLayout>
  );
};

export default UploadPage;