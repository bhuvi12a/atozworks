import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const { width, height } = Dimensions.get('window');
const SESSION_KEY = '@atoz_user_session';
const RESEND_COOLDOWN = 30;

// ─── Animated Glow Blob ───────────────────────────────────────────────────────
function AnimatedBlob({ style }) {
  const [anim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  return <Animated.View style={[style, { transform: [{ translateY }] }]} />;
}

export default function LoginScreen({ navigation }) {
  const [step, setStep] = useState('phone');   // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');

  const otpRefs = useRef([]);
  const [shakeAnim] = useState(() => new Animated.Value(0));
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(40));

  const animateIn = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => { animateIn(); }, [step, animateIn]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ─── Send OTP via Backend → MSG91 ────────────────────────────────────────────
  const handleSendOTP = async () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      shake();
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Could not send OTP. Please try again.');
      }

      setResendTimer(RESEND_COOLDOWN);
      setStep('otp');
    } catch (e) {
      const msg = e?.message || '';
      if (msg.toLowerCase().includes('too many') || msg.toLowerCase().includes('many requests')) {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setError(msg || 'Could not send OTP. Please check your network.');
      }
      shake();
    } finally {
      setLoading(false);
    }
  };

  // ─── Verify OTP via Backend → MSG91 ──────────────────────────────────────────
  const handleVerifyOTP = async (code) => {
    const finalCode = code || otp.join('');
    if (finalCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      shake();
      return;
    }
    setError('');
    setLoading(true);

    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: finalCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Incorrect OTP. Please check and try again.');
      }

      // Save persistent session with JWT tokens
      const session = {
        phone: cleanPhone,
        userId: data.user?.id,
        name: data.user?.name,
        role: data.user?.role,
        accessToken: data.tokens?.accessToken,
        refreshToken: data.tokens?.refreshToken,
        loggedIn: true,
        loginTime: new Date().toISOString(),
      };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e) {
      setError(e?.message || 'Incorrect OTP. Please check and try again.');
      shake();
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (text, index) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (newOtp.every(d => d !== '')) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOTPKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(['', '', '', '', '', '']);
    setStep('phone');
  };

  // ─── PHONE STEP ─────────────────────────────────────────────────────────────
  if (step === 'phone') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#080818" />
        <AnimatedBlob style={styles.blob1} />
        <AnimatedBlob style={styles.blob2} />

        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Animated.View style={[styles.content, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}>

              {/* Brand */}
              <View style={styles.brandSection}>
                <View style={styles.logoBox}>
                  <Image
                    source={require('../assets/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.brandName}>AtoZ Works</Text>
                <Text style={styles.brandTagline}>Professional services at your doorstep</Text>
              </View>

              {/* Card */}
              <View style={styles.card}>
                <Text style={styles.cardHeading}>Enter your mobile number</Text>
                <Text style={styles.cardSubtext}>
                  We'll send a one-time verification code via SMS
                </Text>

                <View style={[styles.phoneRow, error ? styles.inputError : null]}>
                  <View style={styles.countryCode}>
                    <Text style={styles.flag}>🇮🇳</Text>
                    <Text style={styles.dialCode}>+91</Text>
                    <View style={styles.divider} />
                  </View>
                  <TextInput
                    style={styles.phoneField}
                    placeholder="98765 43210"
                    placeholderTextColor="#4b5563"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={(t) => { setPhone(t); setError(''); }}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOTP}
                    autoFocus
                  />
                </View>

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    (loading || phone.replace(/\D/g, '').length < 10) && styles.btnDisabled
                  ]}
                  onPress={handleSendOTP}
                  disabled={loading || phone.replace(/\D/g, '').length < 10}
                  activeOpacity={0.88}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.primaryBtnText}>Get OTP  →</Text>
                  }
                </TouchableOpacity>

                <View style={styles.trustRow}>
                  <Text style={styles.trustText}>🔒 End-to-end encrypted</Text>
                </View>

                <Text style={styles.termsText}>
                  By continuing, you agree to our{' '}
                  <Text style={styles.termsLink}
                    onPress={() => Linking.openURL('https://atozworks.co/terms')}>
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}
                    onPress={() => Linking.openURL('https://atozworks.co/privacy')}>
                    Privacy Policy
                  </Text>
                </Text>
                
                <Text style={styles.developerText}>Developed by booworks.co</Text>
              </View>

            </Animated.View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // ─── OTP STEP ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#080818" />
      <AnimatedBlob style={styles.blob1} />
      <AnimatedBlob style={styles.blob2} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View style={[styles.content, {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }]}>

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); }}
            >
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.brandSection}>
              <View style={styles.logoBox}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandName}>Verify OTP</Text>
              <Text style={styles.brandTagline}>
                SMS sent to +91 {phone.replace(/(\d{5})(\d{5})/, '$1 $2')}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeading}>Enter 6-digit code</Text>
              <Text style={styles.cardSubtext}>
                Check your SMS messages for the OTP from AtoZ Works
              </Text>

              <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={r => (otpRefs.current[i] = r)}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                      error ? styles.otpBoxError : null,
                    ]}
                    value={digit}
                    onChangeText={t => handleOTPChange(t, i)}
                    onKeyPress={e => handleOTPKeyPress(e, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                    autoFocus={i === 0}
                  />
                ))}
              </Animated.View>

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              {loading && (
                <View style={styles.verifyingRow}>
                  <ActivityIndicator size="small" color="#00a8e8" />
                  <Text style={styles.verifyingText}>Verifying your OTP...</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleResend}
                disabled={resendTimer > 0}
              >
                {resendTimer > 0
                  ? <Text style={styles.resendTimerText}>⏱  Resend OTP in {resendTimer}s</Text>
                  : <Text style={styles.resendActiveText}>Didn't receive it? Resend OTP</Text>
                }
              </TouchableOpacity>

              <View style={styles.trustRow}>
                <Text style={styles.trustText}>🔒 End-to-end encrypted</Text>
                <Text style={styles.trustDot}>·</Text>
                <Text style={styles.trustText}>🇮🇳 Made in India</Text>
              </View>

              <Text style={styles.developerText}>Developed by booworks.co</Text>
            </View>

          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080818' },
  blob1: {
    position: 'absolute', width: 320, height: 320,
    borderRadius: 160, backgroundColor: '#00a8e826',
    top: -80, left: -80,
  },
  blob2: {
    position: 'absolute', width: 260, height: 260,
    borderRadius: 130, backgroundColor: '#6366f115',
    bottom: 100, right: -60,
  },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 16, left: 24, zIndex: 10 },
  backBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },

  brandSection: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 84, height: 84, borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#00a8e8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  logoImage: { width: 72, height: 72, borderRadius: 16 },
  brandName: { fontSize: 26, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  brandTagline: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24, padding: 24,
  },
  cardHeading: { fontSize: 20, fontWeight: '700', color: '#f1f5f9', marginBottom: 6 },
  cardSubtext: { fontSize: 13, color: '#64748b', lineHeight: 19, marginBottom: 24 },

  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 16, height: 58, overflow: 'hidden',
  },
  inputError: { borderColor: '#ef444480' },
  countryCode: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 6 },
  flag: { fontSize: 18 },
  dialCode: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  divider: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: 6 },
  phoneField: {
    flex: 1, fontSize: 22, fontWeight: '700',
    color: '#ffffff', paddingHorizontal: 12, letterSpacing: 2,
  },

  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  otpBox: {
    flex: 1, height: 60, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    fontSize: 26, fontWeight: '800', color: '#ffffff',
  },
  otpBoxFilled: { borderColor: '#00a8e8', backgroundColor: '#00a8e815' },
  otpBoxError: { borderColor: '#ef444460', backgroundColor: '#ef444408' },

  errorText: { color: '#f87171', fontSize: 13, marginBottom: 12, marginTop: -4, fontWeight: '500' },

  verifyingRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginBottom: 12,
  },
  verifyingText: { color: '#94a3b8', fontSize: 13 },

  primaryBtn: {
    backgroundColor: '#00a8e8', borderRadius: 14,
    height: 56, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#00a8e8', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
  },
  btnDisabled: { backgroundColor: '#1e293b', shadowOpacity: 0, elevation: 0 },
  primaryBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },

  resendBtn: { alignItems: 'center', paddingVertical: 14 },
  resendTimerText: { color: '#475569', fontSize: 13, fontWeight: '500' },
  resendActiveText: { color: '#00a8e8', fontSize: 13, fontWeight: '600' },

  trustRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 6, marginBottom: 16,
  },
  trustText: { fontSize: 11, color: '#475569', fontWeight: '500' },
  trustDot: { color: '#334155' },
  termsText: { fontSize: 11, color: '#475569', textAlign: 'center', lineHeight: 18 },
  termsLink: { color: '#00a8e8', fontWeight: '600' },
  developerText: { fontSize: 10, color: '#334155', textAlign: 'center', marginTop: 14, fontWeight: '500', opacity: 0.6 },
});
