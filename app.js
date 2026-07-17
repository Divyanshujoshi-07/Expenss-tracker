/* app.js — navigation + dashboard/report rendering + bootstrap */

const App = (() => {

  const VIEW_META = {
    dashboard: { title: 'Dashboard', subtitle: 'Your financial position at a glance.' },
    transactions: { title: 'Transactions', subtitle: 'Every income and expense entry, in one ledger.' },
    budgets: { title: 'Budget Goals', subtitle: 'Set monthly limits and track progress by category.' },
    reports: { title: 'Monthly Reports', subtitle: 'Break down any month by category.' }
  };

  function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('is-active'));
    document.getElementById(`view-${viewName}`).classList.add('is-active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('is-active'));
    document.querySelector(`.nav-item[data-view="${viewName}"]`).classList.add('is-active');

    document.getElementById('viewTitle').textContent = VIEW_META[viewName].title;
    document.getElementById('viewSubtitle').textContent = VIEW_META[viewName].subtitle;

    if (viewName === 'transactions') TransactionsModule.renderTransactionsTable();
    if (viewName === 'budgets') BudgetsModule.renderBudgetsView();
    if (viewName === 'reports') renderReportsView();
    if (viewName === 'dashboard') renderDashboard();
  }

  function groupByMonth(transactions) {
    const map = {};
    transactions.forEach(t => {
      const mk = monthKeyFromDate(t.date);
      if (!map[mk]) map[mk] = [];
      map[mk].push(t);
    });
    return map;
  }

  function renderDashboard() {
    const all = Storage.getTransactions();
    const mk = currentMonthKey();
    const byMonth = groupByMonth(all);
    const thisMonthTx = byMonth[mk] || [];

    const income = thisMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = thisMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const net = income - expense;

    const totalBalance = all.reduce((s, t) => s + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);

    document.getElementById('balanceFigure').textContent = formatCurrency(totalBalance);
    document.getElementById('monthIncome').textContent = formatCurrency(income);
    document.getElementById('monthExpense').textContent = formatCurrency(expense);
    document.getElementById('monthNet').textContent = (net >= 0 ? '+' : '−') + formatCurrency(Math.abs(net));
    document.getElementById('pieMonthLabel').textContent = monthLabel(mk);

    const months = lastNMonthKeys(6);
    ChartsModule.renderCategoryPie(thisMonthTx);
    ChartsModule.renderTrendChart(months, byMonth);
    ChartsModule.renderSparkline(months, byMonth);

    BudgetsModule.renderDashboardBudgets();
    TransactionsModule.renderRecentTable();
  }

  function renderReportsView() {
    const monthInput = document.getElementById('reportMonth');
    const mk = monthInput.value || currentMonthKey();
    monthInput.value = mk;

    const all = Storage.getTransactions().filter(t => monthKeyFromDate(t.date) === mk);
    const income = all.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = all.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    document.getElementById('reportIncome').textContent = formatCurrency(income);
    document.getElementById('reportExpense').textContent = formatCurrency(expense);
    document.getElementById('reportNet').textContent = formatCurrency(income - expense);

    ChartsModule.renderReportPie(all);

    const totals = ChartsModule.categoryTotals(all);
    const counts = {};
    all.filter(t => t.type === 'expense').forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });

    const tbody = document.querySelector('#reportTable tbody');
    const rows = Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
    tbody.innerHTML = rows.length
      ? rows.map(cat => `
          <tr>
            <td><span class="cat-pill">${cat}</span></td>
            <td class="num">${counts[cat]}</td>
            <td class="num amt-expense">${formatCurrency(totals[cat])}</td>
          </tr>`).join('')
      : `<tr><td colspan="3" class="empty-state">No expenses in this month.</td></tr>`;
  }

  function refreshAll() {
    const activeView = document.querySelector('.view.is-active').id.replace('view-', '');
    switchView(activeView);
  }

  function init() {
    TransactionsModule.init();
    BudgetsModule.init();
    ExportModule.init();

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    document.querySelectorAll('[data-view-link]').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.viewLink));
    });

    document.getElementById('reportMonth').value = currentMonthKey();
    document.getElementById('reportMonth').addEventListener('change', renderReportsView);

    document.addEventListener('data-changed', refreshAll);

    renderDashboard();
  }

  return { init, switchView };
})();

document.addEventListener('DOMContentLoaded', App.init);
