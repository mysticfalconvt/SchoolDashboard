import React from 'react';

const QueryLoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="relative w-16 h-16 mb-4">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
        
        {/* Inner pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Animated dots */}
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Processing your question...
      </p>
    </div>
  );
};

export default QueryLoadingSpinner;

