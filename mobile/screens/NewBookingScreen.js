import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Linking,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Phone, MapPin, Calendar, Clock, CheckCircle, CheckCircle2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import LocationPicker from '../components/LocationPicker';

const TIME_SLOTS = [
  '09:00 AM - 12:00 PM',
  '12:00 PM - 03:00 PM',
  '03:00 PM - 06:00 PM',
  '06:00 PM - 09:00 PM'
];

export default function NewBookingScreen({ route, navigation }) {
  const { service, initialAddress = '' } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(initialAddress);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  
  // Custom Date Selector (Next 7 Days)
  const getNext7Days = () => {
    const days = [];
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', options),
        value: d.toISOString().split('T')[0]
      });
    }
    return days;
  };
  const dates = getNext7Days();
  const [selectedDate, setSelectedDate] = useState(dates[0].value);

  React.useEffect(() => {
    AsyncStorage.getItem('@atoz_user_session').then(sessionStr => {
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session?.phone) {
          const digits = session.phone.replace(/[^0-9]/g, '').slice(-10);
          setPhone(digits);
        }
      }
    }).catch(() => {});
  }, []);

  const handleConfirmBooking = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Please enter your name');
    if (!phone.trim() || phone.length < 10) return Alert.alert('Error', 'Please enter a valid 10-digit phone number');
    if (!address.trim()) return Alert.alert('Error', 'Please enter your address');

    setLoading(true);

    try {
      const sessionStr = await AsyncStorage.getItem('@atoz_user_session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      const token = session?.accessToken;

      if (!token) {
        setLoading(false);
        return Alert.alert('Error', 'Please log in again to book.');
      }

      // 1. Create Booking on Backend
      const bookingRes = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: service.slug,
          serviceName: service.name,
          price: service.price ? parseInt(service.price.replace(/[^0-9]/g, '')) : 0,
          bookingDate: selectedDate,
          bookingTime: selectedSlot.split(' ')[0],
          address: {
            houseNo: address,
            street: '',
            landmark: '',
            city: 'Hosur',
            state: 'Tamil Nadu',
            pincode: '635109',
            location: lat && lng ? { type: 'Point', coordinates: [lng, lat] } : undefined
          }
        }),
      });

      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(bookingData.message || 'Failed to create booking');

      const bookingId = bookingData.booking.id;
      // Payment is collected on-site after service completion (Pay After Service model)

      // ✅ Save booking locally so it appears in the Bookings tab immediately
      const newBooking = {
        id: bookingId || `local_${Date.now()}`,
        bookingNumber: bookingId || `ATZ${Date.now()}`,
        serviceName: service?.name,
        service: service?.name,
        status: 'PENDING',
        date: selectedDate,
        timeSlot: selectedSlot,
        address: address,
        phone: phone,
        price: service?.price,
        createdAt: new Date().toISOString(),
      };
      try {
        const existing = await AsyncStorage.getItem('atozworks_bookings');
        const existingList = existing ? JSON.parse(existing) : [];
        existingList.unshift(newBooking);
        await AsyncStorage.setItem('atozworks_bookings', JSON.stringify(existingList));
      } catch (saveErr) {
        console.warn('Could not save booking locally:', saveErr);
      }

      setLoading(false);
      setSuccess(true);
    } catch (err) {
      setLoading(false);
      console.error(err);
      Alert.alert('Booking Failed', err.message);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.successBox}>
          <View style={styles.successIconWrapper}>
            <CheckCircle size={54} color="#10b981" />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successDesc}>
            Awesome, {name}. Our technician will arrive on{' '}
            <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{selectedDate}</Text>{' '}
            between{' '}
            <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{selectedSlot}</Text>.
          </Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>Service: {service.name}</Text>
            <Text style={styles.summaryText}>Cost: {service.price}</Text>
            <Text style={styles.summaryText}>Phone: +91 {phone}</Text>
          </View>

          <TouchableOpacity
            style={[styles.successBtn, { backgroundColor: '#25D366', marginBottom: 10 }]}
            onPress={() => {
              const mapsPinUrl = (lat && lng && Number(lat) !== 12.74) 
                ? `https://www.google.com/maps/search/?api=1&query=${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

              const fullText = `🚨 *NEW ATOZ WORKS ORDER DISPATCH* 🚨

🛠️ *Service:* ${service?.name || 'Home Service'}
👤 *Customer:* ${name}
📞 *Phone:* ${phone}
📅 *Date and Slot:* ${selectedDate} (${selectedSlot})
🏠 *Address:* ${address}

🗺️ *OPEN GOOGLE MAPS NAVIGATION PIN:*
${mapsPinUrl}`;

              Linking.openURL(`https://wa.me/919360651833?text=${encodeURIComponent(fullText)}`);
            }}
          >
            <Text style={styles.successBtnText}>📲 Send Job & Location to WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => {
              navigation.popToTop();
            }}
          >
            <Text style={styles.successBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Selected Service Features Summary Card */}
        <View style={styles.serviceSummaryCard}>
          <View style={styles.serviceSummaryHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.serviceSummaryBadge}>SERVICE ORDER SUMMARY</Text>
              <Text style={styles.serviceSummaryTitle}>{service?.name || 'AtoZ Works Service'}</Text>
              <Text style={styles.serviceSummaryPrice}>{service?.price || 'Visiting Charge: ₹199'}</Text>
            </View>
            {service?.image ? (
              <Image 
                source={typeof service.image === 'string' ? { uri: service.image } : service.image} 
                style={styles.serviceSummaryPhoto} 
              />
            ) : null}
          </View>

          {/* Included Features Checklist */}
          {service?.features && service.features.length > 0 && (
            <View style={styles.serviceFeaturesBox}>
              <Text style={styles.serviceFeaturesHeading}>Included Features & Scope of Work:</Text>
              {service.features.map((feat, i) => (
                <View key={i} style={styles.featureRow}>
                  <CheckCircle2 size={14} color="#00a8e8" style={{ marginRight: 6 }} />
                  <Text style={styles.featureRowText}>{feat}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Contact Information */}
        <Text style={styles.sectionTitle}>Contact Details</Text>
        <View style={styles.inputCard}>
          <View style={styles.inputContainer}>
            <User size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              placeholder="Your Name"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              placeholder="10-digit Phone Number"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        {/* Date Selector */}
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.dateScroll}
        >
          {dates.map((d) => {
            const isSelected = selectedDate === d.value;
            return (
              <TouchableOpacity
                key={d.value}
                style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                onPress={() => setSelectedDate(d.value)}
              >
                <Calendar size={14} color={isSelected ? '#ffffff' : '#64748b'} style={{ marginBottom: 4 }} />
                <Text style={[styles.dateCardText, isSelected && styles.dateCardTextSelected]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Time Slot Selector */}
        <Text style={styles.sectionTitle}>Preferred Time Slot</Text>
        <View style={styles.slotGrid}>
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedSlot === slot;
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.slotCard, isSelected && styles.slotCardSelected]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Clock size={14} color={isSelected ? '#ffffff' : '#64748b'} style={{ marginRight: 6 }} />
                <Text style={[styles.slotCardText, isSelected && styles.slotCardTextSelected]}>
                  {slot.split(' - ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Address & Location Picker */}
        <Text style={styles.sectionTitle}>Service Address</Text>
        <LocationPicker initialAddress={initialAddress} onLocationSelect={(loc, details) => {
          setAddress(loc);
          if (details && details.lat) {
            setLat(details.lat);
            setLng(details.lng);
          }
        }} />
        <View style={[styles.inputCard, { paddingVertical: 10 }]}>
          <View style={[styles.inputContainer, { alignItems: 'flex-start', borderBottomWidth: 0 }]}>
            <MapPin size={16} color="#64748b" style={[styles.inputIcon, { marginTop: 4 }]} />
            <TextInput
              placeholder="Your complete address..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>

      </ScrollView>

      {/* Footer Confirm Block */}
      <View style={styles.footerBar}>
        <View>
          <Text style={styles.visitingChargeLabel}>* Pay after completion</Text>
          <Text style={styles.visitingCharge}>Visiting charge: ₹199</Text>
        </View>
        <TouchableOpacity 
          style={[styles.confirmBtn, loading && styles.disabledBtn]}
          onPress={handleConfirmBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 12,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
    paddingBottom: 110,
  },
  serviceSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#00a8e8',
    marginBottom: 16,
    shadowColor: '#00a8e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  serviceSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  serviceSummaryBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00a8e8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  serviceSummaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  serviceSummaryPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
  serviceSummaryPhoto: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  serviceFeaturesBox: {
    marginTop: 10,
    gap: 6,
  },
  serviceFeaturesHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureRowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
    marginTop: 15,
  },
  inputCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  dateScroll: {
    paddingBottom: 5,
  },
  dateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginRight: 10,
    minWidth: 80,
  },
  dateCardSelected: {
    backgroundColor: '#0088ff',
    borderColor: '#0088ff',
  },
  dateCardText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  dateCardTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
  },
  slotCardSelected: {
    backgroundColor: '#0088ff',
    borderColor: '#0088ff',
  },
  slotCardText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  slotCardTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  footerBar: {
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
  visitingChargeLabel: {
    fontSize: 10,
    color: '#00a8e8',
    fontWeight: '700',
  },
  visitingCharge: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: '#00a8e8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: '#00a8e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#f8fbfe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBox: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  successIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e6fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 10,
  },
  successDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#f8fbfe',
    borderRadius: 16,
    padding: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 4,
  },
  summaryText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  successBtn: {
    backgroundColor: '#0f172a',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  successBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  }
});
