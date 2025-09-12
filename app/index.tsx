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
import { BlurView } from 'expo-blur';




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
          style={styles.webVideo}
        >
          <source src="https://cdn.pixabay.com/video/2016/09/14/5242-183786752_large.mp4" type="video/mp4" />
        </video>
      )}
      <View style={styles.overlay} />
      
      {/* Fixed Header with Logo and History */}
      <View style={styles.fixedHeader}>
        <View style={styles.logoContainer}>
          <Sparkles color="#2563eb" size={28} />
          <Text style={styles.logoText}>PriceWise</Text>
        </View>
        {Platform.OS !== 'web' ? (
          <BlurView intensity={20} style={styles.glassHistoryButton}>
            <TouchableOpacity 
              style={styles.historyButtonInner}
              onPress={() => {
                console.log('Search history:', searchHistory);
              }}
            >
              <History color="#ffffff" size={20} />
            </TouchableOpacity>
          </BlurView>
        ) : (
          <View style={styles.webGlassHistoryButton}>
            <TouchableOpacity 
              style={styles.historyButtonInner}
              onPress={() => {
                console.log('Search history:', searchHistory);
              }}
            >
              <History color="#ffffff" size={20} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeContent}>
          {/* Main Title */}
          <Text style={styles.mainTitle}>Find the best prices for any product</Text>
          <Text style={styles.subtitle}>Compare prices across multiple platforms and get AI-powered insights</Text>
          
          <View style={styles.centerInputContainer}>
            {Platform.OS !== 'web' ? (
              <BlurView intensity={25} style={styles.glassSearchWrapper}>
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
              </BlurView>
            ) : (
              <View style={styles.webGlassSearchWrapper}>
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
              </View>
            )}
            {Platform.OS !== 'web' ? (
              <BlurView intensity={20} style={styles.glassSendButton}>
                <TouchableOpacity
                  testID="homeSearchSend"
                  style={[styles.centerSendButton, !inputText.trim() && styles.centerSendButtonDisabled]}
                  onPress={() => handleSend()}
                  disabled={!inputText.trim()}
                >
                  <Send color="#fff" size={18} />
                </TouchableOpacity>
              </BlurView>
            ) : (
              <View style={styles.webGlassSendButton}>
                <TouchableOpacity
                  testID="homeSearchSend"
                  style={[styles.centerSendButton, !inputText.trim() && styles.centerSendButtonDisabled]}
                  onPress={() => handleSend()}
                  disabled={!inputText.trim()}
                >
                  <Send color="#fff" size={18} />
                </TouchableOpacity>
              </View>
            )}
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
  
  // Fixed Header
  fixedHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
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
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  glassHistoryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  webGlassHistoryButton: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  historyButtonInner: {
    padding: 12,
  },

  // Welcome screen styles
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 120,
    zIndex: 1,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 44,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginTop: -60,
  },
  subtitle: {
    fontSize: 18,
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 26,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  welcomeContent: {
    alignItems: 'center',
    maxWidth: 700,
    width: '100%',
  },

  centerInputContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 20,
  },
  glassSearchWrapper: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  webGlassSearchWrapper: {
    flex: 1,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(25px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: Platform.OS === 'web' ? 0 : 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  searchIcon: {
    marginRight: 12,
  },
  centerTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 120,
  },
  glassSendButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  webGlassSendButton: {
    borderRadius: 25,
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  centerSendButton: {
    backgroundColor: '#2563eb',
    borderRadius: 25,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  centerSendButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0.1,
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