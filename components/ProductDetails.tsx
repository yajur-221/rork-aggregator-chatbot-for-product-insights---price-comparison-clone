import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Star, MessageCircle, ThumbsUp, TrendingUp, Users, Calendar } from 'lucide-react-native';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  verified: boolean;
}

interface ProductDetailsProps {
  productName: string;
  overallRating: number;
  totalReviews: number;
  reviews: Review[];
  marketTrends?: {
    priceHistory: { month: string; price: number }[];
    popularityScore: number;
    demandTrend: 'increasing' | 'stable' | 'decreasing';
  };
}

export function ProductDetails({ 
  productName, 
  overallRating, 
  totalReviews, 
  reviews,
  marketTrends 
}: ProductDetailsProps) {
  const [selectedTab, setSelectedTab] = useState<'reviews' | 'trends'>('reviews');
  const [reviewFilter, setReviewFilter] = useState<'all' | 5 | 4 | 3 | 2 | 1>('all');

  const renderStars = (rating: number, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={size}
          color={i <= rating ? '#fbbf24' : '#d1d5db'}
          fill={i <= rating ? '#fbbf24' : 'transparent'}
        />
      );
    }
    return stars;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const filteredReviews = reviewFilter === 'all' 
    ? reviews 
    : reviews.filter(review => review.rating === reviewFilter);

  const ratingDistribution = getRatingDistribution();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <MessageCircle color="#2563eb" size={24} />
        <Text style={styles.title}>Product Details</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'reviews' && styles.activeTab]}
          onPress={() => setSelectedTab('reviews')}
        >
          <Text style={[styles.tabText, selectedTab === 'reviews' && styles.activeTabText]}>Reviews</Text>
        </TouchableOpacity>
        {marketTrends && (
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'trends' && styles.activeTab]}
            onPress={() => setSelectedTab('trends')}
          >
            <Text style={[styles.tabText, selectedTab === 'trends' && styles.activeTabText]}>Market Trends</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedTab === 'reviews' ? (
        <>
          {/* Overall Rating Summary */}
          <View style={styles.ratingSummary}>
            <View style={styles.overallRating}>
              <Text style={styles.ratingNumber}>{overallRating.toFixed(1)}</Text>
              <View style={styles.starsContainer}>
                {renderStars(overallRating, 20)}
              </View>
              <Text style={styles.totalReviews}>{totalReviews.toLocaleString()} reviews</Text>
            </View>
            
            <View style={styles.ratingBreakdown}>
              {[5, 4, 3, 2, 1].map(rating => {
                const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <TouchableOpacity
                    key={rating}
                    style={styles.ratingRow}
                    onPress={() => setReviewFilter(reviewFilter === rating ? 'all' : rating as 5 | 4 | 3 | 2 | 1)}
                  >
                    <Text style={styles.ratingLabel}>{rating}</Text>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.ratingCount}>{count}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Review Filter */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filter:</Text>
            <TouchableOpacity
              style={[styles.filterButton, reviewFilter === 'all' && styles.activeFilter]}
              onPress={() => setReviewFilter('all')}
            >
              <Text style={[styles.filterText, reviewFilter === 'all' && styles.activeFilterText]}>All</Text>
            </TouchableOpacity>
            {[5, 4, 3, 2, 1].map(rating => (
              <TouchableOpacity
                key={rating}
                style={[styles.filterButton, reviewFilter === rating && styles.activeFilter]}
                onPress={() => setReviewFilter(rating as 5 | 4 | 3 | 2 | 1)}
              >
                <Text style={[styles.filterText, reviewFilter === rating && styles.activeFilterText]}>{rating}⭐</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reviews List */}
          <View style={styles.reviewsList}>
            {filteredReviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{review.userName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userName}>{review.userName}</Text>
                        {review.verified && (
                          <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedText}>✓ Verified</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  </View>
                  <View style={styles.reviewRating}>
                    {renderStars(review.rating, 14)}
                  </View>
                </View>
                
                <Text style={styles.reviewComment}>{review.comment}</Text>
                
                <View style={styles.reviewActions}>
                  <TouchableOpacity style={styles.helpfulButton}>
                    <ThumbsUp size={14} color="#666" />
                    <Text style={styles.helpfulText}>Helpful ({review.helpful})</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        marketTrends && (
          <>
            {/* Market Trends */}
            <View style={styles.trendsContainer}>
              <View style={styles.trendCard}>
                <View style={styles.trendHeader}>
                  <TrendingUp color="#2563eb" size={20} />
                  <Text style={styles.trendTitle}>Popularity Score</Text>
                </View>
                <Text style={styles.trendValue}>{marketTrends.popularityScore}/100</Text>
                <Text style={styles.trendDescription}>Based on search volume and user interest</Text>
              </View>

              <View style={styles.trendCard}>
                <View style={styles.trendHeader}>
                  <Users color="#10b981" size={20} />
                  <Text style={styles.trendTitle}>Demand Trend</Text>
                </View>
                <View style={styles.demandIndicator}>
                  <View style={[
                    styles.demandDot,
                    marketTrends.demandTrend === 'increasing' && styles.increasing,
                    marketTrends.demandTrend === 'stable' && styles.stable,
                    marketTrends.demandTrend === 'decreasing' && styles.decreasing,
                  ]} />
                  <Text style={styles.demandText}>
                    {marketTrends.demandTrend.charAt(0).toUpperCase() + marketTrends.demandTrend.slice(1)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Price History */}
            <View style={styles.priceHistoryContainer}>
              <View style={styles.priceHistoryHeader}>
                <Calendar color="#2563eb" size={20} />
                <Text style={styles.sectionTitle}>Price History (Last 6 Months)</Text>
              </View>
              <View style={styles.priceChart}>
                {marketTrends.priceHistory.map((item, index) => (
                  <View key={index} style={styles.pricePoint}>
                    <Text style={styles.priceMonth}>{item.month}</Text>
                    <Text style={styles.priceAmount}>₹{item.price.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )
      )}
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabText: {
    color: '#fff',
  },
  ratingSummary: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    gap: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  overallRating: {
    alignItems: 'center',
    flex: 1,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: '#64748b',
  },
  ratingBreakdown: {
    flex: 2,
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#0f172a',
    width: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
  },
  ratingCount: {
    fontSize: 12,
    color: '#64748b',
    width: 24,
    textAlign: 'right',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
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
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  verifiedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  reviewDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  helpfulText: {
    fontSize: 12,
    color: '#64748b',
  },
  trendsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  trendCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  trendValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  trendDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  demandIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  demandDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  increasing: {
    backgroundColor: '#10b981',
  },
  stable: {
    backgroundColor: '#fbbf24',
  },
  decreasing: {
    backgroundColor: '#ef4444',
  },
  demandText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  priceHistoryContainer: {
    marginBottom: 20,
  },
  priceHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  priceChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pricePoint: {
    alignItems: 'center',
    gap: 8,
  },
  priceMonth: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  priceAmount: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
});