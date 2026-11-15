import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { stops } from './data/stops';
import { routes } from './data/routes';
import { calculateDistance, calculateETA } from './utils/geo';
import { db, Booking } from './lib/store';
import { AuthedRequest, checkPassword, hashPassword, newId, publicUser, requireAuth, signToken } from './lib/auth';
import { quote, BusType } from './lib/fare';
import { sendBookingEmails } from './lib/mailer';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

interface Bus {
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
  status: 'Active' | 'Delayed' | 'Inactive';
}

interface Location {
  name: string;
  lat: number;
  lng: number;
}

const BENGALURU_LOCATIONS: Location[] = [
  { name: 'Majestic', lat: 12.9767, lng: 77.5713 },
  { name: 'Silk Board', lat: 12.9172, lng: 77.6228 },
  { name: 'Hebbal', lat: 13.0358, lng: 77.5970 },
  { name: 'Banashankari', lat: 12.9255, lng: 77.5468 },
  { name: 'Shivajinagar', lat: 12.9857, lng: 77.6057 },
  { name: 'KR Market', lat: 12.9639, lng: 77.5763 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7499 },
  { name: 'Electronic City', lat: 12.8452, lng: 77.6602 },
  { name: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { name: 'Jayanagar', lat: 12.9250, lng: 77.5938 },
  { name: 'Yeshwanthpur', lat: 13.0285, lng: 77.5401 },
  { name: 'Marathahalli', lat: 12.9591, lng: 77.6974 },
];

let currentCenter: Location = BENGALURU_LOCATIONS[0];
let isSimulationRunning = true;

const DESTINATIONS = ['Kempegowda Bus Station', 'Silk Board', 'Electronic City', 'Whitefield', 'Hebbal', 'Banashankari', 'Indiranagar', 'KR Puram'];
const NEXT_STOPS = ['Richmond Town', 'Madiwala Checkpost', 'Jayanagar 4th Block', 'Agara Junction', 'Marathahalli Bridge', 'Hebbal Flyover'];

const createBus = (id: string, routeNumber: string, lat: number, lng: number, i = 0): Bus => ({
  id,
  routeNumber,
  routeName: `Simulated Route ${routeNumber}`,
  origin: currentCenter.name,
  destination: DESTINATIONS[i % DESTINATIONS.length],
  latitude: lat,
  longitude: lng,
  speed: 20 + Math.floor(Math.random() * 30),
  heading: Math.floor(Math.random() * 360),
  capacity: 60,
  occupancy: Math.floor(Math.random() * 50),
  nextStop: NEXT_STOPS[i % NEXT_STOPS.length],
  etaMinutes: 2 + Math.floor(Math.random() * 10),
  status: 'Active',
});

const generateBusesForLocation = (loc: Location): Bus[] => {
  return Array.from({ length: 15 }, (_, i) =>
    createBus(`SIM-${loc.name.replace(/\s+/g, '')}-${i + 1}`, `50${i}`, loc.lat + (Math.random() - 0.5) * 0.04, loc.lng + (Math.random() - 0.5) * 0.04, i)
  );
};

let buses: Bus[] = generateBusesForLocation(currentCenter);

// Simulate movement
setInterval(() => {
  if (!isSimulationRunning) return;
  buses = buses.map((bus) => {
    if (bus.status === 'Inactive') return bus;
    const deltaLat = (Math.random() - 0.49) * 0.0012;
    const deltaLng = (Math.random() - 0.49) * 0.0012;
    const speedChange = (Math.random() - 0.5) * 6;
    const newSpeed = Math.max(10, Math.min(65, Math.round(bus.speed + speedChange)));

    return {
      ...bus,
      latitude: Number((bus.latitude + deltaLat).toFixed(4)),
      longitude: Number((bus.longitude + deltaLng).toFixed(4)),
      speed: newSpeed,
      etaMinutes: Math.max(1, bus.etaMinutes + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0))
    };
  });
}, 3000);

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Smart Bus BMTC API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      buses: '/api/buses',
      locations: '/api/locations',
      busDetail: '/api/buses/:id',
      nearbyBuses: '/api/buses/nearby (POST)',
      nearbyStops: '/api/stops/nearby (GET)',
      stops: '/api/stops'
    }
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/locations', (req: Request, res: Response) => {
  res.json(BENGALURU_LOCATIONS);
});

app.post('/api/location', (req: Request, res: Response) => {
  const { name, lat, lng } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }
  currentCenter = { name: name || 'Custom Location', lat, lng };
  buses = generateBusesForLocation(currentCenter);
  res.json({ success: true, currentCenter, buses });
});

app.post('/api/simulation/start', (req: Request, res: Response) => {
  isSimulationRunning = true;
  res.json({ success: true, status: 'running' });
});

app.post('/api/simulation/pause', (req: Request, res: Response) => {
  isSimulationRunning = false;
  res.json({ success: true, status: 'paused' });
});

app.post('/api/simulation/reset', (req: Request, res: Response) => {
  buses = generateBusesForLocation(currentCenter);
  res.json({ success: true, buses });
});

app.get('/api/stops', (req: Request, res: Response) => {
  res.json(stops);
});

app.get('/api/stops/nearby', (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }
  const nearbyStops = stops.map(stop => ({
    ...stop,
    distanceKm: calculateDistance(lat, lng, stop.latitude, stop.longitude)
  })).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 10);
  res.json(nearbyStops);
});

app.get('/api/buses', (req: Request, res: Response) => {
  res.json(buses);
});

app.get('/api/buses/:id', (req: Request, res: Response) => {
  const bus = buses.find((b) => b.id === req.params.id);
  if (!bus) {
    return res.status(404).json({ error: 'Bus not found' });
  }
  res.json(bus);
});

app.post('/api/buses/nearby', (req: Request, res: Response) => {
  const { latitude, longitude, radius } = req.body;

  if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ success: false, error: 'Invalid coordinates' });
  }

  const searchRadius = typeof radius === 'number' && radius > 0 ? radius : 5;

  const nearbyStops = stops.map(stop => {
    const dist = calculateDistance(latitude, longitude, stop.latitude, stop.longitude);
    return { ...stop, distanceKm: dist };
  }).filter(stop => stop.distanceKm <= searchRadius)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const nearbyBusesResult: any[] = [];

  buses.forEach(bus => {
    if (bus.status === 'Inactive') return;
    const distBus = calculateDistance(latitude, longitude, bus.latitude, bus.longitude);
    if (distBus <= searchRadius * 2) {
      nearbyBusesResult.push({
        busId: bus.id,
        routeNumber: bus.routeNumber,
        route: bus.routeName,
        origin: bus.origin,
        destination: bus.destination,
        boardingStop: nearbyStops[0]?.name || 'Nearby Hub',
        boardingStopDistanceKm: nearbyStops[0] ? Number(nearbyStops[0].distanceKm.toFixed(2)) : 0.5,
        distanceKm: Number(distBus.toFixed(2)),
        etaMinutes: Math.max(1, Math.round(distBus * 3)),
        speed: bus.speed,
        status: bus.status === 'Delayed' ? 'Delayed' : 'Approaching'
      });
    }
  });

  nearbyBusesResult.sort((a, b) => a.etaMinutes - b.etaMinutes);

  res.json({
    success: true,
    userLocation: { latitude, longitude },
    nearbyStops: nearbyStops.slice(0, 5).map(s => ({
      id: s.id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      distanceKm: Number(s.distanceKm.toFixed(2))
    })),
    nearbyBuses: nearbyBusesResult
  });
});

// ───────────── Accounts & ticket booking ─────────────
const attempts = new Map<string, { n: number; t: number }>();
const limited = (key: string, max = 10, windowMs = 10 * 60 * 1000) => {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || now - a.t > windowMs) { attempts.set(key, { n: 1, t: now }); return false; }
  a.n += 1;
  return a.n > max;
};
const clean = (v: unknown, max = 80) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const IST = 'Asia/Kolkata';
const istDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: IST }); // YYYY-MM-DD
const istTime = (d: Date) => d.toLocaleTimeString('en-GB', { timeZone: IST, hour: '2-digit', minute: '2-digit' });

app.post('/api/auth/register', async (req: Request, res: Response) => {
  if (limited('reg:' + req.ip)) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  const name = clean(req.body.name, 60), email = clean(req.body.email, 120).toLowerCase(), phone = clean(req.body.phone, 15).replace(/[^\d+]/g, '');
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (name.length < 2) return res.status(400).json({ error: 'Enter your full name.' });
  if (!emailOk(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (phone.replace(/\D/g, '').length < 10) return res.status(400).json({ error: 'Enter a 10-digit phone number.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  if (db.findUserByEmail(email)) return res.status(409).json({ error: 'An account with this email already exists. Log in instead.' });
  const user = { id: newId('U'), name, email, phone, passwordHash: await hashPassword(password), createdAt: new Date().toISOString() };
  db.addUser(user);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const email = clean(req.body.email, 120).toLowerCase();
  if (limited('login:' + req.ip + email)) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  const user = db.findUserByEmail(email);
  const ok = user && typeof req.body.password === 'string' && (await checkPassword(req.body.password, user.passwordHash));
  if (!user || !ok) return res.status(401).json({ error: 'Incorrect email or password.' });
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res: Response) => res.json({ user: publicUser(req.user!) }));

app.get('/api/fare', (req: Request, res: Response) => {
  const type: BusType = req.query.type === 'AC' ? 'AC' : 'Ordinary';
  const passengers = Math.min(6, Math.max(1, parseInt(String(req.query.passengers || '1'), 10) || 1));
  const q = quote(String(req.query.from), String(req.query.to), type, passengers);
  if (!q) return res.status(400).json({ error: 'Choose two different stops.' });
  res.json({ distanceKm: q.distanceKm, farePerPassenger: q.farePerPassenger, totalFare: q.totalFare, travelMinutes: q.travelMinutes });
});

app.get('/api/bookings', requireAuth, (req: AuthedRequest, res: Response) => res.json(db.bookingsFor(req.user!.id)));

app.post('/api/bookings', requireAuth, async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const { fromStopId, toStopId, busId } = req.body;
  const type: BusType = req.body.busType === 'AC' ? 'AC' : 'Ordinary';
  const passengers = Math.floor(Number(req.body.passengers));
  if (!(passengers >= 1 && passengers <= 6)) return res.status(400).json({ error: 'Choose between 1 and 6 passengers.' });

  const bus = buses.find((b) => b.id === busId);
  if (!bus) return res.status(409).json({ error: 'This bus is no longer available. Pick another bus.' });
  if (bus.status === 'Inactive') return res.status(409).json({ error: 'This bus is not running right now.' });

  const q = quote(String(fromStopId), String(toStopId), type, passengers);
  if (!q) return res.status(400).json({ error: 'Choose two different stops.' });

  const now = new Date();
  const today = istDate(now);
  const maxDate = istDate(new Date(now.getTime() + 6 * 86400000));
  const travelDate = typeof req.body.travelDate === 'string' ? req.body.travelDate : today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(travelDate) || travelDate < today || travelDate > maxDate) return res.status(400).json({ error: 'Pick a date within the next 7 days.' });

  let departure: Date;
  let departureTime: string;
  if (travelDate === today) {
    departure = new Date(now.getTime() + bus.etaMinutes * 60000);
    departureTime = istTime(departure);
  } else {
    departureTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(req.body.departureTime || '') ? req.body.departureTime : '08:00';
    departure = new Date(`${travelDate}T${departureTime}:00+05:30`);
  }
  const arrivalTime = istTime(new Date(departure.getTime() + q.travelMinutes * 60000));

  const taken = new Set(db.takenSeats(bus.id, travelDate));
  const free: string[] = [];
  for (let i = 1; i <= bus.capacity && free.length < passengers; i++) if (!taken.has(`S${i}`)) free.push(`S${i}`);
  if (free.length < passengers) return res.status(409).json({ error: 'Not enough seats left on this bus.' });

  const method = ['UPI', 'Card', 'Cash'].includes(req.body.paymentMethod) ? req.body.paymentMethod : 'UPI';
  const booking: Booking = {
    id: newId('TKT-'), userId: user.id,
    customerName: user.name, customerEmail: user.email, customerPhone: user.phone,
    busId: bus.id, routeNumber: bus.routeNumber, busType: type,
    from: q.from.name, to: q.to.name, distanceKm: q.distanceKm,
    travelDate, departureTime, arrivalTime,
    passengers, seats: free,
    farePerPassenger: q.farePerPassenger, totalFare: q.totalFare,
    paymentMethod: method === 'Cash' ? 'Cash' : `${method} (demo)`,
    paymentStatus: method === 'Cash' ? 'PAY_ON_BOARD' : 'PAID',
    status: 'CONFIRMED', createdAt: new Date().toISOString(),
  };
  db.addBooking(booking);
  const mail = await sendBookingEmails(booking); // never blocks the booking if email fails
  res.status(201).json({ booking, email: mail });
});

app.post('/api/bookings/:id/cancel', requireAuth, (req: AuthedRequest, res: Response) => {
  const b = db.getBooking(String(req.params.id));
  if (!b || b.userId !== req.user!.id) return res.status(404).json({ error: 'Ticket not found.' });
  res.json(db.cancelBooking(b.id));
});

app.get('/api/stops-list', (_req: Request, res: Response) => res.json(stops));

app.listen(port, () => {
  console.log(`Smart Bus Backend API running on http://localhost:${port}`);
});
