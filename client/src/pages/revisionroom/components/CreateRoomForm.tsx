import React, { useState } from 'react';
import {
  Input, Textarea, Button, Alert, AlertTitle, AlertDescription,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui';
import roomService from '@/services/room-service';
import { getUser } from '@/services/api-backend';
import { RevisionRoom } from '@/types/index3';

interface CreateRoomFormProps {
  onCancel: () => void;
  onSuccess: (room: RevisionRoom) => void;
  faculties: any[];
  colors: any;
}

export const CreateRoomForm: React.FC<CreateRoomFormProps> = ({ 
  onCancel, 
  onSuccess,
  faculties,
  colors
}) => {
  const currentUser = getUser();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit_id: '',
    unit_code: '',
    faculty_code: '',
    topic: '',
    tags: [] as string[]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFacultyChange = (value: string) => {
    setFormData(prev => ({ ...prev, faculty_code: value }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags: tagsArray }));
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.unit_id || !formData.unit_code || !formData.topic) {
        setError('Name, unit ID, unit code, and topic are required');
        return;
      }

      setIsSubmitting(true);
      
      const response = await roomService.createRoom({
        name: formData.name,
        description: formData.description,
        unit_id: formData.unit_id,
        unit_code: formData.unit_code,
        faculty_code: formData.faculty_code,
        topic: formData.topic,
        tags: formData.tags,
        user_name: currentUser?.name
      });
      
      if (response.success && response.data) {
        onSuccess(response.data);
      } else {
        setError(response.error || 'Failed to create room');
      }
    } catch (err) {
      console.error('Error creating room:', err);
      setError('An error occurred while creating the room');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">Room Name*</label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="e.g., DSA Final Exam Study Group"
          required
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe what this study room is for..."
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="unit_code" className="block text-sm font-medium mb-1">Unit Code*</label>
          <Input
            id="unit_code"
            name="unit_code"
            value={formData.unit_code}
            onChange={handleInputChange}
            placeholder="e.g., CS202"
            required
          />
        </div>
        
        <div>
          <label htmlFor="faculty_code" className="block text-sm font-medium mb-1">Faculty</label>
          <Select 
            onValueChange={handleFacultyChange}
            value={formData.faculty_code}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Faculty" />
            </SelectTrigger>
            <SelectContent>
              {faculties.map(faculty => (
                <SelectItem key={faculty.id} value={faculty.code}>{faculty.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <label htmlFor="topic" className="block text-sm font-medium mb-1">Topic*</label>
        <Input
          id="topic"
          name="topic"
          value={formData.topic}
          onChange={handleInputChange}
          placeholder="e.g., Final Exam Preparation"
          required
        />
      </div>
      
      <div>
        <label htmlFor="unit_id" className="block text-sm font-medium mb-1">Unit ID*</label>
        <Input
          id="unit_id"
          name="unit_id"
          value={formData.unit_id}
          onChange={handleInputChange}
          placeholder="e.g., CS202-S1-2023"
          required
        />
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
        <Input
          id="tags"
          name="tags"
          value={formData.tags.join(', ')}
          onChange={handleTagsChange}
          placeholder="e.g., DSA, Algorithms, Sorting"
        />
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2 mt-6">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          style={{ backgroundColor: colors.tertiary, color: colors.textPrimary }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Room'}
        </Button>
      </div>
    </div>
  );
};