import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { ShoppingCart, MapPin, ExternalLink, Phone, Star, Truck, Filter } from 'lucide-react-native';

interface PriceItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  source: string;
  sourceType: 'online' | 'local';
  link?: string;
  phone?: string;
  address?: string;
  distance?: number;
  stockStatus?: string;
  deliveryTime?: string;
  rating?: number;
  reviewCount?: number;
}

interface PriceComparisonProps {
  data: PriceItem[];
}

export function PriceComparison({ data }: PriceComparisonProps) {
  const [filterType, setFilterType] = useState<'all' | 'online' | 'local'>('all');
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('price');
  
  console.log('PriceComparison received data:', data);
  console.log('PriceComparison data type:', typeof data);
  console.log('PriceComparison data length:', Array.isArray(data) ? data.length : 'not array');
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log('PriceComparison: No data or empty array provided');
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ShoppingCart color="#2563eb" size={24} />
          <Text style={styles.title}>Price Comparison</Text>
        </View>
        <Text style={styles.title}>Loading price comparison...</Text>
      </View>
    );
  }
  
  const filteredData = data.filter(item => {
    if (filterType === 'all') return true;
    return item.sourceType === filterType;
  });
  
  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'distance':
        if (a.sourceType === 'local' && b.sourceType === 'local') {
          return (a.distance || 0) - (b.distance || 0);
        }
        return a.sourceType === 'local' ? -1 : 1;
      default:
        return a.price - b.price;
    }
  });

  const openLink = async (url: string) => {
    try {
      console.log('Attempting to open URL:', url);
      
      // Validate URL format
      if (!url || typeof url !== 'string') {
        console.error('Invalid URL provided:', url);
        return;
      }
      
      // Ensure URL has proper protocol
      let validUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        validUrl = 'https://' + url;
      }
      
      // Special handling for search URLs - these should always work
      const isSearchUrl = validUrl.includes('/search') || validUrl.includes('/results');
      
      if (isSearchUrl) {
        // For search URLs, try to open directly
        try {
          await Linking.openURL(validUrl);
          console.log('Successfully opened search URL:', validUrl);
          return;
        } catch (searchError) {
          console.log('Search URL failed, trying fallback:', searchError);
        }
      }
      
      // Check if URL can be opened
      const canOpen = await Linking.canOpenURL(validUrl);
      if (canOpen) {
        await Linking.openURL(validUrl);
        console.log('Successfully opened URL:', validUrl);
      } else {
        console.error('Cannot open URL:', validUrl);
        // Fallback: try to open the base domain
        const urlParts = validUrl.split('/');
        if (urlParts.length >= 3) {
          const domain = urlParts[2];
          const fallbackUrl = `https://${domain}`;
          try {
            const canOpenFallback = await Linking.canOpenURL(fallbackUrl);
            if (canOpenFallback) {
              await Linking.openURL(fallbackUrl);
              console.log('Opened fallback URL:', fallbackUrl);
            } else {
              console.error('Cannot open fallback URL either:', fallbackUrl);
            }
          } catch (fallbackError) {
            console.error('Fallback URL also failed:', fallbackError);
          }
        }
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const callPhone = async (phone: string) => {
    try {
      console.log('Attempting to call phone:', phone);
      
      // Validate phone number format
      if (!phone || typeof phone !== 'string') {
        console.error('Invalid phone number provided:', phone);
        return;
      }
      
      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = phone.replace(/[^+\d]/g, '');
      
      if (cleanPhone.length < 10) {
        console.error('Phone number too short:', cleanPhone);
        return;
      }
      
      const telUrl = `tel:${cleanPhone}`;
      
      // Check if phone calls are supported
      const canCall = await Linking.canOpenURL(telUrl);
      if (canCall) {
        await Linking.openURL(telUrl);
        console.log('Successfully initiated call to:', cleanPhone);
      } else {
        console.error('Cannot make phone calls on this device');
      }
    } catch (error) {
      console.error('Error making phone call:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={12}
          color={i <= rating ? '#fbbf24' : '#d1d5db'}
          fill={i <= rating ? '#fbbf24' : 'transparent'}
        />
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ShoppingCart color="#2563eb" size={24} />
        <Text style={styles.title}>Price Comparison</Text>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{sortedData.length}</Text>
          <Text style={styles.statLabel}>Sources</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatPrice(sortedData[0]?.price || 0)}</Text>
          <Text style={styles.statLabel}>Best Price</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {sortedData.length > 1 ? formatPrice(sortedData[sortedData.length - 1].price - sortedData[0].price) : '₹0'}
          </Text>
          <Text style={styles.statLabel}>Max Savings</Text>
        </View>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Store</Text>
        <Text style={styles.tableHeaderText}>Price</Text>
        <Text style={styles.tableHeaderText}>Rating</Text>
        <Text style={styles.tableHeaderText}>Action</Text>
      </View>

      {/* Table Content */}
      <ScrollView style={styles.tableContainer} showsVerticalScrollIndicator={false}>
        {sortedData.map((item, index) => (
          <View key={item.id} style={[styles.tableRow, index === 0 && styles.bestPriceRow]}>
            {index === 0 && (
              <View style={styles.bestPriceBadge}>
                <Text style={styles.bestPriceText}>BEST</Text>
              </View>
            )}
            
            {/* Store Column */}
            <View style={styles.storeColumn}>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName} numberOfLines={1}>{item.source}</Text>
                <View style={styles.storeDetails}>
                  <Text style={styles.storeType}>{item.sourceType === 'online' ? '🌐 Online' : '🏪 Local'}</Text>
                  {item.sourceType === 'local' && item.distance && (
                    <Text style={styles.distance}>{item.distance.toFixed(1)}km</Text>
                  )}
                  {item.deliveryTime && (
                    <Text style={styles.delivery}>{item.deliveryTime}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Price Column */}
            <View style={styles.priceColumn}>
              <Text style={styles.currentPrice}>{formatPrice(item.price)}</Text>
              {item.originalPrice && item.originalPrice > item.price && (
                <View style={styles.discountInfo}>
                  <Text style={styles.originalPrice}>{formatPrice(item.originalPrice)}</Text>
                  <Text style={styles.discount}>
                    {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                  </Text>
                </View>
              )}
            </View>

            {/* Rating Column */}
            <View style={styles.ratingColumn}>
              {item.rating ? (
                <View style={styles.ratingContainer}>
                  <View style={styles.starsContainer}>
                    {renderStars(item.rating)}
                  </View>
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              ) : (
                <Text style={styles.noRating}>-</Text>
              )}
            </View>

            {/* Action Column */}
            <View style={styles.actionColumn}>
              {item.sourceType === 'online' && item.link ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openLink(item.link!)}
                >
                  <ExternalLink color="#2563eb" size={14} />
                </TouchableOpacity>
              ) : item.sourceType === 'local' && item.phone ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => callPhone(item.phone!)}
                >
                  <Phone color="#2563eb" size={14} />
                </TouchableOpacity>
              ) : (
                <Text style={styles.noAction}>-</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    flex: 1,
  },
  tableContainer: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    position: 'relative',
    minHeight: 60,
  },
  bestPriceRow: {
    backgroundColor: '#f0fdf4',
    borderBottomColor: '#bbf7d0',
  },
  bestPriceBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  bestPriceText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
  },
  storeColumn: {
    flex: 1,
    paddingRight: 8,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  storeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  storeType: {
    fontSize: 10,
    color: '#64748b',
  },
  distance: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: '500',
  },
  delivery: {
    fontSize: 10,
    color: '#059669',
  },
  priceColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  discountInfo: {
    alignItems: 'center',
    marginTop: 2,
  },
  originalPrice: {
    fontSize: 10,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  discount: {
    fontSize: 9,
    color: '#10b981',
    fontWeight: '600',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 1,
  },
  ratingColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 1,
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '500',
  },
  noRating: {
    fontSize: 12,
    color: '#94a3b8',
  },
  actionColumn: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: 4,
  },
  actionButton: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noAction: {
    fontSize: 12,
    color: '#94a3b8',
  },
});