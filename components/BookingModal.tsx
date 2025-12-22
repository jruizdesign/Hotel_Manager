import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Guest } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook: (guest: Omit<Guest, 'id'>) => boolean;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onBook }) => {
  const [formData, setFormData] = useState<Omit<Guest, 'id'>>({
    name: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    vip: false,
    status: 'Reserved',
    balance: 0
  });
  const [isIndefinite, setIsIndefinite] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setFormData({
            name: '',
            email: '',
            phone: '',
            checkIn: new Date().toISOString().split('T')[0],
            checkOut: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
            vip: false,
            status: 'Reserved',
            balance: 0
        });
        setIsIndefinite(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit: Omit<Guest, 'id'> = { ...formData };
    
    delete (dataToSubmit as Partial<Omit<Guest, 'id'>>).roomNumber;

    if (isIndefinite || (formData.vip && !formData.checkOut)) {
      delete dataToSubmit.checkOut;
    }
    if (onBook(dataToSubmit)) {
      onClose();
    } else {
      alert("Error creating reservation. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">New Reservation</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <input required placeholder="Guest Name" className="w-full col-span-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <input required placeholder="Email" type="email" className="w-full" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            <input required placeholder="Phone" className="w-full" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />

            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Anticipated Check In</label>
                <input type="date" required className="w-full" value={formData.checkIn} onChange={e => setFormData({ ...formData, checkIn: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Anticipated Check Out</label>
                <input type="date" required={!isIndefinite && !formData.vip} disabled={isIndefinite} className="w-full" value={isIndefinite ? '' : formData.checkOut || ''} onChange={e => setFormData({ ...formData, checkOut: e.target.value })} />
              </div>
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="vip-guest-booking" checked={formData.vip} onChange={e => setFormData({ ...formData, vip: e.target.checked })} />
              <label htmlFor="vip-guest-booking" className="font-medium text-slate-700">VIP Guest</label>
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="indefinite-stay-booking" checked={isIndefinite} onChange={e => {
                setIsIndefinite(e.target.checked);
                if (e.target.checked) {
                  setFormData(f => ({ ...f, checkOut: undefined }));
                } else {
                  setFormData(f => ({ ...f, checkOut: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0] }));
                }
              }} />
              <label htmlFor="indefinite-stay-booking" className="font-medium text-slate-700">Indefinite Stay</label>
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm">Confirm Reservation</button>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;