import firebase from "firebase/app";
import "firebase/firestore";
import { AppSettings } from "../types";

let dbInstance: firebase.firestore.Firestore | null = null;
let appInstance: firebase.app.App | null = null;

export const initializeFirebase = (settings: AppSettings): firebase.firestore.Firestore | null => {
  if (!settings.firebaseConfig || !settings.firebaseConfig.apiKey) {
    return null;
  }

  // Prevent double initialization
  if (firebase.apps.length > 0) {
    appInstance = firebase.app();
    dbInstance = appInstance.firestore();
    return dbInstance;
  }

  try {
    appInstance = firebase.initializeApp(settings.firebaseConfig);
    dbInstance = appInstance.firestore();
    return dbInstance;
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return null;
  }
};

export const getFirebaseDB = (): firebase.firestore.Firestore | null => {
  return dbInstance;
};