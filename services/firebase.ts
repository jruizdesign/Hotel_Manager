import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { AppSettings } from "../types";

let dbInstance: Firestore | null = null;
let appInstance: any = null;

export const initializeFirebase = (settings: AppSettings): Firestore | null => {
  if (!settings.firebaseConfig || !settings.firebaseConfig.apiKey) {
    return null;
  }

  // Prevent double initialization
  if (appInstance) {
    // In modular SDK, getting firestore multiple times for the same app is fine, it returns the existing instance
    if (!dbInstance) {
      dbInstance = getFirestore(appInstance);
    }
    return dbInstance;
  }

  try {
    appInstance = initializeApp(settings.firebaseConfig);
    dbInstance = getFirestore(appInstance);
    return dbInstance;
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return null;
  }
};

export const getFirebaseDB = (): Firestore | null => {
  return dbInstance;
};