import * as firebase from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, User, Auth } from "firebase/auth";
import { AppSettings } from "../types";

let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let appInstance: any | null = null;

export const initializeFirebase = (settings: AppSettings): Firestore | null => {
  if (!settings.firebaseConfig || !settings.firebaseConfig.apiKey) {
    return null;
  }

  // Prevent double initialization
  if (appInstance) {
    if (!dbInstance) {
      dbInstance = getFirestore(appInstance);
    }
    if (!authInstance) {
        authInstance = getAuth(appInstance);
    }
    return dbInstance;
  }

  try {
    appInstance = firebase.initializeApp(settings.firebaseConfig);
    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
    return dbInstance;
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return null;
  }
};

export const getFirebaseDB = (): Firestore | null => {
  return dbInstance;
};

// --- Authentication Exports ---

export const loginTerminal = async (email: string, pass: string) => {
    if (!authInstance) throw new Error("Cloud connection not active. Check settings.");
    return await signInWithEmailAndPassword(authInstance, email, pass);
};

export const logoutTerminal = async () => {
    if (!authInstance) return;
    return await signOut(authInstance);
};

export const resetTerminalPassword = async (email: string) => {
    if (!authInstance) throw new Error("Cloud connection not active. Check settings.");
    return await sendPasswordResetEmail(authInstance, email);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    // If not initialized yet, we can't subscribe. 
    // In a real app, we might wait, but here we assume init happens early in App.tsx
    if (!authInstance && appInstance) {
        authInstance = getAuth(appInstance);
    }
    
    if (authInstance) {
        return onAuthStateChanged(authInstance, callback);
    }
    return () => {}; // No-op unsubscribe
};

export const getAuthInstance = () => authInstance;