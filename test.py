import requests
import json
import os
from pprint import pprint

BASE_URL = "http://localhost:5000/api"

class SyllaBuzzTester:
    def __init__(self):
        self.tokens = {
            'access': None,
            'refresh': None
        }
        self.current_user = None
        self.course_id = None
        self.unit_id = None
        self.question_id = None
        self.note_id = None
    
    def register_user(self, email, password, name, role='student'):
        """Register a new user"""
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                'email': email,
                'password': password,
                'name': name,
                'role': role
            }
        )
        
        print(f"Register user ({role}):")
        pprint(response.json())
        
        if response.status_code == 201:
            result = response.json()
            self.tokens = result.get('tokens', {})
            self.current_user = result.get('user', {})
            return True
        return False
    
    def login_user(self, email, password):
        """Login a user"""
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                'email': email,
                'password': password
            }
        )
        
        print("Login user:")
        pprint(response.json())
        
        if response.status_code == 200:
            result = response.json()
            self.tokens = result.get('tokens', {})
            self.current_user = result.get('user', {})
            return True
        return False
    
    def create_course(self, name, code, description):
        """Create a new course"""
        headers = {'Authorization': f"Bearer {self.tokens.get('access')}"}
        
        response = requests.post(
            f"{BASE_URL}/courses/",
            headers=headers,
            json={
                'name': name,
                'code': code,
                'description': description
            }
        )
        
        print("Create course:")
        pprint(response.json())
        
        if response.status_code == 201:
            result = response.json()
            self.course_id = result.get('course', {}).get('id')
            return True
        return False
    
    def create_unit(self, name, code, description):
        """Create a new unit"""
        if not self.course_id:
            print("No course ID available")
            return False
        
        headers = {'Authorization': f"Bearer {self.tokens.get('access')}"}
        
        response = requests.post(
            f"{BASE_URL}/units/course/{self.course_id}",
            headers=headers,
            json={
                'name': name,
                'code': code,
                'description': description
            }
        )
        
        print("Create unit:")
        pprint(response.json())
        
        if response.status_code == 201:
            result = response.json()
            self.unit_id = result.get('unit', {}).get('id')
            return True
        return False
    
    def upload_past_paper(self, file_path, paper_type='exam', year='2023'):
        """Upload a past paper"""
        if not self.unit_id:
            print("No unit ID available")
            return False
        
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            return False
        
        headers = {'Authorization': f"Bearer {self.tokens.get('access')}"}
        files = {'file': open(file_path, 'rb')}
        data = {'type': paper_type, 'year': year}
        
        response = requests.post(
            f"{BASE_URL}/units/{self.unit_id}/upload-past-paper",
            headers=headers,
            files=files,
            data=data
        )
        
        print("Upload past paper:")
        pprint(response.json())
        
        return response.status_code == 200
    
    def upload_notes(self, file_path, topic='General'):
        """Upload lecture notes"""
        if not self.unit_id:
            print("No unit ID available")
            return False
        
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            return False
        
        headers = {'Authorization': f"Bearer {self.tokens.get('access')}"}
        files = {'file': open(file_path, 'rb')}
        data = {'topic': topic}
        
        response = requests.post(
            f"{BASE_URL}/notes/unit/{self.unit_id}/upload",
            headers=headers,
            files=files,
            data=data
        )
        
        print("Upload notes:")
        pprint(response.json())
        
        return response.status_code == 200
    
if __name__ == "__main__":
    tester = SyllaBuzzTester()
    
    print("\n===== INSTRUCTOR WORKFLOW =====\n")
    
    instructor_email = "instructor@example.com"
    instructor_pass = "password123"
    
    if not tester.register_user(instructor_email, instructor_pass, "Test Instructor", "instructor"):
        tester.login_user(instructor_email, instructor_pass)
    
    tester.create_course("Computer Science", "CS101", "Introduction to Computer Science")
    tester.create_unit("Algorithms", "ALG101", "Introduction to Algorithms")
    
    past_paper_path = "sample_past_paper.pdf"
    notes_path = "sample_notes.pdf"
    
    if os.path.exists(past_paper_path):
        tester.upload_past_paper(past_paper_path)
    else:
        print(f"Sample past paper not found at {past_paper_path}")
    
    if os.path.exists(notes_path):
        tester.upload_notes(notes_path)
    else:
        print(f"Sample notes not found at {notes_path}")