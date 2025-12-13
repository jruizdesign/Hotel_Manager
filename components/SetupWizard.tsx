import React, { useState } from 'react';
import { RoomType, Room } from '../types';
import { Building2, CheckCircle2, Plus, ArrowRight } from 'lucide-react';

interface SetupWizardProps {
  onComplete: (rooms: Omit<Room, 'id' | 'status'>[]) => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'bulk' | 'manual'>('bulk');
  
  // Bulk Mode State
  const [floors, setFloors] = useState(2);
  const [roomsPerFloor, setRoomsPerFloor] = useState(10);
  const [basePrice, setBasePrice] = useState(120);

  const generateRooms = () => {
    const newRooms: Omit<Room, 'id' | 'status'>[] = [];
    
    for (let f = 1; f <= floors; f++) {
      for (let r = 1; r <= roomsPerFloor; r++) {
        // Format: 101, 102... 201, 202...
        const roomNum = `${f}${r.toString().padStart(2, '0')}`;
        // Simple logic for types: 01-05 Standard, 06-08 Double, 09+ Suite
        let type = RoomType.SINGLE;
        let price = basePrice;

        if (r > 5 && r <= 8) {
           type = RoomType.DOUBLE;
           price = Math.round(basePrice * 1.5);
        } else if (r > 8) {
           type = RoomType.SUITE;
           price = basePrice * 2;
        }

        newRooms.push({
          number: roomNum,
          type,
          price,
          discount: 0
        });
      }
    }
    return newRooms;
  };

  const handleFinish = () => {
    const rooms = generateRooms();
    onComplete(rooms);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-emerald-600 p-8 text-white text-center">
           <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
             <Building2 size={32} />
           </div>
           <h1 className="text-2xl font-bold">Welcome to StaySync</h1>
           <p className="text-emerald-100 mt-2">Let's set up your property in a few seconds.</p>
        </div>

        <div className="p-8">
           {step === 1 && (
             <div className="space-y-6">
               <div className="text-center">
                 <h2 className="text-lg font-bold text-slate-800">Quick Room Generation</h2>
                 <p className="text-slate-500 text-sm">We'll automatically create room numbers based on floors.</p>
               </div>

               <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Number of Floors</label>
                    <input 
                      type="number" min="1" max="20"
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center text-lg font-bold text-slate-700"
                      value={floors}
                      onChange={e => setFloors(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Rooms per Floor</label>
                    <input 
                      type="number" min="1" max="50"
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center text-lg font-bold text-slate-700"
                      value={roomsPerFloor}
                      onChange={e => setRoomsPerFloor(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Base Room Price ($)</label>
                    <input 
                      type="number" min="1"
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center text-lg font-bold text-slate-700"
                      value={basePrice}
                      onChange={e => setBasePrice(Number(e.target.value))}
                    />
                  </div>
               </div>

               <div className="bg-emerald-50 p-4 rounded-lg flex items-start gap-3">
                 <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                 <p className="text-sm text-emerald-800">
                   This will create <strong>{floors * roomsPerFloor} rooms</strong> (e.g. 101-{floors}{roomsPerFloor.toString().padStart(2,'0')}). You can edit them later.
                 </p>
               </div>

               <button 
                 onClick={handleFinish}
                 className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
               >
                 Create Rooms & Start <ArrowRight size={20} />
               </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;