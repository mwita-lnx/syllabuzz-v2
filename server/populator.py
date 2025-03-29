#!/usr/bin/env python
# comp311_paper_populator.py

import os
import sys
import json
from datetime import datetime
from bson import ObjectId
import random

# Add the application directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the Flask application and models
from app import create_app, mongo

app = create_app()

from app.models.unit import Unit
from app.models.pastpaper import PastPaper, Question
from app.models.course import Course
from app.models.user import User

# Define COMP 311 course information
comp311_info = {
    "code": "COMP 311",
    "name": "Design and Analysis of Algorithms",
    "description": "Study of algorithm design paradigms and complexity analysis"
}

# Sample papers for COMP 311 (based on PDF documents provided)
comp311_papers = [
    {
        "title": "End of Semester Examination",
        "year": "2020/2021",
        "exam_type": "Regular",
        "semester": "Second",
        "stream": "Y3/S1",
        "date": "2021-05-21",
        "time": "11:30-1:30",
        "session": "JAN. - APRIL",
        "instructions": [
            "Answer Question 1 and any other two questions in the answer booklet provided.",
            "Do not write on your question papers. All rough work should be done in your answer booklet.",
            "Clearly indicate which question you are answering.",
            "Write neatly and legibly.",
            "Edit your work for language and grammar errors.",
            "Follow all the instructions in the answer booklet"
        ]
    },
    {
        "title": "First Semester Examination",
        "year": "2018/2019",
        "exam_type": "Regular",
        "semester": "First",
        "stream": "Y3S2",
        "date": "2019-04-15",
        "time": "2:00-4:00",
        "session": "APRIL",
        "instructions": [
            "Instructions to candidates: Answer QUESTION ONE and any other TWO questions"
        ]
    },
    {
        "title": "First Semester Examination",
        "year": "2023/2024",
        "exam_type": "Regular",
        "semester": "First",
        "stream": "Y3S1",
        "date": "2024-03-28",
        "time": "4:00-6:00PM",
        "session": "JAN.-APRIL",
        "venue": "CONVOCATION HALL DOOR 1",
        "instructions": [
            "Answer Question 1 and any other two questions in the answer booklet provided.",
            "Do not write on your question papers. All rough work should be done in your answer booklet.",
            "Clearly indicate which question you are answering.",
            "Write neatly and legibly.",
            "Edit your work for language and grammar errors.",
            "Follow all the instructions in the answer booklet"
        ]
    }
]

# Actual questions from the 2020/2021 paper
comp311_2020_questions = [
    {
        "question_number": "1",
        "marks": 30,
        "compulsory": True,
        "text": "Algorithm Analysis and Complexity",
        "subquestions": [
            {
                "id": "a",
                "text": "Suppose a manager gives a task to two of his employees to design an algorithm in Python that calculates the factorial of a number entered by the user. The algorithm developed by the first employee looks like this: [iterative factorial algorithm]. Similarly, the second employee also developed an algorithm that calculates factorial of a number as follows [recursive factorial algorithm].\n(i) Explain the techniques used by the two algorithms.\n(ii) The manager has to decide which algorithm to use. To do so, he has to find the complexity of the algorithm. One way to do this is by finding the time required to execute the algorithms, explain how this can be achieved in python programming.\n(iii) Which algorithm gives the optimal solution, explain.\n(iv) Explain why algorithm analysis is important.",
                "marks": 12
            },
            {
                "id": "b",
                "text": "Identify and explain the following flavor of Big O algorithm [constant_algo function]",
                "marks": 2
            },
            {
                "id": "c",
                "text": "Huffman algorithm is a lossless data compression algorithm that is used to compress data. Find the root node for the Huffman data. (i) Find the Huffman codes for the characters. (ii) Find the average code per character.",
                "marks": 8
            },
            {
                "id": "d",
                "text": "Usually, when someone asks you about the complexity of the algorithm, he is asking you about the worst-case complexity. Study the algorithm below and explain its complexity.",
                "marks": 3
            },
            {
                "id": "e",
                "text": "Using Dijkstra algorithm find the shortest path from A-D, represent your solution in a tabular format.",
                "marks": 5
            }
        ]
    },
    {
        "question_number": "2",
        "marks": 20,
        "text": "Dynamic Programming and Divide & Conquer",
        "subquestions": [
            {
                "id": "a",
                "text": "A mountain climber faces a dynamic programming problem, there are 7 items to be packed for climbing the mountain, The bag is initially empty and can hold a maximum of 24 kg weight, show how the climber will maximize the value of the item using heuristic greedy by profit, by weight and profit density. (ii) Are the algorithms used above optimal, Support your answer.",
                "marks": 10
            },
            {
                "id": "b",
                "text": "Using divide and conquer algorithm method, perform the Merge-Sort algorithm on the below set of data. Show your step by step workings: 31 24 23 26 14 15 7 27",
                "marks": 6
            },
            {
                "id": "c",
                "text": "Develop an algorithm that takes as input an array, and returns the array with all the duplicate elements removed. For example, if the input array is {1,3,3,2,4,2}, the algorithm returns a sorted data i.e {1,3,2,4}",
                "marks": 4
            }
        ]
    },
    {
        "question_number": "3",
        "marks": 20,
        "text": "Graph Algorithms and Network Design",
        "subquestions": [
            {
                "id": "a",
                "text": "A network engineer is faced with a task of connecting houses in a neighborhood with fiber optic, the houses are spanned as below, design an algorithm that will connect all the houses without repeating any house.",
                "marks": 6
            },
            {
                "id": "b",
                "text": "By use of Job Sequencing in Algorithmic analysis, let us consider a set of given jobs as shown in the following table, which has the deadline priorities indicated and the attached profit value of the job. You are required to find a sequence of jobs, which will be completed within their deadlines and will give maximum profit. Ensure to clearly stipulate your workings at each stage.",
                "marks": 4
            },
            {
                "id": "c",
                "text": "Discuss any THREE properties of shortest path algorithms.",
                "marks": 3
            },
            {
                "id": "d",
                "text": "Explain the difference between optimal substructure and overlapping subproblem.",
                "marks": 3
            },
            {
                "id": "e",
                "text": "Uber, a taxi business company uses an algorithm to find the closest cars to customer location, in your own opinion explain how the algorithm identifies the closest vehicle, what algorithm techniques do you think is suitable for this scenario.",
                "marks": 4
            }
        ]
    }
]

# Questions from the 2018/2019 paper
comp311_2018_questions = [
    {
        "question_number": "1",
        "marks": 30,
        "compulsory": True,
        "text": "Algorithm Design and Analysis Fundamentals",
        "subquestions": [
            {
                "id": "a",
                "text": "State and explain any three techniques of designing algorithms (give examples in each case).",
                "marks": 6
            },
            {
                "id": "b",
                "text": "An algorithm is a clearly specified set of simple instructions to be followed to solve a problem. Briefly explain any three mathematical definitions for analyzing Algorithm.",
                "marks": 6
            },
            {
                "id": "c",
                "text": "State and explain the time complexity of the code fragments below:\n(i) algorithm alg1 with nested loops\n(ii) Sub algorithm calculating sum.",
                "marks": 4
            },
            {
                "id": "3",
                "text": "Design the recursive Euclid algorithm and analyze it Time complexity.",
                "marks": 4
            },
            {
                "id": "4",
                "text": "List and explain the criteria of evaluating a search algorithm e.g. BFS.",
                "marks": 5
            },
            {
                "id": "5",
                "text": "Design Quick Sort algorithm and state it's running time complexity, how does Quick sort utilize Divide and conquer strategy?",
                "marks": 5
            }
        ]
    },
    {
        "question_number": "2",
        "marks": 20,
        "text": "Searching and Sorting Algorithms",
        "subquestions": [
            {
                "id": "a",
                "text": "Design Binary Search algorithm.",
                "marks": 3
            },
            {
                "id": "b",
                "text": "Explain any three problems that can be solved using Greedy algorithm technique.",
                "marks": 4
            },
            {
                "id": "c",
                "text": "Explain when a decision can be termed as NP hard problem.",
                "marks": 2
            },
            {
                "id": "d",
                "text": "Use the following array {22,45,12,8,10,10,6,72,81,32,30,18,50,14} to explain the concepts behind the following sorting techniques, and determine their worst case complexities:\n(i) bubble sort\n(ii) Selection Sort\n(iii) Counting sort\n(iv) Bucket sort",
                "marks": 8
            },
            {
                "id": "e",
                "text": "Explain any two reasons why we study algorithms performance.",
                "marks": 3
            }
        ]
    },
    {
        "question_number": "3",
        "marks": 20,
        "text": "Algorithm Implementation and Analysis",
        "subquestions": [
            {
                "id": "a",
                "text": "Write an algorithm that will accept the marks in a test for a group of 25 students then calculate and display the average mark.",
                "marks": 4
            },
            {
                "id": "b",
                "text": "Discuss the advantages of using a flow chart.",
                "marks": 4
            },
            {
                "id": "c",
                "text": "State the difference between:\n(i) testing and debugging\n(ii) syntax error and logic error\n(iii) logic error and run-time error",
                "marks": 6
            },
            {
                "id": "d",
                "text": "Explain any two advantages of Divide and Conquer algorithm.",
                "marks": 2
            },
            {
                "id": "e",
                "text": "Explain the order of growth of the following:\n(i) 4n^3 + n^2 +2n\n(ii) 5n^2 + 3n + 2log n",
                "marks": 4
            }
        ]
    }
]

# Questions from the 2023/2024 paper
comp311_2024_questions = [
    {
        "question_number": "1",
        "marks": 30,
        "compulsory": True,
        "text": "Algorithm Design and Applications",
        "subquestions": [
            {
                "id": "a",
                "text": "Create a time table schedule algorithm for a school, using some constraints that are generally divided in two categories (Sanity Checks and Preferences).",
                "marks": 6
            },
            {
                "id": "b",
                "text": "Using an example describe asymptotic notations.",
                "marks": 4
            },
            {
                "id": "c",
                "text": "Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.",
                "marks": 4
            },
            {
                "id": "d",
                "text": "There are many algorithms that are used in everyday life, including linear processes that follow a specific set of steps. Smart cities for example have been trying to implement algorithm to manage service delivery, List and explain FOUR smart city algorithm application areas.",
                "marks": 8
            },
            {
                "id": "e",
                "text": "Usually, when someone asks you about the complexity of the algorithm, it's about worst-case complexity. Study the algorithm below and explain its output and complexity.",
                "marks": 3
            },
            {
                "id": "f",
                "text": "Using Dijkstra algorithm find the shortest path from A-F, represent your solution in a tabular format.",
                "marks": 5
            }
        ]
    },
    {
        "question_number": "2",
        "marks": 20,
        "text": "Algorithm Correctness and Design Techniques",
        "subquestions": [
            {
                "id": "a",
                "text": "An algorithm is totally correct if it receives valid input, terminates, and always returns the correct output, Explain using examples how the following proving methods operates:\n(i) Induction\n(ii) Counterexample\n(iii) Loop invariant",
                "marks": 12
            },
            {
                "id": "b",
                "text": "An algorithm design technique is a general approach to solving problems algorithmically that is applicable to a variety of problems from different areas of computing. Algorithms lie at the heart of computing. If we observe our surroundings, we can find several algorithms working to solve our daily life problems. Using real world applications, discuss the following algorithms:\n(i) Divide and conquer\n(ii) Dynamic programming",
                "marks": 8
            }
        ]
    },
    {
        "question_number": "3",
        "marks": 20,
        "text": "Binary Search Trees and Graph Algorithms",
        "subquestions": [
            {
                "id": "a",
                "text": "Consider the four elements a1<a2<a3 with q0 = 1/8, q1 =3/16, q2= 1/16, q3 =1/16 and p1 = 1/4, p2 1/8, p3 =1/16. Construct the optimal binary search tree for the given set of identifiers.",
                "marks": 6
            },
            {
                "id": "b",
                "text": "Study the following algorithm and then answer the questions that follows:\n(i) Explain the objective of the algorithm\n(ii) Explain the algorithm design technique used\n(iii) Is the algorithm optimized, explain",
                "marks": 9
            },
            {
                "id": "c",
                "text": "Using examples compare the following:\n(i) Kruskal's and Prims algorithm\n(ii) Divide and conquer and Brute force",
                "marks": 8
            },
            {
                "id": "d",
                "text": "Explain the difference between optimal substructure and overlapping sub problem.",
                "marks": 3
            }
        ]
    }
]

def create_dummy_file(filename):
    """Create a dummy PDF file path for testing"""
    return filename

def create_instructor_if_needed():
    """Create a test instructor if none exists"""
    with app.app_context():
        instructor = User.collection.find_one({"role": "instructor"})
        if not instructor:
            instructor_id = ObjectId()
            User.collection.insert_one({
                "_id": instructor_id,
                "username": "algorithm_instructor",
                "email": "algorithm.instructor@kabarak.ac.ke",
                "password_hash": "dummy_hash",  # In a real app, this would be hashed
                "role": "instructor",
                "created_at": datetime.utcnow()
            })
            return str(instructor_id)
        return str(instructor["_id"])

def populate_comp311_database():
    """Populate the database with COMP 311 course, unit, past papers, and questions"""
    with app.app_context():
        # Create an instructor
        instructor_id = create_instructor_if_needed()
        
        # Get or create course
        course = Course.collection.find_one({"code": "CS100"})
        if not course:
            course_result = Course.collection.insert_one({
                "name": "Bachelor of Science in Computer Science",
                "code": "CS100",
                "description": "Computer Science degree program covering theoretical and practical aspects of computing",
                "instructor_id": ObjectId(instructor_id),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            course_id = course_result.inserted_id
        else:
            course_id = course["_id"]
            
        # Get or create unit
        unit = Unit.collection.find_one({"code": comp311_info["code"]})
        if not unit:
            unit_result = Unit.collection.insert_one({
                "name": comp311_info["name"],
                "code": comp311_info["code"],
                "description": comp311_info["description"],
                "course_id": ObjectId(course_id),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            unit_id = unit_result.inserted_id
        else:
            unit_id = unit["_id"]
        
        # Create past papers for COMP 311
        # 2020/2021 paper
        create_past_paper(unit_id, instructor_id, comp311_papers[0], comp311_2020_questions)
        
        # 2018/2019 paper
        create_past_paper(unit_id, instructor_id, comp311_papers[1], comp311_2018_questions)
        
        # 2023/2024 paper
        create_past_paper(unit_id, instructor_id, comp311_papers[2], comp311_2024_questions)

def create_past_paper(unit_id, instructor_id, paper_info, questions):
    """Create a past paper with its questions"""
    with app.app_context():
        # Check if paper already exists
        existing_paper = PastPaper.collection.find_one({
            "unit_id": unit_id,
            "year": paper_info["year"],
            "exam_type": paper_info["exam_type"],
            "semester": paper_info["semester"]
        })
        
        if existing_paper:
            print(f"Past paper already exists for {paper_info['year']} {paper_info['semester']}")
            return
        
        # Create dummy file
        filename = f"{comp311_info['code']}_{paper_info['exam_type']}_{paper_info['year']}.pdf"
        filepath = create_dummy_file(filename)
        
        # Create past paper
        pastpaper = PastPaper.create(
            unit_id=str(unit_id),
            title=paper_info["title"],
            year=paper_info["year"],
            exam_type=paper_info["exam_type"],
            semester=paper_info["semester"],
            stream=paper_info["stream"],
            date=paper_info["date"],
            time=paper_info["time"],
            session=paper_info["session"],
            instructor_id=instructor_id,
            instructions=paper_info["instructions"],
            questions=questions,
            file_path=filename,
            # venue=paper_info.get("venue", "Main Campus")
        )
        
        print(f"Created past paper: {paper_info['title']} for {paper_info['year']} {paper_info['semester']}")
        
        # Create individual questions
        for question in questions:
            question_obj = Question.create_from_pastpaper(
                unit_id=str(unit_id),
                question_text=question["text"],
                question_number=question["question_number"],
                marks=question["marks"],
                subquestions=question.get("subquestions"),
                year=paper_info["year"],
                exam_type=paper_info["exam_type"],
                pastpaper_id=str(pastpaper["_id"]),
                section=None  # Can add section if needed
            )
            
            print(f"Added question {question['question_number']} to past paper")

if __name__ == "__main__":
    print("Starting COMP 311 database population...")
    populate_comp311_database()
    print("Database population completed for COMP 311!")