import React from 'react';
import { Guest, Room } from '../types';
import { X } from 'lucide-react';

interface GuestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: Guest | null;
  room: Room | null;
}

const GuestDetailsModal: React.FC<GuestDetailsModalProps> = ({ isOpen, onClose, guest, room }) => {
  if (!isOpen || !guest || !room) return null;

  const getStayDuration = () => {
    const checkInDate = new Date(guest.checkIn);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - checkInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Guest Details - Room {room.number}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
            <p><strong>Guest Name:</strong> {guest.name}</p>
            <p><strong>Check-in Date:</strong> {new Date(guest.checkIn).toLocaleDateString()}</p>
            <p><strong>Check-out Date:</strong> {guest.checkOut ? new Date(guest.checkOut).toLocaleDateString() : 'Indefinite'}</p>
            <p><strong>Length of Stay:</strong> {getStayDuration()} days</p>
        </div>
      </div>
    </div>
  );
};

export default GuestDetailsModal;