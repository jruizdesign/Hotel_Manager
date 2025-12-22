import React, { useState } from 'react';
import { Transaction, Guest, Room } from '../types';
import { Download, TrendingUp, TrendingDown, DollarSign, CreditCard, Search, Filter } from 'lucide-react';

interface AccountingProps {
  transactions: Transaction[];
  guests: Guest[];
  rooms: Room[];
}

const Accounting: React.FC<AccountingProps> = ({ transactions, guests, rooms }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'receivables' | 'transactions'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Calculations ---

  const calculateTotal = (type: 'Income' | 'Expense') => {
    return transactions
      .filter(t => t.type === type)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const income = calculateTotal('Income');
  const expenses = calculateTotal('Expense');
  const profit = income - expenses;

  // Calculate Accounts Receivable (Money owed by guests)
  const totalReceivables = guests.reduce((acc, guest) => acc + (guest.balance > 0 ? guest.balance : 0), 0);

  // Filter guests with outstanding balances or currently checked in
  const activeDebtors = guests.filter(g => g.balance > 0 || g.status === 'Checked In');

  // --- Helpers ---

  const getRoomPrice = (roomNumber?: string) => {
    if (!roomNumber) return 0;
    const room = rooms.find(r => r.number === roomNumber);
    return room ? room.price : 0;
  };

  const handleExport = (format: 'csv' | 'json') => {
    let content = '';
    let mimeType = '';
    let extension = '';

    if (format === 'csv') {
      const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Guest'].join(',');
      const rows = transactions.map(t => {
        const guestName = t.guestId ? guests.find(g => g.id === t.guestId)?.name || 'Unknown' : '-';
        return [t.id, t.date, t.type, t.category, `"${t.description}"`, t.amount, `"${guestName}"`].join(',');
      });
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

  // --- Render Components ---

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '100')} ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Financial Management</h2>
          <p className="text-slate-500 text-sm">Track revenue, expenses, and guest billing</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors font-medium text-sm shadow-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('receivables')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'receivables' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Guest Ledger (Due)
        </button>
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'transactions' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          All Transactions
        </button>
      </div>

      {/* CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard 
              title="Total Income" 
              value={`$${income.toLocaleString()}`} 
              icon={TrendingUp} 
              color="text-emerald-600" 
            />
            <StatCard 
              title="Total Expenses" 
              value={`$${expenses.toLocaleString()}`} 
              icon={TrendingDown} 
              color="text-red-600" 
            />
            <StatCard 
              title="Net Profit" 
              value={`$${profit.toLocaleString()}`} 
              icon={DollarSign} 
              color={profit >= 0 ? 'text-slate-800' : 'text-red-600'} 
            />
            <StatCard 
              title="Pending Collections" 
              value={`$${totalReceivables.toLocaleString()}`} 
              icon={CreditCard} 
              color="text-amber-600"
              subtext="Unpaid Guest Balances"
            />
          </div>

          {/* Recent Activity Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Financial Activity</h3>
            <div className="space-y-4">
              {transactions.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${t.type === 'Income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {t.type === 'Income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{t.description}</p>
                      <p className="text-xs text-slate-500">{t.date} • {t.category}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${t.type === 'Income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.type === 'Income' ? '+' : '-'}${t.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: RECEIVABLES (GUEST LEDGER) */}
      {activeTab === 'receivables' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Guest Ledger</h3>
              <p className="text-sm text-slate-500">Daily breakdown of amounts due from guests</p>
            </div>
            <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium border border-amber-100">
              Total Due: ${totalReceivables.toLocaleString()}
            </div>
          </div>
          
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Guest</th>
                <th className="px-6 py-4">Room</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Daily Rate</th>
                <th className="px-6 py-4 text-right">Current Due</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeDebtors.length > 0 ? (
                activeDebtors.map(guest => {
                  const dailyRate = getRoomPrice(guest.roomNumber);
                  const isVip = guest.vip;
                  const isUpToDate = guest.balance <= 0;
                  
                  return (
                    <tr key={guest.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                            {guest.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900">{guest.name}</p>
                              {isVip && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded uppercase tracking-wide">VIP</span>}
                            </div>
                            <p className="text-xs text-slate-400">{guest.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {guest.roomNumber ? `#${guest.roomNumber}` : <span className="text-slate-400">Not Assigned</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          guest.status === 'Checked In' ? 'bg-emerald-100 text-emerald-700' :
                          guest.status === 'Reserved' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {guest.status}
                        </span>
                        {isVip && !guest.checkOut && <div className="text-[10px] text-slate-400 mt-1">Indefinite Stay</div>}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{dailyRate > 0 ? `$${dailyRate}/night` : '-'}</td>
                      <td className="px-6 py-4 text-right">
                        {isVip && isUpToDate ? (
                          <div>
                            <span className="font-bold text-lg text-slate-700">${dailyRate.toLocaleString()}</span>
                            <p className="text-[10px] text-slate-400">Daily Accrual</p>
                          </div>
                        ) : (
                          <span className={`font-bold text-lg ${guest.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            ${guest.balance.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">View Folio</button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No outstanding balances found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CONTENT: ALL TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Filter size={16} /> Filter
            </button>
          </div>
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
              {transactions
                .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{t.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{t.description}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1 text-xs font-bold ${
                      t.type === 'Income' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {t.type === 'Income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {t.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${
                    t.type === 'Income' ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                    {t.type === 'Income' ? '+' : '-'}${t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Accounting;
