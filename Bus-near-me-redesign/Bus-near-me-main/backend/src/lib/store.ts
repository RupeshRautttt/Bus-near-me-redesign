import fs from 'fs';
import path from 'path';

export interface User { id: string; name: string; email: string; phone: string; passwordHash: string; createdAt: string; }
export interface Booking {
  id: string; userId: string;
  customerName: string; customerEmail: string; customerPhone: string;
  busId: string; routeNumber: string; busType: 'Ordinary' | 'AC';
  from: string; to: string; distanceKm: number;
  travelDate: string; departureTime: string; arrivalTime: string;
  passengers: number; seats: string[];
  farePerPassenger: number; totalFare: number;
  paymentMethod: string; paymentStatus: 'PAID' | 'PAY_ON_BOARD';
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
}
interface DB { users: User[]; bookings: Booking[]; }

const FILE = path.join(__dirname, '..', '..', 'data', 'db.json');

function load(): DB {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return { users: [], bookings: [] }; }
}
function save(db: DB) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, FILE);
}

export const db = {
  findUserByEmail: (email: string) => load().users.find((u) => u.email === email.toLowerCase()),
  findUserById: (id: string) => load().users.find((u) => u.id === id),
  addUser: (u: User) => { const d = load(); d.users.push(u); save(d); },
  addBooking: (b: Booking) => { const d = load(); d.bookings.push(b); save(d); },
  bookingsFor: (userId: string) => load().bookings.filter((b) => b.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  getBooking: (id: string) => load().bookings.find((b) => b.id === id),
  cancelBooking: (id: string) => { const d = load(); const b = d.bookings.find((x) => x.id === id); if (b) { b.status = 'CANCELLED'; save(d); } return b; },
  takenSeats: (busId: string, date: string) =>
    load().bookings.filter((b) => b.busId === busId && b.travelDate === date && b.status === 'CONFIRMED').flatMap((b) => b.seats),
};
