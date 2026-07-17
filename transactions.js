/* transactions.js — transaction CRUD, tables, filters, modal */

const TransactionsModule = (() => {
  let editingId = null;

  function populateCategorySelect(selectEl, type) {
    const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    selectEl.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  function populateFilterCategorySelect() {
    const sel = document.getElementById('filterCategory');
    const allCats = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];
    sel.innerHTML = '<option value="all">All categories</option>' +
      allCats.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  function openModal(type, txToEdit) {
    const backdrop = document.getElementById('txModalBackdrop');
    const title = document.getElementById('txModalTitle');
    const submitBtn = document.getElementById('txSubmitBtn');
    const typeInput = document.getElementById('txType');
    const catSelect = document.getElementById('txCategory');

    editingId = txToEdit ? txToEdit.id : null;
    const effectiveType = txToEdit ? txToEdit.type : type;
    typeInput.value = effectiveType;
    populateCategorySelect(catSelect, effectiveType);

    if (txToEdit) {
      title.textContent = `Edit ${effectiveType}`;
      submitBtn.textContent = 'Save changes';
      document.getElementById('txAmount').value = txToEdit.amount;
      catSelect.value = txToEdit.category;
      document.getElementById('txDescription').value = txToEdit.description;
      document.getElementById('txDate').value = txToEdit.date;
    } else {
      title.textContent = effectiveType === 'income' ? 'Add income' : 'Add expense';
      submitBtn.textContent = effectiveType === 'income' ? 'Add income' : 'Add expense';
      document.getElementById('txForm').reset();
      document.getElementById('txType').value = effectiveType;
      document.getElementById('txDate').value = todayISO();
    }

    backdrop.classList.add('is-open');
    document.getElementById('txAmount').focus();
  }

  function closeModal() {
    document.getElementById('txModalBackdrop').classList.remove('is-open');
    editingId = null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('txType').value;
    const amount = parseFloat(document.getElementById('txAmount').value);
    const category = document.getElementById('txCategory').value;
    const description = document.getElementById('txDescription').value.trim();
    const date = document.getElementById('txDate').value;

    if (!amount || amount <= 0 || !description || !date) return;

    if (editingId) {
      Storage.updateTransaction(editingId, { type, amount, category, description, date });
      showToast('Transaction updated');
    } else {
      Storage.addTransaction({ id: uid(), type, amount, category, description, date });
      showToast(type === 'income' ? 'Income added' : 'Expense added');
    }

    closeModal();
    document.dispatchEvent(new CustomEvent('data-changed'));
  }

  function deleteTransaction(id) {
    if (!confirm('Delete this transaction? This cannot be undone.')) return;
    Storage.deleteTransaction(id);
    showToast('Transaction deleted');
    document.dispatchEvent(new CustomEvent('data-changed'));
  }

  function rowHtml(tx, withActions) {
    const amountClass = tx.type === 'income' ? 'amt-income' : 'amt-expense';
    const sign = tx.type === 'income' ? '+' : '−';
    const actions = withActions ? `
      <td class="num">
        <div class="row-actions">
          <button class="edit" data-id="${tx.id}">Edit</button>
          <button class="del" data-id="${tx.id}">Delete</button>
        </div>
      </td>` : '';
    const typeCell = withActions ? `<td>${tx.type === 'income' ? 'Income' : 'Expense'}</td>` : '';
    return `
      <tr>
        <td>${formatDateDisplay(tx.date)}</td>
        <td>${escapeHtml(tx.description)}</td>
        <td><span class="cat-pill">${tx.category}</span></td>
        ${typeCell}
        <td class="num ${amountClass}">${sign} ${formatCurrency(tx.amount)}</td>
        ${actions}
      </tr>`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderRecentTable() {
    const all = Storage.getTransactions().sort((a, b) => b.date.localeCompare(a.date));
    const recent = all.slice(0, 6);
    const tbody = document.querySelector('#recentTable tbody');
    tbody.innerHTML = recent.length
      ? recent.map(tx => rowHtml(tx, false)).join('')
      : `<tr><td colspan="4" class="empty-state">No transactions yet.</td></tr>`;
  }

  function getFilteredTransactions() {
    const type = document.getElementById('filterType').value;
    const category = document.getElementById('filterCategory').value;
    const month = document.getElementById('filterMonth').value;

    return Storage.getTransactions()
      .filter(t => type === 'all' || t.type === type)
      .filter(t => category === 'all' || t.category === category)
      .filter(t => !month || monthKeyFromDate(t.date) === month)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function renderTransactionsTable() {
    const filtered = getFilteredTransactions();
    const tbody = document.querySelector('#txTable tbody');
    const emptyState = document.getElementById('txEmptyState');

    tbody.innerHTML = filtered.map(tx => rowHtml(tx, true)).join('');
    emptyState.style.display = filtered.length ? 'none' : 'block';

    tbody.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const tx = Storage.getTransactions().find(t => t.id === btn.dataset.id);
        if (tx) openModal(tx.type, tx);
      });
    });
    tbody.querySelectorAll('.del').forEach(btn => {
      btn.addEventListener('click', () => deleteTransaction(btn.dataset.id));
    });
  }

  function init() {
    populateFilterCategorySelect();

    document.getElementById('addExpenseBtn').addEventListener('click', () => openModal('expense'));
    document.getElementById('addIncomeBtn').addEventListener('click', () => openModal('income'));
    document.getElementById('txForm').addEventListener('submit', handleSubmit);
    document.getElementById('txModalClose').addEventListener('click', closeModal);
    document.getElementById('txCancelBtn').addEventListener('click', closeModal);
    document.getElementById('txModalBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'txModalBackdrop') closeModal();
    });

    ['filterType', 'filterCategory', 'filterMonth'].forEach(id => {
      document.getElementById(id).addEventListener('change', renderTransactionsTable);
    });
    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
      document.getElementById('filterType').value = 'all';
      document.getElementById('filterCategory').value = 'all';
      document.getElementById('filterMonth').value = '';
      renderTransactionsTable();
    });
  }

  return { init, renderRecentTable, renderTransactionsTable, getFilteredTransactions, openModal };
})();
