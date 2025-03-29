// src/components/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  FileText, 
  Layers, 
  Star, 
  ChevronRight, 
  ChevronLeft, 
  X,
  Upload
} from 'lucide-react';
import { User } from '../types';
import { getCourses } from '../services/course-service';
import { Course } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  user: User;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, user }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesExpanded, setCoursesExpanded] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesData = await getCourses();
        setCourses(coursesData);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    
    fetchCourses();
  }, []);

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="h-6 w-6 text-indigo-600" />
              <span className="ml-2 text-lg font-semibold text-indigo-600">SyllaBuzz</span>
            </div>
            <button
              onClick={toggleSidebar}
              className="md:hidden p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md ${
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Home className="h-5 w-5 mr-3" />
              <span>Dashboard</span>
            </NavLink>
            
            {/* Courses Section */}
            <div>
              <button
                onClick={() => setCoursesExpanded(!coursesExpanded)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                  location.pathname.includes('/courses') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <Layers className="h-5 w-5 mr-3" />
                  <span>Courses</span>
                </div>
                {coursesExpanded ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {coursesExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  <NavLink
                    to="/courses"
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-md ${
                        isActive && location.pathname === "/courses" ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <span>All Courses</span>
                  </NavLink>
                  
                  {courses.map(course => (
                    <NavLink
                      key={course._id}
                      to={`/courses/${course._id}/units`}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 rounded-md ${
                          isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
                        }`
                      }
                    >
                      <span className="truncate">{course.code}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
            
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md ${
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Star className="h-5 w-5 mr-3" />
              <span>Frequent Questions</span>
            </NavLink>
            
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md ${
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <FileText className="h-5 w-5 mr-3" />
              <span>Notes</span>
            </NavLink>
            
            {/* Upload Section (Only for instructors) */}
            {user.role === 'instructor' && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Instructor Tools
                </h3>
                <div className="mt-2 space-y-1">
                  <NavLink
                    to="/upload"
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-md ${
                        isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <Upload className="h-5 w-5 mr-3" />
                    <span>Upload Materials</span>
                  </NavLink>
                </div>
              </div>
            )}
          </nav>
          
          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
            © {new Date().getFullYear()} SyllaBuzz
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;