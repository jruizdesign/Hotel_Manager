import { MaintenanceTicket } from '../types';

/**
 * Simulates sending an email by logging to console and returning a promise.
 * In a real app, this would call a backend endpoint or an Email API like SendGrid/AWS SES.
 */

export const sendMaintenanceRequestEmail = async (ticket: MaintenanceTicket): Promise<boolean> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const timestamp = new Date().toLocaleString();
  
  console.group('%c📧 EMAIL SENT: NEW MAINTENANCE REQUEST', 'color: #10b981; font-weight: bold; font-size: 12px;');
  console.log(`%cTime: ${timestamp}`, 'color: #64748b');
  console.log(`%cTo: maintenance@staysync.hotel`, 'font-weight: bold');
  console.log(`%cSubject: [${ticket.priority.toUpperCase()}] New Issue in Room ${ticket.roomNumber}`, 'font-weight: bold');
  console.log(`----------------------------------------`);
  console.log(`Room: ${ticket.roomNumber}`);
  console.log(`Priority: ${ticket.priority}`);
  console.log(`Reported By: ${ticket.reportedBy}`);
  console.log(`Description: \n${ticket.description}`);
  console.log(`----------------------------------------`);
  console.groupEnd();

  return true;
};

export const sendMaintenanceResolvedEmail = async (ticket: MaintenanceTicket, cost: number, notes: string): Promise<boolean> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const timestamp = new Date().toLocaleString();

  console.group('%c📧 EMAIL SENT: MAINTENANCE TICKET RESOLVED', 'color: #3b82f6; font-weight: bold; font-size: 12px;');
  console.log(`%cTime: ${timestamp}`, 'color: #64748b');
  console.log(`%cTo: manager@staysync.hotel`, 'font-weight: bold');
  console.log(`%cSubject: Ticket Resolved - Room ${ticket.roomNumber}`, 'font-weight: bold');
  console.log(`----------------------------------------`);
  console.log(`Ticket ID: ${ticket.id}`);
  console.log(`Total Cost: $${cost.toFixed(2)}`);
  console.log(`Resolution Notes: \n${notes}`);
  console.log(`----------------------------------------`);
  console.groupEnd();

  return true;
};