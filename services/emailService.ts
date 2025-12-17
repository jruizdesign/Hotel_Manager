import { MaintenanceTicket } from '../types';
import { StorageService } from './storage';

const API_URL = 'http://localhost:3000';

/**
 * Sends a maintenance request alert via the backend email queue.
 */
export const sendMaintenanceRequestEmail = async (ticket: MaintenanceTicket): Promise<boolean> => {
  try {
    const settings = await StorageService.getSettings();
    const toEmail = settings.maintenanceEmail || 'maintenance@staysync.hotel';

    // Construct the email payload
    const payload = {
      to: toEmail,
      subject: `[${ticket.priority.toUpperCase()}] New Issue in Room ${ticket.roomNumber}`,
      body: `MAINTENANCE REQUEST\n\nRoom: ${ticket.roomNumber}\nPriority: ${ticket.priority}\nReported By: ${ticket.reportedBy}\nDate: ${ticket.date}\n\nDescription:\n${ticket.description}`
    };

    const response = await fetch(`${API_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Failed to send maintenance email:", error);
    // We throw the error so the UI (App.tsx) knows to display the "Email Failed" toast
    throw error; 
  }
};

/**
 * Sends a resolution report email via the backend email queue.
 */
export const sendMaintenanceResolvedEmail = async (ticket: MaintenanceTicket, cost: number, notes: string): Promise<boolean> => {
  try {
    const settings = await StorageService.getSettings();
    // Default to maintenance email for resolution report as well, or manager if preferred
    const toEmail = settings.maintenanceEmail || 'maintenance@staysync.hotel';

    const payload = {
      to: toEmail,
      subject: `Ticket Resolved - Room ${ticket.roomNumber}`,
      body: `TICKET RESOLVED\n\nTicket ID: ${ticket.id}\nRoom: ${ticket.roomNumber}\n\nTotal Cost: $${cost.toFixed(2)}\n\nResolution Notes:\n${notes}\n\nStatus: Closed`
    };

    const response = await fetch(`${API_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Failed to send resolution email:", error);
    throw error;
  }
};