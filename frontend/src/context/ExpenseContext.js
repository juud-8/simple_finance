import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { expenseService } from '../services/expenseService';

const ExpenseContext = createContext();

const initialState = {
  expenses: [],
  categories: [],
  summaries: {
    day: { total_amount: 0, expense_count: 0, top_categories: [] },
    week: { total_amount: 0, expense_count: 0, top_categories: [] },
    month: { total_amount: 0, expense_count: 0, top_categories: [] }
  },
  loading: false,
  error: null
};

const expenseReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload, loading: false };
    case 'ADD_EXPENSE':
      return { 
        ...state, 
        expenses: [action.payload, ...state.expenses], 
        loading: false 
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(expense => expense.id !== action.payload),
        loading: false
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload]
      };
    case 'SET_SUMMARIES':
      return { ...state, summaries: action.payload };
    case 'UPDATE_SUMMARY':
      return {
        ...state,
        summaries: {
          ...state.summaries,
          [action.payload.period]: action.payload.data
        }
      };
    default:
      return state;
  }
};

export const ExpenseProvider = ({ children }) => {
  const [state, dispatch] = useReducer(expenseReducer, initialState);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Load categories and summaries in parallel
      const [categoriesData, daySummary, weekSummary, monthSummary] = await Promise.all([
        expenseService.getCategories(),
        expenseService.getDailySummary(),
        expenseService.getWeeklySummary(),
        expenseService.getMonthlySummary()
      ]);

      dispatch({ type: 'SET_CATEGORIES', payload: categoriesData });
      dispatch({ 
        type: 'SET_SUMMARIES', 
        payload: {
          day: daySummary,
          week: weekSummary,
          month: monthSummary
        }
      });
      
      // Load recent expenses
      const recentExpenses = await expenseService.getExpenses({ limit: 50 });
      dispatch({ type: 'SET_EXPENSES', payload: recentExpenses });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const addExpense = async (expenseData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newExpense = await expenseService.createExpense(expenseData);
      dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
      
      // Refresh summaries
      await refreshSummaries();
      
      return newExpense;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const deleteExpense = async (expenseId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await expenseService.deleteExpense(expenseId);
      dispatch({ type: 'DELETE_EXPENSE', payload: expenseId });
      
      // Refresh summaries
      await refreshSummaries();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const loadExpenses = async (filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const expenses = await expenseService.getExpenses(filters);
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const addCategory = async (categoryData) => {
    try {
      const newCategory = await expenseService.createCategory(categoryData);
      dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
      return newCategory;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const refreshSummaries = async () => {
    try {
      const [daySummary, weekSummary, monthSummary] = await Promise.all([
        expenseService.getDailySummary(),
        expenseService.getWeeklySummary(),
        expenseService.getMonthlySummary()
      ]);

      dispatch({ 
        type: 'SET_SUMMARIES', 
        payload: {
          day: daySummary,
          week: weekSummary,
          month: monthSummary
        }
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value = {
    ...state,
    addExpense,
    deleteExpense,
    loadExpenses,
    addCategory,
    refreshSummaries,
    clearError
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};