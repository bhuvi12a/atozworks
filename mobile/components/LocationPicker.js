import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { MapPin, Navigation, CheckCircle2, Landmark, Home, Layers, Search } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

const TAMILNADU_LOCALITIES = [
  // Hosur Localities
  'Bharathi Nagar, Hosur',
  'BTR Nagar, Hosur',
  'Zuzuvadi, Hosur',
  'Poonga Nagar, Hosur',
  'Bagalur Road, Hosur',
  'SIPCOT Phase 1, Hosur',
  'SIPCOT Phase 2, Hosur',
  'Mathigiri, Hosur',
  'Mookondapalli, Hosur',
  'Denkanikottai Road, Hosur',
  'Avalapalli Road, Hosur',
  'Kamraj Nagar, Hosur',
  'Shanthi Nagar, Hosur',
  'Mullai Nagar, Hosur',
  'Gandhi Nagar, Hosur',
  'Rayakottai Road, Hosur',
  'Titan Nagar, Hosur',
  'Alasanatham Road, Hosur',
  'Onnalvadi, Hosur',
  'TVS Nagar, Hosur',
  'SIPCOT Housing Board, Hosur',
  'Vasanth Nagar, Hosur',
  'Basthi, Hosur',
  'Dharga, Hosur',
  'Dinnur, Hosur',
  'Gopasandra, Hosur',

  // Chennai Localities
  'T. Nagar, Chennai',
  'Velachery, Chennai',
  'Anna Nagar, Chennai',
  'Adyar, Chennai',
  'Mylapore, Chennai',
  'Tambaram, Chennai',
  'Porur, Chennai',
  'Chromepet, Chennai',
  'Guindy, Chennai',
  'Sholinganallur, Chennai',

  // Coimbatore Localities
  'RS Puram, Coimbatore',
  'Gandhipuram, Coimbatore',
  'Peelamedu, Coimbatore',
  'Singanallur, Coimbatore',
  'Saravanampatti, Coimbatore',

  // Madurai Localities
  'Simmakkal, Madurai',
  'KK Nagar, Madurai',
  'Anna Nagar, Madurai',

  // Trichy Localities
  'Thillai Nagar, Tiruchirappalli',
  'Cantonment, Tiruchirappalli',

  // Salem, Tiruppur, Erode, Vellore, Others
  'Fairlands, Salem',
  'Hasthampatti, Salem',
  'Avinashi Road, Tiruppur',
  'Perundurai Road, Erode',
  'Palayamkottai, Tirunelveli',
  'Katpadi, Vellore',
  'Medical College Road, Thanjavur',
  'Palani Road, Dindigul',
  'Kanchipuram Town',
  'Nagercoil, Kanyakumari'
];

export default function LocationPicker({ onLocationSelect, initialAddress = '', initialLandmark = '' }) {
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState(12.7408);
  const [lng, setLng] = useState(77.8253);
  const [hasRealGps, setHasRealGps] = useState(false);
  const [houseNo, setHouseNo] = useState('');
  const [landmark, setLandmark] = useState(initialLandmark);
  const [areaAddress, setAreaAddress] = useState(initialAddress);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mapType, setMapType] = useState('satellite');
  const webviewRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Auto-fetch customer's actual GPS location on screen load
  useEffect(() => {
    autoFetchGPS();
  }, []);

  const autoFetchGPS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        setLat(newLat);
        setLng(newLng);
        setHasRealGps(true);
        if (webviewRef.current) {
          webviewRef.current.postMessage(JSON.stringify({ type: 'SET_CENTER', lat: newLat, lng: newLng }));
        }
        await reverseGeocode(newLat, newLng);
      }
    } catch (e) {
      console.warn('Auto GPS fetch error:', e);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    setAreaAddress(text);
    updateParentAddress(houseNo, landmark, text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);
    setSearchLoading(true);

    // Live search API with 350ms debounce
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const queryText = text.toLowerCase().includes('hosur') || text.toLowerCase().includes('chennai') || text.toLowerCase().includes('tamil nadu')
          ? text
          : `${text}, Hosur, Tamil Nadu, India`;
        
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryText)}&addressdetails=1&limit=6`, {
          headers: { 'User-Agent': 'AtoZWorksApp/1.0' }
        });
        
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (e) {
        console.warn('Live location search error:', e);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  };

  const moveMapToLocation = (targetLat, targetLng) => {
    setLat(targetLat);
    setLng(targetLng);
    setHasRealGps(true);

    if (webviewRef.current) {
      const jsCode = `
        if (window.map) {
          window.map.flyTo([${targetLat}, ${targetLng}], 18, { animate: true, duration: 1.2 });
        }
        true;
      `;
      webviewRef.current.injectJavaScript(jsCode);
      webviewRef.current.postMessage(JSON.stringify({ type: 'SET_CENTER', lat: targetLat, lng: targetLng }));
    }
  };

  const handleSelectSearchResult = (place) => {
    const selectedLat = parseFloat(place.lat);
    const selectedLng = parseFloat(place.lon);
    
    // Clean formatted display address
    const cleanAddress = place.display_name;

    setAreaAddress(cleanAddress);
    setSearchQuery(cleanAddress);
    setShowDropdown(false);
    setSearchResults([]);

    moveMapToLocation(selectedLat, selectedLng);
    updateParentAddress(houseNo, landmark, cleanAddress, selectedLat, selectedLng);
  };

  // HTML content rendering Official Google Maps Tiles & Google Center Pin
  const leafletHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #e5e3df; }
          .leaflet-control-attribution { display: none !important; }
          .center-pin {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            z-index: 1000;
            pointer-events: none;
            transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .center-pin.dragging {
            transform: translate(-50%, -125%) scale(1.15);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div id="pin" class="center-pin">
          <svg width="38" height="50" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="#EA4335"/>
            <circle cx="12" cy="12" r="5" fill="#B31412"/>
          </svg>
        </div>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], 18);
          
          // Official Google Maps Satellite Hybrid Layer
          var googleSat = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            maxZoom: 21,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            attribution: 'Google Maps'
          });

          // Official Google Maps Roadmap Layer
          var googleStreets = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 21,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            attribution: 'Google Maps'
          });

          var currentLayer = googleStreets;
          currentLayer.addTo(map);

          window.map = map;
          var pinEl = document.getElementById('pin');

          function notifyCenter() {
            var c = map.getCenter();
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'MARKER_MOVED',
                lat: c.lat,
                lng: c.lng
              }));
            }
          }

          map.on('movestart', function() {
            pinEl.classList.add('dragging');
          });

          map.on('moveend', function() {
            pinEl.classList.remove('dragging');
            notifyCenter();
          });

          function handleWebMessage(event) {
            try {
              var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
              if (data && data.type === 'SET_CENTER') {
                map.flyTo([data.lat, data.lng], 18, { animate: true, duration: 1.2 });
              } else if (data && data.type === 'SWITCH_LAYER') {
                map.removeLayer(currentLayer);
                if (data.layer === 'satellite') {
                  currentLayer = googleSat;
                } else {
                  currentLayer = googleStreets;
                }
                currentLayer.addTo(map);
              }
            } catch(e){}
          }

          document.addEventListener('message', handleWebMessage);
          window.addEventListener('message', handleWebMessage);
        </script>
      </body>
    </html>
  `;

  const updateParentAddress = (newHouse, newLandmark, newArea, currentLat, currentLng) => {
    const parts = [newHouse, newLandmark, newArea].filter(Boolean);
    const full = parts.join(', ');
    if (onLocationSelect) {
      const activeLat = currentLat || lat;
      const activeLng = currentLng || lng;
      const isGpsValid = hasRealGps || (activeLat && Number(activeLat) !== 12.7408 && Number(activeLat) !== 12.74);
      onLocationSelect(full, {
        houseNo: newHouse,
        landmark: newLandmark,
        areaAddress: newArea,
        lat: isGpsValid ? activeLat : null,
        lng: isGpsValid ? activeLng : null
      });
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const parts = [
          place.name || place.street,
          place.district || place.subregion,
          place.city,
          place.region,
          place.postalCode
        ].filter(Boolean);
        if (parts.length > 0) {
          const resolvedArea = parts.join(', ');
          setAreaAddress(resolvedArea);
          updateParentAddress(houseNo, landmark, resolvedArea);
        }
      }
    } catch (e) {
      console.warn('Reverse geocode error:', e);
    }
  };

  const handleUseGPS = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission denied. You can tap the map to set your location.');
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const newLat = position.coords.latitude;
      const newLng = position.coords.longitude;

      setLat(newLat);
      setLng(newLng);
      setHasRealGps(true);

      if (webviewRef.current) {
        webviewRef.current.postMessage(JSON.stringify({ type: 'SET_CENTER', lat: newLat, lng: newLng }));
      }

      await reverseGeocode(newLat, newLng);
    } catch (error) {
      console.warn('GPS Error:', error);
      Alert.alert('GPS Error', 'Could not fetch location. Please tap your location on the map.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMapType = () => {
    const newType = mapType === 'satellite' ? 'street' : 'satellite';
    setMapType(newType);
    if (webviewRef.current) {
      webviewRef.current.postMessage(JSON.stringify({ type: 'SWITCH_LAYER', layer: newType }));
    }
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MARKER_MOVED') {
        setLat(data.lat);
        setLng(data.lng);
        reverseGeocode(data.lat, data.lng);
      }
    } catch (e) {}
  };

  const handleSelectArea = async (area) => {
    setAreaAddress(area);
    setSearchQuery(area);
    setShowDropdown(false);
    updateParentAddress(houseNo, landmark, area);

    // Auto-geocode chip area to move satellite map marker!
    try {
      const geocode = await Location.geocodeAsync(area.includes('Tamil Nadu') ? area : `${area}, Tamil Nadu, India`);
      if (geocode && geocode.length > 0) {
        const targetLat = geocode[0].latitude;
        const targetLng = geocode[0].longitude;
        moveMapToLocation(targetLat, targetLng);
        updateParentAddress(houseNo, landmark, area, targetLat, targetLng);
      }
    } catch(e) {}
  };

  const handleHouseNoChange = (text) => {
    setHouseNo(text);
    updateParentAddress(text, landmark, areaAddress);
  };

  const handleLandmarkChange = (text) => {
    setLandmark(text);
    updateParentAddress(houseNo, text, areaAddress);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.labelContainer}>
          <MapPin size={16} color="#EA4335" style={{ marginRight: 6 }} />
          <Text style={styles.labelText}>GOOGLE MAPS LOCATION</Text>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity style={styles.toggleBtn} onPress={toggleMapType}>
            <Layers size={12} color="#475569" style={{ marginRight: 4 }} />
            <Text style={styles.toggleBtnText}>
              {mapType === 'satellite' ? '🛰️ Satellite' : '🗺️ Google Map'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gpsBtn} onPress={handleUseGPS} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#00a8e8" />
            ) : (
              <>
                <Navigation size={12} color="#00a8e8" style={{ marginRight: 4 }} />
                <Text style={styles.gpsBtnText}>Use GPS</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔍 LIVE SEARCH BAR - RIGHT ABOVE THE SATELLITE MAP */}
      <View style={[styles.fieldBox, { zIndex: 100, marginBottom: 10, borderColor: '#00a8e8', borderWidth: 1.5 }]}>
        <View style={styles.fieldHeader}>
          <Search size={14} color="#00a8e8" style={{ marginRight: 6 }} />
          <Text style={[styles.fieldLabel, { color: '#00a8e8', fontWeight: '700' }]}>Search Location / Address (Live Map)</Text>
          {searchLoading && <ActivityIndicator size="small" color="#00a8e8" style={{ marginLeft: 'auto' }} />}
        </View>
        <View style={{ position: 'relative' }}>
          <TextInput
            style={[styles.textInput, { fontWeight: '600', color: '#0f172a', fontSize: 13 }]}
            placeholder="Type any area, layout, street name..."
            placeholderTextColor="#94a3b8"
            value={searchQuery !== '' ? searchQuery : areaAddress}
            onChangeText={handleSearchChange}
            onFocus={() => setShowDropdown(true)}
          />

          {/* Live Search Dropdown Overlay */}
          {showDropdown && (searchResults.length > 0 || searchQuery.trim().length >= 2) && (
            <View style={styles.dropdownBox}>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                {searchResults.length > 0 ? (
                  searchResults.map((item, idx) => (
                    <TouchableOpacity
                      key={item.place_id || idx.toString()}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectSearchResult(item)}
                    >
                      <MapPin size={14} color="#00a8e8" style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dropdownText} numberOfLines={1}>
                          {item.display_name.split(',')[0]}
                        </Text>
                        <Text style={styles.dropdownSubText} numberOfLines={1}>
                          {item.display_name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  TAMILNADU_LOCALITIES.filter(loc => loc.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map((loc) => (
                    <TouchableOpacity
                      key={loc}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setAreaAddress(loc);
                        setSearchQuery(loc);
                        setShowDropdown(false);
                        updateParentAddress(houseNo, landmark, loc);
                      }}
                    >
                      <MapPin size={14} color="#00a8e8" style={{ marginRight: 8 }} />
                      <Text style={styles.dropdownText}>{loc}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Real-time Interactive Satellite Map View */}
      <View style={styles.mapFrame}>
        <WebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html: leafletHTML }}
          style={styles.webview}
          onMessage={handleMessage}
          scrollEnabled={false}
        />
        <View style={styles.mapBadge}>
          <Text style={styles.mapBadgeText}>🛰️ High-Resolution Satellite View — Tap or drag pin</Text>
        </View>
      </View>

      {/* Prominent Mark Current GPS Location Button */}
      <TouchableOpacity 
        style={styles.markGpsFullBtn} 
        onPress={handleUseGPS} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Navigation size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.markGpsFullBtnText}>📍 Mark My Current GPS Location</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Address Details Fields */}
      <View style={styles.inputsSection}>
        {/* House / Door Number Input */}
        <View style={styles.fieldBox}>
          <View style={styles.fieldHeader}>
            <Home size={14} color="#64748b" style={{ marginRight: 6 }} />
            <Text style={styles.fieldLabel}>House / Door No. & Building Name</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. No. 42, Green Valley Apartments"
            placeholderTextColor="#94a3b8"
            value={houseNo}
            onChangeText={handleHouseNoChange}
          />
        </View>

        {/* Landmark Input */}
        <View style={styles.fieldBox}>
          <View style={styles.fieldHeader}>
            <Landmark size={14} color="#64748b" style={{ marginRight: 6 }} />
            <Text style={styles.fieldLabel}>Landmark (Nearby Known Place)</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Opposite Reliance Smart, Near Temple"
            placeholderTextColor="#94a3b8"
            value={landmark}
            onChangeText={handleLandmarkChange}
          />
        </View>

        {/* Active Selected Locality Badge */}
        {areaAddress ? (
          <View style={styles.activeLocationBadge}>
            <CheckCircle2 size={14} color="#10b981" style={{ marginRight: 6 }} />
            <Text style={styles.activeLocationText} numberOfLines={2}>
              Selected Location: {areaAddress}
            </Text>
          </View>
        ) : null}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 14,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00a8e815',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  gpsBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00a8e8',
  },
  markGpsFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00a8e8',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 4,
    shadowColor: '#00a8e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  markGpsFullBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  mapFrame: {
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    position: 'relative',
    marginBottom: 12,
  },
  webview: {
    flex: 1,
  },
  mapBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  mapBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  inputsSection: {
    gap: 10,
  },
  fieldBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  textInput: {
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 2,
    fontWeight: '500',
  },
  dropdownBox: {
    position: 'absolute',
    top: 36,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#00a8e8',
    borderRadius: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 999,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  dropdownSubText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  activeLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6fdf4',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
    flex: 1,
  },
  quickAreaLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  areaScroll: {
    paddingBottom: 2,
  },
  areaChip: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  areaChipSelected: {
    backgroundColor: '#0088ff',
    borderColor: '#0088ff',
  },
  areaChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  areaChipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  }
});
