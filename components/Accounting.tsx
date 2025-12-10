import React from 'react';
import { Transaction } from '../types';
import { Download, TrendingUp, TrendingDown, FileText, DollarSign } from 'lucide-react';

interface AccountingProps {
  transactions: Transaction[];
}

const Accounting: React.FC<AccountingProps> = ({ transactions }) => {
  const calculateTotal = (type: 'Income' | 'Expense') => {
    return transactions
      .filter(t => t.type === type)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const income = calculateTotal('Income');
  const expenses = calculateTotal('Expense');
  const profit = income - expenses;

  const handleExport = (format: 'csv' | 'json') => {
    let content = '';
    let mimeType = '';
    let extension = '';

    if (format === 'csv') {
      const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount'].join(',');
      const rows = transactions.map(t => 
        [t.id, t.date, t.type, t.category, `"${t.description}"`, t.amount].join(',')
      );
      content = [headers, ...rows].join('\n');
      mimeType = 'text/csv';
      extension = 'csv';
    } else {
      content = JSON.stringify(transactions, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hotel_financials_${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Accounting & Finance</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
          >
            <Download size={18} />
            Export for Excel/QB
          </button>
          <button 
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <FileText size={18} />
            Export JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Income</p>
            <p className="text-2xl font-bold text-emerald-600">+${income.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-emerald-100 rounded-full text-emerald-600"><TrendingUp size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">-${expenses.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-red-100 rounded-full text-red-600"><TrendingDown size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Net Profit</p>
            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-slate-800' : 'text-red-600'}`}>${profit.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full text-blue-600"><DollarSign size={24} /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium">{t.date}</td>
                <td className="px-6 py-4">{t.description}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold border border-slate-200">{t.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${t.type === 'Income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {t.type}
                  </span>
                </td>
                <td className={`px-6 py-4 text-right font-bold ${t.type === 'Income' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {t.type === 'Income' ? '+' : '-'}${t.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Accounting;