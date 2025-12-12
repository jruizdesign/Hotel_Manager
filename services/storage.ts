import { Room, Guest, MaintenanceTicket, Staff, Transaction, BookingHistory, AppSettings } from '../types';
import { MOCK_ROOMS, MOCK_GUESTS, MOCK_MAINTENANCE, MOCK_STAFF, MOCK_TRANSACTIONS, MOCK_HISTORY } from '../constants';

const STORAGE_KEYS = {
  ROOMS: 'staysync_rooms',
  GUESTS: 'staysync_guests',
  MAINTENANCE: 'staysync_maintenance',
  STAFF: 'staysync_staff',
  TRANSACTIONS: 'staysync_transactions',
  HISTORY: 'staysync_history',
  SETTINGS: 'staysync_settings'
};

const DEFAULT_SETTINGS: AppSettings = {
  dataSource: 'Local',
  apiBaseUrl: '',
  apiKey: '',
  demoMode: true
};

// --- Helper for API Calls ---
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
  getSettings: (): AppSettings => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- Generic Data Handler ---
  // This helps us switch between Local and Remote easily
  async getData<T>(key: string, mockData: T, endpoint: string): Promise<T> {
    const settings = StorageService.getSettings();
    
    if (settings.dataSource === 'Remote' && settings.apiBaseUrl) {
      try {
        return await apiCall(endpoint, 'GET', undefined, settings);
      } catch (error) {
        console.error(`Failed to fetch ${key} from remote, falling back to local cache if available.`, error);
        // Fallback logic could go here, for now we throw or return empty
        // In a robust app, we might return cached local data with a "offline" warning
      }
    }

    // Local Storage Logic
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
      
      // If no stored data, check demo mode
      return settings.demoMode ? mockData : ([] as unknown as T);
    } catch {
      return settings.demoMode ? mockData : ([] as unknown as T);
    }
  },

  async saveData<T>(key: string, data: T, endpoint: string): Promise<void> {
    const settings = StorageService.getSettings();

    // Always save to local storage as backup/cache
    localStorage.setItem(key, JSON.stringify(data));

    if (settings.dataSource === 'Remote' && settings.apiBaseUrl) {
      try {
        // We assume the backend accepts a full list PUT for synchronization in this simple implementation
        // A real backend would likely take individual POST/PATCH updates
        await apiCall(endpoint, 'PUT', data, settings);
      } catch (error) {
        console.error(`Failed to save ${key} to remote`, error);
        throw error; 
      }
    }
  },

  // --- Entity Specific Methods ---

  getRooms: async (): Promise<Room[]> => {
    return StorageService.getData(STORAGE_KEYS.ROOMS, MOCK_ROOMS, '/rooms');
  },
  saveRooms: async (rooms: Room[]) => {
    return StorageService.saveData(STORAGE_KEYS.ROOMS, rooms, '/rooms');
  },

  getGuests: async (): Promise<Guest[]> => {
    return StorageService.getData(STORAGE_KEYS.GUESTS, MOCK_GUESTS, '/guests');
  },
  saveGuests: async (guests: Guest[]) => {
    return StorageService.saveData(STORAGE_KEYS.GUESTS, guests, '/guests');
  },

  getHistory: async (): Promise<BookingHistory[]> => {
    return StorageService.getData(STORAGE_KEYS.HISTORY, MOCK_HISTORY, '/history');
  },
  saveHistory: async (history: BookingHistory[]) => {
    return StorageService.saveData(STORAGE_KEYS.HISTORY, history, '/history');
  },

  getMaintenance: async (): Promise<MaintenanceTicket[]> => {
    return StorageService.getData(STORAGE_KEYS.MAINTENANCE, MOCK_MAINTENANCE, '/maintenance');
  },
  saveMaintenance: async (tickets: MaintenanceTicket[]) => {
    return StorageService.saveData(STORAGE_KEYS.MAINTENANCE, tickets, '/maintenance');
  },

  getStaff: async (): Promise<Staff[]> => {
    return StorageService.getData(STORAGE_KEYS.STAFF, MOCK_STAFF, '/staff');
  },
  saveStaff: async (staff: Staff[]) => {
    return StorageService.saveData(STORAGE_KEYS.STAFF, staff, '/staff');
  },

  getTransactions: async (): Promise<Transaction[]> => {
    return StorageService.getData(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS, '/transactions');
  },
  saveTransactions: async (transactions: Transaction[]) => {
    return StorageService.saveData(STORAGE_KEYS.TRANSACTIONS, transactions, '/transactions');
  },

  // --- Utility Methods ---

  clearAllData: () => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
  },

  resetToDemo: () => {
    // We clear storage, forcing the app to fall back to mocks based on default settings logic (or explicitly saving them)
    // However, since demoMode might be persisted in settings, we should just clear data keys 
    // AND ensure the `getData` function returns MOCKS because `demoMode` will be true.
    localStorage.removeItem(STORAGE_KEYS.ROOMS);
    localStorage.removeItem(STORAGE_KEYS.GUESTS);
    localStorage.removeItem(STORAGE_KEYS.MAINTENANCE);
    localStorage.removeItem(STORAGE_KEYS.STAFF);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  },

  exportAllData: () => {
    const data: Record<string, any> = {};
    Object.values(STORAGE_KEYS).forEach(key => {
      const stored = localStorage.getItem(key);
      if (stored) {
        data[key] = JSON.parse(stored);
      }
    });
    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data
    };
  },

  importData: (backupData: any) => {
    if (!backupData || !backupData.data) {
      throw new Error("Invalid backup file format");
    }
    
    const data = backupData.data;
    Object.values(STORAGE_KEYS).forEach(key => {
      if (data[key]) {
        localStorage.setItem(key, JSON.stringify(data[key]));
      }
    });
  },

  // --- Connection Test ---
  testConnection: async (url: string, key: string): Promise<boolean> => {
    try {
      // Try to fetch rooms as a test
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