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
    // If auth is not available (e.g., missing Firebase config), skip auth entirely
    if (!auth) {
      console.warn('⚠️ Firebase auth not initialized - running without authentication');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
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
      
      setLoading(false);
    });

    return () => unsubscribe();
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
