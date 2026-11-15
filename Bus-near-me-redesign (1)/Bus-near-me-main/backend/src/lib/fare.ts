import { stops } from '../data/stops';
import { calculateDistance } from '../utils/geo';

export type BusType = 'Ordinary' | 'AC';

/** BMTC-style fare: base + per-km, rounded to the nearest rupee. AC (Vajra) costs more. */
export function quote(fromId: string, toId: string, type: BusType, passengers: number) {
  const a = stops.find((s) => s.id === fromId);
  const b = stops.find((s) => s.id === toId);
  if (!a || !b || a.id === b.id) return null;
  const distanceKm = Number((calculateDistance(a.latitude, a.longitude, b.latitude, b.longitude) * 1.3).toFixed(1)); // road factor
  const base = type === 'AC' ? 20 : 8;
  const perKm = type === 'AC' ? 3.6 : 1.9;
  const fare = Math.max(type === 'AC' ? 25 : 10, Math.round(base + perKm * distanceKm));
  const travelMinutes = Math.max(8, Math.round((distanceKm / 22) * 60));
  return { from: a, to: b, distanceKm, farePerPassenger: fare, totalFare: fare * passengers, travelMinutes };
}
