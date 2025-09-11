import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { Lightbulb, ThumbsUp, ThumbsDown, Youtube, ExternalLink, Star, HelpCircle, Settings, Award, Truck, Shield } from 'lucide-react-native';

interface AIInsightsProps {
  data: {
    howToUse: string[];
    tips: string[];
    pros: string[];
    cons: string[];
    youtubeLinks: { title: string; url: string; videoId: string; thumbnail: string }[];
    generalInsights: string;
    specifications?: Record<string, string>;
    alternatives?: { name: string; price: string; reason: string }[];
    faqs?: { question: string; answer: string }[];
    userRating?: number;
    reviewSummary?: string;
    warranty?: string;
    availability?: string;
  };
}

export function AIInsights({ data }: AIInsightsProps) {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  
  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
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
        <Lightbulb color="#2563eb" size={24} />
        <Text style={styles.title}>AI Insights</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Use</Text>
        {data.howToUse.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips & Tricks</Text>
        {data.tips.map((tip, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.bullet}>💡</Text>
            <Text style={styles.listText}>{tip}</Text>
          </View>
        ))}
      </View>

      <View style={styles.prosConsContainer}>
        <View style={styles.prosSection}>
          <View style={styles.prosHeader}>
            <ThumbsUp color="#059669" size={20} />
            <Text style={styles.prosTitle}>Pros</Text>
          </View>
          {data.pros.map((pro, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.proBullet}>✓</Text>
              <Text style={styles.listText}>{pro}</Text>
            </View>
          ))}
        </View>

        <View style={styles.consSection}>
          <View style={styles.consHeader}>
            <ThumbsDown color="#dc2626" size={20} />
            <Text style={styles.consTitle}>Cons</Text>
          </View>
          {data.cons.map((con, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.conBullet}>✗</Text>
              <Text style={styles.listText}>{con}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.youtubeHeader}>
          <Youtube color="#ff0000" size={20} />
          <Text style={styles.sectionTitle}>Helpful Videos</Text>
        </View>
        {data.youtubeLinks.map((video, index) => (
          <TouchableOpacity
            key={index}
            style={styles.videoCard}
            onPress={() => openLink(video.url)}
          >
            <Image 
              source={{ uri: video.thumbnail }} 
              style={styles.videoThumbnail}
              resizeMode="cover"
            />
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
              <View style={styles.videoMeta}>
                <Youtube color="#ff0000" size={12} />
                <Text style={styles.videoSource}>YouTube</Text>
              </View>
            </View>
            <ExternalLink color="#2563eb" size={16} />
          </TouchableOpacity>
        ))}
      </View>

      {/* User Rating & Reviews */}
      {data.userRating && (
        <View style={styles.section}>
          <View style={styles.ratingHeader}>
            <Award color="#f59e0b" size={20} />
            <Text style={styles.sectionTitle}>User Rating</Text>
          </View>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(data.userRating)}
            </View>
            <Text style={styles.ratingText}>{data.userRating}/5.0</Text>
          </View>
          {data.reviewSummary && (
            <Text style={styles.reviewSummary}>{data.reviewSummary}</Text>
          )}
        </View>
      )}

      {/* Specifications */}
      {data.specifications && (
        <View style={styles.section}>
          <View style={styles.specHeader}>
            <Settings color="#2563eb" size={20} />
            <Text style={styles.sectionTitle}>Specifications</Text>
          </View>
          <View style={styles.specContainer}>
            {Object.entries(data.specifications).map(([key, value], index) => (
              <View key={index} style={styles.specRow}>
                <Text style={styles.specKey}>{key}</Text>
                <Text style={styles.specValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Alternatives */}
      {data.alternatives && data.alternatives.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alternative Options</Text>
          {data.alternatives.map((alt, index) => (
            <View key={index} style={styles.alternativeCard}>
              <View style={styles.alternativeHeader}>
                <Text style={styles.alternativeName}>{alt.name}</Text>
                <Text style={styles.alternativePrice}>{alt.price}</Text>
              </View>
              <Text style={styles.alternativeReason}>{alt.reason}</Text>
            </View>
          ))}
        </View>
      )}

      {/* FAQs */}
      {data.faqs && data.faqs.length > 0 && (
        <View style={styles.section}>
          <View style={styles.faqHeader}>
            <HelpCircle color="#2563eb" size={20} />
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          </View>
          {data.faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
            >
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              {expandedFAQ === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Warranty & Availability */}
      {(data.warranty || data.availability) && (
        <View style={styles.section}>
          <View style={styles.warrantyHeader}>
            <Shield color="#059669" size={20} />
            <Text style={styles.sectionTitle}>Warranty & Availability</Text>
          </View>
          {data.warranty && (
            <View style={styles.warrantyItem}>
              <Shield color="#059669" size={16} />
              <Text style={styles.warrantyText}>{data.warranty}</Text>
            </View>
          )}
          {data.availability && (
            <View style={styles.warrantyItem}>
              <Truck color="#2563eb" size={16} />
              <Text style={styles.warrantyText}>{data.availability}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General Insights</Text>
        <Text style={styles.insightsText}>{data.generalInsights}</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  bullet: {
    color: '#2563eb',
    fontWeight: 'bold',
    marginTop: 2,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  prosConsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  prosSection: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  consSection: {
    flex: 1,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  prosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  consHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  prosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  consTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  proBullet: {
    color: '#059669',
    fontWeight: 'bold',
    marginTop: 2,
  },
  conBullet: {
    color: '#dc2626',
    fontWeight: 'bold',
    marginTop: 2,
  },
  youtubeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  videoThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e1e5e9',
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 4,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoSource: {
    fontSize: 12,
    color: '#64748b',
  },
  insightsText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  reviewSummary: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  specHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  specContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  specKey: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  specValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  alternativeCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  alternativePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  alternativeReason: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  faqItem: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  warrantyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  warrantyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warrantyText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
});