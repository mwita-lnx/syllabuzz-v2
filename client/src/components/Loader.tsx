// src/components/Loader.tsx
import React from 'react';
import { BookOpen } from 'lucide-react';

interface LoaderProps {
  fullScreen?: boolean;
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ 
  fullScreen = true, 
  message = 'Loading...' 
}) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <div className="flex flex-col items-center">
          <div className="animate-bounce bg-indigo-600 p-4 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-indigo-600 mb-2">SyllaBuzz</h1>
          <p className="text-gray-500">{message}</p>
          <div className="mt-4 relative w-64 h-4 bg-gray-200 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-indigo-600 animate-pulse rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p className="ml-2 text-gray-500">{message}</p>
    </div>
  );
};

export default Loader;