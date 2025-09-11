import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Send, History, Search, Sparkles } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import LiquidGlass from 'liquid-glass-react';




export default function ChatScreen() {
  const [inputText, setInputText] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleSend = async (searchQuery?: string) => {
    const query = searchQuery || inputText.trim();
    if (!query) return;

    // Add to search history
    if (!searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev.slice(0, 9)]); // Keep last 10 searches
    }

    // Navigate to results page with the query
    router.push({
      pathname: '/results',
      params: { query }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {Platform.OS !== 'web' ? (
        <Video
          source={{ uri: 'https://cdn.pixabay.com/video/2016/09/14/5242-183786752_large.mp4' }}
          style={styles.backgroundVideo}
          shouldPlay
          isLooping
          isMuted
          resizeMode={ResizeMode.COVER}
        />
      ) : (
        <video
          autoPlay
          loop
          muted
          style={styles.webVideo as any}
        >
          <source src="https://cdn.pixabay.com/video/2016/09/14/5242-183786752_large.mp4" type="video/mp4" />
        </video>
      )}
      <View style={styles.overlay} />
      
      {/* Header with Logo and History at the top */}
      <View style={styles.topHeader}>
        <View style={styles.logoContainer}>
          <Sparkles color="#2563eb" size={28} />
          <Text style={styles.logoText}>PriceWise</Text>
        </View>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => {
            console.log('Search history:', searchHistory);
          }}
        >
          <History color="#ffffff" size={20} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeContent}>
          {/* Main Title in the middle */}
          <Text style={styles.mainTitle}>Find the best prices for any product</Text>
          <Text style={styles.subtitle}>Compare prices across multiple platforms and get AI-powered insights</Text>
          
          {/* Glass Search Box */}
          <View style={styles.centerInputContainer}>
            <LiquidGlass
              displacementScale={100}
              blurAmount={0.08}
              saturation={180}
              elasticity={0.2}
              mode="prominent"
              cornerRadius={24}
              style={styles.glassSearchWrapper}
            >
              <View style={styles.searchInputWrapper}>
                <Search color="#9ca3af" size={20} style={styles.searchIcon} />
                <TextInput
                  testID="homeSearchInput"
                  style={styles.centerTextInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Search for any product..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  maxLength={500}
                  onSubmitEditing={() => handleSend()}
                />
              </View>
            </LiquidGlass>
            
            <LiquidGlass
              displacementScale={100}
              blurAmount={0.08}
              saturation={180}
              elasticity={0.2}
              mode="prominent"
              cornerRadius={24}
              style={styles.glassSendButton}
            >
              <TouchableOpacity
                testID="homeSearchSend"
                style={[styles.centerSendButton, !inputText.trim() && styles.centerSendButtonDisabled]}
                onPress={() => handleSend()}
                disabled={!inputText.trim()}
              >
                <Send color="#fff" size={18} />
              </TouchableOpacity>
            </LiquidGlass>
          </View>
          
          {/* Search History */}
          {searchHistory.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Recent Searches</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
                {searchHistory.slice(0, 5).map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.historyItem}
                    onPress={() => handleSend(item)}
                  >
                    <Text style={styles.historyItemText} numberOfLines={1}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },

  // Top header styles
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 2,
  },
  
  // Welcome screen styles
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  historyButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  welcomeContent: {
    alignItems: 'center',
    maxWidth: 700,
    width: '100%',
    paddingHorizontal: 20,
  },

  centerInputContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 600,
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 20,
    alignSelf: 'center',
  },
  glassSearchWrapper: {
    flex: 1,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  glassSendButton: {
    borderRadius: 24,
  },
  searchIcon: {
    marginRight: 12,
  },
  centerTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    maxHeight: 120,
  },
  centerSendButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.8)',
    borderRadius: 24,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  centerSendButtonDisabled: {
    backgroundColor: 'rgba(209, 213, 219, 0.3)',
  },
  historyContainer: {
    width: '100%',
    marginTop: 20,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  historyScroll: {
    flexDirection: 'row',
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    maxWidth: 150,
  },
  historyItemText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  webVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: -1,
  },

});