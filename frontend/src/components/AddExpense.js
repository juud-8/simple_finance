import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useExpense } from '../context/ExpenseContext';
import { FiDollarSign, FiTag, FiFileText, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const AddExpense = () => {
  const navigate = useNavigate();
  const { categories, addExpense, loading } = useExpense();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    }
  });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      const expenseData = {
        amount: parseFloat(data.amount),
        category: data.category,
        description: data.description || null,
        date: new Date(data.date + 'T00:00:00').toISOString()
      };

      await addExpense(expenseData);
      
      setShowSuccess(true);
      reset();
      
      // Show success message and navigate back
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/');
      }, 1500);
      
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (showSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-success-50 border border-success-200 rounded-2xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-success-800 mb-2">
            Expense Added Successfully!
          </h2>
          <p className="text-success-600">
            Your expense has been recorded and your dashboard has been updated.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          Add New Expense
        </h2>
        <p className="text-secondary-600">
          Track your spending by adding expense details
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            <FiDollarSign className="inline w-4 h-4 mr-1" />
            Amount *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="form-input pl-12"
              {...register('amount', {
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' }
              })}
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400">
              $
            </div>
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-error-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Category Select */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            <FiTag className="inline w-4 h-4 mr-1" />
            Category *
          </label>
          <select
            className="form-select"
            {...register('category', { required: 'Category is required' })}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {getCategoryIcon(category.name)} {category.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-error-600">{errors.category.message}</p>
          )}
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            <FiFileText className="inline w-4 h-4 mr-1" />
            Description (Optional)
          </label>
          <textarea
            rows="3"
            placeholder="What did you spend on?"
            className="form-input resize-none"
            {...register('description')}
          />
        </div>

        {/* Date Input */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            className="form-input"
            {...register('date', { required: 'Date is required' })}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-error-600">{errors.date.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary"
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.1 }}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="loading-spinner mr-2"></div>
              Adding Expense...
            </div>
          ) : (
            'Add Expense'
          )}
        </motion.button>
      </motion.form>

      {/* Category Cards for Quick Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8"
      >
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Quick Category Selection
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {categories.slice(0, 6).map((category) => (
            <motion.button
              key={category.id}
              type="button"
              onClick={() => {
                // This will be handled by the form
                const categorySelect = document.querySelector('select[name="category"]');
                categorySelect.value = category.name;
                categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
              }}
              className="p-4 bg-white/70 backdrop-blur-sm rounded-xl card-shadow hover:card-shadow-hover transition-all duration-200 flex flex-col items-center space-y-2"
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl">{getCategoryIcon(category.name)}</span>
              <span className="text-sm font-medium text-secondary-700">{category.name}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AddExpense;