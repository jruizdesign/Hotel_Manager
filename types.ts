
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
  role: 'Superuser' | 'Manager' | 'Housekeeping' | 'Reception' | 'Maintenance';
  status: 'On Duty' | 'Off Duty' | 'Break';
  shift: string;
  pin: string; // Security PIN for login
}

export type AttendanceAction = 'CLOCK_IN' | 'CLOCK_OUT' | 'START_BREAK' | 'END_BREAK';

export interface AttendanceLog {
  id: string;
  staffId: string;
  staffName: string; // Denormalized for easier display
  action: AttendanceAction;
  timestamp: string; // ISO String
}

export interface Transaction {
  id: string;
  date: string;
  category: 'Room Revenue' | 'F&B' | 'Services' | 'Maintenance Cost' | 'Payroll' | 'Utilities' | 'Guest Payment';
  amount: number;
  description: string;
  type: 'Income' | 'Expense';
  guestId?: string; // Optional link to a specific guest
}

export interface StoredDocument {
  id: string;
  title: string;
  category: 'Invoice' | 'Guest ID' | 'Contract' | 'Report' | 'Other';
  date: string; // ISO Date String
  fileData: string; // Base64 Encoded Data
  fileType: string; // MIME Type (e.g., 'application/pdf')
  size: number; // Bytes
  description?: string;
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
  photo?: string; // Base64 encoded string
  dateAdded: string;
}

export type ViewState = 'dashboard' | 'rooms' | 'guests' | 'maintenance' | 'staff' | 'accounting' | 'documents' | 'features' | 'settings' | 'reports';

export type UserRole = 'Superuser' | 'Manager' | 'Staff' | 'Contractor';

export interface CurrentUser {
  id?: string; // Added to track specific staff ID
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
  firebaseConfig?: FirebaseConfig;
  // Legacy
  apiBaseUrl?: string;
  apiKey?: string;
}