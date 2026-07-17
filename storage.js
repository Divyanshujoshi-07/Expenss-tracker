/* storage.js — localStorage persistence layer */

const STORAGE_KEYS = {
  transactions: 'ledger_transactions_v1',
  budgets: 'ledger_budgets_v1'
};

const Storage = {
  getTransactions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.transactions);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to read transactions', e);
      return [];
    }
  },

  saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  },

  addTransaction(tx) {
    const all = this.getTransactions();
    all.push(tx);
    this.saveTransactions(all);
    return tx;
  },

  updateTransaction(id, updates) {
    const all = this.getTransactions();
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates };
    this.saveTransactions(all);
    return all[idx];
  },

  deleteTransaction(id) {
    const all = this.getTransactions().filter(t => t.id !== id);
    this.saveTransactions(all);
  },

  getBudgets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.budgets);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to read budgets', e);
      return [];
    }
  },

  saveBudgets(budgets) {
    localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(budgets));
  },

  upsertBudget(category, limit) {
    const all = this.getBudgets();
    const idx = all.findIndex(b => b.category === category);
    if (idx === -1) {
      all.push({ category, limit });
    } else {
      all[idx].limit = limit;
    }
    this.saveBudgets(all);
  },

  deleteBudget(category) {
    const all = this.getBudgets().filter(b => b.category !== category);
    this.saveBudgets(all);
  }
};
