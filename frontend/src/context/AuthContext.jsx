import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
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
  const [userRole, setUserRole] = useState('guest'); // 'guest', 'citoyen', 'observateur', 'admin'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 AuthProvider: Initializing...');
    
    // Hard timeout to prevent infinite loading - force render after 5 seconds
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('⏱️ AuthProvider: Timeout reached (5s) - forcing render');
        setLoading(false);
        setUserRole('guest');
      }
    }, 5000);

    // If auth is not available (e.g., missing Firebase config), skip auth entirely
    if (!auth) {
      console.warn('⚠️ Firebase auth not initialized - running without authentication');
      setLoading(false);
      clearTimeout(timeoutId);
      return;
    }

    console.log('✅ AuthProvider: Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('🔄 AuthProvider: Auth state changed', currentUser ? 'User logged in' : 'No user');
      setUser(currentUser);
      
      // Fetch user role from Firestore if available
      if (currentUser && db) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role || 'citoyen'); // Default to 'citoyen' if no role specified
          } else {
            setUserRole('citoyen'); // Default for new users
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('citoyen'); // Default on error
        }
      } else if (!currentUser) {
        setUserRole('guest');
      }
      
      console.log('✅ AuthProvider: Initialization complete');
      setLoading(false);
      clearTimeout(timeoutId);
    });

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
    isAdmin: userRole === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
