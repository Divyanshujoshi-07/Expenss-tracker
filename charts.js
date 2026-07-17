/* charts.js — Chart.js wrappers + custom sparkline */

const ChartsModule = (() => {
  let pieInstance = null;
  let trendInstance = null;
  let reportPieInstance = null;

  Chart.defaults.color = '#8B95A3';
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.borderColor = '#21262E';

  function categoryTotals(transactions) {
    const totals = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + Number(t.amount);
    });
    return totals;
  }

  function renderPie(canvasId, legendId, transactions, existingInstanceGetter, existingInstanceSetter) {
    const totals = categoryTotals(transactions);
    const labels = Object.keys(totals);
    const data = labels.map(l => totals[l]);
    const colors = labels.map(getCategoryColor);
    const canvas = document.getElementById(canvasId);

    const existing = existingInstanceGetter();
    if (existing) existing.destroy();

    const newInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: '#13161B',
          borderWidth: 2
        }]
      },
      options: {
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw)}`
            }
          }
        }
      }
    });
    existingInstanceSetter(newInstance);

    // Receipt-style legend
    const legendEl = document.getElementById(legendId);
    legendEl.innerHTML = '';
    const total = data.reduce((a, b) => a + b, 0);

    if (labels.length === 0) {
      legendEl.innerHTML = '<li class="empty-state" style="padding:0;">No expenses recorded yet.</li>';
      return;
    }

    labels
      .map((label, i) => ({ label, value: data[i], color: colors[i] }))
      .sort((a, b) => b.value - a.value)
      .forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="leg-dot" style="background:${item.color}"></span>
          <span class="leg-name">${item.label}</span>
          <span class="leg-leader"></span>
          <span class="leg-amount">${formatCurrency(item.value)}</span>
        `;
        legendEl.appendChild(li);
      });
  }

  function renderCategoryPie(transactions) {
    renderPie(
      'categoryPie', 'receiptLegend', transactions,
      () => pieInstance, (inst) => { pieInstance = inst; }
    );
  }

  function renderReportPie(transactions) {
    renderPie(
      'reportPie', 'reportLegend', transactions,
      () => reportPieInstance, (inst) => { reportPieInstance = inst; }
    );
  }

  function renderTrendChart(monthKeys, transactionsByMonth) {
    const canvas = document.getElementById('trendChart');
    const incomeData = monthKeys.map(mk => {
      const txs = transactionsByMonth[mk] || [];
      return txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    });
    const expenseData = monthKeys.map(mk => {
      const txs = transactionsByMonth[mk] || [];
      return txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    });
    const labels = monthKeys.map(mk => {
      const [y, m] = mk.split('-');
      return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short' });
    });

    if (trendInstance) trendInstance.destroy();
    trendInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Income', data: incomeData, backgroundColor: '#2FBF8F', borderRadius: 4, maxBarThickness: 22 },
          { label: 'Expense', data: expenseData, backgroundColor: '#E2685B', borderRadius: 4, maxBarThickness: 22 }
        ]
      },
      options: {
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#1A1E24' }, ticks: { callback: (v) => '₹' + v } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, padding: 16 } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } }
        }
      }
    });
  }

  function renderSparkline(monthKeys, transactionsByMonth) {
    // Cumulative balance trend over the given months, as a lightweight inline SVG
    const svg = document.getElementById('sparkline');
    let running = 0;
    const points = monthKeys.map(mk => {
      const txs = transactionsByMonth[mk] || [];
      const net = txs.reduce((s, t) => s + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
      running += net;
      return running;
    });

    const w = 300, h = 40, pad = 4;
    const min = Math.min(...points, 0);
    const max = Math.max(...points, 0);
    const range = (max - min) || 1;

    const coords = points.map((p, i) => {
      const x = pad + (i / (points.length - 1 || 1)) * (w - pad * 2);
      const y = h - pad - ((p - min) / range) * (h - pad * 2);
      return [x, y];
    });

    const pathD = coords.map((c, i) => (i === 0 ? 'M' : 'L') + c[0].toFixed(1) + ',' + c[1].toFixed(1)).join(' ');
    const last = coords[coords.length - 1] || [0, 0];
    const color = points[points.length - 1] >= 0 ? '#2FBF8F' : '#E2685B';

    svg.innerHTML = `
      <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${last[0]}" cy="${last[1]}" r="3" fill="${color}" />
    `;
  }

  return { renderCategoryPie, renderReportPie, renderTrendChart, renderSparkline, categoryTotals };
})();
