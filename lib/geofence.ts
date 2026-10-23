export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GeofenceCheckResult {
  isWithinGeofence: boolean;
  distanceMeters: number;
  targetRadiusMeters: number;
}

/**
 * Calculates distance between two GPS coordinates using Haversine formula
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Gets current device GPS location with promise
 */
export function getCurrentGpsPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser or device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        let errorMsg = "Unable to retrieve your GPS location.";
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = "GPS location permission was denied. Please allow location access in your browser settings.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = "Location information is unavailable on your device.";
        } else if (err.code === err.TIMEOUT) {
          errorMsg = "Timed out attempting to acquire GPS coordinates.";
        }
        reject(new Error(errorMsg));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  });
}
