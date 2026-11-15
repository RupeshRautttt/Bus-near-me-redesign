import { motion } from 'framer-motion';
import { BellRing, Gauge, MapPinned, Route, Users, Zap, Search, Crosshair, Footprints, Code2, Heart } from 'lucide-react';
import { Logo } from './Navbar';
import type { LocationOption } from '../lib/transit';

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

export function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  return (
    <motion.div {...reveal} className="max-w-2xl">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-signal">{eyebrow}</div>
      <h2 className="font-display font-extrabold text-4xl md:text-5xl leading-[1.02] mt-3">{title}</h2>
      {sub && <p className="mt-4 text-muted text-lg leading-relaxed">{sub}</p>}
    </motion.div>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="relative border-y border-line bg-panel/50 overflow-hidden py-4 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
      <div className="flex w-max animate-marquee gap-10 text-sm font-medium text-muted">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap">{t}<span className="size-1 rounded-full bg-signal" /></span>
        ))}
      </div>
    </div>
  );
}

const features = [
  { icon: Zap, title: 'Real-time positions', body: 'Buses refresh every three seconds, so the dot on your screen is the bus on the road.', span: 'lg:col-span-4' },
  { icon: Users, title: 'Crowd levels', body: 'Know if there are seats before the bus pulls in.', span: 'lg:col-span-2' },
  { icon: Gauge, title: 'Smart ETAs', body: 'Arrival estimates built from live distance and speed — not a static timetable.', span: 'lg:col-span-2' },
  { icon: MapPinned, title: 'Nearby stops', body: 'Instantly see the closest BMTC stops and how far you need to walk.', span: 'lg:col-span-4' },
  { icon: Route, title: 'Route overlays', body: 'Follow a route across the city with clear, glowing path lines.', span: 'lg:col-span-3' },
  { icon: BellRing, title: 'Delay awareness', body: 'Delayed and inactive buses are flagged so you can pick a better ride.', span: 'lg:col-span-3' },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead eyebrow="Features" title={<>Everything you need<br />before you step outside.</>} sub="Designed for the 30 seconds that matter: you’re at the door and want to know when to leave." />
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {features.map((f, i) => (
            <motion.div key={f.title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.05 }}
              className={`group relative overflow-hidden rounded-3xl border border-line bg-panel p-7 hover:border-signal/40 transition-colors ${f.span}`}>
              <div className="absolute -top-20 -right-20 size-56 rounded-full bg-signal/0 group-hover:bg-signal/10 blur-3xl transition-colors" />
              <div className="relative grid place-items-center size-12 rounded-2xl bg-signal/10 text-signal border border-signal/20"><f.icon size={22} /></div>
              <h3 className="relative font-display font-bold text-2xl mt-6">{f.title}</h3>
              <p className="relative mt-2 text-muted leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { icon: Search, title: 'Choose your hub', body: 'Pick a Bengaluru locality or let us use your GPS.' },
  { icon: Crosshair, title: 'Spot your bus', body: 'Filter by route or destination and tap a bus for live speed, crowd and ETA.' },
  { icon: Footprints, title: 'Leave on time', body: 'Walk to the closest stop right when the bus is a few minutes away.' },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-24 lg:py-32 border-t border-line bg-panel/40">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead eyebrow="How it works" title="Three taps. Zero waiting." />
        <div className="mt-14 grid md:grid-cols-3 gap-4 relative">
          {steps.map((s, i) => (
            <motion.div key={s.title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.1 }} className="relative rounded-3xl border border-line bg-panel-2/60 p-8">
              <div className="font-display font-extrabold text-7xl text-white/[.06] absolute top-4 right-6 select-none">0{i + 1}</div>
              <div className="grid place-items-center size-12 rounded-2xl bg-fg text-ink"><s.icon size={22} /></div>
              <h3 className="font-display font-bold text-2xl mt-8">{s.title}</h3>
              <p className="mt-2 text-muted leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Coverage({ locations, onPick }: { locations: LocationOption[]; onPick: (l: LocationOption) => void }) {
  return (
    <section id="coverage" className="py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
        <SectionHead eyebrow="Coverage" title="Across the whole city." sub="From Majestic to Electronic City — jump straight to any major hub and see what’s rolling nearby." />
        <motion.div {...reveal} className="flex flex-wrap gap-2.5">
          {locations.map((l) => (
            <a key={l.name} href="#live" onClick={() => onPick(l)} className="px-4 py-2.5 rounded-full border border-line bg-panel text-sm font-medium text-muted hover:text-signal-ink hover:bg-signal hover:border-signal transition">
              {l.name}
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="px-5 pb-24">
      <motion.div {...reveal} className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-signal text-signal-ink px-8 py-16 md:px-16 md:py-20">
        <div className="absolute inset-0 opacity-[.12]" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #000 0 2px, transparent 2px 18px)' }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <h2 className="font-display font-extrabold text-4xl md:text-6xl leading-[0.98] max-w-2xl">Your next bus is already on its way.</h2>
          <a href="#live" className="shrink-0 inline-flex items-center justify-center gap-2 bg-ink text-fg font-bold px-8 py-4 rounded-2xl hover:scale-[1.03] active:scale-[.98] transition">Open the live map</a>
        </div>
      </motion.div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line py-12">
      <div className="mx-auto max-w-7xl px-5 flex flex-col md:flex-row gap-8 md:items-center justify-between">
        <div className="space-y-3"><Logo /><p className="text-sm text-dim max-w-sm">An intelligent bus tracking and simulation platform for Bengaluru. Bus data shown is simulated.</p></div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
          <a href="#live" className="hover:text-fg">Live map</a><a href="#features" className="hover:text-fg">Features</a><a href="#how" className="hover:text-fg">How it works</a><a href="#coverage" className="hover:text-fg">Coverage</a>
        </div>
        <div className="text-sm text-dim flex items-center gap-2"><Code2 size={15} /> Built with <Heart size={13} className="text-danger" /> React, Leaflet & Express</div>
      </div>
    </footer>
  );
}

