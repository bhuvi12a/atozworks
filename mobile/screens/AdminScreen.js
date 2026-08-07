import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Alert,
  Linking,
  Platform,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Lock,
  ShieldCheck,
  Calendar,
  Clock,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  UserCheck,
  Share2
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../config';

export default function AdminScreen({ navigation }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'kyc'
  const [bookings, setBookings] = useState([]);
  const [kycList, setKycList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAdminData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    let allBookings = [];

    // 1. Read from local storage first (0.0s instant load)
    try {
      const localStr = await AsyncStorage.getItem('atozworks_bookings');
      if (localStr) {
        const localData = JSON.parse(localStr);
        if (Array.isArray(localData)) {
          allBookings = [...localData];
          setBookings(allBookings); // Instant UI render!
        }
      }
    } catch (e) {
      console.warn('Failed reading local storage: ', e);
    }

    // 2. Try fetching from backend API and merge
    try {
      const res = await fetch(`${API_URL}/bookings`);
      if (res.ok) {
        const data = await res.json();
        if (data.bookings && Array.isArray(data.bookings)) {
          const merged = [...data.bookings, ...allBookings];
          const unique = [];
          const seen = new Set();
          for (const item of merged) {
            const key = item.id || item.bookingNumber || JSON.stringify(item);
            if (!seen.has(key)) {
              seen.add(key);
              unique.push(item);
            }
          }
          allBookings = unique;
        }
      }
    } catch (e) {}

    setBookings(allBookings);
    setLoading(false);
    if (isManualRefresh) setRefreshing(false);
  };

  // Initial load on mount
  useEffect(() => {
    fetchAdminData();
  }, []);

  // Screen Focus & Live Polling
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        fetchAdminData();
        const interval = setInterval(fetchAdminData, 3000); // 3s auto polling
        return () => clearInterval(interval);
      }
    }, [isAuthenticated])
  );

  const handleLogin = () => {
    setAuthError('');
    if (password === 'AtoZWorks@Admin2026!') {
      setIsAuthenticated(true);
      fetchAdminData();
    } else {
      setAuthError('Invalid Admin Password. Please try again.');
    }
  };

  const handleCallCustomer = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenMap = (item) => {
    const customerAddress = (item.address || '').replace(/\n/g, ', ').trim();
    // Only use lat/lng if customer actually dropped a custom GPS pin (not dummy 12.7400)
    const isCustomPin = item.lat && item.lng && Number(item.lat) !== 12.74 && Number(item.lat) !== 12.7400;
    const mapsUrl = isCustomPin
      ? `https://maps.google.com/?q=${Number(item.lat).toFixed(6)},${Number(item.lng).toFixed(6)}`
      : `https://maps.google.com/?q=${encodeURIComponent(customerAddress)}`;
    Linking.openURL(mapsUrl);
  };

  const handleShareLocationToPartner = (item) => {
    const customerAddress = (item.address || 'Address not specified').replace(/\n/g, ', ').trim();
    const isCustomPin = item.lat && item.lng && Number(item.lat) !== 12.74 && Number(item.lat) !== 12.7400;
    
    // Official Google Maps Navigation Pin Link
    const mapsPinUrl = isCustomPin
      ? `https://www.google.com/maps/search/?api=1&query=${Number(item.lat).toFixed(6)},${Number(item.lng).toFixed(6)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customerAddress)}`;

    const fullText = `🚨 *ATOZ WORKS - NEW JOB DISPATCH FOR TECHNICIAN / PARTNER* 🚨

🆔 *Booking ID:* ${item.bookingNumber || `AW-${item.id}`}
🛠️ *Service Required:* ${item.service || item.serviceName || 'Home Service'}
👤 *Customer Name:* ${item.customer || item.name || 'Customer'}
📞 *Customer Phone:* ${item.phone || 'N/A'}
📅 *Scheduled Date and Slot:* ${item.date || item.selectedDate || 'Today'} (${item.timeSlot || item.selectedSlot || 'Anytime'})
🏠 *Customer Address:* ${customerAddress}

🗺️ *OPEN GOOGLE MAPS NAVIGATION PIN:*
${mapsPinUrl}

⚡ *Instructions:* Please call the customer before arriving and navigate using the Google Maps link above!`;

    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(fullText)}`);
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    Alert.alert(
      'Update Status',
      `Change booking status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const updated = bookings.map(b => 
              (b.id === bookingId || b.bookingNumber === bookingId) 
                ? { ...b, status: newStatus } 
                : b
            );
            setBookings(updated);
            try {
              await AsyncStorage.setItem('atozworks_bookings', JSON.stringify(updated));
            } catch (e) {}
          }
        }
      ]
    );
  };

  const filteredBookings = bookings.filter(b => {
    const q = searchQuery.toLowerCase();
    return (
      (b.customer || b.name || '').toLowerCase().includes(q) ||
      (b.service || b.serviceName || '').toLowerCase().includes(q) ||
      (b.phone || '').includes(q) ||
      (b.bookingNumber || '').toLowerCase().includes(q)
    );
  });

  // Security Login Gate Screen
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Access Gate</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.loginContainer}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={48} color="#00a8e8" />
          </View>
          <Text style={styles.loginTitle}>AtoZ Works Admin Portal</Text>
          <Text style={styles.loginSub}>Enter your master admin password to view all customer orders & vendor KYC.</Text>

          <View style={styles.inputBox}>
            <Lock size={18} color="#64748b" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.textInput}
              placeholder="Admin Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>Unlock Admin Panel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Admin Portal Main Screen
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Admin Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔐 Admin Dashboard</Text>
        <TouchableOpacity onPress={fetchAdminData}>
          <RefreshCw size={18} color="#00a8e8" />
        </TouchableOpacity>
      </View>

      {/* Stats Summary Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{bookings.length}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
            {bookings.filter(b => b.status === 'PENDING' || !b.status).length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>
            {bookings.filter(b => b.status === 'COMPLETED').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Search size={16} color="#64748b" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by customer, phone, or service..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Order Feed List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item, index) => item.id || item.bookingNumber || index.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => fetchAdminData(true)} 
            colors={['#00a8e8']}
            tintColor="#00a8e8"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No Customer Orders Found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderNumber}>{item.bookingNumber || `AW-${item.id}`}</Text>
                <Text style={styles.serviceName}>{item.service || item.serviceName}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                item.status === 'COMPLETED' ? styles.statusCompleted :
                item.status === 'CANCELLED' ? styles.statusCancelled : styles.statusPending
              ]}>
                <Text style={styles.statusText}>{item.status || 'PENDING'}</Text>
              </View>
            </View>

            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <Phone size={14} color="#64748b" style={{ marginRight: 6 }} />
                <Text style={styles.detailText}>{item.customer || item.name} ({item.phone})</Text>
              </View>
              <View style={styles.detailRow}>
                <Calendar size={14} color="#64748b" style={{ marginRight: 6 }} />
                <Text style={styles.detailText}>{item.date || item.selectedDate} | {item.timeSlot || item.selectedSlot}</Text>
              </View>
              <View style={styles.detailRow}>
                <MapPin size={14} color="#64748b" style={{ marginRight: 6 }} />
                <Text style={styles.detailText} numberOfLines={2}>{item.address}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={styles.callBtn} 
                onPress={() => handleCallCustomer(item.phone)}
              >
                <Phone size={12} color="#ffffff" style={{ marginRight: 3 }} />
                <Text style={styles.callBtnText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.mapBtn} 
                onPress={() => handleOpenMap(item)}
              >
                <MapPin size={12} color="#ffffff" style={{ marginRight: 3 }} />
                <Text style={styles.mapBtnText}>Map</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.shareBtn} 
                onPress={() => handleShareLocationToPartner(item)}
              >
                <Share2 size={12} color="#ffffff" style={{ marginRight: 3 }} />
                <Text style={styles.shareBtnText}>Share to Partner</Text>
              </TouchableOpacity>

              {item.status !== 'COMPLETED' && (
                <TouchableOpacity 
                  style={styles.completeBtn}
                  onPress={() => handleUpdateStatus(item.id || item.bookingNumber, 'COMPLETED')}
                >
                  <CheckCircle2 size={12} color="#10b981" style={{ marginRight: 3 }} />
                  <Text style={styles.completeBtnText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 15,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  backBtn: {
    padding: 6,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#00a8e815',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  loginSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 14,
    width: '100%',
    height: 50,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 14,
  },
  loginBtn: {
    backgroundColor: '#00a8e8',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#00a8e8',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },
  orderDetails: {
    gap: 6,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
    flexShrink: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00a8e8',
    paddingVertical: 8,
    borderRadius: 10,
  },
  callBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  mapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    borderRadius: 10,
  },
  mapBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  shareBtn: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 8,
    borderRadius: 10,
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  completeBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingVertical: 8,
    borderRadius: 10,
  },
  completeBtnText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  }
});
