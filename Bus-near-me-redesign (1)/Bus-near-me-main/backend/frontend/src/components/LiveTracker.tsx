import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import {
  Bus as BusIcon, ChevronDown, Clock, Crosshair, Gauge, List, Locate, Map as MapIcon, MapPin,
  Pause, Play, RotateCcw, Search, Sparkles, Users, X, Navigation, WifiOff, Radio, Ticket,
} from 'lucide-react';
import { busIcon, hubIcon, meIcon, stopIcon } from '../lib/markers';
import { occupancyLevel, type Bus, type LocationOption, type NearbyResult, type Stop } from '../lib/transit';

interface Props {
  buses: Bus[];
  stops: Stop[];
  locations: LocationOption[];
  location: LocationOption;
  loading: boolean;
  demo: boolean;
  running: boolean;
  onLocation: (l: LocationOption) => void;
  onToggle: () => void;
  onReset: () => void;
  onFindNearby: (lat: number, lng: number) => Promise<NearbyResult>;
  onBook: (bus: Bus) => void;
}

const toneText = { ok: 'text-ok', warn: 'text-warn', danger: 'text-danger' } as const;
const toneBg = { ok: 'bg-ok', warn: 'bg-warn', danger: 'bg-danger' } as const;

function FlyTo({ target }: { target: { pos: [number, number]; zoom?: number; k: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.pos, target.zoom ?? 14, { duration: 1.1 });
  }, [target, map]);
  return null;
}
function DragWatcher({ onDrag }: { onDrag: () => void }) {
  useMapEvents({ dragstart: onDrag });
  return null;
}

function StatusPill({ bus }: { bus: Bus }) {
  const map = {
    Active: 'text-ok bg-ok/10 border-ok/25',
    Delayed: 'text-danger bg-danger/10 border-danger/25',
    Inactive: 'text-muted bg-white/5 border-line',
  } as const;
  return <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[bus.status]}`}>{bus.status === 'Active' ? 'On time' : bus.status}</span>;
}

function OccupancyBar({ bus }: { bus: Bus }) {
  const o = occupancyLevel(bus);
  const segs = 10;
  const filled = Math.round((o.pct / 100) * segs);
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="text-muted flex items-center gap-1"><Users size={11} /> {o.label}</span>
        <span className={`font-mono ${toneText[o.tone]}`}>{bus.occupancy}/{bus.capacity}</span>
      </div>
      <div className="flex gap-[3px]">
        {Array.from({ length: segs }).map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < filled ? toneBg[o.tone] : 'bg-white/10'}`} />
        ))}
      </div>
    </div>
  );
}

export default function LiveTracker(p: Props) {
  const { buses, stops, locations, location, loading, demo, running } = p;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<'map' | 'list'>('map');
  const [tab, setTab] = useState<'fleet' | 'nearby'>('fleet');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | Bus['status']>('ALL');
  const [dropdown, setDropdown] = useState(false);
  const [locQuery, setLocQuery] = useState('');
  const [me, setMe] = useState<[number, number] | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [nearby, setNearby] = useState<NearbyResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [fly, setFly] = useState<{ pos: [number, number]; zoom?: number; k: number } | null>(null);

  const selected = buses.find((b) => b.id === selectedId) ?? null;

  useEffect(() => { setFly({ pos: [location.lat, location.lng], k: Date.now() }); setNearby(null); setSelectedId(null); }, [location]);

  const route = useMemo<[number, number][]>(() => [
    [location.lat - 0.015, location.lng - 0.015], [location.lat - 0.005, location.lng + 0.01],
    [location.lat + 0.01, location.lng + 0.015], [location.lat + 0.015, location.lng - 0.005],
    [location.lat - 0.015, location.lng - 0.015],
  ], [location]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return buses.filter((b) =>
      (status === 'ALL' || b.status === status) &&
      (!q || b.routeNumber.toLowerCase().includes(q) || b.destination.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)));
  }, [buses, query, status]);

  const counts = useMemo(() => ({
    ALL: buses.length,
    Active: buses.filter((b) => b.status === 'Active').length,
    Delayed: buses.filter((b) => b.status === 'Delayed').length,
    Inactive: buses.filter((b) => b.status === 'Inactive').length,
  }), [buses]);

  const pick = (b: Bus) => {
    setSelectedId(b.id);
    setPanel('map');
    setFly({ pos: [b.latitude, b.longitude], zoom: 15, k: Date.now() });
  };

  const locateMe = () => {
    if (!navigator.geolocation) return setGeoMsg('Geolocation is not supported.');
    navigator.geolocation.getCurrentPosition(
      (pos) => { const c: [number, number] = [pos.coords.latitude, pos.coords.longitude]; setMe(c); setGeoMsg(null); setFly({ pos: c, k: Date.now() }); },
      (e) => setGeoMsg(e.code === 1 ? 'Location permission denied.' : 'Could not get your location.'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const findNearby = async () => {
    setSearching(true);
    const [lat, lng] = me ?? [location.lat, location.lng];
    const r = await p.onFindNearby(lat, lng);
    setNearby(r); setTab('nearby'); setSearching(false);
  };

  const locFiltered = locations.filter((l) => l.name.toLowerCase().includes(locQuery.toLowerCase()));

  return (
    <div className="rounded-[1.75rem] border border-line-strong bg-panel overflow-hidden shadow-[0_40px_120px_-40px_rgba(0,0,0,.8)]">
      {/* top bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-line bg-panel-2/60">
        <div className="relative">
          <button onClick={() => setDropdown(!dropdown)} className="flex items-center gap-2.5 pl-3 pr-3.5 py-2 rounded-xl bg-panel-3 border border-line hover:border-line-strong transition">
            <MapPin size={15} className="text-signal" />
            <span className="text-left leading-tight"><span className="block text-[10px] uppercase tracking-wider text-dim">Hub</span><span className="text-sm font-semibold">{location.name}</span></span>
            <ChevronDown size={15} className={`text-muted transition ${dropdown ? 'rotate-180' : ''}`} />
          </button>
          {dropdown && (
            <>
              <div className="fixed inset-0 z-[1500]" onClick={() => setDropdown(false)} />
              <div className="absolute left-0 top-full mt-2 w-72 z-[1600] rounded-2xl bg-panel-2 border border-line-strong shadow-2xl overflow-hidden">
                <div className="p-2 border-b border-line relative">
                  <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-dim" />
                  <input autoFocus value={locQuery} onChange={(e) => setLocQuery(e.target.value)} placeholder="Search a locality…" className="w-full bg-panel-3 rounded-lg pl-8 pr-3 py-2 text-sm outline-none border border-transparent focus:border-signal/50 placeholder:text-dim" />
                </div>
                <div className="max-h-64 overflow-y-auto scroll-thin p-1.5">
                  {locFiltered.map((l) => (
                    <button key={l.name} onClick={() => { p.onLocation(l); setDropdown(false); setLocQuery(''); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition ${l.name === location.name ? 'bg-signal text-signal-ink font-semibold' : 'hover:bg-panel-3 text-fg'}`}>
                      {l.name}<span className="font-mono text-[10px] opacity-60">{l.lat.toFixed(2)}, {l.lng.toFixed(2)}</span>
                    </button>
                  ))}
                  {!locFiltered.length && <div className="text-center text-sm text-dim py-6">No locality found</div>}
                </div>
              </div>
            </>
          )}
        </div>

        <div className={`hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border ${demo ? 'border-warn/30 text-warn bg-warn/10' : 'border-ok/30 text-ok bg-ok/10'}`}>
          {demo ? <WifiOff size={13} /> : <Radio size={13} />}
          {demo ? 'Demo mode · simulated locally' : 'Live API connected'}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={p.onToggle} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition active:scale-95 ${running ? 'bg-panel-3 border border-line text-fg hover:border-line-strong' : 'bg-signal text-signal-ink'}`}>
            {running ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
          </button>
          <button onClick={p.onReset} title="Respawn buses" className="p-2.5 rounded-xl bg-panel-3 border border-line text-muted hover:text-fg hover:border-line-strong transition"><RotateCcw size={15} /></button>
          <div className="md:hidden flex bg-panel-3 rounded-xl border border-line p-0.5">
            {(['map', 'list'] as const).map((v) => (
              <button key={v} onClick={() => setPanel(v)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${panel === v ? 'bg-signal text-signal-ink' : 'text-muted'}`}>
                {v === 'map' ? <MapIcon size={13} /> : <List size={13} />} {v === 'map' ? 'Map' : 'Buses'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex h-[78vh] min-h-[560px] max-h-[820px]">
        {/* Sidebar */}
        <aside className={`${panel === 'list' ? 'flex' : 'hidden'} md:flex w-full md:w-[390px] shrink-0 flex-col border-r border-line bg-panel`}>
          <div className="p-4 space-y-3 border-b border-line">
            <button onClick={findNearby} disabled={searching} className="w-full flex items-center justify-center gap-2 bg-signal text-signal-ink font-bold py-3 rounded-xl text-sm hover:brightness-110 active:scale-[.98] transition disabled:opacity-60">
              <Sparkles size={16} className={searching ? 'animate-spin' : ''} />
              {searching ? 'Scanning…' : me ? 'Find buses near my location' : `Find buses near ${location.name}`}
            </button>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Route number or destination" className="w-full bg-panel-2 border border-line focus:border-signal/50 outline-none rounded-xl pl-10 pr-9 py-2.5 text-sm placeholder:text-dim" />
              {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-fg"><X size={14} /></button>}
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {(['ALL', 'Active', 'Delayed', 'Inactive'] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${status === s ? 'bg-fg text-ink border-fg' : 'border-line text-muted hover:text-fg hover:border-line-strong'}`}>
                  {s === 'ALL' ? 'All' : s} <span className="font-mono opacity-60 ml-0.5">{counts[s]}</span>
                </button>
              ))}
            </div>
          </div>

          {nearby && (
            <div className="flex px-4 pt-3 gap-1">
              {(['fleet', 'nearby'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${tab === t ? 'bg-panel-3 text-fg' : 'text-muted hover:text-fg'}`}>
                  {t === 'fleet' ? `Fleet (${filtered.length})` : `Nearby (${nearby.nearbyBuses.length})`}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-2.5">
            {tab === 'nearby' && nearby ? (
              <>
                {nearby.nearbyStops.length > 0 && (
                  <div className="mb-1">
                    <div className="text-[10px] uppercase tracking-widest text-dim font-semibold mb-2">Closest stops</div>
                    <div className="space-y-1.5">
                      {nearby.nearbyStops.slice(0, 3).map((s) => (
                        <button key={s.id} onClick={() => setFly({ pos: [s.latitude, s.longitude], zoom: 16, k: Date.now() }) } className="w-full flex items-center justify-between text-left text-sm px-3 py-2.5 rounded-xl bg-panel-2 border border-line hover:border-sky/40 transition">
                          <span className="flex items-center gap-2 truncate"><span className="size-2 rounded-full bg-sky" />{s.name}</span>
                          <span className="font-mono text-xs text-muted">{s.distanceKm?.toFixed(2)} km</span>
                        </button>
                      ))}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-dim font-semibold mt-4 mb-2">Arriving soon</div>
                  </div>
                )}
                {nearby.nearbyBuses.length === 0 && <div className="text-center text-sm text-dim py-10">No buses within range.</div>}
                {nearby.nearbyBuses.map((nb) => {
                  const bus = buses.find((b) => b.id === nb.busId);
                  return (
                    <button key={nb.busId} onClick={() => bus && pick(bus)} className="w-full text-left p-3.5 rounded-2xl bg-panel-2 border border-line hover:border-signal/40 transition group">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-signal">{nb.routeNumber}</span>
                        <span className="font-display font-extrabold text-2xl leading-none">{nb.etaMinutes}<span className="text-xs font-sans text-muted font-medium ml-0.5">min</span></span>
                      </div>
                      <div className="text-sm font-medium mt-1.5 truncate">{nb.destination}</div>
                      <div className="text-xs text-muted mt-1 flex items-center gap-3"><span>{nb.distanceKm} km away</span><span>{nb.speed} km/h</span><span className={nb.status === 'Delayed' ? 'text-danger' : 'text-ok'}>{nb.status}</span></div>
                    </button>
                  );
                })}
              </>
            ) : loading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[118px] rounded-2xl bg-panel-2 animate-pulse" />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-dim"><BusIcon className="mx-auto mb-3 opacity-40" size={30} /><p className="text-sm">No buses match your filters</p></div>
            ) : (
              filtered.map((b) => {
                const sel = b.id === selectedId;
                return (
                  <button key={b.id} onClick={() => pick(b)} className={`w-full text-left p-3.5 rounded-2xl border transition ${sel ? 'bg-signal/[.07] border-signal/50' : 'bg-panel-2 border-line hover:border-line-strong'} ${b.status === 'Inactive' ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono font-bold text-sm px-2.5 py-1 rounded-lg bg-signal text-signal-ink">{b.routeNumber}</span>
                        <StatusPill bus={b} />
                      </div>
                      <span className="text-xs text-muted flex items-center gap-1 shrink-0"><Gauge size={12} />{b.speed} km/h</span>
                    </div>
                    <div className="mt-2.5 text-sm font-semibold truncate">{b.destination}</div>
                    <div className="text-xs text-muted mt-0.5 truncate">Next stop · {b.nextStop}</div>
                    <div className="mt-3 grid grid-cols-[1fr_auto] gap-4 items-end">
                      <OccupancyBar bus={b} />
                      <div className="text-right leading-none"><div className="font-display font-extrabold text-2xl">{b.etaMinutes}<span className="text-xs font-sans text-muted font-medium ml-0.5">min</span></div></div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Map */}
        <div className={`${panel === 'map' ? 'block' : 'hidden'} md:block relative flex-1 min-w-0`}>
          <MapContainer center={[location.lat, location.lng]} zoom={14} zoomControl={false} className="!absolute inset-0" scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
            />
            <Polyline positions={route} pathOptions={{ color: '#b6f23a', weight: 10, opacity: 0.08 }} />
            <Polyline positions={route} pathOptions={{ color: '#b6f23a', weight: 3, opacity: 0.7, dashArray: '2 9', lineCap: 'round' }} />
            <Marker position={[location.lat, location.lng]} icon={hubIcon} interactive={false} />
            {stops.map((s) => (
              <Marker key={s.id} position={[s.latitude, s.longitude]} icon={stopIcon}>
                <Popup><div className="p-3.5 min-w-[170px]"><div className="text-[10px] uppercase tracking-wider text-sky font-semibold">Bus stop</div><div className="font-semibold text-sm mt-0.5">{s.name}</div>{s.distanceKm != null && <div className="text-xs text-muted mt-1 font-mono">{s.distanceKm.toFixed(2)} km from hub</div>}</div></Popup>
              </Marker>
            ))}
            {filtered.map((b) => (
              <Marker key={b.id} position={[b.latitude, b.longitude]} icon={busIcon(b, b.id === selectedId)} eventHandlers={{ click: () => setSelectedId(b.id) }} zIndexOffset={b.id === selectedId ? 1000 : 0} />
            ))}
            {me && <Marker position={me} icon={meIcon} interactive={false} />}
            <FlyTo target={fly} />
            <DragWatcher onDrag={() => {}} />
          </MapContainer>

          {/* overlays */}
          <div className="absolute top-4 left-4 z-[1000] glass border border-line rounded-2xl px-4 py-2.5 flex items-center gap-3 pointer-events-none">
            <span className="relative flex size-2"><span className="absolute inset-0 rounded-full bg-signal animate-ping" /><span className="relative size-2 rounded-full bg-signal" /></span>
            <span className="text-sm font-semibold">{counts.Active + counts.Delayed} buses moving</span>
            <span className="hidden sm:inline text-xs text-muted">· {location.name}</span>
          </div>

          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button onClick={locateMe} title="Use my location" className="glass border border-line size-11 grid place-items-center rounded-xl text-signal hover:border-signal/50 transition"><Locate size={18} /></button>
            <button onClick={() => setFly({ pos: [location.lat, location.lng], k: Date.now() })} title="Re-centre on hub" className="glass border border-line size-11 grid place-items-center rounded-xl text-fg hover:border-line-strong transition"><Crosshair size={18} /></button>
          </div>
          {geoMsg && <div className="absolute top-20 right-4 z-[1000] glass border border-warn/30 text-warn text-xs rounded-xl px-3 py-2">{geoMsg}</div>}

          {/* legend */}
          {!selected && (
            <div className="absolute bottom-4 left-4 z-[1000] glass border border-line rounded-xl px-3 py-2 hidden sm:flex items-center gap-4 text-[11px] text-muted">
              <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-ok" />Seats</span>
              <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-warn" />Filling</span>
              <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-danger" />Crowded / delayed</span>
              <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full border-2 border-sky" />Stop</span>
            </div>
          )}

          {/* selected bus sheet */}
          {selected && (
            <div className="absolute z-[1000] bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[440px] glass border border-line-strong rounded-2xl p-4 shadow-2xl">
              <button onClick={() => setSelectedId(null)} className="absolute top-3 right-3 size-7 grid place-items-center rounded-full bg-white/5 text-muted hover:text-fg"><X size={14} /></button>
              <div className="flex items-center gap-3 pr-8">
                <span className="font-mono font-bold text-lg px-3 py-2 rounded-xl bg-signal text-signal-ink">{selected.routeNumber}</span>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{selected.destination}</div>
                  <div className="flex items-center gap-2 mt-1"><StatusPill bus={selected} /><span className="text-xs text-muted">from {selected.origin}</span></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="rounded-xl bg-white/5 p-3"><div className="text-[10px] uppercase tracking-wider text-dim flex items-center gap-1"><Clock size={10} />Arrives</div><div className="font-display font-extrabold text-xl mt-1">{selected.etaMinutes}<span className="text-xs text-muted font-sans font-medium ml-0.5">min</span></div></div>
                <div className="rounded-xl bg-white/5 p-3"><div className="text-[10px] uppercase tracking-wider text-dim flex items-center gap-1"><Gauge size={10} />Speed</div><div className="font-display font-extrabold text-xl mt-1">{selected.speed}<span className="text-xs text-muted font-sans font-medium ml-0.5">km/h</span></div></div>
                <div className="rounded-xl bg-white/5 p-3"><div className="text-[10px] uppercase tracking-wider text-dim flex items-center gap-1"><Navigation size={10} />Next</div><div className="text-sm font-semibold mt-1.5 leading-tight line-clamp-2">{selected.nextStop}</div></div>
              </div>
              <div className="mt-3"><OccupancyBar bus={selected} /></div>
              <button onClick={() => p.onBook(selected)} disabled={selected.status === 'Inactive'} className="mt-3 w-full flex items-center justify-center gap-2 bg-signal text-signal-ink font-bold py-3 rounded-xl hover:brightness-110 active:scale-[.98] transition disabled:opacity-50"><Ticket size={16} /> {selected.status === 'Inactive' ? 'Not running' : 'Book a ticket'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
