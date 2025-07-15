import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date) => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const formatDateShort = (date) => {
  return format(new Date(date), 'MMM dd');
};

export const formatTime = (date) => {
  return format(new Date(date), 'HH:mm');
};

export const getDateRanges = () => {
  const now = new Date();
  
  return {
    today: {
      start: startOfDay(now),
      end: endOfDay(now)
    },
    thisWeek: {
      start: startOfWeek(now),
      end: endOfWeek(now)
    },
    thisMonth: {
      start: startOfMonth(now),
      end: endOfMonth(now)
    }
  };
};

export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return checkDate.toDateString() === today.toDateString();
};

export const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const checkDate = new Date(date);
  return checkDate.toDateString() === yesterday.toDateString();
};

export const getRelativeDate = (date) => {
  const checkDate = new Date(date);
  
  if (isToday(checkDate)) {
    return 'Today';
  } else if (isYesterday(checkDate)) {
    return 'Yesterday';
  } else {
    return formatDate(checkDate);
  }
};

export const groupExpensesByDate = (expenses) => {
  const groups = {};
  
  expenses.forEach(expense => {
    const dateKey = formatDate(expense.date);
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: expense.date,
        expenses: [],
        total: 0
      };
    }
    groups[dateKey].expenses.push(expense);
    groups[dateKey].total += expense.amount;
  });
  
  return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const formatDateForAPI = (date) => {
  return date.toISOString();
};