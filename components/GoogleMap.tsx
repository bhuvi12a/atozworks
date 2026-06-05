/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";

interface GoogleMapProps {
  mode: "picker" | "viewer";
  latitude?: number;
  longitude?: number;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
}

export default function GoogleMap({
  mode,
  latitude = 12.7408, // Default Hosur coordinates
  longitude = 77.8253,
  onLocationSelect,
}: GoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [geocodeLoading, setGeocodeLoading] = useState(false);

  // Check if a valid Google Maps API Key is provided
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const hasValidGoogleKey = apiKey.trim() !== "" && apiKey !== "YOUR_GOOGLE_MAPS_API_KEY";

  const [useLeafletFallback, setUseLeafletFallback] = useState(!hasValidGoogleKey);

  const fallbackOSMGeocode = async (lat: number, lng: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const response = await fetch(url, {
        headers: { "User-Agent": "AtoZWorksHomeServices/1.0" },
      });
      if (!response.ok) throw new Error("OSM lookup failed");
      const data = (await response.json()) as any;
      
      const addressParts = [];
      if (data.address) {
        const a = data.address;
        if (a.house_number) addressParts.push(a.house_number);
        if (a.road) addressParts.push(a.road);
        if (a.suburb || a.neighbourhood) addressParts.push(a.suburb || a.neighbourhood);
        if (a.city || a.town || a.village) addressParts.push(a.city || a.town || a.village);
        if (a.state) addressParts.push(a.state);
        if (a.postcode) addressParts.push(a.postcode);
      }
      const addressString = addressParts.length > 0 ? addressParts.join(", ") : data.display_name;
      
      if (onLocationSelect) {
        onLocationSelect(lat, lng, addressString);
      }
    } catch (e) {
      if (onLocationSelect) {
        onLocationSelect(lat, lng, `Pinned Coordinate (Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)})`);
      }
    } finally {
      setGeocodeLoading(false);
    }
  };

  // Reverse Geocoding helper
  const reverseGeocode = (lat: number, lng: number) => {
    setGeocodeLoading(true);
    const google = (window as any).google;

    // Use Google geocoder if Google engine is active
    if (!useLeafletFallback && hasValidGoogleKey && google && google.maps && google.maps.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === "OK" && results[0]) {
          const address = results[0].formatted_address;
          if (onLocationSelect) {
            onLocationSelect(lat, lng, address);
          }
          setGeocodeLoading(false);
        } else {
          fallbackOSMGeocode(lat, lng);
        }
      });
    } else {
      fallbackOSMGeocode(lat, lng);
    }
  };

  useEffect(() => {
    // Intercept Google Maps Auth Failures if the key is present but invalid/unauthorized
    (window as any).gm_authFailure = () => {
      console.warn("Google Maps credentials validation failed. Switching to Leaflet...");
      setUseLeafletFallback(true);
    };
  }, []);

  useEffect(() => {
    const google = (window as any).google;
    
    // ----------------------------------------------------
    // ENGINE A: GOOGLE MAPS SERVICE
    // ----------------------------------------------------
    if (!useLeafletFallback && hasValidGoogleKey) {
      const scriptId = "google-maps-api-script";
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      const initializeGoogleMap = () => {
        const gg = (window as any).google;
        if (!gg || !mapContainerRef.current || mapRef.current) return;

        try {
          const mapOptions = {
            center: { lat: latitude, lng: longitude },
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
            ],
          };

          mapRef.current = new gg.maps.Map(mapContainerRef.current, mapOptions);

          if (mode === "picker") {
            markerRef.current = new gg.maps.Marker({
              position: { lat: latitude, lng: longitude },
              map: mapRef.current,
              draggable: true,
              title: "Service Location",
              animation: gg.maps.Animation.DROP,
            });

            reverseGeocode(latitude, longitude);

            markerRef.current.addListener("dragend", () => {
              const pos = markerRef.current.getPosition();
              if (pos) {
                reverseGeocode(pos.lat(), pos.lng());
              }
            });

            mapRef.current.addListener("click", (e: any) => {
              if (e.latLng) {
                markerRef.current.setPosition(e.latLng);
                reverseGeocode(e.latLng.lat(), e.latLng.lng());
              }
            });
          } else {
            markerRef.current = new gg.maps.Marker({
              position: { lat: latitude, lng: longitude },
              map: mapRef.current,
              draggable: false,
              title: "Client Location",
            });
          }
          setLoading(false);
        } catch (e) {
          console.warn("Failed initializing Google Maps, falling back to Leaflet:", e);
          setUseLeafletFallback(true);
        }
      };

      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.onerror = () => {
          console.warn("Google Maps Script failed to load. Falling back to Leaflet...");
          setUseLeafletFallback(true);
        };
        script.onload = () => {
          initializeGoogleMap();
        };
        document.body.appendChild(script);
      } else {
        if (google) {
          initializeGoogleMap();
        } else {
          script.addEventListener("load", initializeGoogleMap);
          script.addEventListener("error", () => setUseLeafletFallback(true));
        }
      }

      return () => {
        if (mapRef.current && !useLeafletFallback) {
          mapRef.current = null;
        }
      };
    }

    // ----------------------------------------------------
    // ENGINE B: LEAFLET / OPENSTREETMAP FALLBACK
    // ----------------------------------------------------
    if (useLeafletFallback || !hasValidGoogleKey) {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const leafletScriptId = "leaflet-js-script";
      let leafletScript = document.getElementById(leafletScriptId) as HTMLScriptElement;

      const initializeLeafletMap = () => {
        const L = (window as any).L;
        if (!L || !mapContainerRef.current) return;

        // Clear container if previously initialized with errors
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = "";
        }

        mapRef.current = L.map(mapContainerRef.current).setView(
          [latitude, longitude],
          15
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
        }).addTo(mapRef.current);

        const customIcon = L.icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          shadowSize: [41, 41],
        });

        if (mode === "picker") {
          markerRef.current = L.marker([latitude, longitude], {
            icon: customIcon,
            draggable: true,
          }).addTo(mapRef.current);

          reverseGeocode(latitude, longitude);

          markerRef.current.on("dragend", () => {
            const position = markerRef.current.getLatLng();
            reverseGeocode(position.lat, position.lng);
          });

          mapRef.current.on("click", (e: any) => {
            const { lat, lng } = e.latlng;
            markerRef.current.setLatLng([lat, lng]);
            reverseGeocode(lat, lng);
          });
        } else {
          markerRef.current = L.marker([latitude, longitude], {
            icon: customIcon,
            draggable: false,
          }).addTo(mapRef.current);
        }

        setLoading(false);
      };

      if (!leafletScript) {
        leafletScript = document.createElement("script");
        leafletScript.id = leafletScriptId;
        leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        leafletScript.async = true;
        leafletScript.onload = initializeLeafletMap;
        document.body.appendChild(leafletScript);
      } else {
        if ((window as any).L) {
          initializeLeafletMap();
        } else {
          leafletScript.addEventListener("load", initializeLeafletMap);
        }
      }

      return () => {
        if (mapRef.current && (useLeafletFallback || !hasValidGoogleKey)) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, [latitude, longitude, mode, useLeafletFallback, hasValidGoogleKey, apiKey]);

  // GPS Locate me trigger
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);

    const onSuccess = (position: any) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      if (useLeafletFallback || !hasValidGoogleKey) {
        const L = (window as any).L;
        if (L && mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
          reverseGeocode(lat, lng);
        }
      } else {
        const google = (window as any).google;
        if (google && mapRef.current && markerRef.current) {
          const latLng = new google.maps.LatLng(lat, lng);
          mapRef.current.setCenter(latLng);
          mapRef.current.setZoom(16);
          markerRef.current.setPosition(latLng);
          reverseGeocode(lat, lng);
        }
      }
      setGpsLoading(false);
    };

    const onError = (error: any) => {
      console.error("GPS position acquisition failed: ", {
        code: error.code,
        message: error.message,
      });
      alert("Could not access your location. Please select it manually on the map.");
      setGpsLoading(false);
    };

    // Try high accuracy first. If it fails due to timeout or position unavailable, retry with low accuracy.
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (firstError) => {
        console.warn(
          `High accuracy GPS attempt failed (Code ${firstError.code}: ${firstError.message}). Retrying with low accuracy...`
        );
        // If permission is denied, don't bother retrying
        if (firstError.code === firstError.PERMISSION_DENIED) {
          onError(firstError);
          return;
        }

        // Retry with lower accuracy and longer timeout
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          onError,
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };



  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs">
        <label className="font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
          <MapPin size={12} className="text-[#0088ff]" />
          {mode === "picker" ? "Mark Location on Map" : "Client Address Location"}
          {(useLeafletFallback || !hasValidGoogleKey) && (
            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-normal normal-case ml-2">
              OSM Fallback Active
            </span>
          )}
        </label>
        {mode === "picker" && (
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={gpsLoading || geocodeLoading}
            className="text-xs text-[#0088ff] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Navigation size={12} className={gpsLoading ? "animate-spin" : ""} />
            {gpsLoading ? "Locating..." : "Use Current Location"}
          </button>
        )}
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-[#82cdff]/30 h-48 bg-slate-50 shadow-inner">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center text-sm font-semibold text-slate-500">
            <div className="w-5 h-5 border-2 border-[#0088ff] border-t-transparent rounded-full animate-spin mr-2" />
            Loading Map View...
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>

      {mode === "picker" && (
        <span className="text-[10px] text-slate-400 leading-none block">
          * Drag the marker pin or tap the map to locate your exact address coordinates.
        </span>
      )}
    </div>
  );
}
