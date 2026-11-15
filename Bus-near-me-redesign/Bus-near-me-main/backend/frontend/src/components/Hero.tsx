import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Radio, Users, Clock, Navigation } from 'lucide-react';
import type { Bus, LocationOption } from '../lib/transit';

interface Props {
  buses: Bus[];
  locations: LocationOption[];
  selected: LocationOption;
  onPick: (l: LocationOption) => void;
}

const rise = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] as const },
});

export default function Hero({ buses, locations, selected, onPick }: Props) {
  const active = buses.filter((b) => b.status !== 'Inactive');
  const avgEta = active.length ? Math.round(active.reduce((s, b) => s + b.etaMinutes, 0) / active.length) : 0;
  const next = [...active].sort((a, b) => a.etaMinutes - b.etaMinutes)[0];

  return (
    <section id="top" className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-signal/10 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-5 grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
        <div>
          <motion.div {...rise(0)} className="inline-flex items-center gap-2 text-xs font-medium text-muted border border-line rounded-full pl-2 pr-3.5 py-1.5 bg-panel/60">
            <span className="relative flex size-2"><span className="absolute inset-0 rounded-full bg-signal animate-ping" /><span className="relative size-2 rounded-full bg-signal" /></span>
            Live in Bengaluru · {active.length || '—'} buses on the map
          </motion.div>

          <motion.h1 {...rise(1)} className="font-display font-extrabold text-[clamp(2.8rem,7vw,5.6rem)] leading-[0.95] mt-6">
            Never miss<br />your bus <span className="text-signal">again.</span>
          </motion.h1>

          <motion.p {...rise(2)} className="mt-6 text-lg text-muted max-w-xl leading-relaxed">
            See every BMTC bus around you in real time — where it is, how full it is and exactly when it reaches your stop. Pick a hub, tap a bus, go.
          </motion.p>

          <motion.div {...rise(3)} className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#live" className="group inline-flex items-center gap-2 bg-signal text-signal-ink font-bold px-6 py-3.5 rounded-2xl hover:brightness-110 active:scale-[.98] transition shadow-[0_10px_40px_-10px_rgba(182,242,58,.6)]">
              Open live map <ArrowRight size={18} strokeWidth={2.6} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#how" className="inline-flex items-center gap-2 font-semibold px-6 py-3.5 rounded-2xl border border-line-strong hover:bg-panel-2 transition">
              How it works
            </a>
          </motion.div>

          <motion.div {...rise(4)} className="mt-10">
            <div className="text-xs uppercase tracking-widest text-dim font-semibold mb-3">Popular hubs</div>
            <div className="flex flex-wrap gap-2">
              {locations.slice(0, 7).map((l) => (
                <a
                  key={l.name}
                  href="#live"
                  onClick={() => onPick(l)}
                  className={`inline-flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-full border transition ${
                    selected.name === l.name ? 'border-signal/60 bg-signal/10 text-signal' : 'border-line text-muted hover:text-fg hover:border-line-strong'
                  }`}
                >
                  <MapPin size={13} /> {l.name}
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Visual */}
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto w-full max-w-[520px]">
          <div className="relative aspect-[4/4.4] rounded-[2rem] border border-line-strong bg-panel overflow-hidden shadow-[0_40px_120px_-30px_rgba(182,242,58,.25)]">
            <svg viewBox="0 0 400 440" className="absolute inset-0 w-full h-full">
              <defs>
                <pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,.05)" /></pattern>
                <linearGradient id="r" x1="0" x2="1"><stop offset="0" stopColor="#4cc9f0" /><stop offset="1" stopColor="#b6f23a" /></linearGradient>
              </defs>
              <rect width="400" height="440" fill="url(#g)" />
              <path d="M-10 330 C 80 300, 120 200, 200 220 S 330 150, 420 80" stroke="rgba(255,255,255,.07)" strokeWidth="26" fill="none" />
              <path d="M60 -10 C 90 120, 160 140, 170 260 S 150 400, 190 460" stroke="rgba(255,255,255,.05)" strokeWidth="18" fill="none" />
              <path id="route" d="M30 380 C 100 330, 130 250, 200 235 S 320 170, 372 70" stroke="url(#r)" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="2 12" className="animate-dash" />
              {[[30, 380], [138, 275], [200, 235], [300, 180], [372, 70]].map(([x, y], i) => (
                <g key={i}><circle cx={x} cy={y} r="9" fill="#0d1219" stroke="#4cc9f0" strokeWidth="3" /></g>
              ))}
              <circle r="9" fill="#b6f23a"><animateMotion dur="7s" repeatCount="indefinite" path="M30 380 C 100 330, 130 250, 200 235 S 320 170, 372 70" /></circle>
              <circle r="22" fill="#b6f23a" opacity=".18"><animateMotion dur="7s" repeatCount="indefinite" path="M30 380 C 100 330, 130 250, 200 235 S 320 170, 372 70" /></circle>
            </svg>

            <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
              <div className="glass border border-line rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-2"><Radio size={14} className="text-signal" /> Live · updates every 3s</div>
              <div className="glass border border-line rounded-xl px-3 py-2 text-xs font-mono text-muted">{selected.name}</div>
            </div>
          </div>

          {/* floating cards */}
          <div className="absolute -left-4 sm:-left-10 bottom-12 animate-float">
            <div className="glass border border-line-strong rounded-2xl p-4 w-[230px] shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-signal bg-signal/10 px-2.5 py-1 rounded-lg text-sm">{next?.routeNumber ?? '500D'}</span>
                <span className="text-[11px] text-ok font-semibold flex items-center gap-1"><span className="size-1.5 rounded-full bg-ok" /> On time</span>
              </div>
              <div className="mt-3 text-sm font-semibold truncate">{next?.destination ?? 'Kempegowda Bus Station'}</div>
              <div className="mt-3 flex items-end justify-between">
                <div><div className="text-[10px] uppercase tracking-wider text-dim">Arrives in</div><div className="font-display font-extrabold text-3xl leading-none">{next?.etaMinutes ?? 4}<span className="text-sm text-muted font-sans font-medium ml-1">min</span></div></div>
                <Navigation size={18} className="text-sky" />
              </div>
            </div>
          </div>

          <div className="absolute -left-2 sm:-left-8 top-24 animate-float [animation-delay:-3s]">
            <div className="glass border border-line-strong rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
              <div className="grid place-items-center size-9 rounded-xl bg-warn/15 text-warn"><Users size={17} /></div>
              <div><div className="text-[10px] uppercase tracking-wider text-dim">Crowd level</div><div className="text-sm font-semibold">Seats available</div></div>
            </div>
          </div>
          <div className="absolute right-6 -bottom-5 animate-float [animation-delay:-1.5s]">
            <div className="glass border border-line-strong rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
              <div className="grid place-items-center size-9 rounded-xl bg-sky/15 text-sky"><Clock size={17} /></div>
              <div><div className="text-[10px] uppercase tracking-wider text-dim">Avg wait nearby</div><div className="text-sm font-semibold">{avgEta || 6} minutes</div></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
