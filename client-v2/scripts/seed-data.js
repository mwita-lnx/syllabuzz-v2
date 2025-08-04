#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

// Sample data
const sampleCourses = [
  {
    name: 'Computer Science',
    code: 'CS',
    description: 'Bachelor of Computer Science program'
  },
  {
    name: 'Business Administration',
    code: 'BBA',
    description: 'Bachelor of Business Administration program'
  }
];

const sampleUnits = [
  {
    name: 'Data Structures and Algorithms',
    code: 'CS202',
    course_code: 'CS',
    description: 'Advanced data structures and algorithm analysis',
    credits: 3
  },
  {
    name: 'Introduction to Marketing',
    code: 'MKT101',
    course_code: 'BBA',
    description: 'Fundamentals of marketing principles and practices',
    credits: 3
  },
  {
    name: 'Database Systems',
    code: 'CS301',
    course_code: 'CS',
    description: 'Design and implementation of database systems',
    credits: 4
  }
];

const samplePastPapers = [
  {
    title: 'Data Structures & Algorithms Final Exam',
    unit_code: 'CS202',
    unit_name: 'Data Structures and Algorithms',
    year: '2023',
    exam_type: 'Final',
    semester: 'First',
    faculty_code: 'sci',
    faculty: 'Science',
    difficulty: 'Medium',
    topics: ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Sorting'],
    instructions: [
      'Answer ALL questions',
      'All questions carry equal marks',
      'Time allowed: 3 hours',
      'Use of calculators is not permitted'
    ]
  },
  {
    title: 'Introduction to Marketing Midterm',
    unit_code: 'MKT101',
    unit_name: 'Introduction to Marketing',
    year: '2023',
    exam_type: 'Midterm',
    semester: 'First',
    faculty_code: 'bus',
    faculty: 'Business',
    difficulty: 'Easy',
    topics: ['Marketing Principles', 'Consumer Behavior', 'Market Research'],
    instructions: [
      'Answer ANY THREE questions',
      'Each question carries 20 marks',
      'Time allowed: 2 hours'
    ]
  },
  {
    title: 'Database Systems CAT 1',
    unit_code: 'CS301',
    unit_name: 'Database Systems',
    year: '2024',
    exam_type: 'CAT',
    semester: 'Second',
    faculty_code: 'sci',
    faculty: 'Science',
    difficulty: 'Hard',
    topics: ['ER Modeling', 'Normalization', 'SQL Queries'],
    instructions: [
      'Answer ALL questions',
      'Time allowed: 1 hour',
      'No external materials allowed'
    ]
  }
];

async function createCourse(course) {
  try {
    const response = await axios.post(`${API_BASE_URL}/courses`, course);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
      console.log(`Course ${course.code} already exists, skipping...`);
      return null;
    }
    throw error;
  }
}

async function createUnit(unit) {
  try {
    const response = await axios.post(`${API_BASE_URL}/units`, unit);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
      console.log(`Unit ${unit.code} already exists, skipping...`);
      return null;
    }
    throw error;
  }
}

async function createPastPaper(paper) {
  try {
    // First get the unit ID
    const unitsResponse = await axios.get(`${API_BASE_URL}/units`);
    const units = unitsResponse.data.units || unitsResponse.data.data || [];
    const unit = units.find(u => u.code === paper.unit_code);
    
    if (!unit) {
      console.error(`Unit ${paper.unit_code} not found, skipping past paper: ${paper.title}`);
      return null;
    }
    
    const paperData = {
      ...paper,
      unit_id: unit.id || unit._id
    };
    
    const response = await axios.post(`${API_BASE_URL}/pastpapers`, paperData);
    return response.data;
  } catch (error) {
    console.error(`Error creating past paper ${paper.title}:`, error.response?.data || error.message);
    return null;
  }
}

async function seedData() {
  console.log('🌱 Seeding SyllaBuzz with sample data...');
  console.log('=' .repeat(50));
  
  try {
    // Create courses
    console.log('📚 Creating courses...');
    for (const course of sampleCourses) {
      const result = await createCourse(course);
      if (result) {
        console.log(`  ✅ Created course: ${course.name} (${course.code})`);
      }
    }
    
    // Create units
    console.log('\n📖 Creating units...');
    for (const unit of sampleUnits) {
      const result = await createUnit(unit);
      if (result) {
        console.log(`  ✅ Created unit: ${unit.name} (${unit.code})`);
      }
    }
    
    // Create past papers
    console.log('\n📄 Creating past papers...');
    for (const paper of samplePastPapers) {
      const result = await createPastPaper(paper);
      if (result) {
        console.log(`  ✅ Created past paper: ${paper.title}`);
      }
    }
    
    console.log('\n🎉 Data seeding completed successfully!');
    
    // Display summary
    const [coursesResponse, unitsResponse, papersResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/courses`),
      axios.get(`${API_BASE_URL}/units`),
      axios.get(`${API_BASE_URL}/pastpapers`)
    ]);
    
    const coursesCount = coursesResponse.data.courses?.length || coursesResponse.data.data?.length || 0;
    const unitsCount = unitsResponse.data.units?.length || unitsResponse.data.data?.length || 0;
    const papersCount = papersResponse.data.data?.length || 0;
    
    console.log('\n📊 Current database summary:');
    console.log(`  Courses: ${coursesCount}`);
    console.log(`  Units: ${unitsCount}`);
    console.log(`  Past Papers: ${papersCount}`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the seeder
seedData().catch(console.error);