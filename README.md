# SyllaBuzz - University Course Management System

SyllaBuzz is a comprehensive application for universities to manage courses, units, continuous assessment tests (CATs), and exams. The system uses NLP and embedding techniques to extract questions from past papers, group similar questions, and link them to relevant sections in lecture notes.

## Core Features

1. **Course and Unit Management**: Organize university curriculum by courses and units
2. **Past Paper Analysis**: Extract questions from past exam papers and CATs using NLP
3. **Semantic Search**: Find related questions and notes using sentence transformer embeddings
4. **Question Grouping**: Identify similar questions that have appeared in multiple examss
5. **Note Linking**: Connect questions to relevant sections in lecture notes
6. **Search Functionality**: Semantic search across questions and notes

## System Architecture

### Backend (Flask + MongoDB)

- **Flask API**: RESTful API for all operations
- **MongoDB**: NoSQL database for storing courses, units, questions, and notes
- **JWT Authentication**: Secure authentication for students and instructors

### NLP Components

- **Sentence Transformers**: For creating embeddings (`sentence-transformers/all-MiniLM-L6-v2`)
- **PDF Extraction**: Extract structured content from PDFs (PyMuPDF)
- **Question Processing**: Analyze and group similar questions
- **Note Processing**: Extract sections from lecture notes and link to questions

### Frontend (React - Not Implemented Yet)

The frontend will be implemented as a React application that consumes the APIs provided by the backend.

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Set up MongoDB:
   - Install MongoDB
   - Create a database called `syllabuzz`

4. Configure environment variables:
   ```
   export MONGO_URI="mongodb://localhost:27017/syllabuzz"
   export SECRET_KEY="your-secret-key"
   export JWT_SECRET_KEY="your-jwt-secret-key"
   ```

5. Run the application:
   ```
   python run.py
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user (student or instructor)
- `POST /api/auth/login`: Log in an existing user
- `POST /api/auth/refresh`: Refresh access token
- `GET /api/auth/me`: Get current user information

### Courses

- `GET /api/courses/`: Get all courses
- `GET /api/courses/<course_id>`: Get a specific course with its units
- `POST /api/courses/`: Create a new course (instructors only)
- `PUT /api/courses/<course_id>`: Update a course (instructors only)
- `DELETE /api/courses/<course_id>`: Delete a course (instructors only)

### Units

- `GET /api/units/course/<course_id>`: Get all units for a course
- `GET /api/units/<unit_id>`: Get a specific unit with its questions and notes
- `POST /api/units/course/<course_id>`: Create a new unit (instructors only)
- `PUT /api/units/<unit_id>`: Update a unit (instructors only)
- `DELETE /api/units/<unit_id>`: Delete a unit (instructors only)
- `POST /api/units/<unit_id>/upload-past-paper`: Upload and process a past paper (instructors only)

### Questions

- `GET /api/questions/unit/<unit_id>`: Get all questions for a unit (with filtering options)
- `GET /api/questions/<question_id>/similar`: Get questions similar to a specific question
- `GET /api/questions/<question_id>/highlights`: Get highlighted note sections related to a question
- `GET /api/questions/unit/<unit_id>/frequent`: Get frequently appearing questions
- `POST /api/questions/search`: Search for questions using semantic similarity
- `DELETE /api/questions/<question_id>`: Delete a question (instructors only)
- `POST /api/questions/analyze`: Analyze a question for topics and difficulty

### Notes

- `GET /api/notes/unit/<unit_id>`: Get all notes for a unit (with filtering options)
- `GET /api/notes/<note_id>`: Get a specific note
- `GET /api/notes/unit/<unit_id>/topics`: Get all topics covered in a unit's notes
- `POST /api/notes/unit/<unit_id>/upload`: Upload and process lecture notes (instructors only)
- `PUT /api/notes/<note_id>`: Update a note (instructors only)
- `DELETE /api/notes/<note_id>`: Delete a note (instructors only)
- `POST /api/notes/search`: Search for notes using semantic similarity

## Workflow Examples

### Instructor Workflow

1. Register/login as an instructor
2. Create a new course
3. Add units to the course
4. Upload past papers for each unit (system extracts questions)
5. Upload lecture notes for each unit (system extracts sections)
6. Review automatically linked questions and notes

### Student Workflow

1. Register/login as a student
2. Browse available courses and units
3. View questions from past papers
4. Search for specific topics or questions
5. View frequently asked questions
6. For any question, view related notes sections

## Using Embeddings for Semantic Search

The application uses sentence-transformers to create vector embeddings for questions and note sections. These embeddings capture the semantic meaning of the text, enabling similarity comparisons that go beyond simple keyword matching.

Key benefits:
- Find similar questions even when wording is different
- Connect questions to relevant notes based on meaning
- Group related questions to identify frequently tested concepts

## Future Enhancements

1. **React Frontend**: Implement a user-friendly frontend interface
2. **Advanced NLP Features**: Incorporate more advanced NLP techniques for better extraction
3. **AI-Generated Practice Questions**: Generate new practice questions based on patterns
4. **Analytics Dashboard**: Provide insights into frequently tested topics
5. **Mobile App**: Develop a companion mobile application

## Technical Implementation Notes

- The system uses cosine similarity for comparing embeddings
- Questions are grouped when similarity exceeds a threshold (default 0.85)
- PDF extraction uses a combination of regex patterns and NLP techniques
- MongoDB is used for its flexibility with embedding vectors and nested data

## Requirements

See `requirements.txt` for a full list of dependencies.
