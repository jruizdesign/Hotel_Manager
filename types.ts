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
}

export interface MaintenanceTicket {
  id: string;
  roomNumber: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Resolved';
  reportedBy: string;
  date: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Manager' | 'Housekeeping' | 'Reception' | 'Maintenance';
  status: 'On Duty' | 'Off Duty' | 'Break';
  shift: string;
}

export interface Transaction {
  id: string;
  date: string;
  category: 'Room Revenue' | 'F&B' | 'Services' | 'Maintenance Cost' | 'Payroll' | 'Utilities';
  amount: number;
  description: string;
  type: 'Income' | 'Expense';
}

export type ViewState = 'dashboard' | 'rooms' | 'guests' | 'maintenance' | 'staff' | 'accounting';

export type UserRole = 'Manager' | 'Staff' | 'Contractor';

export interface CurrentUser {
  name: string;
  role: UserRole;
  avatarInitials: string;
}