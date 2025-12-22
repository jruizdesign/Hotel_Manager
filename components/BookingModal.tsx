import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Room, Guest, RoomStatus } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook: (guest: Omit<Guest, 'id'>) => boolean;
  rooms: Room[];
  initialRoomNumber?: string;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onBook, rooms, initialRoomNumber }) => {
  const [formData, setFormData] = useState<Omit<Guest, 'id'>>({
    name: '',
    email: '',
    phone: '',
    roomNumber: initialRoomNumber || '',
    checkIn: '',
    checkOut: '',
    vip: false,
    status: 'Reserved',
    balance: 0
  });

  useEffect(() => {
    if (isOpen) {
        setFormData({
            name: '',
            email: '',
            phone: '',
            roomNumber: initialRoomNumber || '',
            checkIn: new Date().toISOString().split('T')[0],
            checkOut: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
            vip: false,
            status: 'Reserved',
            balance: 0
        });
    }
  }, [isOpen, initialRoomNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onBook(formData)) {
      onClose();
    } else {
      alert("Room unavailable or error creating booking.");
    }
  };

  if (!isOpen) return null;

  const availableRooms = rooms.filter(r => r.status === RoomStatus.AVAILABLE);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">New Reservation</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <input required placeholder="Guest Name" className="w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <input required placeholder="Email" type="email" className="w-full" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            <input required placeholder="Phone" className="w-full" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            <select required value={formData.roomNumber} className="w-full" onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}>
              <option value="" disabled>Select Room</option>
              {initialRoomNumber && !availableRooms.some(r => r.number === initialRoomNumber) && 
                <option key={initialRoomNumber} value={initialRoomNumber}>
                  {initialRoomNumber} (Current)
                </option>
              }
              {availableRooms.map(r => <option key={r.id} value={r.number}>{r.number} ({r.type})</option>)}
            </select>
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Check In</label>
                <input type="date" required className="w-full" value={formData.checkIn} onChange={e => setFormData({ ...formData, checkIn: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Check Out</label>
                <input type="date" required className="w-full" value={formData.checkOut} onChange={e => setFormData({ ...formData, checkOut: e.target.value })} />
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="vip-guest" checked={formData.vip} onChange={e => setFormData({ ...formData, vip: e.target.checked })} />
              <label htmlFor="vip-guest" className="font-medium text-slate-700">VIP Guest</label>
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm">Confirm Booking</button>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;