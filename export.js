/* export.js — CSV export of all transactions */

const ExportModule = (() => {

  function toCsvValue(val) {
    const str = String(val ?? '');
    if (/[",\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function exportCsv() {
    const transactions = Storage.getTransactions().sort((a, b) => a.date.localeCompare(b.date));

    if (!transactions.length) {
      showToast('No transactions to export');
      return;
    }

    const header = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = transactions.map(t => [
      t.date, t.type, t.category, t.description, t.amount.toFixed(2)
    ]);

    const csvContent = [header, ...rows]
      .map(row => row.map(toCsvValue).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `ledger-export-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('CSV exported');
  }

  function init() {
    document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
  }

  return { init };
})();
