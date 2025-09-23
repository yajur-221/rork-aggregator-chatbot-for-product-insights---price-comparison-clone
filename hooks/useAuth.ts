import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Configure WebBrowser for auth session
WebBrowser.maybeCompleteAuthSession();

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
const OTP_STORAGE_KEY = '@otp_data';

// Google OAuth Configuration - Replace with your actual client IDs
const GOOGLE_CLIENT_ID = Platform.select({
  web: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
  default: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
});

// SMS Service Configuration - For demo purposes, we'll simulate SMS sending
// In production, replace with your actual SMS service (Twilio, AWS SNS, etc.)
const SMS_SERVICE_URL = 'https://api.example-sms-service.com/send'; // Replace with real SMS service

interface OTPData {
  otp: string;
  phoneNumber: string;
  timestamp: number;
  attempts: number;
}

// Real storage functions using AsyncStorage
const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Error getting storage item:', error);
    return null;
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Error setting storage item:', error);
  }
};

const removeStorageItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing storage item:', error);
  }
};

// Demo SMS sending function - simulates real SMS service
const sendSMSOTP = async (phoneNumber: string, otp: string): Promise<boolean> => {
  try {
    // For demo purposes, we'll simulate the SMS sending process
    // In production, replace this with your actual SMS service integration
    
    console.log('🚀 Simulating SMS sending...');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, you would make a real API call like this:
    /*
    const response = await fetch(SMS_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SMS_API_KEY',
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`SMS API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('SMS sent successfully:', result);
    */
    
    // For demo purposes, always succeed and log the OTP
    console.log(`📱 SMS would be sent to: ${phoneNumber}`);
    console.log(`🔐 Your OTP code is: ${otp}`);
    console.log('⏰ This code expires in 10 minutes');
    console.log('\n💡 In production, this would be sent via your SMS provider (Twilio, AWS SNS, etc.)');
    
    return true;
  } catch (error) {
    console.error('SMS sending simulation error:', error);
    // Even if there's an error, we'll still show the OTP for demo purposes
    console.log(`🔐 Demo OTP for ${phoneNumber}: ${otp}`);
    return true;
  }
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
        // Simplified Google OAuth implementation for demo
        // In production, you would implement full OAuth flow
        
        // For demo purposes, create a mock Google user after simulating auth
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate auth delay
        
        const userData: User = {
          id: 'google_' + Date.now(),
          name: 'Google User',
          email: 'user@gmail.com',
          profilePicture: 'https://via.placeholder.com/100/4285f4/ffffff?text=G',
          loginMethod: 'google',
        };
        
        setUser(userData);
        await saveUserToStorage(userData);
        
        // TODO: Implement real Google OAuth
        // const redirectUri = AuthSession.makeRedirectUri();
        // const request = new AuthSession.AuthRequest({
        //   clientId: GOOGLE_CLIENT_ID!,
        //   scopes: ['openid', 'profile', 'email'],
        //   redirectUri,
        //   responseType: AuthSession.ResponseType.Code,
        // });
        // const result = await request.promptAsync({
        //   authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        // });
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
      throw error;
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
      
      // Check if we recently sent an OTP to prevent spam
      const existingOTPData = await getStorageItem(OTP_STORAGE_KEY);
      if (existingOTPData) {
        const otpData: OTPData = JSON.parse(existingOTPData);
        const timeDiff = Date.now() - otpData.timestamp;
        if (timeDiff < 60000 && otpData.phoneNumber === sanitizedPhone) { // 1 minute cooldown
          console.log('OTP already sent recently. Please wait.');
          return false;
        }
      }
      
      // Generate a random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP data with timestamp and attempts
      const otpData: OTPData = {
        otp,
        phoneNumber: sanitizedPhone,
        timestamp: Date.now(),
        attempts: 0,
      };
      
      await setStorageItem(OTP_STORAGE_KEY, JSON.stringify(otpData));
      
      // Send SMS using real SMS service
      const smsSent = await sendSMSOTP(sanitizedPhone, otp);
      
      if (!smsSent) {
        // Clean up if SMS failed
        await removeStorageItem(OTP_STORAGE_KEY);
        return false;
      }
      
      // Log OTP for demo purposes
      console.log(`✅ OTP sent to ${sanitizedPhone}: ${otp}`);
      console.log('📱 In production, this would be sent via SMS service');
      
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
      
      const storedOTPData = await getStorageItem(OTP_STORAGE_KEY);
      if (!storedOTPData) {
        console.error('No OTP data found');
        return false;
      }
      
      const otpData: OTPData = JSON.parse(storedOTPData);
      
      // Check if OTP is expired (10 minutes)
      const timeDiff = Date.now() - otpData.timestamp;
      if (timeDiff > 600000) { // 10 minutes
        await removeStorageItem(OTP_STORAGE_KEY);
        console.error('OTP expired');
        return false;
      }
      
      // Check if too many attempts
      if (otpData.attempts >= 3) {
        await removeStorageItem(OTP_STORAGE_KEY);
        console.error('Too many OTP attempts');
        return false;
      }
      
      // Check if phone number matches
      if (otpData.phoneNumber !== sanitizedPhone) {
        console.error('Phone number mismatch');
        return false;
      }
      
      // Verify OTP
      if (otpData.otp === sanitizedOTP) {
        // Clear OTP after successful verification
        await removeStorageItem(OTP_STORAGE_KEY);
        return true;
      } else {
        // Increment attempts
        otpData.attempts += 1;
        await setStorageItem(OTP_STORAGE_KEY, JSON.stringify(otpData));
        console.error('Invalid OTP');
        return false;
      }
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