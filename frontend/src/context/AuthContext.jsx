import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseReady } from '../lib/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('guest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDev = import.meta.env.DEV;
    const anonymousModeEnabled = import.meta.env.VITE_AUTH_ANON_ENABLED === 'true';

    if (isDev) {
      console.debug('🔄 AuthProvider: Initializing...');
    }

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setUserRole((currentRole) => currentRole || 'guest');

      if (isDev) {
        console.debug('⏱️ AuthProvider: Timeout reached (5s) - forcing render');
      }
    }, 5000);

    if (!isFirebaseReady || !auth) {
      setLoading(false);
      clearTimeout(timeoutId);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (isDev) {
          console.debug('🔄 AuthProvider: Auth state changed', currentUser ? 'User logged in' : 'No user');
        }

        setUser(currentUser);

        if (!currentUser) {
          setUserRole('guest');

          if (anonymousModeEnabled) {
            try {
              await signInAnonymously(auth);
              if (isDev) {
                console.debug('✅ AuthProvider: Anonymous sign-in successful');
              }
            } catch (error) {
              console.error('AuthProvider: Anonymous sign-in failed:', error);
            }
          }

          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }

        if (db) {
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserRole(userData.role || 'citoyen');
            } else {
              setUserRole('citoyen');
            }
          } catch (error) {
            console.error('Error fetching user role:', error);
            setUserRole('citoyen');
          }
        }

        setLoading(false);
        clearTimeout(timeoutId);
      },
      (error) => {
        console.error('AuthProvider: onAuthStateChanged failed:', error);
        setLoading(false);
        setUser(null);
        setUserRole('guest');
        clearTimeout(timeoutId);
      }
    );

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const value = {
    user,
    userRole,
    loading,
    isGuest: !user,
    isCitoyen: userRole === 'citoyen',
    isObservateur: userRole === 'observateur',
    isAdmin: userRole === 'admin'
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
