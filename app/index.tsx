import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Send, Paperclip, HelpCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatScreen() {
  const [inputText, setInputText] = useState('');

  const handleSend = async () => {
    const query = inputText.trim();
    if (!query) return;

    // Navigate to results page with the query
    router.push({
      pathname: '/results',
      params: { query }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1a0b2e', '#2d1b4e', '#1a0b2e']}
        style={styles.backgroundGradient}
        start={styles.gradientStart}
        end={styles.gradientEnd}
      />
      
      {/* Curved Earth-like element at bottom */}
      <View style={styles.earthContainer}>
        <LinearGradient
          colors={['#4c1d95', '#6b21a8', '#7c3aed']}
          style={styles.earthGradient}
          start={styles.earthGradientStart}
          end={styles.earthGradientEnd}
        />
        <View style={styles.earthGlow} />
      </View>
      
      <SafeAreaView style={styles.content}>
        <View style={styles.centerContainer}>
          {/* Main Title */}
          <Text style={styles.mainTitle}>Find the best prices instantly</Text>
          <Text style={styles.subtitle}>Compare prices across Amazon, Flipkart, Swiggy & more with AI-powered search.</Text>
          
          {/* Input Container */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                testID="homeSearchInput"
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
placeholder="Search for any product... iPhone 15, laptop, milk, etc."
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
    backgroundColor: '#1a0b2e',
  },
  gradientStart: { x: 0, y: 0 } as const,
  gradientEnd: { x: 1, y: 1 } as const,
  earthGradientStart: { x: 0, y: 0 } as const,
  earthGradientEnd: { x: 1, y: 0 } as const,
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  earthContainer: {
    position: 'absolute',
    bottom: -200,
    left: -100,
    right: -100,
    height: 400,
    borderRadius: 200,
    overflow: 'hidden',
  },
  earthGradient: {
    flex: 1,
    borderRadius: 200,
  },
  earthGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 220,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 0 100px rgba(139, 92, 246, 0.5), inset 0 0 100px rgba(139, 92, 246, 0.2)',
    }),
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
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  mainTitle: {
    fontSize: Platform.OS === 'web' ? 48 : 36,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: Platform.OS === 'web' ? 56 : 44,
    maxWidth: 600,
  },
  subtitle: {
    fontSize: 18,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 26,
    maxWidth: 500,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 600,
  },
  inputWrapper: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3f3f46',
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    }),
  },
  textInput: {
    fontSize: 16,
    color: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top',
  },
  inputToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#3f3f46',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 8,
  },
});