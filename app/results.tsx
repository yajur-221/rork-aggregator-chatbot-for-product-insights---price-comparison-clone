import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Send, Bot, History, ArrowLeft, Sparkles } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { AIInsights } from '@/components/AIInsights';
import { PriceComparison } from '@/components/PriceComparison';
import { useLocation } from '@/hooks/useLocation';
import { generateAIResponse } from '@/services/aiService';
import { fetchPriceComparison } from '@/services/priceService';


interface ProductData {
  aiInsights: any;
  priceComparison: any[];
  productDetails?: {
    productName: string;
    overallRating: number;
    totalReviews: number;
    reviews: any[];
    marketTrends?: {
      priceHistory: { month: string; price: number }[];
      popularityScore: number;
      demandTrend: 'increasing' | 'stable' | 'decreasing';
    };
  };
}

export default function ResultsScreen() {
  const { query } = useLocalSearchParams<{ query: string }>();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const { location, requestLocation } = useLocation();

  const handleSend = async (searchQuery?: string) => {
    const newQuery = searchQuery || inputText.trim();
    if (!newQuery) return;

    // Navigate to results page with the new query
    router.push({
      pathname: '/results',
      params: { query: newQuery }
    });
  };



  const loadProductData = useCallback(async (searchQuery: string) => {
    if (!searchQuery || !searchQuery.trim() || searchQuery.length > 200) return;
    
    const sanitizedQuery = searchQuery.trim();
    setIsLoading(true);
    setProductData(null);
    
    const abortController = new AbortController();
    
    try {
      if (!location) {
        await requestLocation();
      }
      
      if (abortController.signal.aborted) return;
      
      const [aiInsights, priceComparison] = await Promise.all([
        generateAIResponse(sanitizedQuery),
        fetchPriceComparison(sanitizedQuery, location)
      ]);
      
      if (abortController.signal.aborted) return;
      
      const productDetails = {
        productName: sanitizedQuery,
        overallRating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
        totalReviews: Math.floor(Math.random() * 2000) + 500,
        reviews: [
          { id: '1', userName: 'Rajesh Kumar', rating: 5, comment: 'Excellent product! Great value for money. Highly recommended for anyone looking for quality and performance.', date: '2 days ago', helpful: 23, verified: true },
          { id: '2', userName: 'Priya Sharma', rating: 4, comment: 'Good product overall. The build quality is solid and it works as expected. Minor issues with setup but customer service was helpful.', date: '1 week ago', helpful: 15, verified: true },
          { id: '3', userName: 'Amit Singh', rating: 3, comment: 'Average product. Does the job but nothing exceptional. Price could be better for what you get.', date: '2 weeks ago', helpful: 8, verified: false },
          { id: '4', userName: 'Sneha Patel', rating: 5, comment: 'Amazing! Exceeded my expectations. Fast delivery and excellent packaging. Will definitely buy again.', date: '3 weeks ago', helpful: 31, verified: true },
          { id: '5', userName: 'Vikram Gupta', rating: 4, comment: 'Solid choice. Good features and reliable performance. Shipping was quick and product arrived in perfect condition.', date: '1 month ago', helpful: 12, verified: true }
        ],
        marketTrends: {
          priceHistory: [
            { month: 'Aug', price: Math.floor(Math.random() * 5000) + 20000 },
            { month: 'Sep', price: Math.floor(Math.random() * 5000) + 22000 },
            { month: 'Oct', price: Math.floor(Math.random() * 5000) + 21000 },
            { month: 'Nov', price: Math.floor(Math.random() * 5000) + 23000 },
            { month: 'Dec', price: Math.floor(Math.random() * 5000) + 24000 },
            { month: 'Jan', price: Math.floor(Math.random() * 5000) + 25000 }
          ],
          popularityScore: Math.floor(Math.random() * 30) + 70,
          demandTrend: ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)] as 'increasing' | 'stable' | 'decreasing'
        }
      };
      
      if (!abortController.signal.aborted) {
        setProductData({ aiInsights, priceComparison, productDetails });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      if (!abortController.signal.aborted) {
        setProductData(null);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
    
    return () => {
      abortController.abort();
    };
  }, [location, requestLocation]);

  useEffect(() => {
    if (!query) return;
    loadProductData(query as string);
  }, [query, loadProductData]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#374151" size={24} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Sparkles color="#1f2937" size={20} />
            <Text style={styles.headerTitle}>PriceWise</Text>
          </View>
          <TouchableOpacity 
            style={styles.headerHistoryButton}
            onPress={() => {
              console.log('History button pressed');
            }}
          >
            <History color="#6b7280" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {isLoading ? (
          <View style={styles.loadingScreen}>
            <Bot color="#1f2937" size={48} />
            <Text style={styles.loadingTitle}>Analyzing Product...</Text>
            <Text style={styles.loadingSubtitle}>Getting AI insights and comparing prices</Text>
            <View style={styles.loadingSteps}>
              <Text style={styles.loadingStep}>🤖 Generating AI insights</Text>
              <Text style={styles.loadingStep}>💰 Comparing prices across platforms</Text>
              <Text style={styles.loadingStep}>📍 Finding local stores</Text>
              <Text style={styles.loadingStep}>⭐ Gathering reviews and ratings</Text>
            </View>
          </View>
        ) : productData ? (
          <ScrollView style={styles.mobileResults} showsVerticalScrollIndicator={false} testID="resultsScroll">
            <AIInsights data={productData.aiInsights} />
            <PriceComparison data={productData.priceComparison} />
          </ScrollView>
        ) : (
          <View style={styles.errorScreen}>
            <Text style={styles.errorTitle}>No results found</Text>
            <Text style={styles.errorSubtitle}>Try searching for a different product</Text>
          </View>
        )}

        {/* Fixed search bar at bottom */}
        <View style={styles.fixedInputContainer}>
          <TextInput
            testID="bottomSearchInput"
            style={styles.fixedTextInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Search for another product..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            testID="bottomSearchSend"
            style={(!inputText.trim() || isLoading) ? styles.fixedSendButtonDisabled : styles.fixedSendButton}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
          >
            <Send color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  backButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerHistoryButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  content: {
    flex: 1,
  },
  tabletLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  insightsSection: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#e1e5e9',
  },
  priceSection: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#e1e5e9',
  },
  detailsSection: {
    flex: 1,
  },
  mobileResults: {
    flex: 1,
    paddingTop: 20,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
  },
  loadingSteps: {
    gap: 12,
    alignItems: 'center',
  },
  loadingStep: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  errorScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  fixedInputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    alignItems: 'flex-end',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  fixedTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  fixedSendButton: {
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1f2937',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  fixedSendButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0.1,
  },
});