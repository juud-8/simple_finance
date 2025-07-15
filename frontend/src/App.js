import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import AddExpense from './components/AddExpense';
import ExpenseList from './components/ExpenseList';
import Navigation from './components/Navigation';
import Header from './components/Header';
import { ExpenseProvider } from './context/ExpenseContext';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="loading-spinner mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gradient">Finance Tracker</h2>
          <p className="text-secondary-600 mt-2">Loading your financial data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <ExpenseProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
          <Header />
          
          <main className="pb-20 pt-16">
            <AnimatePresence mode="wait">
              <Routes>
                <Route
                  path="/"
                  element={
                    <motion.div
                      key="dashboard"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Dashboard />
                    </motion.div>
                  }
                />
                <Route
                  path="/add"
                  element={
                    <motion.div
                      key="add"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <AddExpense />
                    </motion.div>
                  }
                />
                <Route
                  path="/expenses"
                  element={
                    <motion.div
                      key="expenses"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ExpenseList />
                    </motion.div>
                  }
                />
              </Routes>
            </AnimatePresence>
          </main>

          <Navigation />
        </div>
      </Router>
    </ExpenseProvider>
  );
}

export default App;