import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sha256, DEFAULT_PASSWORD_HASH, PASSWORD_HASH_KEY, HAS_CHANGED_PASSWORD_KEY } from '../utils/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  isForcedPasswordChange: boolean;
  login: (password: string) => Promise<boolean>;
  changePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  forceSetNewPassword: (newPass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isCheckingAuth: true,
  isForcedPasswordChange: false,
  login: async () => false,
  changePassword: async () => false,
  forceSetNewPassword: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isForcedPasswordChange, setIsForcedPasswordChange] = useState(false);
  const [storedHash, setStoredHash] = useState<string>(DEFAULT_PASSWORD_HASH);

  useEffect(() => {
    async function loadAuthSettings() {
      try {
        const hash = await AsyncStorage.getItem(PASSWORD_HASH_KEY);
        const changed = await AsyncStorage.getItem(HAS_CHANGED_PASSWORD_KEY);

        if (hash === null) {
          await AsyncStorage.setItem(PASSWORD_HASH_KEY, DEFAULT_PASSWORD_HASH);
          await AsyncStorage.setItem(HAS_CHANGED_PASSWORD_KEY, 'false');
          setStoredHash(DEFAULT_PASSWORD_HASH);
        } else {
          setStoredHash(hash);
        }
      } catch (error) {
        console.error('Error loading auth settings:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    loadAuthSettings();
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    const inputHash = sha256(password);
    if (inputHash === storedHash) {
      if (inputHash === DEFAULT_PASSWORD_HASH) {
        setIsForcedPasswordChange(true);
      } else {
        setIsAuthenticated(true);
      }
      return true;
    }
    return false;
  }, [storedHash]);

  const forceSetNewPassword = useCallback(async (newPass: string): Promise<boolean> => {
    try {
      const newHash = sha256(newPass);
      await AsyncStorage.setItem(PASSWORD_HASH_KEY, newHash);
      await AsyncStorage.setItem(HAS_CHANGED_PASSWORD_KEY, 'true');
      setStoredHash(newHash);
      setIsForcedPasswordChange(false);
      setIsAuthenticated(true);
      return true;
    } catch (e) {
      console.error('Failed to set new password:', e);
      return false;
    }
  }, []);

  const changePassword = useCallback(async (oldPass: string, newPass: string): Promise<boolean> => {
    try {
      const oldHash = sha256(oldPass);
      if (oldHash !== storedHash) {
        return false;
      }
      const newHash = sha256(newPass);
      await AsyncStorage.setItem(PASSWORD_HASH_KEY, newHash);
      await AsyncStorage.setItem(HAS_CHANGED_PASSWORD_KEY, 'true');
      setStoredHash(newHash);
      setIsForcedPasswordChange(false);
      setIsAuthenticated(true);
      return true;
    } catch (e) {
      console.error('Failed to change password:', e);
      return false;
    }
  }, [storedHash]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setIsForcedPasswordChange(false);
  }, []);

  const value = useMemo(() => ({
    isAuthenticated,
    isCheckingAuth,
    isForcedPasswordChange,
    login,
    changePassword,
    forceSetNewPassword,
    logout,
  }), [
    isAuthenticated,
    isCheckingAuth,
    isForcedPasswordChange,
    login,
    changePassword,
    forceSetNewPassword,
    logout,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
