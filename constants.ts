import { BookingHistory, Guest, MaintenanceTicket, Room, RoomStatus, RoomType, Staff, Transaction } from "./types";

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
  { id: 'g1', name: 'Guest One', email: 'guest1@example.com', phone: '555-0101', checkIn: '2023-10-25', checkOut: '2023-10-28', roomNumber: '102', vip: false, status: 'Checked In', balance: 0 },
  { id: 'g2', name: 'Guest Two', email: 'guest2@example.com', phone: '555-0102', checkIn: '2023-10-26', checkOut: '2023-10-30', roomNumber: '202', vip: true, status: 'Checked In', balance: 125 },
  { id: 'g3', name: 'Guest Three', email: 'guest3@example.com', phone: '555-0103', checkIn: '2023-10-28', checkOut: '2023-11-01', roomNumber: '104', vip: false, status: 'Reserved', balance: 0 },
];

export const MOCK_HISTORY: BookingHistory[] = [
  { id: 'h1', guestId: 'g1', checkIn: '2022-12-10', checkOut: '2022-12-15', roomNumber: '101', roomType: RoomType.SINGLE, totalAmount: 600, status: 'Completed', rating: 5 },
  { id: 'h2', guestId: 'g1', checkIn: '2023-05-20', checkOut: '2023-05-22', roomNumber: '103', roomType: RoomType.DOUBLE, totalAmount: 360, status: 'Completed', rating: 4 },
];

export const MOCK_MAINTENANCE: MaintenanceTicket[] = [
  { id: 'm1', roomNumber: '201', description: 'AC unit leaking water', priority: 'High', status: 'In Progress', reportedBy: 'Housekeeping', date: '2023-10-26' },
  { id: 'm2', roomNumber: '103', description: 'TV remote batteries dead', priority: 'Low', status: 'Pending', reportedBy: 'Guest', date: '2023-10-27' },
];

// Generic Demo Staff - Used only for Offline Demo Mode
export const MOCK_STAFF: Staff[] = [
  { id: 's0', name: 'Demo Admin', email: 'admin@hotel.com', role: 'Superuser', status: 'On Duty', shift: 'Any', pin: '0000' },
  { id: 's1', name: 'Demo Manager', email: 'manager@hotel.com', role: 'Manager', status: 'On Duty', shift: 'Morning', pin: '1234' },
  { id: 's2', name: 'Front Desk', email: 'reception@hotel.com', role: 'Reception', status: 'On Duty', shift: 'Morning', pin: '1111' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2023-10-26', category: 'Room Revenue', amount: 450, description: 'Room 101 Payment', type: 'Income' },
  { id: 't2', date: '2023-10-26', category: 'F&B', amount: 75, description: 'Breakfast Service', type: 'Income' },
];