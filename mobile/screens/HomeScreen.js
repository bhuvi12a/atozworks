import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  Platform,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Sparkles, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { ALL_SERVICES, CATEGORIES, CATEGORY_ICONS } from '../constants/services';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [failedImages, setFailedImages] = useState({});
  const [tapCount, setTapCount] = useState(0);

  const handleHeaderTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    if (newCount >= 6) {
      setTapCount(0);
      navigation.navigate('AdminPortal');
    }
  };

  const handleImageError = (slug) => {
    setFailedImages(prev => ({ ...prev, [slug]: true }));
  };

  // Filter services by category and search query
  const filteredServices = ALL_SERVICES.filter(service => {
    const matchesCategory = selectedCategory ? service.category === selectedCategory : true;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={handleHeaderTap}>
          <Text style={styles.headerSubtitle}>Welcome to</Text>
          <Text style={styles.headerTitleText}>AtoZ Works</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity 
            style={styles.partnerBtn}
            onPress={() => navigation.navigate('PartnerRegister')}
          >
            <Sparkles size={13} color="#00a8e8" />
            <Text style={styles.partnerBtnText}>Partner</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Bento Hero Card with Logo */}
        <View style={styles.bentoHero}>
          <TouchableOpacity style={styles.heroTopRow} activeOpacity={0.8} onPress={handleHeaderTap}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.heroLogo} 
              resizeMode="contain" 
            />
          </TouchableOpacity>
          <Text style={styles.heroHeading}>Professional repairs & shifting, at your doorstep.</Text>
          <Text style={styles.heroSubheading}>Hassle-free bookings with verified technicians.</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            placeholder="Search for plumbing, AC mechanic..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories horizontal scroll */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryCard, 
              !selectedCategory && styles.categoryCardSelected
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              styles.categoryCardText,
              !selectedCategory && styles.categoryCardTextSelected
            ]}>All</Text>
          </TouchableOpacity>

          {Object.entries(CATEGORIES).map(([key, label]) => {
            const IconComponent = CATEGORY_ICONS[label] || Sparkles;
            const isSelected = selectedCategory === label;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.categoryCard, 
                  isSelected && styles.categoryCardSelected
                ]}
                onPress={() => setSelectedCategory(label)}
              >
                <IconComponent size={16} color={isSelected ? '#ffffff' : '#475569'} style={styles.categoryIcon} />
                <Text style={[
                  styles.categoryCardText,
                  isSelected && styles.categoryCardTextSelected
                ]}>
                  {label.split(' & ')[0]} {/* Shorten name for UI */}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Services List / Grid */}
        <View style={styles.servicesHeader}>
          <Text style={styles.sectionTitle}>Featured Services</Text>
          <Text style={styles.resultsCount}>{filteredServices.length} found</Text>
        </View>

        <View style={styles.servicesGrid}>
          {filteredServices.map((service) => {
            const IconComponent = service.icon;
            return (
              <TouchableOpacity
                key={service.slug}
                style={styles.serviceCard}
                onPress={() => navigation.navigate('ServiceDetails', { service })}
              >
                <View style={styles.imageWrapper}>
                  {service.image && !failedImages[service.slug] ? (
                    <Image 
                      source={typeof service.image === 'string' ? { uri: service.image } : service.image} 
                      style={styles.serviceImage} 
                      resizeMode="cover" 
                      onError={() => handleImageError(service.slug)}
                    />
                  ) : (
                    <View style={[styles.iconWrapper, { backgroundColor: (service.color || '#0088ff') + '25' }]}>
                      <IconComponent size={26} color={service.colorDark || '#0088ff'} />
                    </View>
                  )}
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDesc} numberOfLines={2}>{service.desc}</Text>
                  <View style={styles.serviceFooter}>
                    <Text style={styles.servicePrice}>{service.price}</Text>
                    <View style={styles.bookBadge}>
                      <Text style={styles.bookBadgeText}>Book</Text>
                      <ChevronRight size={12} color="#0088ff" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* Floating WhatsApp Button */}
      <TouchableOpacity 
        style={styles.whatsappFloat}
        onPress={() => Linking.openURL('https://wa.me/919360651833?text=Hi!%20I%20need%20assistance%20with%20AtoZ%20Works')}
        activeOpacity={0.85}
      >
        <Image
          source={require('../assets/whatsapp.png')}
          style={styles.whatsappIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fbfe',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 15,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexWrap: 'wrap',
    gap: 8,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  partnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00a8e810',
    borderWidth: 1,
    borderColor: '#00a8e830',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  partnerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00a8e8',
    marginLeft: 5,
  },
  scrollContent: {
    padding: 20,
  },
  bentoHero: {
    backgroundColor: '#00a8e8',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#00a8e8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  heroLogo: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  heroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  heroHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSubheading: {
    fontSize: 13,
    color: '#e3f2fd',
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 25,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  categoryScroll: {
    paddingBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 10,
    height: 38,
  },
  categoryCardSelected: {
    backgroundColor: '#00a8e8',
    borderColor: '#00a8e8',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryCardText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  categoryCardTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  resultsCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  servicesGrid: {
    flexDirection: 'column',
    gap: 15,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  imageWrapper: {
    width: 75,
    height: 75,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 15,
    backgroundColor: '#f1f5f9',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  iconWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 8,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  bookBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0088ff10',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  bookBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0088ff',
    marginRight: 2,
  },
  whatsappFloat: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  whatsappIcon: {
    width: 64,
    height: 64,
  }
});
