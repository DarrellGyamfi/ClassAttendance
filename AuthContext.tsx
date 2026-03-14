import React, { createContext, useContext, useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import firestore, { Timestamp } from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'teacher' | 'student') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
        if (userDoc.exists()) {
          let userData = userDoc.data() as User;
          const authStatus = await messaging().requestPermission();
          let token = null;
          if (authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
            token = await messaging().getToken();
          }
          if (token) {
            userData.fcmToken = token;
            await firestore().collection('users').doc(firebaseUser.uid).update({ fcmToken: token });
          }
          setUser(userData);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
 
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await auth().signInWithEmailAndPassword(email, password);
  };

  const signup = async (email: string, password: string, name: string, role: 'teacher' | 'student') => {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const uid = userCredential.user.uid;
    const userData: User = { uid, email, displayName: name, role, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
    await firestore().collection('users').doc(uid).set(userData);
    setUser(userData);
  };

  const logout = async () => {
    await auth().signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};