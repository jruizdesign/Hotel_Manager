import { Guest, MaintenanceTicket, Room, RoomStatus, RoomType, Staff, Transaction } from "./types";

export const MOCK_ROOMS: Room[] = [
  { id: '101', number: '101', type: RoomType.SINGLE, status: RoomStatus.AVAILABLE, price: 120 },
  { id: '102', number: '102', type: RoomType.SINGLE, status: RoomStatus.OCCUPIED, price: 120, guestId: 'g1' },
  { id: '103', number: '103', type: RoomType.DOUBLE, status: RoomStatus.DIRTY, price: 180 },
  { id: '104', number: '104', type: RoomType.DOUBLE, status: RoomStatus.AVAILABLE, price: 180 },
  { id: '201', number: '201', type: RoomType.SUITE, status: RoomStatus.MAINTENANCE, price: 350 },
  { id: '202', number: '202', type: RoomType.DELUXE, status: RoomStatus.OCCUPIED, price: 250, guestId: 'g2' },
  { id: '203', number: '203', type: RoomType.DELUXE, status: RoomStatus.AVAILABLE, price: 250 },
  { id: '204', number: '204', type: RoomType.SINGLE, status: RoomStatus.DIRTY, price: 120 },
];

export const MOCK_GUESTS: Guest[] = [
  { id: 'g1', name: 'Alice Johnson', email: 'alice@example.com', phone: '555-0101', checkIn: '2023-10-25', checkOut: '2023-10-28', roomNumber: '102', vip: false, status: 'Checked In' },
  { id: 'g2', name: 'Robert Smith', email: 'bob.smith@example.com', phone: '555-0102', checkIn: '2023-10-26', checkOut: '2023-10-30', roomNumber: '202', vip: true, status: 'Checked In' },
  { id: 'g3', name: 'Charlie Davis', email: 'charlie@example.com', phone: '555-0103', checkIn: '2023-10-28', checkOut: '2023-11-01', roomNumber: '104', vip: false, status: 'Reserved' },
];

export const MOCK_MAINTENANCE: MaintenanceTicket[] = [
  { id: 'm1', roomNumber: '201', description: 'AC unit leaking water', priority: 'High', status: 'In Progress', reportedBy: 'Housekeeping', date: '2023-10-26' },
  { id: 'm2', roomNumber: '103', description: 'TV remote batteries dead', priority: 'Low', status: 'Pending', reportedBy: 'Guest', date: '2023-10-27' },
];

export const MOCK_STAFF: Staff[] = [
  { id: 's1', name: 'Sarah Connor', role: 'Manager', status: 'On Duty', shift: 'Morning' },
  { id: 's2', name: 'John Doe', role: 'Reception', status: 'On Duty', shift: 'Morning' },
  { id: 's3', name: 'Jane Roe', role: 'Housekeeping', status: 'Break', shift: 'Morning' },
  { id: 's4', name: 'Mike Fixit', role: 'Maintenance', status: 'Off Duty', shift: 'Night' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2023-10-26', category: 'Room Revenue', amount: 450, description: 'Room 101 Payment', type: 'Income' },
  { id: 't2', date: '2023-10-26', category: 'F&B', amount: 75, description: 'Breakfast Service', type: 'Income' },
  { id: 't3', date: '2023-10-26', category: 'Maintenance Cost', amount: 200, description: 'AC Repair Parts', type: 'Expense' },
  { id: 't4', date: '2023-10-25', category: 'Room Revenue', amount: 1200, description: 'Group Booking Deposit', type: 'Income' },
  { id: 't5', date: '2023-10-25', category: 'Utilities', amount: 500, description: 'Electric Bill', type: 'Expense' },
  { id: 't6', date: '2023-10-24', category: 'Payroll', amount: 3000, description: 'Weekly Staff Payroll', type: 'Expense' },
];