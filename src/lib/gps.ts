import type { GpsPoint, Workplace } from "@/lib/types";

export function captureLocation(): Promise<GpsPoint | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date(position.timestamp).toISOString()
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const earthRadius = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

export function isOutsideWorkplaceRadius(point: GpsPoint | null, workplace: Workplace | null) {
  if (!point || !workplace?.latitude || !workplace.longitude || !workplace.allowed_radius_meters) {
    return false;
  }
  return (
    distanceMeters(point.latitude, point.longitude, workplace.latitude, workplace.longitude) >
    workplace.allowed_radius_meters
  );
}
