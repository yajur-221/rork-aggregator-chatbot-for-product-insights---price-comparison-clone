import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Phone, Mail, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

type LoginStep = 'method' | 'phone' | 'otp' | 'name';

export default function LoginModal({ visible, onClose }: LoginModalProps) {
  const [step, setStep] = useState<LoginStep>('method');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, sendOTP, verifyOTP } = useAuth();

  const resetModal = () => {
    setStep('method');
    setPhoneNumber('');
    setOtp('');
    setName('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await login('google');
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to login with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    try {
      const success = await sendOTP(phoneNumber);
      if (success) {
        setStep('otp');
        Alert.alert('OTP Sent', `Check console for OTP (Demo: ${phoneNumber})`);
      } else {
        Alert.alert('Error', 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await verifyOTP(phoneNumber, otp);
      if (isValid) {
        setStep('name');
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteLogin = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      await login('phone', { phoneNumber, name });
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete login');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMethodSelection = () => (
    <View style={styles.content}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Choose your preferred login method</Text>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleGoogleLogin}
        disabled={isLoading}
      >
        <LinearGradient
          colors={['#4285f4', '#34a853']}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Mail color="#ffffff" size={20} />
          <Text style={styles.buttonText}>Continue with Google</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => setStep('phone')}
        disabled={isLoading}
      >
        <LinearGradient
          colors={['#059669', '#10b981']}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Phone color="#ffffff" size={20} />
          <Text style={styles.buttonText}>Continue with Phone</Text>
        </LinearGradient>
      </TouchableOpacity>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#60a5fa" />
          <Text style={styles.loadingText}>Logging in...</Text>
        </View>
      )}
    </View>
  );

  const renderPhoneInput = () => (
    <View style={styles.content}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('method')}
      >
        <ArrowLeft color="#60a5fa" size={20} />
      </TouchableOpacity>

      <Text style={styles.title}>Enter Phone Number</Text>
      <Text style={styles.subtitle}>We'll send you a verification code</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Enter your phone number"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          maxLength={15}
        />
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSendOTP}
        disabled={isLoading}
      >
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Send OTP</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderOTPInput = () => (
    <View style={styles.content}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('phone')}
      >
        <ArrowLeft color="#60a5fa" size={20} />
      </TouchableOpacity>

      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to {phoneNumber}
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={otp}
          onChangeText={setOtp}
          placeholder="Enter 6-digit OTP"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleVerifyOTP}
        disabled={isLoading}
      >
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Verify OTP</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleSendOTP}
        disabled={isLoading}
      >
        <Text style={styles.resendText}>Resend OTP</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNameInput = () => (
    <View style={styles.content}>
      <Text style={styles.title}>What's your name?</Text>
      <Text style={styles.subtitle}>Help us personalize your experience</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
          placeholderTextColor="#9ca3af"
          maxLength={50}
        />
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleCompleteLogin}
        disabled={isLoading}
      >
        <LinearGradient
          colors={['#059669', '#10b981']}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Complete Login</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (step) {
      case 'method':
        return renderMethodSelection();
      case 'phone':
        return renderPhoneInput();
      case 'otp':
        return renderOTPInput();
      case 'name':
        return renderNameInput();
      default:
        return renderMethodSelection();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#1e40af']}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X color="#60a5fa" size={24} />
          </TouchableOpacity>
        </View>

        {renderContent()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  loginButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
    }),
  },
  primaryButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
    }),
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    }),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  loadingText: {
    color: '#60a5fa',
    fontSize: 14,
  },
  resendButton: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  resendText: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
  },
});