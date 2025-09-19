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
import { Search, TrendingUp, ShoppingCart } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function PriceComparisonHome() {
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
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      ...(Platform.OS === 'web' && {
        boxShadow: '0 0 150px rgba(139, 92, 246, 0.4), inset 0 0 100px rgba(139, 92, 246, 0.1)',
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
      
      {/* Dark Purple Background */}
      <LinearGradient
        colors={['#1a0b2e', '#2d1b4e', '#4c1d95']}
        style={styles.backgroundGradient}
        start={dynamicStyles.gradientStart}
        end={dynamicStyles.gradientEnd}
      />
      
      {/* Purple Curve at Bottom */}
      <View style={dynamicStyles.earthContainer}>
        <LinearGradient
          colors={['#6b21a8', '#8b5cf6', '#a855f7']}
          style={dynamicStyles.earthCurve}
          start={dynamicStyles.earthGradientStart}
          end={dynamicStyles.earthGradientEnd}
        />
        {/* Purple Glow */}
        <View style={dynamicStyles.earthGlow} />
      </View>
      
      <SafeAreaView style={styles.content}>
        <View style={styles.centerContainer}>
          {/* Main Title */}
          <Text style={styles.mainTitle}>Find the Best Prices</Text>
          <Text style={styles.subtitle}>Compare prices across multiple platforms and save money on every purchase.</Text>
          
          {/* Input Container */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                testID="homeSearchInput"
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Search for any product to compare prices..."
                placeholderTextColor="#9ca3af"
                multiline
                maxLength={500}
                onSubmitEditing={() => handleSend()}
              />
              
              {/* Bottom toolbar */}
              <View style={styles.inputToolbar}>
                <View style={styles.toolbarLeft}>
                  <TouchableOpacity style={styles.toolbarButton}>
                    <TrendingUp color="#a855f7" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.searchButton}
                    onPress={() => handleSend()}
                  >
                    <Search color="#ffffff" size={20} />
                    <Text style={styles.searchButtonText}>Search</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolbarButton}>
                    <ShoppingCart color="#a855f7" size={20} />
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
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    overflow: 'hidden',
    backdropFilter: 'blur(20px)',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(139, 92, 246, 0.2)',
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
    borderTopColor: 'rgba(139, 92, 246, 0.2)',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.5)',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
    }),
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});