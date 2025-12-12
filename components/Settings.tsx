import React, { useRef, useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { db } from '../services/db';
import { AppSettings, UserRole, FirebaseConfig } from '../types';
import { RefreshCw, Database, Download, Upload, HardDrive, FileJson, Cloud, CheckCircle2, XCircle, Globe, Key, ToggleLeft, ToggleRight, Terminal, Table as TableIcon, Flame } from 'lucide-react';

interface SettingsProps {
  onDataReset: () => void;
  userRole: UserRole;
}

const Settings: React.FC<SettingsProps> = ({ onDataReset, userRole }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<AppSettings>({
    dataSource: 'Local',
    demoMode: true,
    firebaseConfig: {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [dbStats, setDbStats] = useState<Record<string, number>>({});

  useEffect(() => {
    loadSettings();
    loadDbStats();
  }, []);

  const loadSettings = async () => {
    const s = await StorageService.getSettings();
    // Ensure firebaseConfig object exists
    if (!s.firebaseConfig) {
      s.firebaseConfig = {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: ''
      };
    }
    setSettings(s);
  };

  const loadDbStats = async () => {
    const stats: Record<string, number> = {};
    if (db.isOpen()) {
        for (const table of db.tables) {
            stats[table.name] = await table.count();
        }
    }
    setDbStats(stats);
  };

  const handleDemoModeToggle = async () => {
    const newMode = !settings.demoMode;
    
    if (newMode) {
      if (window.confirm("Enable Demo Mode? This will replace your current data with example data.")) {
        await StorageService.resetToDemo();
        const newSettings = { ...settings, demoMode: true };
        setSettings(newSettings);
        await StorageService.saveSettings(newSettings);
        
        await onDataReset();
        loadDbStats();
      }
    } else {
      if (window.confirm("Disable Demo Mode? This will ERASE all demo data so you can set up your own hotel.")) {
        const newSettings = { ...settings, demoMode: false };
        setSettings(newSettings);
        await StorageService.saveSettings(newSettings);
        await StorageService.clearAllData();
        await onDataReset();
        loadDbStats();
      }
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const backupData = await StorageService.exportAllData();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `staysync_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Backup failed", e);
      alert("Failed to generate backup.");
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (window.confirm("WARNING: This will overwrite ALL current data with the backup file. This cannot be undone. Are you sure you want to proceed?")) {
           await StorageService.importData(json);
           await onDataReset();
           loadDbStats();
           alert("Data restored successfully!");
        }
      } catch (err) {
        alert("Failed to restore data: The file is invalid or corrupted.");
        console.error(err);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleLogToConsole = async () => {
    const allData: any = {};
    for (const table of db.tables) {
      allData[table.name] = await table.toArray();
    }
    console.group("StaySync Database Dump");
    console.log(allData);
    console.groupEnd();
    alert("Full database content has been logged to the browser console (Press F12 to view).");
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await StorageService.saveSettings(settings);
    
    setTimeout(() => {
      setIsSaving(false);
      onDataReset();
      alert("Configuration Saved! You may need to refresh the page for cloud connection to activate.");
    }, 800);
  };

  const updateFirebaseConfig = (key: keyof FirebaseConfig, value: string) => {
    setSettings(prev => ({
      ...prev,
      firebaseConfig: {
        ...prev.firebaseConfig!,
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-8 max-w-4xl pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="text-emerald-600" /> System Settings
        </h2>
        <p className="text-slate-500 mt-1">Manage application data, backups, and connections.</p>
      </div>

      {/* Database Status Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center">
           <div>
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <TableIcon size={20} className="text-blue-600" /> Database Status
             </h3>
             <p className="text-sm text-slate-500">Overview of local cache.</p>
           </div>
           <button 
             onClick={handleLogToConsole}
             className="text-xs flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-900 transition-colors"
           >
             <Terminal size={14} /> Log Data to Console
           </button>
        </div>
        <div className="p-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(dbStats).map(([table, count]) => (
                <div key={table} className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex flex-col items-center justify-center">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{table}</span>
                   <span className="text-2xl font-bold text-slate-700">{count}</span>
                   <span className="text-[10px] text-slate-400">records</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Cloud Configuration Section */}
      {userRole === 'Superuser' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden border-l-4 border-l-orange-500">
          <div className="p-6 border-b border-slate-200 bg-orange-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Cloud className="text-orange-600" /> Cloud Sync (Firebase)
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Connect to Google Firebase to access your data from any device.
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <h4 className="font-bold text-slate-800">Storage Location</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {settings.dataSource === 'Local' 
                    ? 'Data stored ONLY on this device (IndexedDB).' 
                    : 'Data stored in Cloud Firestore (Requires Config).'}
                </p>
              </div>
              <div className="flex bg-slate-200 p-1 rounded-lg">
                <button 
                  onClick={() => setSettings({...settings, dataSource: 'Local'})}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${settings.dataSource === 'Local' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  This Device Only
                </button>
                <button 
                  onClick={() => setSettings({...settings, dataSource: 'Cloud'})}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${settings.dataSource === 'Cloud' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Cloud Sync
                </button>
              </div>
            </div>

            {/* Cloud Config Form */}
            {settings.dataSource === 'Cloud' && (
              <div className="space-y-4 border-t border-slate-100 pt-4 animate-in fade-in slide-in-from-top-2">
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4">
                   <strong>How to set up:</strong>
                   <ol className="list-decimal ml-4 mt-2 space-y-1">
                     <li>Go to <a href="https://console.firebase.google.com" target="_blank" className="underline font-bold">console.firebase.google.com</a></li>
                     <li>Create a new project (e.g., "MyHotelApp").</li>
                     <li>Go to "Firestore Database" and Create Database (Start in <strong>Test Mode</strong>).</li>
                     <li>Go to Project Settings, scroll down to "Your apps", and select the Web icon (&lt;/&gt;).</li>
                     <li>Copy the configuration values and paste them below.</li>
                   </ol>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">API Key</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                      value={settings.firebaseConfig?.apiKey}
                      onChange={(e) => updateFirebaseConfig('apiKey', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Auth Domain</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                      value={settings.firebaseConfig?.authDomain}
                      onChange={(e) => updateFirebaseConfig('authDomain', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Project ID</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                      value={settings.firebaseConfig?.projectId}
                      onChange={(e) => updateFirebaseConfig('projectId', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Storage Bucket</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                      value={settings.firebaseConfig?.storageBucket}
                      onChange={(e) => updateFirebaseConfig('storageBucket', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Messaging Sender ID</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                      value={settings.firebaseConfig?.messagingSenderId}
                      onChange={(e) => updateFirebaseConfig('messagingSenderId', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">App ID</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                      value={settings.firebaseConfig?.appId}
                      onChange={(e) => updateFirebaseConfig('appId', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Mode Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-emerald-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <RefreshCw className="text-emerald-600" /> Demo Mode
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Toggle between example data and your live hotel data.
            </p>
          </div>
          <button 
            onClick={handleDemoModeToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
              settings.demoMode 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {settings.demoMode ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            {settings.demoMode ? 'Demo Mode ON' : 'Demo Mode OFF'}
          </button>
        </div>
      </div>

      {/* Backup & Restore Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <HardDrive className="text-slate-600" /> Backup & Restore
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Manual backups are still recommended even when using Cloud Sync.
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <FileJson size={16} className="text-slate-400" /> Download Backup
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                Creates a JSON file containing all data from the current source.
              </p>
            </div>
            <button 
              onClick={handleDownloadBackup}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap"
            >
              <Download size={18} /> Download Data
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Upload size={16} className="text-slate-400" /> Restore from File
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                Import a JSON file. This will overwrite the current database.
              </p>
            </div>
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json"
                onChange={handleFileChange}
              />
              <button 
                onClick={handleRestoreClick}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap"
              >
                <Upload size={18} /> Select Backup File
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;