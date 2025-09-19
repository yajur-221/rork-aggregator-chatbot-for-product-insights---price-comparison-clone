import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Send, Paperclip, HelpCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatScreen() {
  const [inputText, setInputText] = useState('');
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const handleSend = async () => {
    const query = inputText.trim();
    if (!query) return;

    // Navigate to results page with the query
    router.push({
      pathname: '/results',
      params: { query }
    });
  };

  const dynamicStyles = {
    earthContainer: {
      position: 'absolute' as const,
      bottom: -screenHeight * 0.4,
      left: -screenWidth * 0.2,
      right: -screenWidth * 0.2,
      height: screenHeight * 0.8,
      borderRadius: screenHeight * 0.4,
      overflow: 'hidden' as const,
    },
    earthCurve: {
      flex: 1,
      borderRadius: screenHeight * 0.4,
    },
    earthGlow: {
      position: 'absolute' as const,
      top: -30,
      left: -30,
      right: -30,
      bottom: -30,
      borderRadius: screenHeight * 0.4 + 30,
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      ...(Platform.OS === 'web' && {
        boxShadow: '0 0 150px rgba(59, 130, 246, 0.4), inset 0 0 100px rgba(59, 130, 246, 0.1)',
      }),
    },
    gradientStart: { x: 0, y: 0 } as const,
    gradientEnd: { x: 1, y: 1 } as const,
    earthGradientStart: { x: 0, y: 0 } as const,
    earthGradientEnd: { x: 1, y: 0 } as const,
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Space Background */}
      <LinearGradient
        colors={['#0f0f23', '#1a1a3a', '#2d2d5a']}
        style={styles.backgroundGradient}
        start={dynamicStyles.gradientStart}
        end={dynamicStyles.gradientEnd}
      />
      
      {/* Earth Curve at Bottom */}
      <View style={dynamicStyles.earthContainer}>
        <LinearGradient
          colors={['#1e40af', '#3b82f6', '#60a5fa']}
          style={dynamicStyles.earthCurve}
          start={dynamicStyles.earthGradientStart}
          end={dynamicStyles.earthGradientEnd}
        />
        {/* Earth Glow */}
        <View style={dynamicStyles.earthGlow} />
      </View>
      
      <SafeAreaView style={styles.content}>
        <View style={styles.centerContainer}>
          {/* Main Title */}
          <Text style={styles.mainTitle}>What should we build today?</Text>
          <Text style={styles.subtitle}>Create stunning apps & websites by chatting with AI.</Text>
          
          {/* Input Container */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                testID="homeSearchInput"
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your idea and we'll build it together."
                placeholderTextColor="#6b7280"
                multiline
                maxLength={500}
                onSubmitEditing={() => handleSend()}
              />
              
              {/* Bottom toolbar */}
              <View style={styles.inputToolbar}>
                <View style={styles.toolbarLeft}>
                  <TouchableOpacity style={styles.toolbarButton}>
                    <Paperclip color="#6b7280" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.toolbarButton}
                    onPress={() => handleSend()}
                  >
                    <Send color="#6b7280" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolbarButton}>
                    <HelpCircle color="#6b7280" size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  content: {
    flex: 1,
    zIndex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  mainTitle: {
    fontSize: Platform.OS === 'web' ? 64 : 42,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: Platform.OS === 'web' ? 72 : 50,
    maxWidth: 900,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: Platform.OS === 'web' ? 28 : 26,
    maxWidth: 600,
    fontWeight: '400',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 700,
  },
  inputWrapper: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.5)',
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    }),
  },
  textInput: {
    fontSize: 16,
    color: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    minHeight: 100,
    maxHeight: 200,
    textAlignVertical: 'top',
    fontWeight: '400',
  },
  inputToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(75, 85, 99, 0.3)',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
  },
});