// pastpaperService.ts
import axios from 'axios';

// Types for past papers
export interface PastPaperQuestion {
  id: string;
  question_number: string;
  text: string;
  marks: number;
  compulsory?: boolean;
  subquestions?: PastPaperSubQuestion[];
}

export interface PastPaperSubQuestion {
  id: string;
  text: string;
  marks: number;
  subparts?: PastPaperSubPart[];
}

export interface PastPaperSubPart {
  id: string;
  text: string;
  marks: number;
}

export interface PastPaper {
  _id: string;
  title: string;
  unit_id: string;
  unit_name?: string;
  unit_code?: string;
  year: string;
  exam_type: string;
  semester: string;
  stream: string;
  date: string;
  time: string;
  session: string;
  file_path?: string;
  instructions?: string[];
  questions?: PastPaperQuestion[];
  sections?: PastPaperSection[];
  created_at: string;
  updated_at: string;
  faculty?: string;
  faculty_code?: string;
  difficulty?: string;
  total_marks?: number;
  total_questions?: number;
  total_sections?: number;
  topics?: string[];
  average_score?: number | null;
}


export interface PastPaperSection {
  section: string;
  title?: string;
  total_marks: number;
  instructions?: string[];
  questions: PastPaperQuestion[];
}

export interface PastPaperUnit {
  _id: string;
  name: string;
  code: string;
  course_id: string;
  description?: string;
}

// Service for past paper operations
class PastPaperService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  // Get all past papers (with optional filtering)
  async getAllPastPapers(filters?: {
    unit_id?: string;
    unit_code?: string;
    faculty_code?: string;
    year?: string;
    semester?: string;
    exam_type?: string;
    difficulty?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ pastpapers: PastPaper[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await axios.get(`${this.baseUrl}/pastpapers?${params.toString()}`);
      return {
        pastpapers: response.data.data.map((paper: any) => ({
          _id: paper.id,
          title: paper.title,
          unit_id: paper.unit_id,
          unit_name: paper.unit_name,
          unit_code: paper.unit_code,
          year: paper.year,
          exam_type: paper.exam_type,
          semester: paper.semester,
          stream: paper.stream || 'Regular',
          date: paper.created_at,
          time: paper.time || '',
          session: paper.session || '',
          file_path: paper.file_path,
          created_at: paper.created_at,
          updated_at: paper.updated_at || paper.created_at,
          faculty: paper.faculty,
          faculty_code: paper.faculty_code,
          difficulty: paper.difficulty,
          total_questions: paper.total_questions,
          total_marks: paper.total_marks,
          average_score: paper.average_score,
          topics: paper.topics || []
        })),
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching past papers:', error);
      return { pastpapers: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    }
  }

  // Get all past papers for a specific unit
  async getUnitPastPapers(unitId: string): Promise<PastPaper[]> {
    try {
      const result = await this.getAllPastPapers({ unit_id: unitId });
      return result.pastpapers;
    } catch (error) {
      console.error('Error fetching unit past papers:', error);
      return [];
    }
  }

  // Get details of a specific past paper
  async getPastPaper(paperId: string): Promise<PastPaper | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/pastpapers/${paperId}`);
      const paper = response.data.data;
      return {
        _id: paper.id,
        title: paper.title,
        unit_id: paper.unit_id,
        unit_name: paper.unit_name,
        unit_code: paper.unit_code,
        year: paper.year,
        exam_type: paper.exam_type,
        semester: paper.semester,
        stream: paper.stream || 'Regular',
        date: paper.created_at,
        time: paper.time || '',
        session: paper.session || '',
        file_path: paper.file_path,
        created_at: paper.created_at,
        updated_at: paper.updated_at || paper.created_at,
        faculty: paper.faculty,
        faculty_code: paper.faculty_code,
        difficulty: paper.difficulty,
        total_questions: paper.total_questions,
        total_marks: paper.total_marks,
        average_score: paper.average_score,
        topics: paper.topics || [],
        instructions: paper.instructions || [],
        questions: paper.questions || [],
        sections: paper.sections || []
      };
    } catch (error) {
      console.error('Error fetching past paper details:', error);
      return null;
    }
  }

  // Download past paper file
  async downloadPastPaper(paperId: string): Promise<Blob | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/pastpapers/${paperId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading past paper:', error);
      return null;
    }
  }

  // Upload a new past paper
  async uploadPastPaper(
    formData: FormData,
    onProgress?: (percentage: number) => void
  ): Promise<{ success: boolean; message: string; pastpaper_id?: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/pastpapers/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentage);
            }
          }
        }
      );
      
      return {
        success: true,
        message: response.data.message || 'Past paper uploaded successfully',
        pastpaper_id: response.data.data?.id || response.data.pastpaper_id
      };
    } catch (error: any) {
      console.error('Error uploading past paper:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Error uploading past paper'
      };
    }
  }

  // Create a new past paper
  async createPastPaper(paperData: Omit<PastPaper, '_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string; pastpaper?: PastPaper }> {
    try {
      const response = await axios.post(`${this.baseUrl}/pastpapers`, paperData);
      
      return {
        success: true,
        message: 'Past paper created successfully',
        pastpaper: response.data.data
      };
    } catch (error: any) {
      console.error('Error creating past paper:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Error creating past paper'
      };
    }
  }

  // Update a past paper
  async updatePastPaper(paperId: string, paperData: Partial<PastPaper>): Promise<{ success: boolean; message: string; pastpaper?: PastPaper }> {
    try {
      const response = await axios.put(`${this.baseUrl}/pastpapers/${paperId}`, paperData);
      
      return {
        success: true,
        message: 'Past paper updated successfully',
        pastpaper: response.data.data
      };
    } catch (error: any) {
      console.error('Error updating past paper:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Error updating past paper'
      };
    }
  }

  // Get all units with past papers
  async getUnitsWithPastPapers(): Promise<PastPaperUnit[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/units`);
      return response.data.data?.map((unit: any) => ({
        _id: unit.id || unit._id,
        name: unit.name,
        code: unit.code,
        course_id: unit.course_id,
        description: unit.description
      })) || [];
    } catch (error) {
      console.error('Error fetching units with past papers:', error);
      return [];
    }
  }

  // Search past papers
  async searchPastPapers(query: string): Promise<PastPaper[]> {
    try {
      const result = await this.getAllPastPapers({ search: query });
      return result.pastpapers;
    } catch (error) {
      console.error('Error searching past papers:', error);
      return [];
    }
  }

  // Filter past papers by year, semester, or exam type
  async filterPastPapers(
    filters: { 
      unit_id?: string; 
      year?: string; 
      semester?: string; 
      exam_type?: string;
      difficulty?: string;
      faculty_code?: string;
    }
  ): Promise<PastPaper[]> {
    try {
      const result = await this.getAllPastPapers(filters);
      return result.pastpapers;
    } catch (error) {
      console.error('Error filtering past papers:', error);
      return [];
    }
  }

  // Delete a past paper
  async deletePastPaper(paperId: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/pastpapers/${paperId}`);
      return true;
    } catch (error) {
      console.error('Error deleting past paper:', error);
      return false;
    }
  }

  // Add questions to a past paper
  async addQuestion(
    paperId: string,
    questionData: Omit<PastPaperQuestion, 'id'>
  ): Promise<{ success: boolean; question_id?: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/pastpapers/${paperId}/questions`, questionData);
      
      return {
        success: true,
        question_id: response.data.question_id
      };
    } catch (error) {
      console.error('Error adding question:', error);
      return { success: false };
    }
  }

  // Export past paper to JSON
  async exportToJson(paperId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/pastpapers/generate-json/${paperId}`);
      return response.data;
    } catch (error) {
      console.error('Error exporting past paper to JSON:', error);
      return null;
    }
  }
}

export const pastPaperService = new PastPaperService();
export default pastPaperService;