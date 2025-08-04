'use client';

import React, { useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from './ui/dialog';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { pastPaperService, PastPaperUnit } from '@/services/pastpaper-service';
import toast from 'react-hot-toast';

interface PastPaperUploadDialogProps {
  units: PastPaperUnit[];
  onUploadSuccess: () => void;
  triggerButton?: React.ReactNode;
}

export const PastPaperUploadDialog: React.FC<PastPaperUploadDialogProps> = ({
  units,
  onUploadSuccess,
  triggerButton
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    unit_id: '',
    year: '',
    semester: '',
    exam_type: '',
    stream: 'Regular',
    difficulty: '',
    instructions: '',
    topics: ''
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  
  const examTypes = ['Final', 'Midterm', 'Quiz', 'Assignment', 'CAT', 'Sample'];
  const semesters = ['First', 'Second', 'Summer'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const streams = ['Regular', 'Weekend', 'Distance Learning'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setError('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
      setError('');
      
      // Auto-generate title from filename if empty
      if (!formData.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({ ...prev, title: nameWithoutExt }));
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!formData.unit_id || !formData.year || !formData.exam_type) {
      setError('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('unit_id', formData.unit_id);
      uploadFormData.append('year', formData.year);
      uploadFormData.append('semester', formData.semester);
      uploadFormData.append('exam_type', formData.exam_type);
      uploadFormData.append('stream', formData.stream);
      uploadFormData.append('difficulty', formData.difficulty);
      
      if (formData.instructions) {
        uploadFormData.append('instructions', JSON.stringify(formData.instructions.split('\n').filter(i => i.trim())));
      }
      
      if (formData.topics) {
        uploadFormData.append('topics', JSON.stringify(formData.topics.split(',').map(t => t.trim()).filter(t => t)));
      }

      const result = await pastPaperService.uploadPastPaper(
        uploadFormData,
        (progress) => setUploadProgress(progress)
      );

      if (result.success) {
        toast.success('Past paper uploaded successfully!');
        onUploadSuccess();
        setIsOpen(false);
        resetForm();
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload past paper. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      unit_id: '',
      year: '',
      semester: '',
      exam_type: '',
      stream: 'Regular',
      difficulty: '',
      instructions: '',
      topics: ''
    });
    setSelectedFile(null);
    setError('');
  };

  const handleClose = () => {
    if (!isUploading) {
      setIsOpen(false);
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Past Paper
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Upload Past Paper
          </DialogTitle>
          <DialogDescription>
            Upload a new past examination paper
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">PDF File *</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={isUploading}
              required
            />
            {selectedFile && (
              <p className="text-sm text-green-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., CS202 Final Exam 2023"
              disabled={isUploading}
              required
            />
          </div>

          {/* Unit Selection */}
          <div className="space-y-2">
            <Label>Unit *</Label>
            <Select
              value={formData.unit_id}
              onValueChange={(value) => handleInputChange('unit_id', value)}
              disabled={isUploading}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit._id} value={unit._id}>
                    {unit.code} - {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year and Exam Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Year *</Label>
              <Select
                value={formData.year}
                onValueChange={(value) => handleInputChange('year', value)}
                disabled={isUploading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Exam Type *</Label>
              <Select
                value={formData.exam_type}
                onValueChange={(value) => handleInputChange('exam_type', value)}
                disabled={isUploading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Semester and Stream */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select
                value={formData.semester}
                onValueChange={(value) => handleInputChange('semester', value)}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stream</Label>
              <Select
                value={formData.stream}
                onValueChange={(value) => handleInputChange('stream', value)}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Stream" />
                </SelectTrigger>
                <SelectContent>
                  {streams.map((stream) => (
                    <SelectItem key={stream} value={stream}>
                      {stream}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value) => handleInputChange('difficulty', value)}
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {difficulty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Topics */}
          <div className="space-y-2">
            <Label htmlFor="topics">Topics (comma-separated)</Label>
            <Input
              id="topics"
              value={formData.topics}
              onChange={(e) => handleInputChange('topics', e.target.value)}
              placeholder="e.g., Algorithms, Data Structures, Sorting"
              disabled={isUploading}
            />
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions (one per line)</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => handleInputChange('instructions', e.target.value)}
              placeholder="Answer all questions&#10;Time allowed: 3 hours&#10;Use of calculators is not permitted"
              disabled={isUploading}
              rows={3}
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PastPaperUploadDialog;