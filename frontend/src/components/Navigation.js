import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiPlus, FiList } from 'react-icons/fi';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, path: '/' },
    { id: 'add', label: 'Add', icon: FiPlus, path: '/add' },
    { id: 'expenses', label: 'Expenses', icon: FiList, path: '/expenses' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <motion.nav 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-gray-200 safe-area-bottom bounce-in"
    >
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`nav-item btn-touch focus-outline ${isActive ? 'active' : ''}`}
                tabIndex={0}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.1 }}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 700, damping: 25 }}
                    />
                  )}
                </div>
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;