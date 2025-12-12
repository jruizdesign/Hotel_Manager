import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { RefreshCw, Database, Cloud } from 'lucide-react';

interface SettingsProps {
  onDataReset: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onDataReset }) => {
  const [isInitializing, setIsInitializing] = useState(false);

  const handleInitDemo = async () => {
    if (window.confirm("This will write Demo Data to your Firebase Database. Only do this if your DB is empty. Continue?")) {
      setIsInitializing(true);
      try {
        await StorageService.initializeDemoData();
        alert("Demo data uploaded to Firebase!");
      } catch (e) {
        console.error(e);
        alert("Error initializing data. Check console permissions.");
      } finally {
        setIsInitializing(false);
      }
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="text-emerald-600" /> System Settings
        </h2>
        <p className="text-slate-500 mt-1">Managed Cloud Configuration</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-blue-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Cloud className="text-blue-600" /> Firebase Cloud Sync
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Your application is connected to Firebase Firestore. All data is synchronized in real-time across all devices.
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <h4 className="font-bold text-slate-800">Initialize Database</h4>
              <p className="text-sm text-slate-600">
                If this is a new installation, click here to populate your cloud database with demo data (Rooms, Staff, etc).
              </p>
            </div>
            <button 
              onClick={handleInitDemo}
              disabled={isInitializing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap disabled:opacity-50"
            >
              <RefreshCw size={18} className={isInitializing ? 'animate-spin' : ''} /> 
              {isInitializing ? 'Uploading...' : 'Upload Demo Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;