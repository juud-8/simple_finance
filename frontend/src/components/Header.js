import React from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign } from 'react-icons/fi';

const Header = () => {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 safe-area-top"
    >
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gradient">Finance Tracker</h1>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;