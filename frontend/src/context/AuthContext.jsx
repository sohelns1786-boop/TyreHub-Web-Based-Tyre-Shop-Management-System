import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onIdTokenChanged,
} from 'firebase/auth';
import { auth, hasFirebaseConfig } from '../firebase';
import api from '../api/axios';
import { saveAdminSession } from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize Firebase user with MongoDB
  const syncWithBackend = async (firebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      console.log('[AUTH CONTEXT] Syncing Firebase user with MongoDB...');
      
      const response = await api.post('/auth/firebase-sync', { idToken });
      const { token, user: backendUser } = response.data;
      
      // Save session using existing local storage keys
      saveAdminSession(backendUser, token);
      setUser(backendUser);
      window.dispatchEvent(new Event('auth-change'));
      console.log('[AUTH CONTEXT] Sync completed. User synced:', backendUser.email);
      return backendUser;
    } catch (error) {
      console.error('[AUTH CONTEXT] Synchronization with backend failed:', error?.response?.data?.message || error.message);
      throw error;
    }
  };

  // Auth State Listener
  useEffect(() => {
    if (!hasFirebaseConfig) {
      const loadLocalUser = () => {
        try {
          const u = JSON.parse(localStorage.getItem('tyrehub_user') || 'null');
          setUser(u);
        } catch {
          setUser(null);
        }
        setLoading(false);
      };
      
      loadLocalUser();
      
      window.addEventListener('auth-change', loadLocalUser);
      return () => window.removeEventListener('auth-change', loadLocalUser);
    }

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // Only sync if email is verified (unless it's an admin email which we verify internally or Google logins)
        const isGoogle = firebaseUser.providerData.some((p) => p.providerId === 'google.com');
        const adminEmails = ['admin@tyrehub.com', 'rasheedtyresplanet@gmail.com', 'sohelns1786@gmail.com'];
        const isMatchedAdmin = adminEmails.includes(firebaseUser.email?.toLowerCase());

        if (firebaseUser.emailVerified || isGoogle || isMatchedAdmin) {
          try {
            await syncWithBackend(firebaseUser);
          } catch (err) {
            // If sync fails, clear frontend session
            localStorage.removeItem('tyrehub_token');
            localStorage.removeItem('tyrehub_user');
            setUser(null);
          }
        } else {
          // User is signed in but email is not verified
          console.warn('[AUTH CONTEXT] User email is not verified yet.');
          localStorage.removeItem('tyrehub_token');
          localStorage.removeItem('tyrehub_user');
          setUser(null);
        }
      } else {
        console.log('[AUTH CONTEXT] Firebase user is logged out.');
        localStorage.removeItem('tyrehub_token');
        localStorage.removeItem('tyrehub_user');
        setUser(null);
        window.dispatchEvent(new Event('auth-change'));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email and Password Registration
  const registerWithEmail = async (email, password, name) => {
    if (!hasFirebaseConfig) {
      throw new Error('Firebase configuration is missing.');
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name
      await updateProfile(userCredential.user, { displayName: name });
      // Send verification email
      await sendEmailVerification(userCredential.user);
      // Immediately sign out to prevent session creation before verification
      await signOut(auth);
      return userCredential.user;
    } catch (error) {
      console.error('[AUTH CONTEXT] Registration error:', error.message);
      throw error;
    }
  };

  // Email and Password Login
  const loginWithEmail = async (email, password) => {
    if (!hasFirebaseConfig) {
      throw new Error('Firebase configuration is missing.');
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = userCredential;

      const adminEmails = ['admin@tyrehub.com', 'rasheedtyresplanet@gmail.com', 'sohelns1786@gmail.com'];
      const isMatchedAdmin = adminEmails.includes(firebaseUser.email?.toLowerCase());

      if (!firebaseUser.emailVerified && !isMatchedAdmin) {
        // Send/resend verification email and sign out
        await sendEmailVerification(firebaseUser);
        await signOut(auth);
        throw new Error('Your email is not verified. A verification link has been sent to your email.');
      }
      
      const backendUser = await syncWithBackend(firebaseUser);
      return backendUser;
    } catch (error) {
      console.error('[AUTH CONTEXT] Login error:', error.message);
      throw error;
    }
  };

  // Google Login
  const loginWithGoogle = async () => {
    if (!hasFirebaseConfig) {
      throw new Error('Firebase configuration is missing.');
    }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      const backendUser = await syncWithBackend(userCredential.user);
      return backendUser;
    } catch (error) {
      console.error('[AUTH CONTEXT] Google Login error:', error.message);
      throw error;
    }
  };

  // Password Reset
  const resetPassword = async (email) => {
    if (!hasFirebaseConfig) {
      throw new Error('Firebase configuration is missing.');
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('[AUTH CONTEXT] Password Reset error:', error.message);
      throw error;
    }
  };

  // Logout
  const logoutUser = async () => {
    if (hasFirebaseConfig) {
      await signOut(auth);
    } else {
      localStorage.removeItem('tyrehub_token');
      localStorage.removeItem('tyrehub_user');
      setUser(null);
      window.dispatchEvent(new Event('auth-change'));
    }
  };

  // Profile Update helper (to trigger sync after name/photo change)
  const refreshUser = async () => {
    if (hasFirebaseConfig && auth.currentUser) {
      await syncWithBackend(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logoutUser,
        resetPassword,
        refreshUser,
        hasFirebaseConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
