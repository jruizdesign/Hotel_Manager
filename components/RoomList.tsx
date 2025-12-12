import React, { useState } from 'react';
import { Room, RoomStatus, RoomType } from '../types';
import { CheckCircle, XCircle, PenTool, AlertOctagon, Plus, Trash2, X, CalendarPlus, Pencil, LogOut } from 'lucide-react';

interface RoomListProps {
  rooms: Room[];
  onStatusChange: (roomId: string, newStatus: RoomStatus) => void;
  onAddRoom: (room: Omit<Room, 'id' | 'status'>) => void;
  onUpdateRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
  onBookRoom: (roomNumber: string) => void;
  onCheckOut: (roomId: string) => void;
  isManager: boolean;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, onStatusChange, onAddRoom, onUpdateRoom, onDeleteRoom, onBookRoom, onCheckOut, isManager }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Room>>({
    number: '',
    type: RoomType.SINGLE,
    price: 100,
    discount: 0
  });

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.AVAILABLE: return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case RoomStatus.OCCUPIED: return 'bg-blue-50 border-blue-200 text-blue-700';
      case RoomStatus.DIRTY: return 'bg-amber-50 border-amber-200 text-amber-700';
      case RoomStatus.MAINTENANCE: return 'bg-red-50 border-red-200 text-red-700';
    }
  };

  const getStatusIcon = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.AVAILABLE: return <CheckCircle size={18} />;
      case RoomStatus.OCCUPIED: return <XCircle size={18} />;
      case RoomStatus.DIRTY: return <PenTool size={18} />;
      case RoomStatus.MAINTENANCE: return <AlertOctagon size={18} />;
    }
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setFormData({ number: '', type: RoomType.SINGLE, price: 100, discount: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room: Room) => {
    setIsEditMode(true);
    setFormData({ ...room });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.number || !formData.price) return;

    if (isEditMode && formData.id) {
       onUpdateRoom(formData as Room);
    } else {
       onAddRoom(formData as Omit<Room, 'id' | 'status'>);
    }
    
    setIsModalOpen(false);
  };

  const calculateDiscountedPrice = (price: number, discount: number = 0) => {
    return Math.round(price * (1 - discount / 100));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Room Management</h2>
          <p className="text-sm text-slate-500">Manage availability, pricing, discounts, and unit status.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-2 mr-4">
            {Object.values(RoomStatus).map((status) => (
              <div key={status} className={`hidden md:flex px-3 py-1 rounded-full text-xs font-semibold items-center gap-1 border ${getStatusColor(status)}`}>
                {status}
              </div>
            ))}
          </div>
          {isManager && (
            <button 
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium"
            >
              <Plus size={18} /> Add Room
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {rooms.map((room) => (
          <div key={room.id} className={`relative p-5 rounded-xl border-2 transition-all hover:shadow-md ${getStatusColor(room.status)}`}>
            
            {/* Top Actions: Edit / Delete (Manager Only) */}
            {isManager && (
              <div className="absolute top-3 right-3 flex gap-1">
                <button 
                  onClick={() => handleOpenEditModal(room)}
                  className="p-1.5 rounded-full hover:bg-slate-200/50 hover:text-slate-700 text-slate-400 transition-colors"
                  title="Edit Room"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => {
                    if(window.confirm(`Are you sure you want to remove Room ${room.number}?`)) {
                      onDeleteRoom(room.id);
                    }
                  }}
                  className="p-1.5 rounded-full hover:bg-red-100 hover:text-red-600 text-slate-400 transition-colors"
                  title="Remove Room"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            <div className="flex justify-between items-start mb-3 pr-16">
              <span className="text-2xl font-bold">#{room.number}</span>
            </div>
            
            <div className="flex items-center gap-2 mb-3 opacity-90">
               {getStatusIcon(room.status)}
               <span className="font-semibold">{room.status}</span>
            </div>

            <div className="flex justify-between items-end mb-4">
              <span className="text-sm font-medium opacity-75">{room.type}</span>
              
              <div className="flex flex-col items-end">
                {room.discount && room.discount > 0 ? (
                  <>
                     <span className="text-xs text-red-400 line-through font-medium opacity-75">${room.price}</span>
                     <div className="flex items-center gap-1">
                       <span className="font-mono font-bold text-lg text-emerald-700">${calculateDiscountedPrice(room.price, room.discount)}</span>
                       <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-bold">-{room.discount}%</span>
                     </div>
                  </>
                ) : (
                   <span className="font-mono font-bold text-lg opacity-80">${room.price}<span className="text-xs font-normal">/n</span></span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <select 
                className="w-full bg-white bg-opacity-50 border border-current rounded p-1.5 text-sm font-medium focus:ring-2 focus:ring-offset-1 focus:ring-current outline-none cursor-pointer"
                value={room.status}
                onChange={(e) => onStatusChange(room.id, e.target.value as RoomStatus)}
              >
                {Object.values(RoomStatus).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {room.status === RoomStatus.AVAILABLE && (
                <button
                  onClick={() => onBookRoom(room.number)}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded text-sm font-medium shadow-sm transition-colors"
                >
                  <CalendarPlus size={16} /> Book Now
                </button>
              )}

              {room.status === RoomStatus.OCCUPIED && (
                <button
                  onClick={() => onCheckOut(room.id)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded text-sm font-medium shadow-sm transition-colors"
                >
                  <LogOut size={16} /> Check Out
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Room Modal */}
      {isModalOpen && isManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{isEditMode ? 'Edit Room' : 'Add New Room'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Room Number</label>
                  <input 
                    type="text" 
                    required
                    readOnly={isEditMode}
                    placeholder="e.g. 305"
                    className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${isEditMode ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                    value={formData.number}
                    onChange={e => setFormData({...formData, number: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Room Type</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as RoomType})}
                  >
                    {Object.values(RoomType).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Base Price ($)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Discount (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    value={formData.discount || 0}
                    onChange={e => setFormData({...formData, discount: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              {/* Preview */}
              <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center text-sm">
                 <span className="text-slate-500">Final Nightly Rate:</span>
                 <span className="font-bold text-slate-800 text-lg">
                   ${calculateDiscountedPrice(formData.price || 0, formData.discount || 0)}
                 </span>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm"
                >
                  {isEditMode ? 'Save Changes' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomList;