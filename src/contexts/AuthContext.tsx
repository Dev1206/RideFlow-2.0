import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  User as FirebaseUser 
} from 'firebase/auth';
import { createUser, setAuthToken } from '../services/api';

interface AuthContextType {
  user: FirebaseUser | null;
  userRoles: string[];
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isDeveloper: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const isDeveloper = () => {
    return userRoles.includes('developer');
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get the ID token
          const idToken = await firebaseUser.getIdToken();
          // Save Firebase token first
          localStorage.setItem('token', idToken);
          
          // Create or update user in backend
          const userData = {
            firebaseUID: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            photoURL: firebaseUser.photoURL || undefined
          };
          
          const response = await createUser(userData);
          
          // Save the JWT token from backend
          if (response.data?.token) {
            setAuthToken(response.data.token);
            setUserRoles(response.data.user.roles || []);
          }
          
          setUser(firebaseUser);
        } else {
          setUser(null);
          setUserRoles([]);
          localStorage.removeItem('token');
          setAuthToken('');
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
        setUserRoles([]);
        localStorage.removeItem('token');
        setAuthToken('');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Use signInWithPopup directly from firebase/auth
      const result = await signInWithPopup(auth, provider);
      if (!result.user) {
        throw new Error('No user data from Google sign in');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setAuthToken('');
      setUserRoles([]);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRoles, 
      loading, 
      signInWithGoogle, 
      signOut,
      isDeveloper
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 