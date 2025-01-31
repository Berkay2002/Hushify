'use client'; // IMPORTANT: This file must be a Client Component

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebaseConfig';

// 1) Define a context type
type AuthContextType = {
  user: FirebaseUser | null | undefined; // null means no user, undefined means not loaded yet
};

// 2) Create the context
const AuthContext = createContext<AuthContextType>({ user: undefined });

// 3) Create a custom hook to read the AuthContext
export function useAuth() {
  return useContext(AuthContext);
}

// 4) AuthProvider component that wraps your app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // If user is signed in, firebaseUser will be a Firebase user object
      // Otherwise it will be null
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
