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
  private baseUrl = 'http://127.0.0.1:5000/api';

  // Get all past papers for a specific unit
  async getUnitPastPapers(unitId: string): Promise<PastPaper[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/pastpapers/unit/${unitId}`);
      return response.data.pastpapers;
    } catch (error) {
      console.error('Error fetching past papers:', error);
      return [];
    }
  }

  // Get details of a specific past paper
  async getPastPaper(paperId: string): Promise<PastPaper | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/pastpapers/${paperId}`);
      return response.data.pastpaper;
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
    unitId: string,
    formData: FormData,
    onProgress?: (percentage: number) => void
  ): Promise<{ success: boolean; message: string; pastpaper_id?: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/pastpapers/unit/${unitId}/upload`,
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
        message: response.data.message,
        pastpaper_id: response.data.pastpaper_id
      };
    } catch (error: any) {
      console.error('Error uploading past paper:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Error uploading past paper'
      };
    }
  }

  // Get all units with past papers
  async getUnitsWithPastPapers(): Promise<PastPaperUnit[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/pastpapers/units`);
      return response.data.units;
    } catch (error) {
      console.error('Error fetching units with past papers:', error);
      return [];
    }
  }

  // Search past papers
  async searchPastPapers(query: string): Promise<PastPaper[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/pastpapers/search?q=${encodeURIComponent(query)}`);
      return response.data.pastpapers;
    } catch (error) {
      console.error('Error searching past papers:', error);
      return [];
    }
  }

  // Filter past papers by year, semester, or exam type
  async filterPastPapers(
    unitId: string,
    filters: { year?: string; semester?: string; exam_type?: string }
  ): Promise<PastPaper[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.year) queryParams.append('year', filters.year);
      if (filters.semester) queryParams.append('semester', filters.semester);
      if (filters.exam_type) queryParams.append('exam_type', filters.exam_type);
      
      const response = await axios.get(
        `${this.baseUrl}/pastpapers/unit/${unitId}/filter?${queryParams.toString()}`
      );
      
      return response.data.pastpapers;
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