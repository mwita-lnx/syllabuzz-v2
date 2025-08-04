'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

// Import layout
import { MainLayout } from '@/components/MainLayout';

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [faculty, setFaculty] = useState('');
  const [type, setType] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const isValidType = file.type === 'application/pdf' || 
                         file.type.startsWith('image/') ||
                         file.type === 'application/msword' ||
                         file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValidType) {
        toast.error(`${file.name}: Unsupported file type`);
        return false;
      }
      
      if (!isValidSize) {
        toast.error(`${file.name}: File size too large (max 50MB)`);
        return false;
      }
      
      return true;
    });

    const uploadFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      progress: 0,
      status: 'uploading' as const
    }));

    setFiles(prev => [...prev, ...uploadFiles]);

    // Simulate upload process
    uploadFiles.forEach(uploadFile => {
      simulateUpload(uploadFile);
    });
  };

  const simulateUpload = (uploadFile: UploadedFile) => {
    const interval = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id === uploadFile.id) {
          const newProgress = Math.min(f.progress + Math.random() * 30, 100);
          const isCompleted = newProgress >= 100;
          
          return {
            ...f,
            progress: newProgress,
            status: isCompleted ? 'completed' : 'uploading'
          };
        }
        return f;
      }));
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, progress: 100, status: 'completed' }
          : f
      ));
    }, 3000 + Math.random() * 2000);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    if (!title.trim() || !description.trim() || !unitCode || !faculty || !type) {
      toast.error('Please fill in all required fields');
      return;
    }

    const completedFiles = files.filter(f => f.status === 'completed');
    if (completedFiles.length === 0) {
      toast.error('Please wait for files to finish uploading');
      return;
    }

    setIsUploading(true);

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Materials uploaded successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setUnitCode('');
      setFaculty('');
      setType('');
      setFiles([]);
      
      // Redirect to success page or back to home
      router.push('/');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload materials. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Upload Academic Materials</h1>
          <p className="text-gray-600">
            Share notes, papers, and resources with the academic community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>
                Support for PDF, Word documents, and images. Maximum 50MB per file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    Drop files here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, DOC, DOCX, and image files up to 50MB
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Uploaded Files List */}
              {files.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium text-gray-900">Uploaded Files</h4>
                  {files.map((uploadFile) => (
                    <div key={uploadFile.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {uploadFile.file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Badge 
                            variant={
                              uploadFile.status === 'completed' ? 'default' :
                              uploadFile.status === 'error' ? 'destructive' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {uploadFile.status === 'completed' ? 'Completed' :
                             uploadFile.status === 'error' ? 'Error' : 'Uploading'}
                          </Badge>
                        </div>
                        {uploadFile.status === 'uploading' && (
                          <Progress value={uploadFile.progress} className="mt-2 h-1" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadFile.status === 'completed' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {uploadFile.status === 'error' && (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata Form */}
          <Card>
            <CardHeader>
              <CardTitle>Material Information</CardTitle>
              <CardDescription>
                Provide details about the academic material you're uploading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Algorithms Notes"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitCode">Unit Code *</Label>
                  <Input
                    id="unitCode"
                    placeholder="e.g., CS101"
                    value={unitCode}
                    onChange={(e) => setUnitCode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the content and what students can expect to learn..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="faculty">Faculty *</Label>
                  <Select value={faculty} onValueChange={setFaculty} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="arts">Arts</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="medicine">Medicine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Material Type *</Label>
                  <Select value={type} onValueChange={setType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notes">Lecture Notes</SelectItem>
                      <SelectItem value="academic">Academic Paper</SelectItem>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="exam">Past Exam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Upload Guidelines</AlertTitle>
            <AlertDescription>
              Please ensure your materials are original or properly attributed. Do not upload copyrighted content without permission.
              All uploads are subject to review and may be removed if they violate our terms of service.
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || files.length === 0}
            >
              {isUploading ? 'Uploading...' : 'Upload Materials'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}