
import React, { useState, useMemo } from 'react';
import { Guest, Room, RoomStatus } from '../types';
import { LogIn, LogOut, UserPlus, BedDouble, AlertTriangle, CheckCircle } from 'lucide-react';

interface CheckInCheckOutPanelProps {
  guests: Guest[];
  rooms: Room[];
  onUpdateGuest: (guest: Guest) => void;
  onUpdateRoom: (room: Room) => void;
}

const CheckInCheckOutPanel: React.FC<CheckInCheckOutPanelProps> = ({ guests, rooms, onUpdateGuest, onUpdateRoom }) => {
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reservableGuests = useMemo(() => guests.filter(g => g.status === 'Reserved'), [guests]);
  const checkOutableGuests = useMemo(() => guests.filter(g => g.status === 'Checked In'), [guests]);
  const availableRooms = useMemo(() => rooms.filter(r => r.status === RoomStatus.AVAILABLE), [rooms]);

  const handleCheckIn = () => {
    setError(null);
    setSuccess(null);
    if (!selectedGuestId || !selectedRoomId) {
      setError('Please select a guest and a room.');
      return;
    }

    const guest = guests.find(g => g.id === selectedGuestId);
    const room = rooms.find(r => r.id === selectedRoomId);

    if (guest && room) {
      // Update guest status
      onUpdateGuest({ ...guest, status: 'Checked In', roomNumber: room.number });
      
      // Update room status
      onUpdateRoom({ ...room, status: RoomStatus.OCCUPIED, guestId: guest.id });

      setSuccess(`Successfully checked in ${guest.name} to Room ${room.number}.`);
      setSelectedGuestId('');
      setSelectedRoomId('');
    }
  };

  const handleCheckOut = () => {
    setError(null);
    setSuccess(null);
    if (!selectedGuestId) {
      setError('Please select a guest to check out.');
      return;
    }

    const guest = guests.find(g => g.id === selectedGuestId);
    if (guest) {
      if (guest.balance > 0) {
        setError(`Cannot check out ${guest.name}. They have an outstanding balance of $${guest.balance}.`);
        return;
      }

      const room = rooms.find(r => r.number === guest.roomNumber);
      if (room) {
        onUpdateRoom({ ...room, status: RoomStatus.DIRTY, guestId: undefined });
      }

      onUpdateGuest({ ...guest, status: 'Checked Out' });

      setSuccess(`Successfully checked out ${guest.name}. Room ${guest.roomNumber} is now marked as Dirty.`);
      setSelectedGuestId('');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Check-In Panel */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <LogIn size={20} className="text-emerald-600" />
          Guest Check-In
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Guest to Check-In</label>
            <select
              value={selectedGuestId}
              onChange={e => {setSelectedGuestId(e.target.value); setError(null); setSuccess(null);}}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">Select a guest...</option>
              {reservableGuests.map(guest => (
                <option key={guest.id} value={guest.id}>{guest.name} - Reserved</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Room</label>
            <select
              value={selectedRoomId}
              onChange={e => {setSelectedRoomId(e.target.value); setError(null); setSuccess(null);}}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              disabled={!selectedGuestId}
            >
              <option value="">Select an available room...</option>
              {availableRooms.map(room => (
                <option key={room.id} value={room.id}>{room.number} - {room.type}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCheckIn}
            disabled={!selectedGuestId || !selectedRoomId}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold shadow-sm disabled:bg-slate-300"
          >
            <div className='flex justify-center items-center gap-2'>
              <UserPlus size={16}/>
              Check-In Guest
            </div>
          </button>
        </div>
      </div>

      {/* Check-Out Panel */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <LogOut size={20} className="text-red-600" />
          Guest Check-Out
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Guest to Check-Out</label>
            <select
              value={selectedGuestId}
              onChange={e => {setSelectedGuestId(e.target.value); setError(null); setSuccess(null);}}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option value="">Select a guest...</option>
              {checkOutableGuests.map(guest => (
                <option key={guest.id} value={guest.id}>{guest.name} - Room {guest.roomNumber}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCheckOut}
            disabled={!selectedGuestId}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-bold shadow-sm disabled:bg-slate-300"
          >
            <div className='flex justify-center items-center gap-2'>
              <BedDouble size={16}/>
              Check-Out Guest
            </div>
          </button>
        </div>
      </div>

      {error && (
        <div className="md:col-span-2 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} />
          <span className='font-medium'>{error}</span>
        </div>
      )}

      {success && (
        <div className="md:col-span-2 bg-emerald-100 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={20} />
          <span className='font-medium'>{success}</span>
        </div>
      )}
    </div>
  );
};

export default CheckInCheckOutPanel;
