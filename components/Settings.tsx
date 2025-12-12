import React, { useRef, useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { AppSettings, UserRole } from '../types';
import { Trash2, RefreshCw, AlertTriangle, Database, Download, Upload, HardDrive, FileJson, Server, CheckCircle2, XCircle, Globe, Key, ToggleLeft, ToggleRight, Lock } from 'lucide-react';

interface SettingsProps {
  onDataReset: () => void;
  userRole: UserRole;
}

const Settings: React.FC<SettingsProps> = ({ onDataReset, userRole }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSaving, setIsSaving] = useState(false);

  const handleDemoModeToggle = async () => {
    const newMode = !settings.demoMode;
    
    if (newMode) {
      if (window.confirm("Enable Demo Mode? This will replace your current data with example data.")) {
        StorageService.resetToDemo();
        const newSettings = { ...settings, demoMode: true };
        setSettings(newSettings);
        StorageService.saveSettings(newSettings);
        onDataReset();
      }
    } else {
      if (window.confirm("Disable Demo Mode? This will ERASE all demo data so you can set up your own hotel.")) {
        StorageService.clearAllData();
        const newSettings = { ...settings, demoMode: false };
        setSettings(newSettings);
        StorageService.saveSettings(newSettings);
        onDataReset();
      }
    }
  };

  const handleDownloadBackup = () => {
    try {
      const backupData = StorageService.exportAllData();
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
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (window.confirm("WARNING: This will overwrite ALL current data with the backup file. This cannot be undone. Are you sure you want to proceed?")) {
           StorageService.importData(json);
           onDataReset(); // Refresh the app state
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

  // --- API Settings Handlers ---
  const handleSaveSettings = () => {
    setIsSaving(true);
    StorageService.saveSettings(settings);
    
    // Simulate a reload delay
    setTimeout(() => {
      setIsSaving(false);
      // Force reload of data
      onDataReset();
      alert("Settings saved. Data source updated.");
    }, 800);
  };

  const handleTestConnection = async () => {
    setTestStatus('idle');
    if (!settings.apiBaseUrl) return;
    const success = await StorageService.testConnection(settings.apiBaseUrl, settings.apiKey);
    setTestStatus(success ? 'success' : 'error');
  };

  return (
    <div className="space-y-8 max-w-4xl pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="text-emerald-600" /> System Settings
        </h2>
        <p className="text-slate-500 mt-1">Manage application data, backups, and connections.</p>
      </div>

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
        <div className="p-4 bg-slate-50 text-xs text-slate-500">
          Note: Turning OFF demo mode will clear existing demo data and trigger the setup wizard to create your rooms.
        </div>
      </div>

      {/* API Configuration Section - Superuser Only */}
      {userRole === 'Superuser' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden border-l-4 border-l-purple-500">
          <div className="p-6 border-b border-slate-200 bg-purple-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Server className="text-purple-600" /> Data Source Configuration
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Superuser Access: Configure remote database connection.
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <h4 className="font-bold text-slate-800">Storage Mode</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {settings.dataSource === 'Local' ? 'Data is stored in your browser cache.' : 'Data is synced with an external server.'}
                </p>
              </div>
              <div className="flex bg-slate-200 p-1 rounded-lg">
                <button 
                  onClick={() => setSettings({...settings, dataSource: 'Local'})}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${settings.dataSource === 'Local' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Local Storage
                </button>
                <button 
                  onClick={() => setSettings({...settings, dataSource: 'Remote'})}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${settings.dataSource === 'Remote' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Remote API
                </button>
              </div>
            </div>

            {/* API Form */}
            {settings.dataSource === 'Remote' && (
              <div className="space-y-4 border-t border-slate-100 pt-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-1"><Globe size={14}/> API Base URL</label>
                    <input 
                      type="text" 
                      placeholder="https://api.yourhotel.com/v1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      value={settings.apiBaseUrl}
                      onChange={(e) => setSettings({...settings, apiBaseUrl: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-1"><Key size={14}/> API Key (Header: x-api-key)</label>
                    <input 
                      type="password" 
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      value={settings.apiKey}
                      onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <button 
                     onClick={handleTestConnection}
                     disabled={!settings.apiBaseUrl}
                     className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium disabled:opacity-50"
                   >
                     Test Connection
                   </button>
                   {testStatus === 'success' && <span className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle2 size={16}/> Connected!</span>}
                   {testStatus === 'error' && <span className="text-sm text-red-600 flex items-center gap-1"><XCircle size={16}/> Connection Failed</span>}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-70"
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup & Restore Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <HardDrive className="text-slate-600" /> Backup & Restore
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Save your data to an external file or cloud drive, or restore from a previous backup.
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <FileJson size={16} className="text-slate-400" /> Download Backup
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                Creates a JSON file containing all rooms, guests, transactions, and staff data.
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
                Upload a previously saved .json backup file to restore your system.
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