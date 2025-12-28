import React, { useState, useMemo } from 'react';
import { Room, Guest, RoomStatus } from '../types';
import { BedDouble, Wind, User, BadgePercent, PlusCircle, Pencil, Search, SlidersHorizontal } from 'lucide-react';

interface RoomDashboardProps {
  rooms: Room[];
  guests: Guest[];
  onBook: (roomNumber: string) => void;
  onEditRoom: (room: Room) => void;
  onAddNewRoom: () => void;
}

const getStatusStyle = (status: RoomStatus) => {
  switch (status) {
    case 'Available': return { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: 'border-emerald-500' };
    case 'Occupied': return { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'border-blue-500' };
    case 'Dirty': return { bg: 'bg-amber-100', text: 'text-amber-800', icon: 'border-amber-500' };
    case 'Maintenance': return { bg: 'bg-slate-200', text: 'text-slate-800', icon: 'border-slate-500' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'border-gray-500' };
  }
};

const RoomCard = ({ room, guest, onBook, onEditRoom }: { room: Room, guest?: Guest, onBook: (roomNumber: string) => void, onEditRoom: (room: Room) => void }) => {
  const { bg, text, icon } = getStatusStyle(room.status);
  const isAvailable = room.status === 'Available';
  const finalPrice = room.price * (1 - (room.discount || 0) / 100);

  return (
    <div className={`rounded-xl shadow-md transition-all hover:shadow-lg flex flex-col ${isAvailable ? 'hover:scale-105' : ''}`}>
        <div className={`p-4 rounded-t-xl ${bg} ${icon} border-b-4 flex justify-between items-start`}>
            <div>
                <h3 className="font-bold text-xl text-slate-900">Room {room.number}</h3>
                <span className={`font-semibold text-sm ${text}`}>{room.status}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 text-sm">
                <BedDouble size={18} />
                <span className="font-medium">{room.type}</span>
            </div>
        </div>
      
        <div className="p-4 bg-white flex-grow">
        {guest ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
                <User size={18} className="text-blue-600"/>
                <p className="font-bold text-slate-800 text-lg">{guest.name}</p>
                {guest.vip && <span className="bg-yellow-400 text-white text-xs px-2 py-1 rounded-full">VIP</span>}
            </div>
            <p className="text-sm text-slate-500">Checked In: {guest.checkIn}</p>
            <p className="text-sm text-slate-500">Check Out: {guest.checkOut || 'Indefinite'}</p>
          </div>
        ) : ( 
            <div className="text-center text-slate-500 py-4">
                {isAvailable ? "Ready for booking" : (room.status === 'Dirty' ? "Needs cleaning" : "Under maintenance")}
            </div>
        )}
        </div>

        <div className="p-3 bg-slate-50 rounded-b-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
                {room.discount ? (
                    <>
                        <span className="text-slate-500 line-through">${room.price.toFixed(2)}</span>
                        <BadgePercent size={16} className="text-green-600"/>
                        <span className="font-bold text-green-700 text-lg">${finalPrice.toFixed(2)}</span>
                    </>
                ) : (
                    <span className="font-bold text-slate-800 text-lg">${room.price.toFixed(2)}</span>
                )}
                 <span className="text-xs text-slate-500">/ night</span>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={() => onEditRoom(room)} className="text-slate-500 hover:text-blue-600 p-2 rounded-full transition-colors"><Pencil size={16}/></button>
                {isAvailable && <button onClick={() => onBook(room.number)} className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors text-sm">Book</button>}
            </div>
        </div>
    </div>
  );
};


const RoomDashboard: React.FC<RoomDashboardProps> = ({ rooms, guests, onBook, onEditRoom, onAddNewRoom }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<any>({ status: '', type: '' });
  const [showFilters, setShowFilters] = useState(false);

  const guestMap = useMemo(() => new Map(guests.map(g => [g.roomNumber, g])), [guests]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => 
        (room.number.toLowerCase().includes(searchTerm.toLowerCase()) || guestMap.get(room.number)?.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filters.status ? room.status === filters.status : true) &&
        (filters.type ? room.type === filters.type : true)
    );
  }, [rooms, searchTerm, filters, guestMap]);

  return (
    <div className="p-4 lg:p-6 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Room Dashboard</h1>
          <button onClick={onAddNewRoom} className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md">
            <PlusCircle size={20}/>
            Add/Manage Rooms
          </button>
        </div>
        
        <div className="mb-4 p-4 bg-white rounded-xl shadow">
            <div className="flex items-center gap-4">
                <div className="relative flex-grow">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Search by room number or guest name..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    />
                </div>
                <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-lg ${showFilters ? 'bg-blue-100 text-blue-600' : 'text-slate-500'}`}><SlidersHorizontal size={20}/></button>
            </div>
            {showFilters && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t animate-in fade-in-50">
                    <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="w-full">
                        <option value="">All Statuses</option>
                        {Object.values(RoomStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})} className="w-full">
                        <option value="">All Types</option>
                        {Object.values(RoomType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map(room => (
            <RoomCard 
                key={room.id} 
                room={room} 
                guest={guestMap.get(room.number)} 
                onBook={onBook} 
                onEditRoom={onEditRoom} 
            />
          ))}
        </div>
        {filteredRooms.length === 0 && <p className="text-center text-slate-500 py-10 col-span-full">No rooms match the current filters.</p>}
      </div>
    </div>
  );
};

export default RoomDashboard;
