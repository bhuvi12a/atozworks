import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, MapPin } from 'lucide-react-native';

const FAQS_DATA = [
  { q: "How often should I service?", a: "We recommend getting servicing every 6 months to maintain efficiency." },
  { q: "Do I need to provide materials?", a: "No, our professionals bring all necessary materials and tools." },
  { q: "Is there a warranty?", a: "Yes, we provide a 30-day post-service warranty on all jobs." }
];

export default function ServiceDetailsScreen({ route, navigation }) {
  const { service } = route.params;
  const IconComponent = service.icon;
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{service.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Service Hero Banner with Real Photo */}
        <View style={styles.heroPhotoCard}>
          {service.image && !imgFailed ? (
            <Image 
              source={typeof service.image === 'string' ? { uri: service.image } : service.image} 
              style={styles.heroPhoto} 
              resizeMode="cover" 
              onError={() => setImgFailed(true)}
            />
          ) : (
            <View style={[styles.heroPhoto, { backgroundColor: (service.color || '#0088ff') + '40', justifyContent: 'center', alignItems: 'center' }]}>
              <IconComponent size={48} color="#ffffff" />
            </View>
          )}
          <View style={styles.heroPhotoOverlay} />
          <View style={styles.heroPhotoContent}>
            <View style={styles.priceTag}>
              <Text style={styles.priceTagText}>{service.price}</Text>
            </View>
            <Text style={styles.photoServiceName}>{service.name}</Text>
            <Text style={styles.photoServiceDesc}>{service.desc}</Text>
          </View>
        </View>

        {/* Features / Inclusions */}
        <Text style={styles.sectionTitle}>What's Included</Text>
        <View style={styles.featuresList}>
          {service.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <CheckCircle2 size={16} color="#0088ff" style={styles.featureIcon} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqContainer}>
          {FAQS_DATA.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <View key={index} style={styles.faqItem}>
                <TouchableOpacity 
                  style={styles.faqHeader} 
                  onPress={() => toggleFaq(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  {isOpen ? <ChevronUp size={16} color="#475569" /> : <ChevronDown size={16} color="#475569" />}
                </TouchableOpacity>
                {isOpen && (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{faq.a}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

      </ScrollView>

      {/* Booking Action Bar */}
      <View style={styles.actionBar}>
        <View>
          <Text style={styles.actionPriceLabel}>Visiting Charge</Text>
          <Text style={styles.actionPrice}>₹199</Text>
        </View>
        <TouchableOpacity 
          style={styles.bookBtn}
          onPress={() => navigation.navigate('NewBooking', { service, initialAddress: selectedLocation })}
        >
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Safe padding for bottom Action Bar
  },
  heroPhotoCard: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  heroPhotoContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  priceTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#0088ff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  priceTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  photoServiceName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  photoServiceDesc: {
    fontSize: 12,
    color: '#e2e8f0',
    lineHeight: 18,
  },
  serviceDesc: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 10,
    marginBottom: 12,
  },
  featuresList: {
    backgroundColor: '#f8fbfe',
    borderRadius: 16,
    padding: 16,
    marginBottom: 25,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  featureIcon: {
    marginRight: 10,
  },
  featureText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  mapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fbfe',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 25,
  },
  mapTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  mapDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  faqContainer: {
    gap: 10,
  },
  faqItem: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 10,
  },
  faqBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fbfe',
  },
  faqAnswer: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginTop: 8,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionPriceLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  actionPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  bookBtn: {
    backgroundColor: '#00a8e8',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
    shadowColor: '#00a8e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  }
});
