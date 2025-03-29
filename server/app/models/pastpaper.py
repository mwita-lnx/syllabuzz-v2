# app/models/pastpaper.py
from datetime import datetime
from bson import ObjectId
from app import mongo

class PastPaper:
    collection = mongo.db.pastpapers
    
    @staticmethod
    def create(unit_id, title, year, exam_type, semester=None, stream=None, 
               instructor_id=None, date=None, time=None, session=None,
               paper_format=None, instructions=None, sections=None, questions=None, file_path=None):
        """
        Create a new past paper record
        
        Args:
            unit_id: ID of the unit this paper belongs to
            title: Title of the past paper (e.g., "End of Semester Exam")
            year: Academic year (e.g., "2020/2021")
            exam_type: Type of exam (e.g., "Regular", "Supplementary", "CAT")
            semester: Semester (e.g., "First", "Second")
            instructor_id: ID of the instructor who uploaded the paper
            paper_format: Optional format details (e.g., time, date, instructions)
            instructions: List of exam instructions
            sections: Structured sections of the exam
            questions: List of questions (alternatively to sections)
            file_path: Path to the uploaded PDF file
            
        Returns:
            The created past paper document
        """
        pastpaper = {
            'unit_id': ObjectId(unit_id),
            'title': title,
            'year': year,
            'exam_type': exam_type,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'file_path': file_path
        }
        
        # Add exam detail fields
        if semester:
            pastpaper['semester'] = semester
        if stream:
            pastpaper['stream'] = stream
        if date:
            pastpaper['date'] = date
        if time:
            pastpaper['time'] = time
        if session:
            pastpaper['session'] = session
        
        # Add optional fields if provided
        if semester:
            pastpaper['semester'] = semester
        if instructor_id:
            pastpaper['instructor_id'] = ObjectId(instructor_id)
        if paper_format:
            pastpaper['format'] = paper_format
        if instructions:
            pastpaper['instructions'] = instructions
        if sections:
            pastpaper['sections'] = sections
        if questions:
            pastpaper['questions'] = questions
        
        result = PastPaper.collection.insert_one(pastpaper)
        pastpaper['_id'] = result.inserted_id
        return pastpaper
    
    @staticmethod
    def get_by_id(pastpaper_id):
        """Get past paper by ID"""
        return PastPaper.collection.find_one({'_id': ObjectId(pastpaper_id)})
    
    @staticmethod
    def get_unit_papers(unit_id):
        """Get all past papers for a unit"""
        return list(PastPaper.collection.find({'unit_id': ObjectId(unit_id)}))
    
    @staticmethod
    def get_papers_by_year(unit_id, year):
        """Get all past papers for a unit in a specific year"""
        return list(PastPaper.collection.find({
            'unit_id': ObjectId(unit_id),
            'year': year
        }))
    
    @staticmethod
    def add_question(pastpaper_id, question_data):
        """Add a question to a past paper"""
        question_data['created_at'] = datetime.utcnow()
        
        result = PastPaper.collection.update_one(
            {'_id': ObjectId(pastpaper_id)},
            {
                '$push': {'questions': question_data},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        return result.modified_count > 0
    
    @staticmethod
    def update_section(pastpaper_id, section_index, section_data):
        """Update a section in a past paper"""
        update_key = f'sections.{section_index}'
        
        result = PastPaper.collection.update_one(
            {'_id': ObjectId(pastpaper_id)},
            {
                '$set': {
                    update_key: section_data,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0
    
    @staticmethod
    def add_section(pastpaper_id, section_data):
        """Add a section to a past paper"""
        section_data['created_at'] = datetime.utcnow()
        
        result = PastPaper.collection.update_one(
            {'_id': ObjectId(pastpaper_id)},
            {
                '$push': {'sections': section_data},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        return result.modified_count > 0
    
    @staticmethod
    def delete(pastpaper_id):
        """Delete a past paper"""
        result = PastPaper.collection.delete_one({'_id': ObjectId(pastpaper_id)})
        return result.deleted_count > 0

class Question:
    collection = mongo.db.questions
    
    @staticmethod
    def create_from_pastpaper(unit_id, question_text, question_number, marks, 
                             subquestions=None, year=None, exam_type=None, 
                             pastpaper_id=None, section=None):
        """
        Create a question extracted from a past paper
        
        Args:
            unit_id: ID of the unit this question belongs to
            question_text: The main text of the question
            question_number: The number/identifier of the question
            marks: Total marks for the question
            subquestions: List of subquestions (optional)
            year: Year of the past paper
            exam_type: Type of exam
            pastpaper_id: Reference to the past paper
            section: Section identifier (e.g., 'A', 'B')
            
        Returns:
            The created question document
        """
        question = {
            'unit_id': ObjectId(unit_id),
            'text': question_text,
            'question_number': question_number,
            'marks': marks,
            'source_type': 'pastpaper',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Add optional fields if provided
        if subquestions:
            question['subquestions'] = subquestions
        if year:
            question['year'] = year
        if exam_type:
            question['exam_type'] = exam_type
        if pastpaper_id:
            question['pastpaper_id'] = ObjectId(pastpaper_id)
        if section:
            question['section'] = section
        
        result = Question.collection.insert_one(question)
        question['_id'] = result.inserted_id
        return question
    
    @staticmethod
    def get_unit_questions(unit_id):
        """Get all questions for a unit"""
        return list(Question.collection.find({'unit_id': ObjectId(unit_id)}))
    
    @staticmethod
    def get_pastpaper_questions(pastpaper_id):
        """Get all questions from a specific past paper"""
        return list(Question.collection.find({'pastpaper_id': ObjectId(pastpaper_id)}))
    
    @staticmethod
    def update(question_id, update_data):
        """Update a question"""
        update_data['updated_at'] = datetime.utcnow()
        
        result = Question.collection.update_one(
            {'_id': ObjectId(question_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0