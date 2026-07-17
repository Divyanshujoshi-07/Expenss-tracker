/* budgets.js — budget goal CRUD + progress rendering */

const BudgetsModule = (() => {

  function populateBudgetCategorySelect(excludeExisting) {
    const sel = document.getElementById('budgetCategory');
    const existing = new Set(Storage.getBudgets().map(b => b.category));
    const available = EXPENSE_CATEGORIES.filter(c => !excludeExisting || !existing.has(c) || c === excludeExisting);
    sel.innerHTML = available.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  function openModal(budgetToEdit) {
    const backdrop = document.getElementById('budgetModalBackdrop');
    const title = document.getElementById('budgetModalTitle');
    populateBudgetCategorySelect(budgetToEdit ? budgetToEdit.category : null);

    document.getElementById('budgetOriginalCategory').value = budgetToEdit ? budgetToEdit.category : '';
    if (budgetToEdit) {
      title.textContent = 'Edit budget goal';
      document.getElementById('budgetCategory').value = budgetToEdit.category;
      document.getElementById('budgetLimit').value = budgetToEdit.limit;
    } else {
      title.textContent = 'New budget goal';
      document.getElementById('budgetForm').reset();
    }
    backdrop.classList.add('is-open');
  }

  function closeModal() {
    document.getElementById('budgetModalBackdrop').classList.remove('is-open');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const original = document.getElementById('budgetOriginalCategory').value;
    const category = document.getElementById('budgetCategory').value;
    const limit = parseFloat(document.getElementById('budgetLimit').value);
    if (!category || !limit || limit <= 0) return;

    if (original && original !== category) Storage.deleteBudget(original);
    Storage.upsertBudget(category, limit);
    showToast('Budget goal saved');
    closeModal();
    document.dispatchEvent(new CustomEvent('data-changed'));
  }

  function deleteBudget(category) {
    if (!confirm(`Remove the budget goal for ${category}?`)) return;
    Storage.deleteBudget(category);
    showToast('Budget goal removed');
    document.dispatchEvent(new CustomEvent('data-changed'));
  }

  function spentThisMonth(category) {
    const mk = currentMonthKey();
    return Storage.getTransactions()
      .filter(t => t.type === 'expense' && t.category === category && monthKeyFromDate(t.date) === mk)
      .reduce((s, t) => s + Number(t.amount), 0);
  }

  function budgetItemHtml(budget, withActions) {
    const spent = spentThisMonth(budget.category);
    const pct = Math.min(100, (spent / budget.limit) * 100);
    const barClass = spent > budget.limit ? 'is-over' : (pct >= 80 ? 'is-warning' : '');
    const actions = withActions ? `
      <div class="budget-item-actions">
        <button class="edit" data-cat="${budget.category}">Edit</button>
        <button class="del" data-cat="${budget.category}">Remove</button>
      </div>` : '';

    return `
      <div class="budget-item">
        <div class="budget-item-head">
          <span class="cat">${budget.category}</span>
          <span class="amounts">${formatCurrency(spent)} / ${formatCurrency(budget.limit)}</span>
        </div>
        <div class="budget-bar-track">
          <div class="budget-bar-fill ${barClass}" style="width:${pct}%"></div>
        </div>
        ${actions}
      </div>`;
  }

  function renderDashboardBudgets() {
    const budgets = Storage.getBudgets();
    const el = document.getElementById('dashboardBudgets');
    el.innerHTML = budgets.length
      ? budgets.map(b => budgetItemHtml(b, false)).join('')
      : '<p class="empty-state" style="padding:0;">No budget goals yet. Set one from the Budget Goals tab.</p>';
  }

  function renderBudgetsView() {
    const budgets = Storage.getBudgets();
    const el = document.getElementById('budgetsList');
    const emptyState = document.getElementById('budgetEmptyState');

    el.innerHTML = budgets.map(b => budgetItemHtml(b, true)).join('');
    emptyState.style.display = budgets.length ? 'none' : 'block';

    el.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const b = Storage.getBudgets().find(x => x.category === btn.dataset.cat);
        if (b) openModal(b);
      });
    });
    el.querySelectorAll('.del').forEach(btn => {
      btn.addEventListener('click', () => deleteBudget(btn.dataset.cat));
    });
  }

  function init() {
    document.getElementById('addBudgetBtn').addEventListener('click', () => openModal(null));
    document.getElementById('budgetForm').addEventListener('submit', handleSubmit);
    document.getElementById('budgetModalClose').addEventListener('click', closeModal);
    document.getElementById('budgetCancelBtn').addEventListener('click', closeModal);
    document.getElementById('budgetModalBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'budgetModalBackdrop') closeModal();
    });
  }

  return { init, renderDashboardBudgets, renderBudgetsView };
})();
