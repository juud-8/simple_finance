import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      throw new Error('Resource not found');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
);

export const expenseService = {
  // Health check
  async healthCheck() {
    const response = await api.get('/api/health');
    return response.data;
  },

  // Expense operations
  async getExpenses(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.start_date) {
      params.append('start_date', filters.start_date);
    }
    if (filters.end_date) {
      params.append('end_date', filters.end_date);
    }
    if (filters.category) {
      params.append('category', filters.category);
    }
    if (filters.limit) {
      params.append('limit', filters.limit);
    }

    const response = await api.get(`/api/expenses?${params}`);
    return response.data;
  },

  async createExpense(expenseData) {
    const response = await api.post('/api/expenses', expenseData);
    return response.data;
  },

  async deleteExpense(expenseId) {
    const response = await api.delete(`/api/expenses/${expenseId}`);
    return response.data;
  },

  // Summary operations
  async getDailySummary() {
    const response = await api.get('/api/expenses/summary/day');
    return response.data;
  },

  async getWeeklySummary() {
    const response = await api.get('/api/expenses/summary/week');
    return response.data;
  },

  async getMonthlySummary() {
    const response = await api.get('/api/expenses/summary/month');
    return response.data;
  },

  // Category operations
  async getCategories() {
    const response = await api.get('/api/categories');
    return response.data;
  },

  async createCategory(categoryData) {
    const response = await api.post('/api/categories', categoryData);
    return response.data;
  }
};

export default expenseService;