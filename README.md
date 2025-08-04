# 🎓 SyllaBuzz - AI-Powered University Learning Platform

SyllaBuzz is a comprehensive, AI-powered learning platform for universities that combines course management, semantic content analysis, and collaborative study tools. The system uses advanced NLP and machine learning techniques to enhance the educational experience for both students and educators.

## ✨ Core Features

### 📚 **Academic Content Management**
- **Course & Unit Organization**: Structured curriculum management across faculties
- **Smart PDF Processing**: AI-powered extraction and analysis of academic documents
- **Semantic Search**: Find related content using advanced vector similarity search
- **Note Linking**: Intelligent connections between questions and relevant study materials

### 🤖 **AI-Powered Analysis**
- **Question Extraction**: Automatically extract questions from past papers and exams
- **Content Similarity**: Group similar questions and identify frequently tested concepts
- **Semantic Embeddings**: Using `sentence-transformers/all-MiniLM-L6-v2` for content understanding
- **Smart Recommendations**: AI-driven content suggestions based on user behavior

### 👥 **Collaborative Study Tools**
- **Real-time Revision Rooms**: Live collaborative study sessions with chat and polls
- **Progress Tracking**: Monitor individual and group study progress
- **Resource Sharing**: Share and discuss academic materials in real-time
- **Study Timers**: Coordinated study sessions with timer functionality

### 🔐 **Security & User Management**
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Role-based Access**: Different permissions for students, instructors, and administrators
- **Rate Limiting**: Protection against abuse with intelligent rate limiting
- **Data Validation**: Comprehensive input validation and sanitization

## 🏗️ System Architecture

SyllaBuzz uses a modern microservices architecture with three main components:

### 🎨 **Frontend (React + TypeScript)**
- **Modern React 19** with TypeScript for type safety
- **Tailwind CSS + Radix UI** for responsive, accessible design
- **Real-time Communication** via Socket.io
- **State Management** with React Context and custom hooks
- **Error Boundaries** for graceful error handling

### 🔧 **Backend Services**

#### **Node.js/Express Service** (Real-time & Collaboration)
- **Socket.io** for real-time features (chat, polls, live updates)
- **MongoDB** integration for revision rooms and messages
- **JWT Authentication** middleware
- **Rate limiting** and security middleware

#### **Python/Flask Service** (AI & Content Processing)
- **Flask API** for content processing and analysis
- **MongoDB** for document storage and retrieval
- **Qdrant Vector Database** for semantic search capabilities
- **PyMuPDF** for PDF text extraction and processing
- **Sentence Transformers** for generating semantic embeddings

### 🗄️ **Data Layer**
- **MongoDB**: Primary database for structured data
- **Qdrant**: Vector database for semantic search
- **Redis**: Caching and session management
- **File Storage**: Secure file upload and management

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
