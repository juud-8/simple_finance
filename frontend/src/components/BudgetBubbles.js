import React, { useEffect, useState } from 'react';
import { budgetService } from '../services/budgetService';
import { motion, AnimatePresence } from 'framer-motion';

const getBubbleSize = (amount) => {
  // Map budget amount to bubble size (min 80px, max 200px)
  const min = 80, max = 200;
  const scale = Math.min(Math.max(amount / 100, 1), 2.5); // scale for demo
  return Math.max(min, Math.min(max, scale * min));
};

export default function BudgetBubbles() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', category: '' });
  const [editId, setEditId] = useState(null);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await budgetService.getBudgets();
      setBudgets(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleOpenForm = (budget = null) => {
    if (budget) {
      setForm({ name: budget.name, amount: budget.amount, category: budget.category || '' });
      setEditId(budget.id);
    } else {
      setForm({ name: '', amount: '', category: '' });
      setEditId(null);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setForm({ name: '', amount: '', category: '' });
    setEditId(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await budgetService.updateBudget(editId, { ...form, amount: parseFloat(form.amount) });
      } else {
        await budgetService.createBudget({ ...form, amount: parseFloat(form.amount) });
      }
      await fetchBudgets();
      handleCloseForm();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await budgetService.deleteBudget(id);
      await fetchBudgets();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="flex flex-col items-center py-8">
      <h2 className="text-2xl font-bold mb-4">Budget Bubbles</h2>
      <button
        className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => handleOpenForm()}
      >
        Add Budget
      </button>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="flex flex-wrap justify-center gap-8">
          <AnimatePresence>
            {budgets.map((budget) => (
              <motion.div
                key={budget.id}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                style={{
                  width: getBubbleSize(budget.amount),
                  height: getBubbleSize(budget.amount),
                  background: '#4ECDC4',
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  position: 'relative',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  cursor: 'pointer',
                }}
                onClick={() => handleOpenForm(budget)}
                title="Edit budget"
              >
                <div className="font-bold text-lg truncate w-24 text-center">{budget.name}</div>
                <div className="text-sm mt-1">${budget.amount}</div>
                {budget.category && <div className="text-xs mt-1">{budget.category}</div>}
                <button
                  className="absolute top-1 right-2 text-xs bg-red-500 rounded px-2 py-0.5 hover:bg-red-600"
                  onClick={e => { e.stopPropagation(); handleDelete(budget.id); }}
                >
                  Delete
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {/* Modal/Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <motion.form
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg p-6 shadow-lg flex flex-col gap-4 min-w-[300px]"
            onSubmit={handleSubmit}
          >
            <h3 className="text-xl font-semibold mb-2">{editId ? 'Edit Budget' : 'Add Budget'}</h3>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Budget Name"
              className="border rounded px-3 py-2"
              required
            />
            <input
              name="amount"
              type="number"
              min="1"
              value={form.amount}
              onChange={handleChange}
              placeholder="Amount"
              className="border rounded px-3 py-2"
              required
            />
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Category (optional)"
              className="border rounded px-3 py-2"
            />
            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={handleCloseForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {editId ? 'Update' : 'Add'}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
}