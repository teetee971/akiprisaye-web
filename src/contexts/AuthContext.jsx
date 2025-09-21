import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userClaims, setUserClaims] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get user claims (including admin role)
        try {
          const token = await user.getIdTokenResult();
          setUserClaims(token.claims);
        } catch (error) {
          console.error('Error getting user claims:', error);
          setUserClaims({});
        }
      } else {
        setUserClaims(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = () => {
    return userClaims?.admin === true;
  };

  const isPremium = () => {
    return userClaims?.premium === true;
  };

  const value = {
    currentUser,
    userClaims,
    isAdmin,
    isPremium,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}