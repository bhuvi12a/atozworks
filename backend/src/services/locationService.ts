import { logger } from "../utils/logger";

export class LocationService {
  /**
   * Calculates the distance between two coordinates using the Haversine formula.
   */
  public static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return parseFloat(distance.toFixed(2));
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Validates if a customer location coordinates fall within the provider's service radius.
   */
  public static isWithinServiceArea(
    providerLat: number,
    providerLon: number,
    customerLat: number,
    customerLon: number,
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(
      providerLat,
      providerLon,
      customerLat,
      customerLon
    );
    return distance <= radiusKm;
  }

  /**
   * Perform reverse geocoding using OpenStreetMap Nominatim API (free, no keys needed).
   * Falls back to a mock address generator if the network fails.
   */
  public static async reverseGeocode(
    lat: number,
    lon: number
  ): Promise<{
    houseNo: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  }> {
    try {
      // Nominatim requires an User-Agent header to avoid rate limit bans
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "AtoZWorksHomeServices/1.0",
        },
      });

      if (!response.ok) {
        throw new Error("OSM Nominatim API request failed");
      }

      const data = (await response.json()) as any;
      const address = data.address || {};

      return {
        houseNo: address.house_number || "G-1",
        street: address.road || address.suburb || "Main Road",
        city: address.city || address.town || address.county || "Hosur",
        state: address.state || "Tamil Nadu",
        pincode: address.postcode || "635109",
        landmark: address.neighbourhood || undefined,
      };
    } catch (error) {
      logger.warn(`Reverse geocoding failed: ${(error as any).message}. Returning fallback address mock.`);
      return {
        houseNo: "F-12",
        street: "Industrial Area Road",
        city: "Hosur",
        state: "Tamil Nadu",
        pincode: "635109",
        landmark: "Opposite SIPCOT Phase-1",
      };
    }
  }
}
