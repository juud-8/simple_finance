const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

export const budgetService = {
  async getBudgets(userId) {
    const url = userId ? `${API_URL}/budgets?user_id=${userId}` : `${API_URL}/budgets`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch budgets');
    return res.json();
  },

  async createBudget(budget) {
    const res = await fetch(`${API_URL}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget),
    });
    if (!res.ok) throw new Error('Failed to create budget');
    return res.json();
  },

  async updateBudget(budgetId, budget) {
    const res = await fetch(`${API_URL}/budgets/${budgetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget),
    });
    if (!res.ok) throw new Error('Failed to update budget');
    return res.json();
  },

  async deleteBudget(budgetId) {
    const res = await fetch(`${API_URL}/budgets/${budgetId}`, {
      method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete budget');
    return res.json();
  },
};