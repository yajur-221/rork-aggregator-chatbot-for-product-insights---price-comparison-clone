import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { ShoppingCart, ExternalLink, Phone } from 'lucide-react-native';

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
  const sortedData = [...data].sort((a, b) => a.price - b.price);

  const openLink = (url: string) => {
    if (!url || !url.trim()) return;
    Linking.openURL(url.trim());
  };

  const callPhone = (phone: string) => {
    if (!phone || !phone.trim()) return;
    Linking.openURL(`tel:${phone.trim()}`);
  };

  const formatPrice = (price: number) => {
    if (typeof price !== 'number' || isNaN(price)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <ShoppingCart color="#2563eb" size={24} />
        <Text style={styles.title}>Price Comparison</Text>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Store</Text>
        <Text style={styles.tableHeaderText}>Price</Text>
        <Text style={styles.tableHeaderText}>Link</Text>
      </View>

      {/* Table Rows */}
      <View style={styles.tableContainer}>
        {sortedData.map((item, index) => (
          <View key={item.id} style={[styles.tableRow, index === 0 && styles.bestPriceRow]}>
            <View style={styles.storeCell}>
              <Text style={styles.storeName} numberOfLines={1}>{item.source}</Text>
              {index === 0 && <Text style={styles.bestPriceLabel}>BEST PRICE</Text>}
            </View>
            
            <View style={styles.priceCell}>
              <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
              {item.originalPrice && item.originalPrice > item.price && (
                <Text style={styles.originalPriceSmall}>{formatPrice(item.originalPrice)}</Text>
              )}
            </View>
            
            <View style={styles.linkCell}>
              {item.sourceType === 'online' && item.link ? (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => openLink(item.link!)}
                >
                  <ExternalLink color="#2563eb" size={16} />
                </TouchableOpacity>
              ) : item.sourceType === 'local' && item.phone ? (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => callPhone(item.phone!)}
                >
                  <Phone color="#2563eb" size={16} />
                </TouchableOpacity>
              ) : (
                <Text style={styles.noLinkText}>-</Text>
              )}
            </View>
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
    color: '#111827',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  tableContainer: {
    gap: 4,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  bestPriceRow: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
    borderWidth: 2,
  },
  storeCell: {
    flex: 1,
    alignItems: 'flex-start',
  },
  storeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  bestPriceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 2,
  },
  priceCell: {
    flex: 1,
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  originalPriceSmall: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  linkCell: {
    flex: 1,
    alignItems: 'center',
  },
  linkButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noLinkText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});