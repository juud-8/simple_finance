import React from 'react';
import { motion } from 'framer-motion';
import { useExpense } from '../context/ExpenseContext';
import { formatCurrency } from '../utils/dateUtils';
import { FiTrendingUp, FiCalendar, FiDollarSign } from 'react-icons/fi';

const SummaryCard = ({ title, amount, count, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-right">
        <p className="text-sm text-secondary-600 font-medium">{title}</p>
        <p className="text-xs text-secondary-500">{count} expenses</p>
      </div>
    </div>
    <div className="flex items-center">
      <span className="text-2xl font-bold text-secondary-900">
        {formatCurrency(amount)}
      </span>
    </div>
  </motion.div>
);

const TopCategoryItem = ({ category, amount, count, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay }}
    className="flex items-center justify-between py-3 px-4 bg-white/50 rounded-xl"
  >
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center">
        <span className="text-white text-sm font-medium">{category.charAt(0).toUpperCase()}</span>
      </div>
      <div>
        <p className="font-medium text-secondary-900">{category}</p>
        <p className="text-xs text-secondary-500">{count} expenses</p>
      </div>
    </div>
    <span className="font-semibold text-secondary-900">{formatCurrency(amount)}</span>
  </motion.div>
);

const Dashboard = () => {
  const { summaries, loading, error } = useExpense();

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-error-50 border border-error-200 rounded-2xl p-6 text-center">
          <p className="text-error-600 font-medium">Error loading data</p>
          <p className="text-error-500 text-sm mt-1">{error}</p>
        </div>
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
          Your Spending Overview
        </h2>
        <p className="text-secondary-600">
          Track your expenses across different time periods
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="space-y-4">
          <SummaryCard
            title="Today"
            amount={summaries.day.total_amount}
            count={summaries.day.expense_count}
            icon={FiDollarSign}
            color="bg-gradient-to-br from-primary-500 to-primary-600"
            delay={0.1}
          />
          <SummaryCard
            title="This Week"
            amount={summaries.week.total_amount}
            count={summaries.week.expense_count}
            icon={FiCalendar}
            color="bg-gradient-to-br from-success-500 to-success-600"
            delay={0.2}
          />
          <SummaryCard
            title="This Month"
            amount={summaries.month.total_amount}
            count={summaries.month.expense_count}
            icon={FiTrendingUp}
            color="bg-gradient-to-br from-warning-500 to-warning-600"
            delay={0.3}
          />
        </div>

        {/* Top Categories */}
        {summaries.month.top_categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 card-shadow"
          >
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Top Categories This Month
            </h3>
            <div className="space-y-3">
              {summaries.month.top_categories.slice(0, 5).map((category, index) => (
                <TopCategoryItem
                  key={category.category}
                  category={category.category}
                  amount={category.amount}
                  count={category.count}
                  delay={0.1 * index}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-primary-100 text-sm">Daily Average</p>
              <p className="text-xl font-bold">
                {formatCurrency(summaries.month.total_amount / 30)}
              </p>
            </div>
            <div>
              <p className="text-primary-100 text-sm">Monthly Goal</p>
              <p className="text-xl font-bold">
                {formatCurrency(2000)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 flex items-center space-x-3">
            <div className="loading-spinner"></div>
            <span className="text-secondary-700">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;