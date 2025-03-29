// src/pages/home/components/WelcomeCard.tsx
import React from 'react';
import { User } from '../../../types';

interface WelcomeCardProps {
  user: User;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ user }) => {
  // Get current time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome to SyllaBuzz - your learning resource hub for university courses.
          </p>
        </div>
        <div className="hidden md:block w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-indigo-600">
            {new Date().toLocaleDateString('en-US', { month: 'short' })}
          </div>
          <div className="text-xs text-gray-500">Month</div>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-indigo-600">
            {new Date().getDate()}
          </div>
          <div className="text-xs text-gray-500">Day</div>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-indigo-600">
            {/* This would typically come from your database */}
            5
          </div>
          <div className="text-xs text-gray-500">Courses</div>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-indigo-600">
            {/* This would typically come from your database */}
            25
          </div>
          <div className="text-xs text-gray-500">Questions</div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;