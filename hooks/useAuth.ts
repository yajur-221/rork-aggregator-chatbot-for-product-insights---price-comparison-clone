import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profilePicture?: string;
  loginMethod: 'google' | 'phone';
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (method: 'google' | 'phone', data?: any) => Promise<void>;
  logout: () => Promise<void>;
  sendOTP: (phoneNumber: string) => Promise<boolean>;
  verifyOTP: (phoneNumber: string, otp: string) => Promise<boolean>;
}

const AUTH_STORAGE_KEY = '@auth_user';

// Mock OTP storage for demo purposes
const otpStorage: { [key: string]: string } = {};

// Simple storage functions for demo
const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  // For mobile, we'll use a simple in-memory storage for demo
  return null;
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  }
  // For mobile, we'll use a simple in-memory storage for demo
};

const removeStorageItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  }
  // For mobile, we'll use a simple in-memory storage for demo
};

export const [AuthProvider, useAuth] = createContextHook((): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on app start
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const storedUser = await getStorageItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserToStorage = useCallback(async (userData: User) => {
    if (!userData || !userData.id?.trim()) {
      console.error('Invalid user data provided');
      return;
    }
    try {
      await setStorageItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }, []);

  const login = useCallback(async (method: 'google' | 'phone', data?: any) => {
    setIsLoading(true);
    try {
      if (method === 'google') {
        // For demo purposes, create a mock Google user
        const userData: User = {
          id: 'google_' + Date.now(),
          name: 'Google User',
          email: 'user@gmail.com',
          profilePicture: 'https://via.placeholder.com/100',
          loginMethod: 'google',
        };
        setUser(userData);
        await saveUserToStorage(userData);
      } else if (method === 'phone' && data) {
        if (!data.phoneNumber?.trim()) {
          console.error('Invalid phone number provided');
          return;
        }
        // Phone login is handled via OTP verification
        const userData: User = {
          id: data.phoneNumber.trim(),
          name: data.name?.trim() || 'User',
          phone: data.phoneNumber.trim(),
          loginMethod: 'phone',
        };
        setUser(userData);
        await saveUserToStorage(userData);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [saveUserToStorage]);

  const logout = useCallback(async () => {
    try {
      await removeStorageItem(AUTH_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const sendOTP = useCallback(async (phoneNumber: string): Promise<boolean> => {
    if (!phoneNumber?.trim() || phoneNumber.length < 10) {
      console.error('Invalid phone number provided');
      return false;
    }
    try {
      const sanitizedPhone = phoneNumber.trim();
      // Generate a random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP temporarily (in real app, send via SMS service)
      otpStorage[sanitizedPhone] = otp;
      
      // Log OTP for demo purposes (remove in production)
      console.log(`OTP for ${sanitizedPhone}: ${otp}`);
      
      // In a real app, you would call your SMS service here
      // await smsService.sendOTP(phoneNumber, otp);
      
      return true;
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  }, []);

  const verifyOTP = useCallback(async (phoneNumber: string, otp: string): Promise<boolean> => {
    if (!phoneNumber?.trim() || !otp?.trim() || otp.length !== 6) {
      console.error('Invalid phone number or OTP provided');
      return false;
    }
    try {
      const sanitizedPhone = phoneNumber.trim();
      const sanitizedOTP = otp.trim();
      const storedOTP = otpStorage[sanitizedPhone];
      if (storedOTP && storedOTP === sanitizedOTP) {
        // Clear OTP after successful verification
        delete otpStorage[sanitizedPhone];
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }
  }, []);

  return useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    sendOTP,
    verifyOTP,
  }), [user, isLoading, login, logout, sendOTP, verifyOTP]);
});