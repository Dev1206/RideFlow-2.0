import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'test-key',
  authDomain: 'test-domain',
  projectId: 'test-project',
  storageBucket: 'test-bucket',
  messagingSenderId: 'test-sender',
  appId: 'test-app'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { firebaseConfig }; 