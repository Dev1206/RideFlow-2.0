import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { AppError, ErrorType, ErrorCode } from '../utils/errorHandling';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const getFirebaseConfig = (): FirebaseConfig => {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Validate config
  const missingKeys = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new AppError(
      `Missing Firebase configuration keys: ${missingKeys.join(', ')}`,
      ErrorType.VALIDATION,
      ErrorCode.MISSING_FIELD
    );
  }

  return config as FirebaseConfig;
};

let app: FirebaseApp;
let auth: Auth;

try {
  app = initializeApp(getFirebaseConfig());
  auth = getAuth(app);
} catch (error) {
  throw new AppError(
    'Failed to initialize Firebase',
    ErrorType.VALIDATION,
    ErrorCode.INVALID_INPUT,
    { originalError: error }
  );
}

export { auth }; 