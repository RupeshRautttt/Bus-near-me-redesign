import { useState } from 'react';
import AuthModal from './components/AuthModal';
import BookingModal from './components/BookingModal';
import TicketsModal from './components/TicketsModal';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LiveTracker from './components/LiveTracker';
import { Coverage, CTA, Features, Footer, HowItWorks, Marquee, SectionHead } from './components/Sections';
import { LOCATIONS, type Bus, type LocationOption } from './lib/transit';
import { useTransit } from './hooks/useTransit';

export default function App() {
  const [location, setLocation] = useState<LocationOption>(LOCATIONS[0]);
  const t = useTransit(location);
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [bookingBus, setBookingBus] = useState<Bus | null>(null);
  const [pendingBus, setPendingBus] = useState<Bus | null>(null);
  const [ticketsOpen, setTicketsOpen] = useState(false);

  const book = (b: Bus) => { if (user) setBookingBus(b); else { setPendingBus(b); setAuthMode('login'); } };
  const nearestStopId = t.stops[0]?.id;

  const change = (l: LocationOption) => { setLocation(l); t.switchLocation(l); };

  return (
    <div className="min-h-screen bg-ink">
      <Navbar onLogin={() => setAuthMode('login')} onRegister={() => setAuthMode('register')} onTickets={() => setTicketsOpen(true)} />
      <Hero buses={t.buses} locations={t.locations} selected={location} onPick={change} />
      <Marquee items={['Live bus positions', 'Crowd levels', 'Smart ETAs', 'Nearby stops', 'Delay alerts', 'Route overlays', 'Bengaluru-wide coverage']} />

      <section id="live" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHead eyebrow="Live tracker" title={<>The whole fleet,<br />on one map.</>} sub="Pick a hub, search a route, tap any bus for speed, crowd level and arrival time." />
          <div className="mt-10">
            <LiveTracker
              buses={t.buses} stops={t.stops} locations={t.locations} location={location}
              loading={t.loading} demo={t.demo} running={t.running}
              onLocation={change} onToggle={t.toggle} onReset={t.reset} onFindNearby={t.findNearby} onBook={book}
            />
          </div>
        </div>
      </section>

      <Features />
      <HowItWorks />
      <Coverage locations={t.locations} onPick={change} />
      <CTA />
      <Footer />

      <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => { setAuthMode(null); setPendingBus(null); }}
        onDone={() => { setAuthMode(null); if (pendingBus) { setBookingBus(pendingBus); setPendingBus(null); } }} />
      <BookingModal bus={bookingBus} demo={t.demo} defaultFrom={nearestStopId} onClose={() => setBookingBus(null)} onViewTickets={() => setTicketsOpen(true)} />
      <TicketsModal open={ticketsOpen && !!user} onClose={() => setTicketsOpen(false)} />
    </div>
  );
}
