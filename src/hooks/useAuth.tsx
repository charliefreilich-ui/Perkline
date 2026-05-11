import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from '../lib/firebase';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  totalSavings: number;
  dealsUsedCount: number;
  isAdmin?: boolean;
  isMerchant?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isMerchant: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.email?.toLowerCase() === 'charlie.freilich@gmail.com';
  const isMerchant = isAdmin || user?.email?.toLowerCase() === 'clfreilich@ucdavis.edu' || profile?.isMerchant === true;

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      
      // Clear previous listener if any
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (authUser) {
        // Sync/Fetch profile
        const userRef = doc(db, 'users', authUser.uid);
        
        // Use onSnapshot for real-time updates to savings/stats
        unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile({ uid: authUser.uid, ...docSnap.data() } as UserProfile);
          } else {
            // New user initialization
            const newProfile = {
              displayName: authUser.displayName || 'Guest',
              email: authUser.email || '',
              photoURL: authUser.photoURL || '',
              totalSavings: 0,
              dealsUsedCount: 0,
              updatedAt: new Date().toISOString()
            };
            setDoc(userRef, newProfile).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${authUser.uid}`));
            setProfile({ uid: authUser.uid, ...newProfile } as UserProfile);
          }
          setLoading(false);
        }, (error) => {
          // Ignore permission errors during sign out transitions
          if (error.code !== 'permission-denied') {
            handleFirestoreError(error, OperationType.GET, `users/${authUser.uid}`);
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const signIn = async () => {
    const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOutUser = async () => {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isMerchant, signIn, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
