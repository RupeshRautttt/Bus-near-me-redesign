<div align="center">

# 🚌 Bus Near Me

**Live bus tracking, arrival estimates, crowd levels and ticket booking for Bengaluru.**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-build-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-ready-4169E1?logo=postgresql&logoColor=white)

</div>

---

## Overview

**Bus Near Me** is a full-stack web application that shows every bus around a chosen Bengaluru hub on a live map, with speed, next stop, crowd level and a smart ETA. Customers can create an account, book a ticket on any running bus, and the operator receives an email with the complete ticket details for every booking.

The project is a prototype: bus movement is **simulated** by the backend, and payments are a **demo** (no money is charged). Everything else (accounts, bookings, fares, seat allocation, email) is real, working code.

## Features

**For riders**
- Live map with colour-coded bus markers (green: seats free, amber: filling up, red: crowded or delayed)
- Search by route number or destination; filter by On time / Delayed / Inactive
- "Find buses near me" using browser geolocation or the selected hub, with the closest stops
- Per-bus details: ETA, speed, next stop, occupancy bar
- Account sign-up and login; book a ticket, view **My tickets**, cancel a ticket
- Fare calculator (Ordinary or AC Vajra), 1 to 6 passengers, automatic seat allocation

**For the operator**
- An email for every booking: ticket ID, customer name, email and phone, from → to, bus and route, date, departure and arrival time, seats, fare and payment status
- Optional confirmation copy to the customer
- Bookings and accounts stored in PostgreSQL (or a JSON file for quick local use)

**Engineering**
- Responsive, dark UI with a landing page, built from reusable components
- Automatic **demo mode**: if the API is unreachable, the site simulates buses in the browser so it never looks broken
- Input validation, hashed passwords, signed tokens, rate-limited auth, HTML-escaped emails
- Serialised seat allocation so two customers can never get the same seat

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion, Leaflet + React-Leaflet, Axios, Lucide icons |
| Map tiles | CARTO dark basemap (OpenStreetMap data) |
| Backend | Node.js, Express 5, TypeScript (`ts-node`, `nodemon`) |
| Auth | `bcryptjs` password hashing, JWT (7-day expiry) via `jsonwebtoken` |
| Database | PostgreSQL via `pg` (auto-creates tables), or a JSON file fallback |
| Email | [Resend](https://resend.com) HTTP API, or any SMTP server (e.g. Gmail) via `nodemailer` |

## Architecture

```mermaid
flowchart LR
  subgraph Browser
    UI[React + Leaflet UI]
  end
  subgraph Server[Express API]
    SIM[Bus simulation<br/>updates every 3 s]
    AUTH[Auth + JWT]
    BOOK[Booking + fares]
    MAIL[Mailer]
  end
  DB[(PostgreSQL<br/>or JSON file)]
  RES[Resend / SMTP]
  OWN[Owner inbox]

  UI -- "poll /api/buses every 3 s" --> SIM
  UI -- "login / book" --> AUTH
  AUTH --> BOOK
  BOOK <--> DB
  BOOK --> MAIL --> RES --> OWN
```

## Project structure

> The React app lives **inside** `backend/` (`backend/frontend`). Run them as two separate processes.

```
Bus-near-me-main/
├── README.md
├── .gitignore
└── backend/
    ├── .env.example            # copy to .env and fill in
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── index.ts            # Express app, routes, bus simulation
    │   ├── data/               # stops, routes, seed buses
    │   ├── utils/geo.ts        # distance (Haversine) + ETA
    │   └── lib/
    │       ├── auth.ts         # hashing, JWT, requireAuth middleware
    │       ├── fare.ts         # fare + travel-time calculation
    │       ├── store.ts        # PostgreSQL store + JSON file store
    │       └── mailer.ts       # Resend / SMTP / outbox email sender
    └── frontend/
        ├── index.html
        ├── vite.config.ts
        └── src/
            ├── App.tsx
            ├── index.css       # design tokens, map marker styles
            ├── components/     # Navbar, Hero, LiveTracker, BookingModal, AuthModal, Ticket, ...
            ├── hooks/          # useTransit (data + demo mode), useAuth
            └── lib/            # api client, transit data, map markers
```

## Getting started

### Prerequisites

- **Node.js 20 or newer** and npm
- *(optional)* **PostgreSQL 13+**. Without it, data is stored in `backend/data/db.json`.
- *(optional)* a [Resend](https://resend.com) account or Gmail App password for booking emails

### 1. Clone and install

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO

# backend
cd backend
npm install

# frontend
cd frontend
npm install
cd ../..
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env
```

Open `backend/.env` and fill it in (see the table below). At minimum set `JWT_SECRET`.
Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. (Optional) Create the PostgreSQL database

```bash
createdb busnearme
```

Then set `DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/busnearme` in `.env`.
Tables (`users`, `bookings`) are created automatically on first start.

### 4. Run it

Use two terminals:

```bash
# Terminal 1: API on http://localhost:3000
cd backend
npm run dev

# Terminal 2: website on http://localhost:5173
cd backend/frontend
npm run dev
```

Open **http://localhost:5173**. The backend prints which storage it is using (`PostgreSQL` or `JSON file`).

### 5. Try a booking

1. Click **Sign up** and create an account.
2. In **Live tracker**, click a bus, then **Book a ticket**.
3. Pick stops, date, bus type and passengers, then confirm.
4. Check **My tickets**, and your owner inbox for the booking email.

## Configuration

All settings live in `backend/.env`. This file is git-ignored; never commit it.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port. Default `3000`. |
| `JWT_SECRET` | **Yes** | Long random string used to sign login tokens. A weak development secret is used (with a warning) if missing. |
| `DATABASE_URL` | No | PostgreSQL connection string. If empty, a JSON file is used. |
| `DATABASE_SSL` | No | Set `true` for hosted databases that require SSL (Neon, Supabase, Render). |
| `OWNER_EMAIL` | For email | Inbox that receives a message for every booking. |
| `RESEND_API_KEY` | For email | API key from [resend.com/api-keys](https://resend.com/api-keys). Takes priority over SMTP. |
| `MAIL_FROM` | No | Sender, e.g. `Bus Near Me <tickets@yourdomain.com>`. Defaults to `onboarding@resend.dev` with Resend. |
| `SMTP_HOST` / `SMTP_PORT` | No | SMTP server (default `smtp.gmail.com` / `465`). |
| `SMTP_USER` / `SMTP_PASS` | For SMTP | SMTP login. For Gmail use an [App password](https://myaccount.google.com/apppasswords), not your normal password. |

**Frontend (optional):** create `backend/frontend/.env` with `VITE_API_URL=https://your-api.example.com` to point the site at a deployed API. Default is `http://localhost:3000`.

### Email behaviour

| Situation | Result |
|---|---|
| `RESEND_API_KEY` set | Sent through Resend |
| No Resend key, `SMTP_USER` + `SMTP_PASS` set | Sent through SMTP |
| Nothing configured | Booking still succeeds; the email is saved to `backend/data/outbox/<ticket>.html` |

Notes for Resend: the default sender `onboarding@resend.dev` can only deliver to the email address of your own Resend account, which is exactly what the owner alert needs. To also email **customers**, verify your own domain in Resend and set `MAIL_FROM`. Until then the customer copy is skipped with a warning in the server log. A failed email never blocks a booking.

## API reference

Base URL: `http://localhost:3000`. Protected routes need `Authorization: Bearer <token>`.

### Live data

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/locations` | Available hubs |
| POST | `/api/location` | Switch hub `{ name, lat, lng }`; respawns buses around it |
| GET | `/api/buses` | All buses with live position, speed, ETA, occupancy |
| GET | `/api/buses/:id` | One bus |
| POST | `/api/buses/nearby` | Buses and stops within a radius `{ latitude, longitude, radius }` |
| GET | `/api/stops` · `/api/stops/nearby` | Stops, and stops near a point |
| POST | `/api/simulation/start` · `/pause` · `/reset` | Control the simulation |

### Accounts and bookings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | `{ name, email, phone, password }` (password 8+ chars) |
| POST | `/api/auth/login` | – | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | ✔ | Current user |
| GET | `/api/fare` | – | `?from=STOP009&to=STOP001&type=AC&passengers=2` |
| POST | `/api/bookings` | ✔ | `{ fromStopId, toStopId, busId, busType, passengers, travelDate, departureTime?, paymentMethod }` |
| GET | `/api/bookings` | ✔ | Your tickets, newest first |
| POST | `/api/bookings/:id/cancel` | ✔ | Cancel one of your tickets |

### Fares

```
fare = max(minimum, round(base + perKm × distanceKm))     distance = straight-line × 1.3 (road factor)

Ordinary:   base ₹8,  ₹1.9 / km,  minimum ₹10
AC Vajra:   base ₹20, ₹3.6 / km,  minimum ₹25
```

## Data model

```sql
users    (id PK, name, email UNIQUE, phone, password_hash, created_at)
bookings (id PK, user_id → users, customer_*, bus_id, route_number, bus_type,
          from_stop, to_stop, distance_km, travel_date, departure_time, arrival_time,
          passengers, seats TEXT[], fare_per_passenger, total_fare,
          payment_method, payment_status, status, created_at)
```

## Security notes

- Passwords are hashed with bcrypt; plain passwords are never stored or logged.
- Login tokens are signed JWTs that expire after 7 days.
- Register and login are rate limited per IP (10 attempts per 10 minutes).
- All user-supplied text is HTML-escaped in emails.
- `.env`, `node_modules/` and `backend/data/` are git-ignored. **Never commit secrets.** If a key is ever exposed, rotate it immediately.
- For production also: restrict CORS to your site's origin, serve over HTTPS, and move rate limiting to a shared store if you run more than one server instance.

## Build for production

```bash
cd backend/frontend
npm run build          # outputs backend/frontend/dist (static files)
```

Host `dist/` on any static host (Vercel, Netlify, Cloudflare Pages) with `VITE_API_URL` pointing at your API. Deploy `backend/` to any Node host (Render, Railway, Fly.io) with the environment variables above and a managed PostgreSQL database (`DATABASE_SSL=true` where required).

## Troubleshooting

| Problem | Fix |
|---|---|
| Badge says **Demo mode** | The frontend can't reach the API. Start the backend and check `VITE_API_URL`. |
| Booking says "needs the backend" | Same as above; booking is disabled in demo mode. |
| Map is grey or blank | Map tiles need internet access. Check your connection or any ad-blocker. |
| `[mail] owner email failed: ... 403` | With Resend's default sender, `OWNER_EMAIL` must be the email your Resend account was created with. |
| `Invalid login` (Gmail) | Use a 16-character App password; 2-Step Verification must be on. |
| `Could not start. Database error` | Check `DATABASE_URL`, that the database exists, and set `DATABASE_SSL=true` for hosted databases. |
| Emails not arriving | Look in spam; read the `[mail]` lines in the backend terminal; check `backend/data/outbox/`. |

## Roadmap

- Real payment gateway (Razorpay / Stripe) instead of the demo payment
- Real BMTC GTFS-realtime feed instead of simulated buses
- Seat map selection, QR code on tickets, email verification
- Automated tests (API and UI) and CI
- Admin dashboard for bookings

## License

Add a license of your choice (for example MIT) in a `LICENSE` file.

## Author

Built by **YOUR NAME** · [GitHub](https://github.com/YOUR-USERNAME)
