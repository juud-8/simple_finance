import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExpense } from '../context/ExpenseContext';
import { formatCurrency, formatDate, getRelativeDate, groupExpensesByDate } from '../utils/dateUtils';
import { FiTrash2, FiFilter, FiCalendar, FiDollarSign } from 'react-icons/fi';

const ExpenseItem = ({ expense, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getCategoryIcon = (categoryName) => {
    const icons = {
      'Food': '🍔',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Bills': '💡',
      'Healthcare': '🏥',
      'Other': '📝'
    };
    return icons[categoryName] || '📝';
  };

  const getCategoryColor = (categoryName) => {
    const colors = {
      'Food': 'bg-red-100 text-red-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Shopping': 'bg-green-100 text-green-800',
      'Bills': 'bg-yellow-100 text-yellow-800',
      'Healthcare': 'bg-pink-100 text-pink-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[categoryName] || 'bg-gray-100 text-gray-800';
  };

  const handleDelete = async () => {
    try {
      await onDelete(expense.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white/70 backdrop-blur-sm rounded-xl p-4 card-shadow hover:card-shadow-hover transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center">
              <span className="text-lg">{getCategoryIcon(expense.category)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                  {expense.category}
                </span>
              </div>
              {expense.description && (
                <p className="text-sm text-secondary-600 truncate">{expense.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-lg font-semibold text-secondary-900">
                {formatCurrency(expense.amount)}
              </p>
              <p className="text-xs text-secondary-500">
                {formatDate(expense.date)}
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-error-500 hover:bg-error-50 rounded-lg transition-colors duration-200"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Delete Expense
              </h3>
              <p className="text-secondary-600 mb-6">
                Are you sure you want to delete this expense? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-error-500 text-white rounded-lg hover:bg-error-600 transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const ExpenseGroup = ({ group, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="mb-6"
  >
    <div className="flex items-center justify-between mb-3 px-1">
      <h3 className="text-lg font-semibold text-secondary-900">
        {getRelativeDate(group.date)}
      </h3>
      <span className="text-sm font-medium text-secondary-600">
        {formatCurrency(group.total)}
      </span>
    </div>
    <div className="space-y-3">
      <AnimatePresence>
        {group.expenses.map((expense) => (
          <ExpenseItem
            key={expense.id}
            expense={expense}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  </motion.div>
);

const ExpenseList = () => {
  const { expenses, categories, loading, deleteExpense, loadExpenses } = useExpense();
  const [filter, setFilter] = useState('all');
  const [filteredExpenses, setFilteredExpenses] = useState([]);

  useEffect(() => {
    // Load more expenses when component mounts
    loadExpenses({ limit: 100 });
  }, [loadExpenses]);

  useEffect(() => {
    let filtered = expenses;
    
    if (filter !== 'all') {
      filtered = expenses.filter(expense => expense.category === filter);
    }
    
    setFilteredExpenses(filtered);
  }, [expenses, filter]);

  const handleDeleteExpense = async (expenseId) => {
    await deleteExpense(expenseId);
  };

  const groupedExpenses = groupExpensesByDate(filteredExpenses);
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">
              Expense History
            </h2>
            <p className="text-secondary-600">
              View and manage your expenses
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-secondary-600">Total</p>
            <p className="text-xl font-bold text-secondary-900">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2 mb-4">
          <FiFilter className="w-4 h-4 text-secondary-600" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-select text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="loading-spinner mr-2"></div>
          <span className="text-secondary-600">Loading expenses...</span>
        </div>
      ) : groupedExpenses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiDollarSign className="w-8 h-8 text-secondary-400" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            No Expenses Found
          </h3>
          <p className="text-secondary-600 mb-4">
            {filter === 'all' 
              ? "You haven't added any expenses yet. Start tracking your spending!" 
              : `No expenses found for ${filter} category.`}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {groupedExpenses.map((group, index) => (
            <ExpenseGroup
              key={`${group.date}-${index}`}
              group={group}
              onDelete={handleDeleteExpense}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpenseList;