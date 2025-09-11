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

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const callPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <ShoppingCart color="#2563eb" size={24} />
        <Text style={styles.title}>Price Comparison</Text>
      </View>

      {/* Filter and Sort Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.filterContainer}>
          <Filter color="#2563eb" size={16} />
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.activeFilter]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterText, filterType === 'all' && styles.activeFilterText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'online' && styles.activeFilter]}
            onPress={() => setFilterType('online')}
          >
            <Text style={[styles.filterText, filterType === 'online' && styles.activeFilterText]}>Online</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'local' && styles.activeFilter]}
            onPress={() => setFilterType('local')}
          >
            <Text style={[styles.filterText, filterType === 'local' && styles.activeFilterText]}>Local</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort:</Text>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'price' && styles.activeSort]}
            onPress={() => setSortBy('price')}
          >
            <Text style={[styles.sortText, sortBy === 'price' && styles.activeSortText]}>Price</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'rating' && styles.activeSort]}
            onPress={() => setSortBy('rating')}
          >
            <Text style={[styles.sortText, sortBy === 'rating' && styles.activeSortText]}>Rating</Text>
          </TouchableOpacity>
        </View>
      </View>

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
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round((sortedData.reduce((acc, item) => acc + (item.rating || 0), 0) / sortedData.length) * 10) / 10 || 0}
          </Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        {sortedData.map((item, index) => (
          <View key={item.id} style={[styles.priceItem, index === 0 && styles.bestPrice]}>
            {index === 0 && (
              <View style={styles.bestPriceBadge}>
                <Text style={styles.bestPriceText}>BEST PRICE</Text>
              </View>
            )}
            
            <View style={styles.itemHeader}>
              <Image source={{ uri: item.image }} style={styles.productImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.sourceRow}>
                  <Text style={styles.sourceName}>{item.source}</Text>
                  {item.stockStatus && (
                    <View style={[styles.stockBadge, item.stockStatus === 'In Stock' ? styles.inStock : styles.limitedStock]}>
                      <Text style={styles.stockText}>{item.stockStatus}</Text>
                    </View>
                  )}
                </View>
                
                {/* Rating */}
                {item.rating && (
                  <View style={styles.ratingRow}>
                    <View style={styles.starsContainer}>
                      {renderStars(item.rating)}
                    </View>
                    <Text style={styles.ratingText}>{item.rating}</Text>
                    {item.reviewCount && (
                      <Text style={styles.reviewCount}>({item.reviewCount})</Text>
                    )}
                  </View>
                )}
                
                {/* Location/Delivery Info */}
                {item.sourceType === 'local' && item.distance ? (
                  <View style={styles.locationInfo}>
                    <MapPin color="#666" size={12} />
                    <Text style={styles.distanceText}>{item.distance.toFixed(1)} km away</Text>
                  </View>
                ) : item.deliveryTime ? (
                  <View style={styles.locationInfo}>
                    <Truck color="#666" size={12} />
                    <Text style={styles.distanceText}>{item.deliveryTime}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>{formatPrice(item.price)}</Text>
              {item.originalPrice && item.originalPrice > item.price && (
                <Text style={styles.originalPrice}>{formatPrice(item.originalPrice)}</Text>
              )}
              {item.originalPrice && item.originalPrice > item.price && (
                <Text style={styles.discount}>
                  {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                </Text>
              )}
            </View>

            <View style={styles.actionContainer}>
              {item.sourceType === 'online' && item.link && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openLink(item.link!)}
                >
                  <ExternalLink color="#2563eb" size={16} />
                  <Text style={styles.actionText}>Buy Online</Text>
                </TouchableOpacity>
              )}
              
              {item.sourceType === 'local' && item.phone && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => callPhone(item.phone!)}
                >
                  <Phone color="#2563eb" size={16} />
                  <Text style={styles.actionText}>Call Shop</Text>
                </TouchableOpacity>
              )}
            </View>

            {item.address && (
              <Text style={styles.address} numberOfLines={2}>{item.address}</Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
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
  controlsContainer: {
    marginBottom: 16,
    gap: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeFilter: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  sortButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  activeSort: {
    backgroundColor: '#2563eb',
  },
  sortText: {
    fontSize: 12,
    color: '#64748b',
  },
  activeSortText: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  listContainer: {
    gap: 12,
  },
  priceItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bestPrice: {
    borderColor: '#10b981',
    borderWidth: 2,
    backgroundColor: '#f0fdf4',
  },
  bestPriceBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bestPriceText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  itemHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sourceName: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inStock: {
    backgroundColor: '#f0fdf4',
  },
  limitedStock: {
    backgroundColor: '#fef3c7',
  },
  stockText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10b981',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 11,
    color: '#64748b',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#64748b',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  originalPrice: {
    fontSize: 14,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  discount: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionContainer: {
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  address: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
});