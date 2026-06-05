/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function MapPicker({
  onLocationSelect,
  initialLat = 12.7408, // Default to Hosur center
  initialLng = 77.8253,
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [geocodeLoading, setGeocodeLoading] = useState(false);

  useEffect(() => {
    // Performs reverse geocoding lookup
    const fetchAddress = async (lat: number, lng: number) => {
      setGeocodeLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
        const response = await fetch(url, {
          headers: {
            "User-Agent": "AtoZWorksHomeServices/1.0",
          },
        });

        if (!response.ok) {
          throw new Error("Reverse geocoding lookup failed");
        }

        const data = await response.json();
        
        // Construct a clean, readable address string
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

        const addressString = addressParts.length > 0 
          ? addressParts.join(", ") 
          : data.display_name || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;

        onLocationSelect(lat, lng, addressString);
      } catch (error) {
        console.warn("Error geocoding map coordinates: ", error);
        // Fallback display format
        onLocationSelect(lat, lng, `Pinned Location (Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)})`);
      } finally {
        setGeocodeLoading(false);
      }
    };

    // 1. Inject Leaflet CSS Link into document head
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // 2. Load Leaflet script dynamically
    const scriptId = "leaflet-js-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initializeMap = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      // Avoid double-initializing Leaflet maps
      if (mapRef.current) return;

      // Setup map object
      mapRef.current = L.map(mapContainerRef.current).setView(
        [initialLat, initialLng],
        15
      );

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      // Setup custom marker icon (Leaflet defaults sometimes crash due to asset pathing issues)
      const customIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      // Add draggable marker to map
      markerRef.current = L.marker([initialLat, initialLng], {
        icon: customIcon,
        draggable: true,
      }).addTo(mapRef.current);

      // Perform initial geocoding on default coords
      fetchAddress(initialLat, initialLng);

      // Listen for marker drag-end coordinates
      markerRef.current.on("dragend", async () => {
        const position = markerRef.current.getLatLng();
        fetchAddress(position.lat, position.lng);
      });

      // Listen for direct map clicks
      mapRef.current.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        markerRef.current.setLatLng([lat, lng]);
        fetchAddress(lat, lng);
      });

      setLoading(false);
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        initializeMap();
      };
      document.body.appendChild(script);
    } else {
      // Script exists, check if loaded or hook initialization
      if ((window as any).L) {
        initializeMap();
      } else {
        script.addEventListener("load", initializeMap);
      }
    }

    return () => {
      // Cleanup on component unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initialLat, initialLng, onLocationSelect]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs">
        <label className="font-bold text-slate-500 uppercase tracking-wide">
          Mark Location on Map
        </label>
        {geocodeLoading && (
          <span className="text-[#0088ff] font-semibold animate-pulse">
            Fetching address...
          </span>
        )}
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-[#82cdff]/30 h-48 bg-slate-50 shadow-inner">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center text-sm font-semibold text-slate-500">
            <div className="w-5 h-5 border-2 border-[#0088ff] border-t-transparent rounded-full animate-spin mr-2" />
            Loading interactive map...
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>
      <span className="text-[10px] text-slate-400 leading-none">
        * Drag the marker pin or tap anywhere on the map to mark your exact address.
      </span>
    </div>
  );
}
