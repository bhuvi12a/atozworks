import React, { useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  StatusBar, ScrollView, Image, Alert, Linking, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Phone, LogOut, ChevronRight, HelpCircle,
  Shield, FileText, Star, Headphones, Sparkles
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@atoz_user_session';

export default function ProfileScreen({ navigation }) {
  const [session, setSession] = useState(null);
  const [bookingCount, setBookingCount] = useState(0);

  const loadProfile = async () => {
    try {
      const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionStr) {
        const s = JSON.parse(sessionStr);
        setSession(s);
      }

      // Count local bookings
      const b1 = await AsyncStorage.getItem('atozworks_bookings');
      const b2 = await AsyncStorage.getItem('@atoz_user_bookings');
      const list1 = b1 ? JSON.parse(b1) : [];
      const list2 = b2 ? JSON.parse(b2) : [];
      setBookingCount(list1.length + list2.length);
    } catch (e) {
      console.warn(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(SESSION_KEY);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  const menuItems = [
    {
      icon: HelpCircle, label: 'Help & Support', color: '#0088ff',
      onPress: () => Linking.openURL('https://wa.me/919360651833?text=Hello%20AtoZ%20Works%20Support')
    },
    {
      icon: FileText, label: 'Terms of Service', color: '#6366f1',
      onPress: () => Linking.openURL('https://atozworks.in/terms')
    },
    {
      icon: Shield, label: 'Privacy Policy', color: '#10b981',
      onPress: () => Linking.openURL('https://atozworks.in/privacy')
    },
    {
      icon: Star, label: 'Rate the App', color: '#f59e0b',
      onPress: () => Linking.openURL('https://play.google.com/store/apps/details?id=com.atozworks.app')
    },
    {
      icon: Headphones, label: 'Call Support', color: '#ef4444',
      onPress: () => Linking.openURL('tel:+919360651833')
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PartnerRegister')}>
          <View style={styles.partnerBadge}>
            <Sparkles size={13} color="#00a8e8" />
            <Text style={styles.partnerBadgeText}>Partner</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Image source={require('../assets/logo.png')} style={styles.avatar} resizeMode="contain" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {session?.name || 'AtoZ Customer'}
            </Text>
            <View style={styles.phoneBadge}>
              <Phone size={12} color="#00a8e8" />
              <Text style={styles.phoneText}>+91 {session?.phone || '—'}</Text>
            </View>
            {session?.role === 'ADMIN' && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{bookingCount}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={styles.statNumber}>⭐ 4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>🇮🇳</Text>
            <Text style={styles.statLabel}>India</Text>
          </View>
        </View>

        {/* Quick Action: Book Again */}
        <TouchableOpacity
          style={styles.bookAgainBtn}
          onPress={() => navigation.navigate('HomeTab')}
          activeOpacity={0.85}
        >
          <Text style={styles.bookAgainText}>➕  Book a New Service</Text>
          <ChevronRight size={18} color="#ffffff" />
        </TouchableOpacity>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.menuItem, i < menuItems.length - 1 && styles.menuItemBorder]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '18' }]}>
                  <Icon size={18} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <ChevronRight size={16} color="#cbd5e1" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>AtoZ Works v1.0.0 · Made in India 🇮🇳</Text>
        <Text style={styles.developerText}>Developed by booworks.co</Text>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fbfe' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 15,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  partnerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#e0f5ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  partnerBadgeText: { fontSize: 12, fontWeight: '700', color: '#00a8e8' },

  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ffffff', margin: 20, marginBottom: 12,
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  avatarWrapper: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#f1f5f9', overflow: 'hidden',
    marginRight: 16, borderWidth: 2, borderColor: '#00a8e830',
  },
  avatar: { width: 70, height: 70 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  phoneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#e0f5ff', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  phoneText: { fontSize: 12, fontWeight: '600', color: '#00a8e8' },
  adminBadge: {
    backgroundColor: '#fef3c7', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginTop: 6,
  },
  adminBadgeText: { fontSize: 10, fontWeight: '800', color: '#d97706', letterSpacing: 0.5 },

  statsRow: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 10,
  },
  statCard: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 16, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  statCardMiddle: { borderColor: '#00a8e820' },
  statNumber: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },

  bookAgainBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0088ff', marginHorizontal: 20, marginBottom: 16,
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
    shadowColor: '#0088ff', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  bookAgainText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },

  menuCard: {
    backgroundColor: '#ffffff', marginHorizontal: 20, marginBottom: 16,
    borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9',
    overflow: 'hidden',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 10, elevation: 1,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 15,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a' },

  versionText: {
    textAlign: 'center', fontSize: 11, color: '#94a3b8',
    marginBottom: 4, fontWeight: '500',
  },
  developerText: {
    textAlign: 'center', fontSize: 11, color: '#94a3b8',
    marginBottom: 16, fontWeight: '700',
  },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 16, paddingVertical: 14,
  },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
});
