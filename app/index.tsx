import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,

} from 'react-native';
import { Send, History, Search, Sparkles } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';




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
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeContent}>
          {/* Header with Logo */}
          <View style={styles.headerSection}>
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
              <History color="#6b7280" size={20} />
            </TouchableOpacity>
          </View>
          
          {/* Main Title */}
          <Text style={styles.mainTitle}>Find the best prices for any product</Text>
          <Text style={styles.subtitle}>Compare prices across multiple platforms and get AI-powered insights</Text>
          
          <View style={styles.centerInputContainer}>
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
            <TouchableOpacity
              testID="homeSearchSend"
              style={[styles.centerSendButton, !inputText.trim() && styles.centerSendButtonDisabled]}
              onPress={() => handleSend()}
              disabled={!inputText.trim()}
            >
              <Send color="#fff" size={18} />
            </TouchableOpacity>
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
    backgroundColor: '#ffffff',
  },

  // Welcome screen styles
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 48,
    paddingTop: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  historyButton: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
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
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    color: '#666',
    marginBottom: 12,
  },
  historyScroll: {
    flexDirection: 'row',
  },
  historyItem: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxWidth: 150,
  },
  historyItemText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },

});