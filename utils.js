/* utils.js — shared helpers used across the app */

const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Housing', 'Utilities',
  'Entertainment', 'Health', 'Shopping', 'Education', 'Other'
];

const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Gift', 'Other'
];

const CATEGORY_COLORS = {
  Food: '#2FBF8F', Transport: '#5AA9E6', Housing: '#D9A857',
  Utilities: '#8B95A3', Entertainment: '#B57EDC', Health: '#E2685B',
  Shopping: '#EFA94A', Education: '#4FC3D9', Other: '#6C7480',
  Salary: '#2FBF8F', Freelance: '#5AA9E6', Investment: '#D9A857', Gift: '#B57EDC'
};

function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || '#6C7480';
}

function uid() {
  return 'tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function formatCurrency(amount) {
  const n = Number(amount) || 0;
  const sign = n < 0 ? '-' : '';
  return sign + '₹' + Math.abs(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthKeyFromDate(dateStr) {
  return dateStr.slice(0, 7); // 'YYYY-MM'
}

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function monthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/** Returns array of last N month keys ending at current month, oldest first */
function lastNMonthKeys(n) {
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('is-visible'), 2400);
}
