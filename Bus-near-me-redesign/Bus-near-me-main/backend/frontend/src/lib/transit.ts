export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type BusStatus = 'Active' | 'Delayed' | 'Inactive';

export interface Bus {
  id: string;
  routeNumber: string;
  routeName: string;
  origin: string;
  destination: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  capacity: number;
  occupancy: number;
  nextStop: string;
  etaMinutes: number;
  status: BusStatus;
}

export interface LocationOption {
  name: string;
  lat: number;
  lng: number;
}

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
}

export interface NearbyBus {
  busId: string;
  routeNumber: string;
  destination: string;
  distanceKm: number;
  etaMinutes: number;
  speed: number;
  status: string;
}

export interface NearbyResult {
  nearbyBuses: NearbyBus[];
  nearbyStops: Stop[];
}

export const LOCATIONS: LocationOption[] = [
  { name: 'Majestic', lat: 12.9767, lng: 77.5713 },
  { name: 'Silk Board', lat: 12.9172, lng: 77.6228 },
  { name: 'Hebbal', lat: 13.0358, lng: 77.597 },
  { name: 'Banashankari', lat: 12.9255, lng: 77.5468 },
  { name: 'Shivajinagar', lat: 12.9857, lng: 77.6057 },
  { name: 'KR Market', lat: 12.9639, lng: 77.5763 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7499 },
  { name: 'Electronic City', lat: 12.8452, lng: 77.6602 },
  { name: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { name: 'Jayanagar', lat: 12.925, lng: 77.5938 },
  { name: 'Yeshwanthpur', lat: 13.0285, lng: 77.5401 },
  { name: 'Marathahalli', lat: 12.9591, lng: 77.6974 },
];

export const STOPS: Stop[] = [
  { id: 'STOP001', name: 'Silk Board', latitude: 12.9172, longitude: 77.6228 },
  { id: 'STOP002', name: 'HSR Layout BDA Complex', latitude: 12.9116, longitude: 77.6389 },
  { id: 'STOP003', name: 'Agara Junction', latitude: 12.9238, longitude: 77.6514 },
  { id: 'STOP004', name: 'Iblur Junction', latitude: 12.9208, longitude: 77.6644 },
  { id: 'STOP005', name: 'Bellandur', latitude: 12.9279, longitude: 77.6741 },
  { id: 'STOP006', name: 'Marathahalli Bridge', latitude: 12.9559, longitude: 77.6984 },
  { id: 'STOP007', name: 'ITPL Whitefield', latitude: 12.9866, longitude: 77.7345 },
  { id: 'STOP008', name: 'Indiranagar 100ft Road', latitude: 12.9719, longitude: 77.6412 },
  { id: 'STOP009', name: 'Kempegowda Bus Station', latitude: 12.9767, longitude: 77.5713 },
  { id: 'STOP010', name: 'Electronic City Phase 1', latitude: 12.8468, longitude: 77.6766 },
  { id: 'STOP011', name: 'Jayanagar 4th Block', latitude: 12.9284, longitude: 77.5913 },
  { id: 'STOP012', name: 'Hebbal Flyover', latitude: 13.0358, longitude: 77.597 },
  { id: 'STOP013', name: 'Sony World Signal Koramangala', latitude: 12.9345, longitude: 77.6266 },
  { id: 'STOP014', name: 'Madiwala Checkpost', latitude: 12.9226, longitude: 77.6174 },
  { id: 'STOP015', name: 'Richmond Town', latitude: 12.9591, longitude: 77.5971 },
];

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearestStops(lat: number, lng: number, limit = 10): Stop[] {
  return STOPS.map((s) => ({ ...s, distanceKm: distanceKm(lat, lng, s.latitude, s.longitude) }))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, limit);
}

/** Offline / demo fleet — used automatically when the backend API is unreachable. */
export function generateDemoFleet(loc: LocationOption): Bus[] {
  const dests = ['Kempegowda Bus Station', 'Silk Board', 'Electronic City', 'Whitefield', 'Hebbal', 'Banashankari', 'Indiranagar', 'KR Puram'];
  const nexts = ['Richmond Town', 'Madiwala Checkpost', 'Jayanagar 4th Block', 'Agara Junction', 'Marathahalli Bridge', 'Hebbal Flyover'];
  return Array.from({ length: 15 }, (_, i) => {
    const r = Math.random;
    const status: BusStatus = i === 3 || i === 9 ? 'Delayed' : i === 13 ? 'Inactive' : 'Active';
    return {
      id: `SIM-${loc.name.replace(/\s+/g, '')}-${i + 1}`,
      routeNumber: `${['500', '335', '201', 'G4', 'V-365', '600', 'KIA-9', '311'][i % 8]}${i > 7 ? 'A' : ''}`,
      routeName: `Simulated Route ${i + 1}`,
      origin: loc.name,
      destination: dests[i % dests.length],
      latitude: loc.lat + (r() - 0.5) * 0.04,
      longitude: loc.lng + (r() - 0.5) * 0.04,
      speed: status === 'Inactive' ? 0 : 18 + Math.floor(r() * 32),
      heading: Math.floor(r() * 360),
      capacity: 60,
      occupancy: Math.floor(r() * 58),
      nextStop: nexts[i % nexts.length],
      etaMinutes: 2 + Math.floor(r() * 12),
      status,
    };
  });
}

export function stepDemoFleet(buses: Bus[]): Bus[] {
  return buses.map((b) => {
    if (b.status === 'Inactive') return b;
    const speed = Math.max(10, Math.min(65, Math.round(b.speed + (Math.random() - 0.5) * 6)));
    return {
      ...b,
      latitude: b.latitude + (Math.random() - 0.49) * 0.0012,
      longitude: b.longitude + (Math.random() - 0.49) * 0.0012,
      speed,
      etaMinutes: Math.max(1, b.etaMinutes + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0)),
    };
  });
}

export function nearbyFromFleet(buses: Bus[], lat: number, lng: number, radius = 3): NearbyResult {
  const stops = nearestStops(lat, lng, 5).map((s) => ({ ...s, distanceKm: Number((s.distanceKm ?? 0).toFixed(2)) }));
  const nearbyBuses = buses
    .filter((b) => b.status !== 'Inactive')
    .map((b) => ({ b, d: distanceKm(lat, lng, b.latitude, b.longitude) }))
    .filter(({ d }) => d <= radius * 2)
    .map(({ b, d }) => ({
      busId: b.id,
      routeNumber: b.routeNumber,
      destination: b.destination,
      distanceKm: Number(d.toFixed(2)),
      etaMinutes: Math.max(1, Math.round(d * 3)),
      speed: b.speed,
      status: b.status === 'Delayed' ? 'Delayed' : 'Approaching',
    }))
    .sort((a, b) => a.etaMinutes - b.etaMinutes);
  return { nearbyBuses, nearbyStops: stops };
}

export function occupancyLevel(b: Pick<Bus, 'occupancy' | 'capacity'>) {
  const pct = Math.round((b.occupancy / b.capacity) * 100);
  if (pct > 80) return { pct, label: 'Crowded', tone: 'danger' as const };
  if (pct > 50) return { pct, label: 'Filling up', tone: 'warn' as const };
  return { pct, label: 'Seats free', tone: 'ok' as const };
}
