import React, { useState, useEffect } from 'react';
import { X, UserPlus, Calendar, DollarSign, BedDouble, Star } from 'lucide-react';
import { Guest, Room } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook: (guest: Omit<Guest, 'id'>) => Promise<boolean>;
  initialRoomNumber?: string;
  rooms: Room[];
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onBook, initialRoomNumber, rooms }) => {
  const [formData, setFormData] = useState<Partial<Omit<Guest, 'id'>>>({});
  const [isIndefinite, setIsIndefinite] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
      setFormData({
        name: '',
        email: '',
        phone: '',
        checkIn: today,
        checkOut: tomorrow,
        vip: false,
        status: 'Reserved',
        balance: 0, // Should be calculated based on room price
        roomNumber: initialRoomNumber || '',
      });
      setIsIndefinite(false);
    }
  }, [isOpen, initialRoomNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomNumber) {
      alert("A room number must be assigned.");
      return;
    }

    const bookingData: Omit<Guest, 'id'> = {
      name: formData.name || 'Anonymous',
      email: formData.email || '',
      phone: formData.phone || '',
      checkIn: formData.checkIn || '',
      checkOut: isIndefinite ? undefined : formData.checkOut,
      roomNumber: formData.roomNumber,
      vip: formData.vip || false,
      status: 'Reserved',
      balance: formData.balance || 0, // This should be calculated properly
    };

    const success = await onBook(bookingData);
    if (success) {
      onClose();
    } else {
      alert("Failed to book room. It might already be reserved.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-md shadow-2xl transform transition-all animate-in fade-in-90 slide-in-from-bottom-10">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <UserPlus size={20}/>
                    New Reservation for Room {initialRoomNumber}
                </h3>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-4 text-sm">
                    <input required placeholder="Guest Full Name" className="w-full" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                        <input required placeholder="Email Address" type="email" className="w-full" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        <input required placeholder="Phone Number" className="w-full" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-center bg-slate-50 p-2 rounded-lg">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Check In</label>
                            <input type="date" required className="w-full" value={formData.checkIn || ''} onChange={e => setFormData({ ...formData, checkIn: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Check Out</label>
                            <input type="date" required={!isIndefinite} disabled={isIndefinite} className="w-full" value={isIndefinite ? '' : formData.checkOut || ''} onChange={e => setFormData({ ...formData, checkOut: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={!!formData.vip} onChange={e => setFormData({ ...formData, vip: e.target.checked })} />
                            <Star size={18} className="text-yellow-500"/>
                            <span className="font-medium text-slate-700">Mark as VIP Guest</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="indefinite-stay" checked={isIndefinite} onChange={e => setIsIndefinite(e.target.checked)} />
                            <Calendar size={18} className="text-blue-500"/>
                            <span className="font-medium text-slate-700">Indefinite Stay (No checkout date)</span>
                        </label>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button type="submit" className="w-full md:w-auto bg-emerald-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2">
                        <BedDouble size={18}/>
                        Confirm & Book Room
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default BookingModal;
