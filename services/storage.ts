import { Room, Guest, MaintenanceTicket, Staff, Transaction, BookingHistory, AppSettings } from '../types';
import { MOCK_ROOMS, MOCK_GUESTS, MOCK_MAINTENANCE, MOCK_STAFF, MOCK_TRANSACTIONS, MOCK_HISTORY } from '../constants';
import { db } from './db';

const SETTINGS_ID = 'app_settings';

const DEFAULT_SETTINGS: AppSettings = {
  dataSource: 'Local',
  apiBaseUrl: '',
  apiKey: '',
  demoMode: true
};

// --- Helper for API Calls (Keep for Remote Mode) ---
const apiCall = async (endpoint: string, method: string, body?: any, settings?: AppSettings) => {
  if (!settings || !settings.apiBaseUrl) throw new Error("API URL not configured");
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (settings.apiKey) {
    headers['x-api-key'] = settings.apiKey;
  }

  const response = await fetch(`${settings.apiBaseUrl}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
};

export const StorageService = {
  // --- Settings Management ---
  getSettings: async (): Promise<AppSettings> => {
    try {
      const record = await db.settings.get(SETTINGS_ID);
      if (record) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...settings } = record;
        return settings as AppSettings;
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  // Synchronous version for components that can't wait (fallback to defaults, actual load happens in App.tsx)
  getSettingsSync: (): AppSettings => {
    return DEFAULT_SETTINGS;
  },

  saveSettings: async (settings: AppSettings) => {
    await db.settings.put({ ...settings, id: SETTINGS_ID });
  },

  // --- Data Loader with Seed Logic ---
  async getOrSeedData<T>(table: any, mockData: T[], endpoint: string): Promise<T[]> {
    const settings = await StorageService.getSettings();
    
    // 1. Remote Mode
    if (settings.dataSource === 'Remote' && settings.apiBaseUrl) {
      try {
        return await apiCall(endpoint, 'GET', undefined, settings);
      } catch (error) {
        console.error(`Failed to fetch from remote, falling back to local DB.`, error);
      }
    }

    // 2. Local DB Mode
    const count = await table.count();
    
    // If DB is empty and Demo Mode is ON, seed it
    if (count === 0 && settings.demoMode) {
      console.log(`Seeding ${table.name} with mock data...`);
      await table.bulkAdd(mockData);
      return mockData;
    }

    // Return data from DB
    return await table.toArray();
  },

  async saveData<T>(table: any, data: T[], endpoint: string): Promise<void> {
    const settings = await StorageService.getSettings();

    // 1. Save to Local DB (IndexedDB)
    // We clear and bulkAdd to ensure the DB state matches the App state exactly (handling deletions)
    await (db as any).transaction('rw', table, async () => {
      await table.clear();
      await table.bulkAdd(data);
    });

    // 2. Sync to Remote if enabled
    if (settings.dataSource === 'Remote' && settings.apiBaseUrl) {
      try {
        await apiCall(endpoint, 'PUT', data, settings);
      } catch (error) {
        console.error(`Failed to save to remote`, error);
        // Don't throw, so the app continues functioning locally
      }
    }
  },

  // --- Entity Specific Methods ---

  getRooms: async (): Promise<Room[]> => {
    return StorageService.getOrSeedData(db.rooms, MOCK_ROOMS, '/rooms');
  },
  saveRooms: async (rooms: Room[]) => {
    return StorageService.saveData(db.rooms, rooms, '/rooms');
  },

  getGuests: async (): Promise<Guest[]> => {
    return StorageService.getOrSeedData(db.guests, MOCK_GUESTS, '/guests');
  },
  saveGuests: async (guests: Guest[]) => {
    return StorageService.saveData(db.guests, guests, '/guests');
  },

  getHistory: async (): Promise<BookingHistory[]> => {
    return StorageService.getOrSeedData(db.history, MOCK_HISTORY, '/history');
  },
  saveHistory: async (history: BookingHistory[]) => {
    return StorageService.saveData(db.history, history, '/history');
  },

  getMaintenance: async (): Promise<MaintenanceTicket[]> => {
    return StorageService.getOrSeedData(db.maintenance, MOCK_MAINTENANCE, '/maintenance');
  },
  saveMaintenance: async (tickets: MaintenanceTicket[]) => {
    return StorageService.saveData(db.maintenance, tickets, '/maintenance');
  },

  getStaff: async (): Promise<Staff[]> => {
    return StorageService.getOrSeedData(db.staff, MOCK_STAFF, '/staff');
  },
  saveStaff: async (staff: Staff[]) => {
    return StorageService.saveData(db.staff, staff, '/staff');
  },

  getTransactions: async (): Promise<Transaction[]> => {
    return StorageService.getOrSeedData(db.transactions, MOCK_TRANSACTIONS, '/transactions');
  },
  saveTransactions: async (transactions: Transaction[]) => {
    return StorageService.saveData(db.transactions, transactions, '/transactions');
  },

  // --- Utility Methods ---

  clearAllData: async () => {
    await Promise.all([
      db.rooms.clear(),
      db.guests.clear(),
      db.maintenance.clear(),
      db.staff.clear(),
      db.transactions.clear(),
      db.history.clear()
    ]);
  },

  resetToDemo: async () => {
    await StorageService.clearAllData();
    // Setting settings.demoMode = true will trigger re-seed on next fetch
  },

  exportAllData: async () => {
    const [rooms, guests, maintenance, staff, transactions, history] = await Promise.all([
      db.rooms.toArray(),
      db.guests.toArray(),
      db.maintenance.toArray(),
      db.staff.toArray(),
      db.transactions.toArray(),
      db.history.toArray()
    ]);

    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        staysync_rooms: rooms,
        staysync_guests: guests,
        staysync_maintenance: maintenance,
        staysync_staff: staff,
        staysync_transactions: transactions,
        staysync_history: history
      }
    };
  },

  importData: async (backupData: any) => {
    if (!backupData || !backupData.data) {
      throw new Error("Invalid backup file format");
    }
    
    const data = backupData.data;
    
    await (db as any).transaction('rw', db.rooms, db.guests, db.maintenance, db.staff, db.transactions, db.history, async () => {
      await db.rooms.clear();
      if (data.staysync_rooms) await db.rooms.bulkAdd(data.staysync_rooms);
      
      await db.guests.clear();
      if (data.staysync_guests) await db.guests.bulkAdd(data.staysync_guests);
      
      await db.maintenance.clear();
      if (data.staysync_maintenance) await db.maintenance.bulkAdd(data.staysync_maintenance);
      
      await db.staff.clear();
      if (data.staysync_staff) await db.staff.bulkAdd(data.staysync_staff);
      
      await db.transactions.clear();
      if (data.staysync_transactions) await db.transactions.bulkAdd(data.staysync_transactions);

      await db.history.clear();
      if (data.staysync_history) await db.history.bulkAdd(data.staysync_history);
    });
  },

  // --- Connection Test ---
  testConnection: async (url: string, key: string): Promise<boolean> => {
    try {
      const response = await fetch(`${url}/rooms`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key
        }
      });
      return response.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};