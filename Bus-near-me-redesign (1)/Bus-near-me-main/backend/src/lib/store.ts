import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

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

export interface Store {
  findUserByEmail(email: string): Promise<User | undefined>;
  findUserById(id: string): Promise<User | undefined>;
  addUser(u: User): Promise<void>;
  addBooking(b: Booking): Promise<void>;
  bookingsFor(userId: string): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  cancelBooking(id: string): Promise<Booking | undefined>;
  takenSeats(busId: string, date: string): Promise<string[]>;
}

/* ───────────── JSON file (default, zero setup) ───────────── */
interface FileDB { users: User[]; bookings: Booking[]; }
const FILE = path.join(__dirname, '..', '..', 'data', 'db.json');
const load = (): FileDB => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return { users: [], bookings: [] }; } };
const save = (d: FileDB) => { fs.mkdirSync(path.dirname(FILE), { recursive: true }); const t = FILE + '.tmp'; fs.writeFileSync(t, JSON.stringify(d, null, 2)); fs.renameSync(t, FILE); };

export const fileStore: Store = {
  async findUserByEmail(email) { return load().users.find((u) => u.email === email.toLowerCase()); },
  async findUserById(id) { return load().users.find((u) => u.id === id); },
  async addUser(u) { const d = load(); d.users.push(u); save(d); },
  async addBooking(b) { const d = load(); d.bookings.push(b); save(d); },
  async bookingsFor(userId) { return load().bookings.filter((b) => b.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  async getBooking(id) { return load().bookings.find((b) => b.id === id); },
  async cancelBooking(id) { const d = load(); const b = d.bookings.find((x) => x.id === id); if (b) { b.status = 'CANCELLED'; save(d); } return b; },
  async takenSeats(busId, date) { return load().bookings.filter((b) => b.busId === busId && b.travelDate === date && b.status === 'CONFIRMED').flatMap((b) => b.seats); },
};

/* ───────────── PostgreSQL (set DATABASE_URL) ───────────── */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bookings (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES users(id),
  customer_name      TEXT NOT NULL,
  customer_email     TEXT NOT NULL,
  customer_phone     TEXT NOT NULL,
  bus_id             TEXT NOT NULL,
  route_number       TEXT NOT NULL,
  bus_type           TEXT NOT NULL,
  from_stop          TEXT NOT NULL,
  to_stop            TEXT NOT NULL,
  distance_km        DOUBLE PRECISION NOT NULL,
  travel_date        TEXT NOT NULL,
  departure_time     TEXT NOT NULL,
  arrival_time       TEXT NOT NULL,
  passengers         INTEGER NOT NULL,
  seats              TEXT[] NOT NULL,
  fare_per_passenger INTEGER NOT NULL,
  total_fare         INTEGER NOT NULL,
  payment_method     TEXT NOT NULL,
  payment_status     TEXT NOT NULL,
  status             TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_bus_idx  ON bookings (bus_id, travel_date);
`;

const toUser = (r: any): User => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, passwordHash: r.password_hash, createdAt: new Date(r.created_at).toISOString() });
const toBooking = (r: any): Booking => ({
  id: r.id, userId: r.user_id, customerName: r.customer_name, customerEmail: r.customer_email, customerPhone: r.customer_phone,
  busId: r.bus_id, routeNumber: r.route_number, busType: r.bus_type, from: r.from_stop, to: r.to_stop, distanceKm: Number(r.distance_km),
  travelDate: r.travel_date, departureTime: r.departure_time, arrivalTime: r.arrival_time, passengers: r.passengers, seats: r.seats,
  farePerPassenger: r.fare_per_passenger, totalFare: r.total_fare, paymentMethod: r.payment_method, paymentStatus: r.payment_status,
  status: r.status, createdAt: new Date(r.created_at).toISOString(),
});

export function createPgStore(pool: Pool): Store & { init(): Promise<void> } {
  return {
    async init() { await pool.query(SCHEMA); },
    async findUserByEmail(email) { const r = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]); return r.rows[0] && toUser(r.rows[0]); },
    async findUserById(id) { const r = await pool.query('SELECT * FROM users WHERE id = $1', [id]); return r.rows[0] && toUser(r.rows[0]); },
    async addUser(u) { await pool.query('INSERT INTO users (id,name,email,phone,password_hash,created_at) VALUES ($1,$2,$3,$4,$5,$6)', [u.id, u.name, u.email, u.phone, u.passwordHash, u.createdAt]); },
    async addBooking(b) {
      await pool.query(
        `INSERT INTO bookings (id,user_id,customer_name,customer_email,customer_phone,bus_id,route_number,bus_type,from_stop,to_stop,distance_km,travel_date,departure_time,arrival_time,passengers,seats,fare_per_passenger,total_fare,payment_method,payment_status,status,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
        [b.id, b.userId, b.customerName, b.customerEmail, b.customerPhone, b.busId, b.routeNumber, b.busType, b.from, b.to, b.distanceKm, b.travelDate, b.departureTime, b.arrivalTime, b.passengers, b.seats, b.farePerPassenger, b.totalFare, b.paymentMethod, b.paymentStatus, b.status, b.createdAt],
      );
    },
    async bookingsFor(userId) { const r = await pool.query('SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC', [userId]); return r.rows.map(toBooking); },
    async getBooking(id) { const r = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]); return r.rows[0] && toBooking(r.rows[0]); },
    async cancelBooking(id) { const r = await pool.query("UPDATE bookings SET status = 'CANCELLED' WHERE id = $1 RETURNING *", [id]); return r.rows[0] && toBooking(r.rows[0]); },
    async takenSeats(busId, date) { const r = await pool.query("SELECT seats FROM bookings WHERE bus_id = $1 AND travel_date = $2 AND status = 'CONFIRMED'", [busId, date]); return r.rows.flatMap((x) => x.seats as string[]); },
  };
}

let active: Store = fileStore;
export const db: Store = new Proxy({} as Store, { get: (_t, k) => (active as any)[k] });

/** Call once at startup. Uses Postgres when DATABASE_URL is set, otherwise the JSON file. */
export async function initStore(): Promise<string> {
  const url = process.env.DATABASE_URL;
  if (!url) return 'JSON file (backend/data/db.json). Set DATABASE_URL to use PostgreSQL.';
  const pool = new Pool({
    connectionString: url,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  const pg = createPgStore(pool);
  await pg.init();
  active = pg;
  return 'PostgreSQL';
}
