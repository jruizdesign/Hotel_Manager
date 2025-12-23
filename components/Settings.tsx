import React, { useRef, useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { db } from '../services/db';
import { changeUserPassword, getAuthInstance } from '../services/firebase';
import { AppSettings, UserRole, FirebaseConfig } from '../types';
import { RefreshCw, Database, Download, Upload, HardDrive, FileJson, Cloud, CheckCircle2, XCircle, Globe, Key, ToggleLeft, ToggleRight, Terminal, Table as TableIcon, Mail, ShieldCheck, Lock, AlertTriangle, Home, Trash2 } from 'lucide-react';

interface SettingsProps {
  onDataReset: () => void;
  userRole: UserRole;
}

const Settings: React.FC<SettingsProps> = ({ onDataReset, userRole }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<AppSettings>({
    hotelName: 'StaySync Hotel',
    dataSource: 'Local',
    demoMode: true,
    maintenanceEmail: '',
    recaptchaSiteKey: '',
    firebaseConfig: { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '' }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [dbStats, setDbStats] = useState<Record<string, number>>({});
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [isPassLoading, setIsPassLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    loadDbStats();
  }, []);

  const loadSettings = async () => {
    const s = await StorageService.getSettings();
    if (!s.firebaseConfig) s.firebaseConfig = { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '' };
    if (!s.hotelName) s.hotelName = 'StaySync Hotel';
    setSettings(s);
  };

  const loadDbStats = async () => {
    const stats: Record<string, number> = {};
    if ((db as any).isOpen()) {
        const tables = (db as any).tables as any[];
        for (const table of tables) {
            stats[table.name] = await table.count();
        }
    }
    setDbStats(stats);
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

  const handleDemoModeToggle = async () => {
    if (settings.demoMode) {
      if (window.confirm("Disable Demo Mode? This will ERASE all demo data.")) {
        const newSettings = { ...settings, demoMode: false };
        setSettings(newSettings);
        await StorageService.saveSettings(newSettings);
        await StorageService.clearAllData();
        await onDataReset();
      }
    } else {
      if (window.confirm("Enable Demo Mode? This will replace your current data with example data.")) {
        await StorageService.resetToDemo();
        const newSettings = { ...settings, demoMode: true };
        setSettings(newSettings);
        await StorageService.saveSettings(newSettings);
        await onDataReset();
      }
    }
    loadDbStats();
  };

  const handleSaveSettings = async (reload: boolean = false) => {
    setIsSaving(true);
    await StorageService.saveSettings(settings);
    setIsSaving(false);
    alert("Settings Saved!");
    if (reload) {
      if(window.confirm("Reload is required to apply these changes. Reload now?")){
        window.location.reload();
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null); setPassSuccess(null); setIsPassLoading(true);
    if (newPassword !== confirmPassword) {
        setPassError("Passwords do not match.");
        setIsPassLoading(false);
        return;
    }
    try {
        await changeUserPassword(newPassword);
        setPassSuccess("Admin password updated successfully.");
        setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
        setPassError(err.message || "Failed to update password.");
    }
    setIsPassLoading(false);
  };

  const handleResetRooms = async () => {
    if (window.confirm("Are you sure you want to reset all rooms? This will delete all room data and status information.")) {
      await db.rooms.clear();
      await onDataReset();
      loadDbStats();
      alert("Rooms reset successfully.");
    }
  };

  const handleResetGuests = async () => {
    if (window.confirm("Are you sure you want to reset all guest data? This will delete all guest records, history, and balances.")) {
      await db.guests.clear();
      await db.history.clear();
      await db.transactions.clear();
      await onDataReset();
      loadDbStats();
      alert("Guest data reset successfully.");
    }
  };

  const updateFirebaseConfig = (key: keyof FirebaseConfig, value: string) => {
    setSettings(prev => ({ ...prev, firebaseConfig: { ...prev.firebaseConfig!, [key]: value } }));
  };
  
  return (
    <div className="space-y-8 max-w-4xl pb-10">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Database className="text-emerald-600" /> System Settings</h2>
            <p className="text-slate-500 mt-1">Manage application data, backups, and connections.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b"><h3 className="text-lg font-bold flex items-center gap-2"><Home className="text-indigo-600" /> General</h3></div>
          <div className="p-6 space-y-4">
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Hotel Name</label>
                  <input type="text" className="w-full border rounded-lg p-2" value={settings.hotelName} onChange={(e) => setSettings({...settings, hotelName: e.target.value})} />
                  <p className="text-xs text-slate-400 mt-1">This name will appear on the sidebar and on documents.</p>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => handleSaveSettings()} disabled={isSaving} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium">
                    {isSaving ? 'Saving...' : 'Save General Settings'}
                </button>
            </div>
          </div>
        </div>

        {userRole === 'Superuser' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b"><h3 className="text-lg font-bold flex items-center gap-2"><ShieldCheck className="text-purple-600" /> Security</h3></div>
            <div className="p-6">
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border rounded-lg p-2" />
                    <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border rounded-lg p-2" />
                    {passError && <p className="text-xs text-red-600">{passError}</p>}
                    {passSuccess && <p className="text-xs text-emerald-600">{passSuccess}</p>}
                    <button type="submit" disabled={isPassLoading} className="bg-purple-600 text-white px-4 py-2 rounded-lg">Update Password</button>
                </form>
            </div>
        </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b"><h3 className="text-lg font-bold flex items-center gap-2"><Mail className="text-blue-600" /> Notifications</h3></div>
          <div className="p-6">
              <label className="block text-sm font-bold mb-1">Maintenance Alert Email</label>
              <input type="email" className="w-full border rounded-lg p-2" value={settings.maintenanceEmail || ''} onChange={(e) => setSettings({...settings, maintenanceEmail: e.target.value})} />
              <div className="flex justify-end pt-4"><button onClick={() => handleSaveSettings()} disabled={isSaving} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Save Email Settings</button></div>
          </div>
        </div>

        {userRole === 'Superuser' && (
        <div className="bg-white rounded-xl shadow-sm border border-orange-500">
          <div className="p-6 border-b"><h3 className="text-lg font-bold flex items-center gap-2"><Cloud className="text-orange-600" /> Cloud Sync</h3></div>
          <div className="p-6 space-y-4">
              <div className="flex items-center justify-between"><p>Storage Location: {settings.dataSource}</p><div><button onClick={() => setSettings({...settings, dataSource: 'Local'})} className={`px-4 py-1 rounded-l-lg border ${settings.dataSource === 'Local' ? 'bg-orange-600 text-white' : 'bg-white text-slate-600'}`}>Local</button><button onClick={() => setSettings({...settings, dataSource: 'Cloud'})} className={`px-4 py-1 rounded-r-lg border-y border-r ${settings.dataSource === 'Cloud' ? 'bg-orange-600 text-white' : 'bg-white text-slate-600'}`}>Cloud</button></div></div>
              {settings.dataSource === 'Cloud' && (
              <div className="space-y-2">
                  <p>Firebase Config:</p>
                  <input className="w-full border rounded-lg p-2" value={settings.firebaseConfig?.apiKey} onChange={(e) => updateFirebaseConfig('apiKey', e.target.value)} placeholder="API Key" />
                  <input className="w-full border rounded-lg p-2" value={settings.firebaseConfig?.authDomain} onChange={(e) => updateFirebaseConfig('authDomain', e.target.value)} placeholder="Auth Domain" />
                  <input className="w-full border rounded-lg p-2" value={settings.firebaseConfig?.projectId} onChange={(e) => updateFirebaseConfig('projectId', e.target.value)} placeholder="Project ID" />
                  <input className="w-full border rounded-lg p-2" value={settings.firebaseConfig?.storageBucket} onChange={(e) => updateFirebaseConfig('storageBucket', e.target.value)} placeholder="Storage Bucket" />
                  <input className="w-full border rounded-lg p-2" value={settings.firebaseConfig?.messagingSenderId} onChange={(e) => updateFirebaseConfig('messagingSenderId', e.target.value)} placeholder="Msg Sender ID" />
                  <input className="w-full border rounded-lg p-2" value={settings.firebaseConfig?.appId} onChange={(e) => updateFirebaseConfig('appId', e.target.value)} placeholder="App ID" />
                  <input className="w-full border rounded-lg p-2" value={settings.recaptchaSiteKey || ''} onChange={(e) => setSettings({...settings, recaptchaSiteKey: e.target.value})} placeholder="reCAPTCHA Key"/>
              </div>
              )}
              <div className="flex justify-end pt-2"><button onClick={() => handleSaveSettings(true)} disabled={isSaving} className="bg-orange-600 text-white px-6 py-2 rounded-lg">Save Cloud Config</button></div>
          </div>
        </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2"><RefreshCw className="text-emerald-600" /> Demo Mode</h3>
            <button onClick={handleDemoModeToggle} className={`px-4 py-1 rounded-lg border font-bold ${settings.demoMode ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {settings.demoMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {(userRole === 'Superuser' || userRole === 'Manager') && (
          <div className="bg-white rounded-xl shadow-sm border border-red-200">
            <div className="p-6 border-b"><h3 className="text-lg font-bold flex items-center gap-2 text-red-600"><Trash2 /> Data Management</h3></div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-700">Reset Rooms</p>
                  <p className="text-sm text-slate-500">Deletes all room records and status information. This cannot be undone.</p>
                </div>
                <button onClick={handleResetRooms} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors">Reset Rooms</button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-700">Reset Guest Data</p>
                  <p className="text-sm text-slate-500">Deletes all guest records, stay history, and transaction logs. This cannot be undone.</p>
                </div>
                <button onClick={handleResetGuests} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors">Reset Guests</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b"><h3 className="text-lg font-bold flex items-center gap-2"><HardDrive /> Backup & Restore</h3></div>
          <div className="p-6 flex gap-4">
              <button onClick={handleDownloadBackup} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">Download Backup</button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={(e) => { const f = e.target.files?.[0]; if(f){const r = new FileReader(); r.onload = async (ev) => { try { const j = JSON.parse(ev.target?.result as string); if(confirm("Overwrite ALL data?")){ await StorageService.importData(j); await onDataReset(); alert("Restored!"); } } catch(err){ alert("Invalid backup file."); } }; r.readAsText(f); } }} />
              <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 text-white px-4 py-2 rounded-lg">Restore from File</button>
          </div>
        </div>
    </div>
  );
};

export default Settings;
