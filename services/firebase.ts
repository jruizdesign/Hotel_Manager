import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  updatePassword,
  Auth, 
  User
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { AppSettings } from "../types";

let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let storageInstance: FirebaseStorage | null = null;
let appInstance: FirebaseApp | null = null;

// Manual subscribers to handle "Offline/Mock" login state updates
let authSubscribers: ((user: User | null) => void)[] = [];

// Local Storage Key for Mock Users
const LOCAL_USERS_KEY = 'staysync_local_users';

export const initializeFirebase = (settings: AppSettings): Firestore | null => {
  if (!settings.firebaseConfig || !settings.firebaseConfig.apiKey) {
    return null;
  }

  // Prevent double initialization
  if (getApps().length > 0) {
    appInstance = getApp();
    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
    storageInstance = getStorage(appInstance);
    return dbInstance;
  }

  try {
    appInstance = initializeApp(settings.firebaseConfig);

    // Initialize App Check if configured
    if (settings.recaptchaSiteKey) {
        if ((import.meta as any).env?.DEV) {
            (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        }

        initializeAppCheck(appInstance, {
            provider: new ReCaptchaV3Provider(settings.recaptchaSiteKey),
            isTokenAutoRefreshEnabled: true
        });
    }

    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
    storageInstance = getStorage(appInstance);
    return dbInstance;
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return null;
  }
};

export const getFirebaseDB = (): Firestore | null => {
  return dbInstance;
};

export const getFirebaseStorage = (): FirebaseStorage | null => {
  return storageInstance;
};

// --- Mock Auth Helpers ---

const getLocalUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  } catch { return []; }
};

const saveLocalUser = (user: any) => {
  const users = getLocalUsers();
  users.push(user);
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const createMockUserObject = (data: any): any => ({
    uid: data.uid || 'mock-uid-' + Date.now(),
    email: data.email,
    displayName: data.displayName || data.email.split('@')[0],
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
});

// --- Authentication Exports ---

export const loginTerminal = async (email: string, pass: string) => {
    if (authInstance) {
        return await signInWithEmailAndPassword(authInstance, email, pass);
    }

    if (email === 'admin@hotel.com' && pass === 'password123') {
        const mockUser = createMockUserObject({
            uid: 'offline-admin-123',
            email: 'admin@hotel.com',
            displayName: 'System Admin (Offline)'
        });
        
        authSubscribers.forEach(cb => cb(mockUser));
        return { user: mockUser };
    }

    const localUsers = getLocalUsers();
    const found = localUsers.find((u: any) => u.email === email && u.password === pass);
    
    if (found) {
          const mockUser = createMockUserObject(found);
          authSubscribers.forEach(cb => cb(mockUser));
          return { user: mockUser };
    }

    throw new Error("Invalid credentials (Offline Mode). Cloud Sync is disabled.");
};

export const registerTerminalUser = async (email: string, pass: string) => {
    if (authInstance) {
        return await createUserWithEmailAndPassword(authInstance, email, pass);
    }

    const localUsers = getLocalUsers();
    if (localUsers.find((u: any) => u.email === email)) {
            throw new Error("Email already in use (Offline Mode).");
    }
    
    const newUser = {
        uid: `local-${Date.now()}`,
        email,
        password: pass, 
        displayName: email.split('@')[0]
    };
    saveLocalUser(newUser);
    
    const mockUser = createMockUserObject(newUser);
    authSubscribers.forEach(cb => cb(mockUser));
    return { user: mockUser };
};

export const changeUserPassword = async (newPassword: string) => {
    if (!authInstance) {
        throw new Error("Password change for Offline Admin is not supported. Use Cloud Sync for full features.");
    }
    if (!authInstance.currentUser) throw new Error("No active cloud user found.");
    return await updatePassword(authInstance.currentUser, newPassword);
};

export const logoutTerminal = async () => {
    authSubscribers.forEach(cb => cb(null));
    if (!authInstance) return;
    return await signOut(authInstance);
};

export const resetTerminalPassword = async (email: string) => {
    if (!authInstance) {
        throw new Error("Password reset unavailable in Offline Mode. Contact system administrator.");
    }
    return await sendPasswordResetEmail(authInstance, email);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    authSubscribers.push(callback);
    
    if (!authInstance && getApps().length > 0) {
        authInstance = getAuth(getApp());
    }
    
    if (authInstance) {
        const unsubscribeFirebase = onAuthStateChanged(authInstance, (user) => {
            callback(user);
        });
        
        return () => {
            authSubscribers = authSubscribers.filter(cb => cb !== callback);
            unsubscribeFirebase();
        };
    }

    callback(null);

    return () => {
        authSubscribers = authSubscribers.filter(cb => cb !== callback);
    };
};

export const getAuthInstance = () => authInstance;