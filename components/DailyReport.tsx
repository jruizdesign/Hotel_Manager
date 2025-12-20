import React, { useState, useMemo } from 'react';
import { Guest, Room, Transaction } from '../types';
import { CalendarDays, DollarSign, Wallet, TrendingUp, Printer } from 'lucide-react';

interface DailyReportProps {
  guests: Guest[];
  rooms: Room[];
  transactions: Transaction[];
}

// Helper to calculate the number of nights between two dates
const calculateNights = (checkIn: string, checkOut: string): number => {
  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1; // Minimum 1 night
};

const DailyReport: React.FC<DailyReportProps> = ({ guests, rooms, transactions }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const reportData = useMemo(() => {
    const activeGuests = guests.filter(g => {
      const isStayActive = g.checkIn <= selectedDate && g.checkOut >= selectedDate;
      const hasPaymentToday = transactions.some(t => t.guestId === g.id && t.date === selectedDate);
      return isStayActive || hasPaymentToday;
    });

    const rows = activeGuests.map(guest => {
      const room = rooms.find(r => r.number === guest.roomNumber);
      let dailyRate = room ? room.price : 0;
      if (room && room.discount) {
        dailyRate = Math.round(dailyRate * (1 - room.discount / 100));
      }

      const numberOfNights = calculateNights(guest.checkIn, guest.checkOut);
      const projectedBill = dailyRate * numberOfNights;

      const paidToday = transactions
        .filter(t => t.guestId === guest.id && t.date === selectedDate && t.type === 'Income')
        .reduce((sum, t) => sum + t.amount, 0);

      let status = 'Stayover';
      if (guest.checkIn === selectedDate) status = 'Arrival';
      if (guest.checkOut === selectedDate) status = 'Departure';
      if (guest.status === 'Checked Out' && guest.checkOut < selectedDate) status = 'Post-Stay';

      return {
        guestId: guest.id,
        roomNumber: guest.roomNumber,
        guestName: guest.name,
        status,
        dailyRate,
        projectedBill,
        paidToday,
        balance: guest.balance,
      };
    });

    const totalCollected = rows.reduce((sum, r) => sum + r.paidToday, 0);
    const totalBalances = rows.reduce((sum, r) => sum + r.balance, 0);
    const totalProjectedRevenue = rows.filter(r => r.status !== 'Post-Stay').reduce((sum, r) => sum + r.projectedBill, 0);
    const dailyAccruedRevenue = rows.filter(r => r.status !== 'Departure' && r.status !== 'Post-Stay').reduce((sum, r) => sum + r.dailyRate, 0);


    return { rows, totalCollected, totalBalances, totalProjectedRevenue, dailyAccruedRevenue };
  }, [guests, rooms, transactions, selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="text-emerald-600" /> Daily Financial Record
          </h2>
          <p className="text-sm text-slate-500">Day-at-a-glance view of collections and guest balances.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-700"
          />
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
          >
            <Printer size={18} /> Print Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500">Total Collected</p>
               <h3 className="text-3xl font-bold text-emerald-600 mt-1">${reportData.totalCollected.toLocaleString()}</h3>
             </div>
             <div className="p-3 bg-emerald-100 rounded-full text-emerald-600"><DollarSign size={24} /></div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Cash/card received on this date</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500">Outstanding Balances</p>
               <h3 className="text-3xl font-bold text-red-500 mt-1">${reportData.totalBalances.toLocaleString()}</h3>
             </div>
             <div className="p-3 bg-red-100 rounded-full text-red-500"><Wallet size={24} /></div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Total amount owed by active guests</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500">Daily Accrued</p>
               <h3 className="text-3xl font-bold text-blue-600 mt-1">${reportData.dailyAccruedRevenue.toLocaleString()}</h3>
             </div>
             <div className="p-3 bg-blue-100 rounded-full text-blue-600"><TrendingUp size={24} /></div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Revenue from today's stays</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between bg-slate-50">
          <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500">Projected Revenue</p>
               <h3 className="text-3xl font-bold text-purple-600 mt-1">${reportData.totalProjectedRevenue.toLocaleString()}</h3>
             </div>
             <div className="p-3 bg-purple-100 rounded-full text-purple-600"><Wallet size={24} /></div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Total expected from current stays</p>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 print:bg-transparent print:border-b-2 print:border-slate-800">
           <h3 className="font-bold text-slate-800">Room Details - {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-semibold uppercase print:bg-slate-100">
              <tr>
                <th className="px-6 py-3">Room</th>
                <th className="px-6 py-3">Guest Name</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Nightly Rate</th>
                <th className="px-6 py-3 text-right">Projected Bill</th>
                <th className="px-6 py-3 text-right bg-emerald-50/50 print:bg-transparent">Paid Today</th>
                <th className="px-6 py-3 text-right">Total Due Now</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.rows.length > 0 ? (
                reportData.rows.map((row) => (
                  <tr key={row.guestId} className="hover:bg-slate-50 print:hover:bg-transparent">
                    <td className="px-6 py-3 font-mono font-bold text-slate-800">#{row.roomNumber}</td>
                    <td className="px-6 py-3 font-medium">{row.guestName}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${
                        row.status === 'Arrival' ? 'bg-green-100 text-green-700 border-green-200' :
                        row.status === 'Departure' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        row.status === 'Post-Stay' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">${row.dailyRate}</td>
                    <td className="px-6 py-3 text-right font-medium text-purple-700">${row.projectedBill.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right font-bold text-emerald-600 bg-emerald-50/30 print:bg-transparent">
                      {row.paidToday > 0 ? `$${row.paidToday.toLocaleString()}` : '-'}
                    </td>
                    <td className={`px-6 py-3 text-right font-bold ${row.balance > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      ${row.balance.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    No activity found for this date.
                  </td>
                </tr>
              )}
              {/* Footer Totals Row */}
              {reportData.rows.length > 0 && (
                <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200 print:bg-slate-100">
                  <td colSpan={3} className="px-6 py-3 text-right uppercase text-xs tracking-wider">Daily Totals</td>
                  <td className="px-6 py-3 text-right">${reportData.dailyAccruedRevenue.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-purple-700">${reportData.totalProjectedRevenue.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-emerald-700">${reportData.totalCollected.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-red-600">${reportData.totalBalances.toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyReport;