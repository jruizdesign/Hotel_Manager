import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Room, RoomType, RoomStatus } from '../types';

interface RoomManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rooms: Partial<Room>[]) => Promise<void>;
  onUpdate: (room: Partial<Room>) => Promise<void>;
  onDelete: (roomId: string) => Promise<void>;
  existingRoom: Partial<Room> | null;
}

const RoomManagementModal: React.FC<RoomManagementModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onUpdate,
  onDelete,
  existingRoom 
}) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  
  // State for single room form
  const [singleRoom, setSingleRoom] = useState<Partial<Room>>({
    number: '',
    type: RoomType.SINGLE,
    price: 100,
    discount: 0
  });

  // State for bulk generation form
  const [bulk, setBulk] = useState({
    floorPrefix: '',
    start: 1,
    end: 10,
    type: RoomType.SINGLE,
    price: 100
  });

  useEffect(() => {
    if (existingRoom) {
      setSingleRoom(existingRoom);
      setMode('single');
    } else {
      // Reset to default when opening for creation
      setSingleRoom({
        number: '',
        type: RoomType.SINGLE,
        price: 100,
        discount: 0
      });
    }
  }, [existingRoom, isOpen]);

  const handleSave = async () => {
    if (mode === 'single') {
      if(existingRoom && existingRoom.id) {
        await onUpdate(singleRoom);
      } else {
        await onSave([singleRoom]);
      }
    } else {
      const newRooms: Partial<Room>[] = [];
      for (let i = bulk.start; i <= bulk.end; i++) {
        newRooms.push({
          number: `${bulk.floorPrefix}${i.toString().padStart(2, '0')}`,
          type: bulk.type,
          price: bulk.price,
          status: RoomStatus.AVAILABLE
        });
      }
      await onSave(newRooms);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (existingRoom && existingRoom.id) {
        if (window.confirm(`Are you sure you want to delete room ${existingRoom.number}?`)) {
            await onDelete(existingRoom.id);
            onClose();
        }
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl transform transition-all animate-in fade-in-90 slide-in-from-bottom-10">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">{existingRoom ? 'Edit Room' : 'Room Management'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
        </div>

        {!existingRoom && (
          <div className="p-4 bg-slate-100">
            <div className="flex w-full bg-slate-200 rounded-lg p-1">
              <button 
                onClick={() => setMode('single')}
                className={`w-1/2 p-2 rounded-md font-semibold transition-colors text-sm ${mode === 'single' ? 'bg-white shadow' : 'text-slate-600'}`}
              >
                Single Room
              </button>
              <button 
                onClick={() => setMode('bulk')}
                className={`w-1/2 p-2 rounded-md font-semibold transition-colors text-sm ${mode === 'bulk' ? 'bg-white shadow' : 'text-slate-600'}`}
              >
                Bulk Generate
              </button>
            </div>
          </div>
        )}

        <div className="p-6">
          {mode === 'single' ? (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">{existingRoom ? `Editing Room ${existingRoom.number}` : 'Add a Single Room'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  placeholder="Room Number (e.g., 101)" 
                  value={singleRoom.number || ''}
                  onChange={e => setSingleRoom({...singleRoom, number: e.target.value})}
                  className="w-full"
                />
                <select 
                  value={singleRoom.type || RoomType.SINGLE}
                  onChange={e => setSingleRoom({...singleRoom, type: e.target.value as RoomType})}
                  className="w-full"
                >
                  {Object.values(RoomType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input 
                  type="number"
                  placeholder="Price per night" 
                  value={singleRoom.price || ''}
                  onChange={e => setSingleRoom({...singleRoom, price: Number(e.target.value)})}
                  className="w-full"
                />
                 <input 
                  type="number"
                  placeholder="Discount (%)" 
                  value={singleRoom.discount || 0}
                  onChange={e => setSingleRoom({...singleRoom, discount: Number(e.target.value)})}
                  className="w-full"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">Quick Room Generation</h2>
                <p className="text-slate-500 text-sm">Automatically create room numbers for a floor or section.</p>
              </div>
              <div className="grid grid-cols-3 gap-4 items-end">
                <input 
                  placeholder="Floor/Prefix (e.g., 1, 2, A)"
                  value={bulk.floorPrefix}
                  onChange={e => setBulk({...bulk, floorPrefix: e.target.value})}
                />
                <input 
                  type="number"
                  placeholder="Start Number"
                  value={bulk.start}
                  onChange={e => setBulk({...bulk, start: Number(e.target.value)})}
                />
                <input 
                  type="number"
                  placeholder="End Number"
                  value={bulk.end}
                  onChange={e => setBulk({...bulk, end: Number(e.target.value)})}
                />
                 <select 
                  value={bulk.type}
                  onChange={e => setBulk({...bulk, type: e.target.value as RoomType})}
                  className="w-full col-span-2"
                >
                  {Object.values(RoomType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input 
                  type="number"
                  placeholder="Price for all" 
                  value={bulk.price}
                  onChange={e => setBulk({...bulk, price: Number(e.target.value)})}
                  className="w-full"
                />
              </div>
              <p className="text-xs text-center text-slate-500 pt-2">
                This will generate rooms: {bulk.floorPrefix}{String(bulk.start).padStart(2,'0')} to {bulk.floorPrefix}{String(bulk.end).padStart(2,'0')}.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 flex justify-between">
           <div>
            {existingRoom && (
                <button 
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition-colors"
                >
                <Trash2 size={16} />
                Delete
                </button>
            )}
           </div>
           <div className="flex gap-2">
            <button 
                onClick={onClose}
                className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300"
            >
                Cancel
            </button>
            <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm"
            >
                <Plus size={16} />
                {existingRoom ? 'Save Changes' : 'Add Room(s)'}
            </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RoomManagementModal;
