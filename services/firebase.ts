import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail, 
  createUserWithEmailAndPassword, 
  updatePassword, 
  User, 
  Auth 
} from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { AppSettings } from "../types";

let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let appInstance: FirebaseApp | null = null;

// Manual subscribers to handle "Offline/Mock" login state updates
let authSubscribers: ((user: User | null) => void)[] = [];

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
    appInstance = initializeApp(settings.firebaseConfig);

    // Initialize App Check
    // Using the site key provided in the integration request
    if (typeof window !== 'undefined') {
      initializeAppCheck(appInstance, {
        provider: new ReCaptchaV3Provider('abcdefghijklmnopqrstuvwxy-1234567890abcd'),
        isTokenAutoRefreshEnabled: true
      });
    }

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
    // 1. Default Bypass for Testing/Offline Mode
    if (email === 'admin@hotel.com' && pass === 'password123') {
        const mockUser: any = {
            uid: 'offline-admin-123',
            email: 'admin@hotel.com',
            displayName: 'System Admin (Offline)',
            emailVerified: true,
            isAnonymous: false,
            metadata: {},
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: async () => {},
            getIdToken: async () => 'mock-token',
            getIdTokenResult: async () => ({
                token: 'mock-token',
                signInProvider: 'custom',
                claims: {},
                authTime: Date.now().toString(),
                issuedAtTime: Date.now().toString(),
                expirationTime: (Date.now() + 3600000).toString(),
            }),
            reload: async () => {},
            toJSON: () => ({})
        };
        
        // Notify app that we are logged in
        authSubscribers.forEach(cb => cb(mockUser));
        return { user: mockUser };
    }

    // 2. Standard Firebase Login
    if (!authInstance) throw new Error("Cloud connection not active. Use default admin@hotel.com / password123");
    return await signInWithEmailAndPassword(authInstance, email, pass);
};

export const registerTerminalUser = async (email: string, pass: string) => {
    if (!authInstance) throw new Error("Cloud connection not active. Check settings.");
    return await createUserWithEmailAndPassword(authInstance, email, pass);
};

export const changeUserPassword = async (newPassword: string) => {
    if (!authInstance || !authInstance.currentUser) throw new Error("No active cloud user found.");
    return await updatePassword(authInstance.currentUser, newPassword);
};

export const logoutTerminal = async () => {
    // 1. Clear local subscribers (logs out offline user)
    authSubscribers.forEach(cb => cb(null));

    // 2. Sign out of Firebase if active
    if (!authInstance) return;
    return await signOut(authInstance);
};

export const resetTerminalPassword = async (email: string) => {
    if (!authInstance) throw new Error("Cloud connection not active. Check settings.");
    return await sendPasswordResetEmail(authInstance, email);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    // Register the subscriber
    authSubscribers.push(callback);
    
    // If not initialized yet, we can't subscribe to real Firebase yet.
    // In a real app, we might wait, but here we assume init happens early in App.tsx
    if (!authInstance && appInstance) {
        authInstance = getAuth(appInstance);
    }
    
    // If Firebase is active, hook up the real listener
    if (authInstance) {
        const unsubscribeFirebase = onAuthStateChanged(authInstance, (user) => {
            callback(user);
        });
        
        // Return a cleanup function that removes from our array AND unsubscribes from Firebase
        return () => {
            authSubscribers = authSubscribers.filter(cb => cb !== callback);
            unsubscribeFirebase();
        };
    }

    // If no Firebase, we just wait for manual events via authSubscribers
    // Initial state is null (logged out)
    callback(null);

    return () => {
        authSubscribers = authSubscribers.filter(cb => cb !== callback);
    };
};

export const getAuthInstance = () => authInstance;