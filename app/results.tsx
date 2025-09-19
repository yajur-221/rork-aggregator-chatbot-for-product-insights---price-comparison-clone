import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  useWindowDimensions,
  Animated,
  Dimensions,
} from 'react-native';
import { Send, Bot, History, ArrowLeft, Sparkles, Search, ShoppingCart, Zap, Globe, MapPin, Brain } from 'lucide-react-native';
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

}

export default function ResultsScreen() {
  const { query } = useLocalSearchParams<{ query: string }>();
  const { width } = useWindowDimensions();
  const isTablet = useMemo(() => width > 768, [width]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const { location, requestLocation } = useLocation();
  const scrollViewRef = useRef<ScrollView>(null);
  const aiInsightsRef = useRef<View>(null);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const stepAnimations = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handleSend = async (searchQuery?: string) => {
    const newQuery = searchQuery || inputText.trim();
    if (!newQuery) return;

    // Navigate to results page with the new query
    router.push({
      pathname: '/results',
      params: { query: newQuery }
    });
  };



  // Start animations when loading begins
  useEffect(() => {
    if (isLoading) {
      // Reset animations
      setCurrentStep(0);
      progressAnim.setValue(0);
      stepAnimations.forEach(anim => anim.setValue(0));
      
      // Start pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      
      // Start rotation animation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      
      pulseAnimation.start();
      rotateAnimation.start();
      
      // Animate progress and steps
      const stepDuration = 800;
      const stepDelay = 600;
      
      stepAnimations.forEach((anim, index) => {
        setTimeout(() => {
          setCurrentStep(index);
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1,
              duration: stepDuration,
              useNativeDriver: true,
            }),
            Animated.timing(progressAnim, {
              toValue: (index + 1) / stepAnimations.length,
              duration: stepDuration,
              useNativeDriver: false,
            })
          ]).start();
        }, index * stepDelay);
      });
      
      return () => {
        pulseAnimation.stop();
        rotateAnimation.stop();
      };
    }
  }, [isLoading]);

  useEffect(() => {
    if (!query) return;

    const abortController = new AbortController();

    const load = async () => {
      console.log('Starting data load for query:', query);
      setIsLoading(true);
      setProductData(null); // Clear previous data
      
      try {
        // Request location if not available
        if (!location) {
          console.log('Requesting location...');
          await requestLocation();
        }
        
        if (abortController.signal.aborted) return;
        
        console.log('Fetching AI insights and price comparison...');
        const [aiInsights, priceComparison] = await Promise.all([
          generateAIResponse(query as string),
          fetchPriceComparison(query as string, location)
        ]);
        
        if (abortController.signal.aborted) return;
        
        console.log('AI insights received:', aiInsights ? 'Success' : 'Failed');
        console.log('AI insights data:', aiInsights);
        console.log('Price comparison received:', priceComparison ? `${priceComparison.length} items` : 'Failed');
        console.log('Price comparison data:', priceComparison);
        

        
        const newProductData = { 
          aiInsights: aiInsights || null, 
          priceComparison: priceComparison || [] 
        };
        console.log('Setting product data:', {
          hasAiInsights: !!newProductData.aiInsights,
          aiInsightsKeys: newProductData.aiInsights ? Object.keys(newProductData.aiInsights) : [],
          hasPriceComparison: !!newProductData.priceComparison,
          priceComparisonLength: newProductData.priceComparison?.length || 0,

        });
        setProductData(newProductData);
      } catch (error) {
        console.error('Error processing request:', error);
        setProductData(null);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      abortController.abort();
    };
  }, [query]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#374151" size={24} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Sparkles color="#2563eb" size={20} />
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
            {/* Animated Background Circles */}
            <View style={styles.backgroundCircles}>
              <Animated.View style={[styles.circle, styles.circle1, {
                transform: [{
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })
                }]
              }]} />
              <Animated.View style={[styles.circle, styles.circle2, {
                transform: [{
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['360deg', '0deg']
                  })
                }]
              }]} />
            </View>
            
            {/* Main Icon with Pulse */}
            <Animated.View style={[styles.iconContainer, {
              transform: [{ scale: pulseAnim }]
            }]}>
              <View style={styles.iconBackground}>
                <ShoppingCart color="#ffffff" size={40} />
              </View>
            </Animated.View>
            
            <Text style={styles.loadingTitle}>Finding Best Deals</Text>
            <Text style={styles.loadingSubtitle}>Searching across multiple platforms for "{query}"</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }]} />
              </View>
              <Text style={styles.progressText}>
                {Math.round((currentStep + 1) / 5 * 100)}% Complete
              </Text>
            </View>
            
            {/* Animated Steps */}
            <View style={styles.stepsContainer}>
              {[
                { icon: Zap, text: 'Initializing smart scraper', color: '#f59e0b' },
                { icon: Globe, text: 'Scanning e-commerce platforms', color: '#3b82f6' },
                { icon: ShoppingCart, text: 'Checking grocery & quick commerce', color: '#10b981' },
                { icon: Brain, text: 'Generating AI insights', color: '#8b5cf6' },
                { icon: MapPin, text: 'Finding nearby stores', color: '#ef4444' }
              ].map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <Animated.View 
                    key={index}
                    style={[styles.stepItem, {
                      opacity: stepAnimations[index],
                      transform: [{
                        translateX: stepAnimations[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 0]
                        })
                      }]
                    }]}
                  >
                    <View style={[styles.stepIcon, { backgroundColor: step.color }]}>
                      <IconComponent color="#ffffff" size={16} />
                    </View>
                    <Text style={[styles.stepText, {
                      color: currentStep >= index ? '#1f2937' : '#9ca3af'
                    }]}>
                      {step.text}
                    </Text>
                    {currentStep >= index && (
                      <Animated.View style={[styles.checkmark, {
                        opacity: stepAnimations[index]
                      }]}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </Animated.View>
                    )}
                  </Animated.View>
                );
              })}
            </View>
            
            {/* Fun Facts */}
            <View style={styles.funFactContainer}>
              <Text style={styles.funFactTitle}>💡 Did you know?</Text>
              <Text style={styles.funFactText}>
                {[
                  'We compare prices across 15+ platforms in real-time',
                  'Our AI analyzes 1000+ product reviews instantly',
                  'We find deals that save users an average of 25%',
                  'Local store prices are updated every hour'
                ][currentStep] || 'Smart shopping saves time and money!'}
              </Text>
            </View>
          </View>
        ) : productData ? (
          (() => {
            console.log('Rendering results with productData:', {
              hasAiInsights: !!productData.aiInsights,
              hasPriceComparison: !!productData.priceComparison,
              priceComparisonLength: productData.priceComparison?.length
            });
            return isTablet ? (
              <View style={styles.tabletLayout}>
                <View style={styles.insightsSection}>
                  {productData.aiInsights ? (
                    <AIInsights data={productData.aiInsights} />
                  ) : (
                    <View style={styles.loadingComponent}>
                      <Text style={styles.loadingText}>Loading AI Insights...</Text>
                    </View>
                  )}
                </View>
                <View style={styles.priceSection}>
                  {productData.priceComparison && productData.priceComparison.length > 0 ? (
                    <PriceComparison data={productData.priceComparison} />
                  ) : (
                    <View style={styles.loadingComponent}>
                      <Text style={styles.loadingText}>Loading Price Comparison...</Text>
                    </View>
                  )}
                </View>

              </View>
            ) : (
              <ScrollView ref={scrollViewRef} style={styles.mobileResults} showsVerticalScrollIndicator={false} testID="resultsScroll">
                {productData.priceComparison && productData.priceComparison.length > 0 ? (
                  <PriceComparison data={productData.priceComparison} />
                ) : (
                  <View style={styles.loadingComponent}>
                    <Text style={styles.loadingText}>Loading Price Comparison...</Text>
                  </View>
                )}
                <View ref={aiInsightsRef}>
                  {productData.aiInsights ? (
                    <AIInsights data={productData.aiInsights} />
                  ) : (
                    <View style={styles.loadingComponent}>
                      <Text style={styles.loadingText}>Loading AI Insights...</Text>
                    </View>
                  )}
                </View>

              </ScrollView>
            );
          })()
        ) : (
          <View style={styles.errorScreen}>
            <View style={styles.errorIconContainer}>
              <Search color="#6b7280" size={48} />
            </View>
            <Text style={styles.errorTitle}>No results found</Text>
            <Text style={styles.errorSubtitle}>We couldn't find any deals for "{query}"</Text>
            <Text style={styles.errorHint}>Try searching for:</Text>
            <View style={styles.suggestionContainer}>
              {['iPhone 15', 'Samsung TV', 'Nike shoes', 'Laptop'].map((suggestion, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => handleSend(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => handleSend(query as string)}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Floating scroll to insights button */}
        {!isLoading && productData && !isTablet && (
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => {
              aiInsightsRef.current?.measureLayout(
                scrollViewRef.current?.getScrollableNode() as any,
                (x, y) => {
                  scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
                },
                () => {}
              );
            }}
            activeOpacity={0.8}
          >
            <View style={styles.floatingButtonInner}>
              <Brain color="#fff" size={20} />
            </View>
            <View style={styles.floatingButtonRipple} />
          </TouchableOpacity>
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
            style={[styles.fixedSendButton, (!inputText.trim() || isLoading) && styles.fixedSendButtonDisabled]}
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

  mobileResults: {
    flex: 1,
    paddingTop: 20,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    margin: 12,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 600,
  },
  backgroundCircles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 150,
    opacity: 0.08,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: '#3b82f6',
    top: -100,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: '#10b981',
    bottom: -50,
    left: -50,
  },
  iconContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 4,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  loadingSubtitle: {
    fontSize: 17,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
    paddingHorizontal: 8,
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 36,
    alignItems: 'center',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3b82f6',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  stepsContainer: {
    width: '100%',
    gap: 18,
    marginBottom: 36,
    paddingHorizontal: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  funFactContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  funFactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  funFactText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorHint: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  suggestionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
    justifyContent: 'center',
  },
  suggestionChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#2563eb',
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  fixedSendButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0.1,
  },
  loadingComponent: {
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
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 1000,
  },
  floatingButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  floatingButtonRipple: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    transform: [{ scale: 1.5 }],
    opacity: 0.6,
  },
});