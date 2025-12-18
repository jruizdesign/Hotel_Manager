import React, { useMemo } from 'react';
import { Room, Guest, MaintenanceTicket, Transaction, RoomStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { DollarSign, BedDouble, Users, AlertTriangle, TrendingDown } from 'lucide-react';

interface DashboardProps {
  rooms: Room[];
  guests: Guest[];
  maintenance: MaintenanceTicket[];
  transactions: Transaction[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800 mt-1">{value}</h3>
    </div>
    <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
      <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ rooms, guests, maintenance, transactions }) => {
  const totalRevenue = transactions
    .filter(t => t.type === 'Income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'Expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const occupiedRooms = rooms.filter(r => r.status === RoomStatus.OCCUPIED).length;
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;
  const activeTickets = maintenance.filter(m => m.status !== 'Resolved').length;

  // Prepare Dynamic Revenue Chart Data (Last 7 Days)
  const revenueData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    // Iterate last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      
      // Format YYYY-MM-DD locally to match transaction dates
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayIncome = transactions
        .filter(t => t.type === 'Income' && t.date === dateStr)
        .reduce((acc, curr) => acc + curr.amount, 0);
        
      data.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }), // "Mon"
        date: dateStr,
        amount: dayIncome
      });
    }
    return data;
  }, [transactions]);

  const statusData = [
    { name: 'Available', value: rooms.filter(r => r.status === RoomStatus.AVAILABLE).length, color: '#10b981' },
    { name: 'Occupied', value: occupiedRooms, color: '#3b82f6' },
    { name: 'Dirty', value: rooms.filter(r => r.status === RoomStatus.DIRTY).length, color: '#f59e0b' },
    { name: 'Maintenance', value: rooms.filter(r => r.status === RoomStatus.MAINTENANCE).length, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} color="bg-emerald-500" />
        <StatCard title="Total Expenses" value={`$${totalExpenses.toLocaleString()}`} icon={TrendingDown} color="bg-red-500" />
        <StatCard title="Occupancy Rate" value={`${occupancyRate}%`} icon={BedDouble} color="bg-blue-500" />
        <StatCard title="Active Maintenance" value={activeTickets} icon={AlertTriangle} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-slate-800">Revenue Trend</h3>
             <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Last 7 Days</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => `$${value}`} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Income']}
                  labelFormatter={(label) => {
                     const item = revenueData.find(d => d.name === label);
                     return item ? `${label} (${item.date})` : label;
                  }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Status Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Room Status</h3>
          <div className="h-64 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 font-medium">{item.name}: <span className="text-slate-900 font-bold">{item.value}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;