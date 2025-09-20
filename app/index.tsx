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
import { Search, Camera, Image, Clock } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import SearchHistoryModal from '@/components/SearchHistoryModal';

export default function PriceComparisonHome() {
  const [inputText, setInputText] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { addSearchQuery } = useSearchHistory();

  const handleSend = async () => {
    const query = inputText.trim();
    if (!query) return;

    // Add to search history
    addSearchQuery(query);

    // Navigate to results page with the query
    router.push({
      pathname: '/results',
      params: { query }
    });
  };

  const handleCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const query = 'Product from image';
        // Add to search history
        addSearchQuery(query);
        
        // Navigate to results page with image
        router.push({
          pathname: '/results',
          params: { 
            query,
            imageUri: result.assets[0].uri
          }
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleGallery = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library permission is required to select images');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const query = 'Product from image';
        // Add to search history
        addSearchQuery(query);
        
        // Navigate to results page with image
        router.push({
          pathname: '/results',
          params: { 
            query,
            imageUri: result.assets[0].uri
          }
        });
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
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
      
      {/* Dark Blue Background */}
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#1e40af']}
        style={styles.backgroundGradient}
        start={dynamicStyles.gradientStart}
        end={dynamicStyles.gradientEnd}
      />
      
      {/* Blue Curve at Bottom */}
      <View style={dynamicStyles.earthContainer}>
        <LinearGradient
          colors={['#1d4ed8', '#3b82f6', '#60a5fa']}
          style={dynamicStyles.earthCurve}
          start={dynamicStyles.earthGradientStart}
          end={dynamicStyles.earthGradientEnd}
        />
        {/* Blue Glow */}
        <View style={dynamicStyles.earthGlow} />
      </View>
      
      <SafeAreaView style={styles.content}>
        <View style={styles.centerContainer}>
          {/* Search History Button */}
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => setShowHistoryModal(true)}
          >
            <Clock color="#60a5fa" size={20} />
            <Text style={styles.historyButtonText}>Search History</Text>
          </TouchableOpacity>

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
                onSubmitEditing={handleSend}
                returnKeyType="search"
                blurOnSubmit={true}
                enablesReturnKeyAutomatically={true}
              />
              
              {/* Bottom toolbar */}
              <View style={styles.inputToolbar}>
                <View style={styles.toolbarLeft}>
                  <TouchableOpacity 
                    style={styles.toolbarButton}
                    onPress={handleGallery}
                  >
                    <Image color="#60a5fa" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.searchButton}
                    onPress={() => handleSend()}
                  >
                    <Search color="#ffffff" size={20} />
                    <Text style={styles.searchButtonText}>Search</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.cameraButton}
                    onPress={handleCamera}
                  >
                    <Camera color="#ffffff" size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
      
      {/* Search History Modal */}
      <SearchHistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSelectSearch={(query) => {
          setInputText(query);
          // Auto-search when selecting from history
          addSearchQuery(query);
          router.push({
            pathname: '/results',
            params: { query }
          });
        }}
      />
    </View>
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
    borderColor: 'rgba(59, 130, 246, 0.3)',
    overflow: 'hidden',
    backdropFilter: 'blur(20px)',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.2)',
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
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.5)',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
    }),
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  cameraButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.5)',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
    }),
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 32,
    alignSelf: 'center',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2)',
    }),
  },
  historyButtonText: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
  },
});