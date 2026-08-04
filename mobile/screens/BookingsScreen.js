import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, Clock, MapPin, Trash2, Smile, Frown, LogOut, User } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const SESSION_KEY = '@atoz_user_session';


export default function BookingsScreen({ navigation }) {
  const [loggedInPhone, setLoggedInPhone] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSessionAndBookings = async () => {
    setLoading(true);

    // 1. Get logged-in user phone from session
    let phone = '';
    try {
      const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        phone = session?.phone || '';
        setLoggedInPhone(phone);
      }
    } catch (e) {
      console.warn('Session read error:', e);
    }

    if (!phone) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Exact match helper (compares last 10 digits for country code flexibility)
    const isMyBooking = (item) => {
      const itemPhone = (item.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const userPhone = cleanPhone.slice(-10);
      return Boolean(itemPhone && userPhone && itemPhone === userPhone);
    };

    let myBookings = [];

    // 2. Read from local storage
    try {
      const s1 = await AsyncStorage.getItem('atozworks_bookings');
      const s2 = await AsyncStorage.getItem('@atoz_user_bookings');
      const l1 = s1 ? JSON.parse(s1) : [];
      const l2 = s2 ? JSON.parse(s2) : [];
      myBookings = [...l1, ...l2].filter(isMyBooking);
    } catch (e) {
      console.warn('Local storage read error:', e);
    }

    // Deduplicate & sort newest first
    const unique = myBookings.filter((v, i, a) =>
      a.findIndex(t => (t.id || t.bookingNumber) === (v.id || v.bookingNumber)) === i
    );
    unique.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setBookings(unique);

    // 3. Background sync from backend API
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${API_URL}/bookings?phone=${encodeURIComponent(cleanPhone)}`, {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data?.bookings) {
          const remoteMatch = data.bookings.filter(isMyBooking);
          setBookings(prev => {
            const merged = [...remoteMatch, ...prev];
            const deduped = merged.filter((v, i, a) =>
              a.findIndex(t => (t.id || t.bookingNumber) === (v.id || v.bookingNumber)) === i
            );
            deduped.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            return deduped;
          });
        }
      }
    } catch (err) {
      // Silently use local data
    }

    setLoading(false);
  };

  // Auto-load every time user visits this tab
  useFocusEffect(
    useCallback(() => {
      loadSessionAndBookings();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(SESSION_KEY);
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        }
      ]
    );
  };

  const handleCancelBooking = async (id) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            // Update on API if online
            try {
              await fetch(`${API_URL}/bookings/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CANCELLED' })
              });
            } catch (e) {
              console.warn("Backend not reachable. Updating cancellation locally.");
            }

            // Update locally in AsyncStorage
            try {
              const localBookingsStr = await AsyncStorage.getItem('atozworks_bookings');
              if (localBookingsStr) {
                const localBookings = JSON.parse(localBookingsStr);
                const updated = localBookings.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b);
                await AsyncStorage.setItem('atozworks_bookings', JSON.stringify(updated));
              }
            } catch (err) {
              console.error(err);
            }

            // Update local state list
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header with logged-in phone + Logout */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>Manage your appointments & check status</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.userBadge}>
            <User size={12} color="#00a8e8" />
            <Text style={styles.userPhone}>+91 {loggedInPhone}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.container}>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00a8e8" />
            <Text style={{ marginTop: 12, color: '#64748b', fontSize: 14 }}>Loading your bookings...</Text>
          </View>
        ) : bookings.length > 0 ? (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id || item.bookingNumber || Math.random().toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.bookingCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.serviceName}>{item.serviceName || item.service}</Text>
                  <View style={[
                    styles.statusBadge,
                    item.status === 'CANCELLED' ? styles.cancelledBadge :
                    item.status === 'COMPLETED' ? styles.completedBadge : styles.pendingBadge
                  ]}>
                    <Text style={[
                      styles.statusText,
                      item.status === 'CANCELLED' ? styles.cancelledText :
                      item.status === 'COMPLETED' ? styles.completedText : styles.pendingText
                    ]}>
                      {item.status || 'PENDING'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.bookingId}>#{item.bookingNumber || item.id}</Text>

                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={14} color="#64748b" style={styles.detailIcon} />
                    <Text style={styles.detailText}>{item.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={14} color="#64748b" style={styles.detailIcon} />
                    <Text style={styles.detailText}>{item.timeSlot}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MapPin size={14} color="#64748b" style={styles.detailIcon} />
                    <Text style={styles.detailText} numberOfLines={1}>{item.address}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.priceText}>Visiting Charge: ₹199</Text>
                  {item.status !== 'CANCELLED' && item.status !== 'COMPLETED' && (
                    <TouchableOpacity 
                      style={styles.cancelBtn}
                      onPress={() => handleCancelBooking(item.id || item.bookingNumber)}
                    >
                      <Trash2 size={14} color="#ef4444" style={{ marginRight: 4 }} />
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          />
        ) : (
          <View style={styles.centerContainer}>
            <Smile size={48} color="#00a8e8" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptyDesc}>
              You haven't placed any bookings yet. Book a service from the Home tab to get started!
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fbfe',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 15,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f5ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  userPhone: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00a8e8',
  },
  logoutBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  bookingId: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 10,
    marginTop: -4,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    justifyContent: 'center',
    marginRight: 10,
  },
  searchInput: {
    fontSize: 14,
    color: '#0f172a',
  },
  searchBtn: {
    backgroundColor: '#00a8e8',
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  listContent: {
    paddingBottom: 20,
    gap: 15,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
  },
  cancelledBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pendingText: {
    color: '#d97706',
  },
  cancelledText: {
    color: '#ef4444',
  },
  cardDetails: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fff5f5',
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
});
