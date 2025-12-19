
export enum RoomStatus {
  AVAILABLE = 'Available',
  OCCUPIED = 'Occupied',
  DIRTY = 'Dirty',
  MAINTENANCE = 'Maintenance'
}

export enum RoomType {
  SINGLE = 'Single',
  DOUBLE = 'Double',
  SUITE = 'Suite',
  DELUXE = 'Deluxe'
}

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  status: RoomStatus;
  price: number;
  discount?: number; // Percentage discount (0-100)
  guestId?: string; // If occupied
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  roomNumber: string;
  vip: boolean;
  status: 'Checked In' | 'Reserved' | 'Checked Out';
  balance: number; // Positive means they owe money, 0 means paid
}

export interface BookingHistory {
  id: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  roomNumber: string;
  roomType: RoomType;
  totalAmount: number;
  status: 'Completed' | 'Cancelled' | 'No Show';
  rating?: number;
}

export interface MaintenanceTicket {
  id: string;
  roomNumber: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Resolved';
  reportedBy: string;
  date: string;
  cost?: number; // Cost of the repair
  completedDate?: string;
}

export interface Staff {
  id: string;
  name: string;
  email?: string; 
  role: 'Superuser' | 'Manager' | 'Housekeeping' | 'Reception' | 'Maintenance';
  status: 'On Duty' | 'Off Duty' | 'Break';
  shift: string;
  pin: string; 
}

export type AttendanceAction = 'CLOCK_IN' | 'CLOCK_OUT' | 'START_BREAK' | 'END_BREAK' | 'MANUAL_ADJUST';

export interface AttendanceLog {
  id: string;
  staffId: string;
  staffName: string;
  action: AttendanceAction;
  timestamp: string; 
  notes?: string;
}

export interface Transaction {
  id: string;
  date: string;
  category: 'Room Revenue' | 'F&B' | 'Services' | 'Maintenance Cost' | 'Payroll' | 'Utilities' | 'Guest Payment';
  amount: number;
  description: string;
  type: 'Income' | 'Expense';
  guestId?: string; 
}

export interface StoredDocument {
  id: string;
  title: string;
  category: 'Invoice' | 'Receipt' | 'Guest ID' | 'Contract' | 'Report' | 'Other';
  date: string; 
  fileData: string; 
  fileType: string; 
  size: number; 
  description?: string;
  guestId?: string; // Optional link to guest
}

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Rejected';
  submittedBy: string;
  submittedDate: string;
}

export interface DNRRecord {
  id: string;
  name: string;
  reason: string;
  notes: string;
  photo?: string; 
  dateAdded: string;
}

export type ViewState = 'dashboard' | 'rooms' | 'guests' | 'maintenance' | 'staff' | 'accounting' | 'documents' | 'features' | 'settings' | 'reports';

export type UserRole = 'Superuser' | 'Manager' | 'Staff' | 'Contractor';

export interface CurrentUser {
  id?: string; 
  name: string;
  role: UserRole;
  avatarInitials: string;
}

export type DataSource = 'Local' | 'Cloud';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface AppSettings {
  dataSource: DataSource;
  demoMode: boolean;
  maintenanceEmail?: string;
  recaptchaSiteKey?: string; 
  firebaseConfig?: FirebaseConfig;
  apiBaseUrl?: string;
  apiKey?: string;
}
