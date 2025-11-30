import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

interface LoadingScreenProps {
  progress: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative w-64 h-32 mb-8 flex justify-center items-center">
        {/* Flying Document Animation */}
        <motion.div
          animate={{
            x: [-50, 50, -50],
            y: [0, -20, 0],
            rotate: [-5, 5, -5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <FileText size={80} className="text-blue-500" />
        </motion.div>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Processing Document...</h2>
      
      {/* Progress Bar */}
      <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700 shadow-inner">
        <motion.div
          className="h-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">{progress}% Complete</p>
    </div>
  );
};

export default LoadingScreen;
