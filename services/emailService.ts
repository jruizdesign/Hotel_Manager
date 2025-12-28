import { MaintenanceTicket } from '../types';
import { StorageService } from './storage';
import { getFirebaseDB } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

/**
 * Sends an email by creating a document in the 'mail' collection in Firestore.
 * This is a generic function that can be used for any email.
 * @param to The recipient's email address.
 * @param subject The subject of the email.
 * @param body The plain text body of the email.
 */
export const sendCustomEmail = async (to: string, subject: string, body: string): Promise<boolean> => {
  try {
    const db = getFirebaseDB();
    if (!db) {
      throw new Error("Firestore is not initialized. Cannot send email.");
    }

    const emailPayload = {
      to: [to], // The extension expects an array
      message: {
        subject: subject,
        text: body,
      },
    };

    await addDoc(collection(db, 'mail'), emailPayload);
    return true;
  } catch (error) {
    console.error("Failed to send custom email via Firestore:", error);
    throw error;
  }
};


/**
 * Sends a maintenance request alert by creating a document in Firestore,
 * which triggers the firestore-send-email extension.
 */
export const sendMaintenanceRequestEmail = async (ticket: MaintenanceTicket): Promise<boolean> => {
  const settings = await StorageService.getSettings();
  const toEmail = settings.maintenanceEmail || 'maintenance@staysync.hotel';

  const subject = `[${ticket.priority.toUpperCase()}] New Issue in Room ${ticket.roomNumber}`;
  const body = `MAINTENANCE REQUEST\n\nRoom: ${ticket.roomNumber}\nPriority: ${ticket.priority}\nReported By: ${ticket.reportedBy}\nDate: ${ticket.date}\n\nDescription:\n${ticket.description}`;

  return await sendCustomEmail(toEmail, subject, body);
};

/**
 * Sends a resolution report email by creating a document in Firestore.
 */
export const sendMaintenanceResolvedEmail = async (ticket: MaintenanceTicket, cost: number, notes: string): Promise<boolean> => {
  const settings = await StorageService.getSettings();
  const toEmail = settings.maintenanceEmail || 'maintenance@staysync.hotel';

  const subject = `Ticket Resolved - Room ${ticket.roomNumber}`;
  const body = `TICKET RESOLVED\n\nTicket ID: ${ticket.id}\nRoom: ${ticket.roomNumber}\n\nTotal Cost: $${cost.toFixed(2)}\n\nResolution Notes:\n${notes}\n\nStatus: Closed`;
  
  return await sendCustomEmail(toEmail, subject, body);
};
