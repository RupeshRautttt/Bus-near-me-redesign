import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Minus, Plus, WifiOff } from 'lucide-react';
import Modal, { btnPrimary, inputCls, labelCls } from './Modal';
import Ticket, { inr } from './Ticket';
import { errMsg, http, type Ticket as T } from '../lib/api';
import { STOPS, type Bus } from '../lib/transit';
import { useAuth } from '../hooks/useAuth';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const plus = (n: number) => new Date(Date.now() + n * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

export default function BookingModal({ bus, demo, defaultFrom, onClose, onViewTickets }: { bus: Bus | null; demo: boolean; defaultFrom?: string; onClose: () => void; onViewTickets: () => void }) {
  const { user } = useAuth();
  const [from, setFrom] = useState('STOP009');
  const [to, setTo] = useState('STOP001');
  const [type, setType] = useState<'Ordinary' | 'AC'>('Ordinary');
  const [pax, setPax] = useState(1);
  const [date, setDate] = useState(today());
  const [time, setTime] = useState('08:00');
  const [pay, setPay] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
  const [fare, setFare] = useState<{ totalFare: number; farePerPassenger: number; distanceKm: number; travelMinutes: number } | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ ticket: T; emailed: boolean } | null>(null);

  useEffect(() => { if (bus) { setDone(null); setErr(''); setPax(1); setDate(today()); if (defaultFrom) setFrom(defaultFrom); } }, [bus, defaultFrom]);

  useEffect(() => {
    if (!bus || demo || from === to) { setFare(null); return; }
    let cancel = false;
    http.get('/api/fare', { params: { from, to, type, passengers: pax } }).then((r) => !cancel && setFare(r.data)).catch(() => !cancel && setFare(null));
    return () => { cancel = true; };
  }, [bus, demo, from, to, type, pax]);

  const book = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = await http.post('/api/bookings', { fromStopId: from, toStopId: to, busId: bus!.id, busType: type, passengers: pax, travelDate: date, departureTime: time, paymentMethod: pay });
      setDone({ ticket: r.data.booking, emailed: r.data.email?.sent });
    } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };

  const close = () => { setDone(null); onClose(); };
  const isToday = date === today();

  return (
    <Modal open={!!bus} onClose={close} title={done ? 'Ticket booked' : `Book · Route ${bus?.routeNumber ?? ''}`} wide={!!done}>
      {demo ? (
        <div className="text-center py-6">
          <WifiOff className="mx-auto text-warn mb-3" size={30} />
          <p className="font-semibold">Booking needs the backend</p>
          <p className="text-sm text-muted mt-1.5">You’re in demo mode. Start the API (<span className="font-mono">npm run dev</span> in <span className="font-mono">backend/</span>) and refresh to book tickets.</p>
        </div>
      ) : done ? (
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 text-ok font-semibold"><CheckCircle2 size={20} /> You’re all set{done.emailed ? ` — confirmation emailed to ${user?.email}` : ''}.</div>
          <Ticket t={done.ticket} />
          <div className="flex gap-3">
            <button className="flex-1 py-3 rounded-xl border border-line-strong font-semibold hover:bg-panel-3 transition" onClick={() => { close(); onViewTickets(); }}>My tickets</button>
            <button className="flex-1 py-3 rounded-xl bg-signal text-signal-ink font-bold hover:brightness-110 transition" onClick={close}>Done</button>
          </div>
        </div>
      ) : bus && (
        <form onSubmit={book} className="space-y-4">
          <div className="rounded-xl bg-panel-3 border border-line px-4 py-3 text-sm flex items-center justify-between gap-3">
            <div className="min-w-0"><div className="font-semibold truncate">{bus.destination}</div><div className="text-xs text-muted">Bus {bus.id} · arrives at your stop in {bus.etaMinutes} min</div></div>
            <span className="font-mono font-bold px-2.5 py-1 rounded-lg bg-signal text-signal-ink">{bus.routeNumber}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls} htmlFor="b-from">From</label><select id="b-from" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)}>{STOPS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className={labelCls} htmlFor="b-to">To</label><select id="b-to" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)}>{STOPS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls} htmlFor="b-date">Travel date</label><input id="b-date" type="date" className={inputCls} value={date} min={today()} max={plus(6)} onChange={(e) => setDate(e.target.value || today())} /></div>
            <div><label className={labelCls} htmlFor="b-time">Departure</label>{isToday ? <div className={`${inputCls} text-muted`}>When bus arrives (~{bus.etaMinutes} min)</div> : <input id="b-time" type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={labelCls}>Bus type</span>
              <div className="flex bg-panel-3 rounded-xl border border-line p-0.5">
                {(['Ordinary', 'AC'] as const).map((t) => <button type="button" key={t} onClick={() => setType(t)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${type === t ? 'bg-signal text-signal-ink' : 'text-muted'}`}>{t === 'AC' ? 'AC Vajra' : 'Ordinary'}</button>)}
              </div>
            </div>
            <div>
              <span className={labelCls}>Passengers</span>
              <div className="flex items-center justify-between bg-panel-3 rounded-xl border border-line px-1.5 py-1.5">
                <button type="button" aria-label="Fewer" onClick={() => setPax(Math.max(1, pax - 1))} className="size-9 grid place-items-center rounded-lg hover:bg-white/5"><Minus size={16} /></button>
                <span className="font-mono font-bold">{pax}</span>
                <button type="button" aria-label="More" onClick={() => setPax(Math.min(6, pax + 1))} className="size-9 grid place-items-center rounded-lg hover:bg-white/5"><Plus size={16} /></button>
              </div>
            </div>
          </div>

          <div>
            <span className={labelCls}>Payment</span>
            <div className="grid grid-cols-3 gap-2">
              {(['UPI', 'Card', 'Cash'] as const).map((p) => <button type="button" key={p} onClick={() => setPay(p)} className={`py-2.5 rounded-xl text-sm font-semibold border ${pay === p ? 'border-signal bg-signal/10 text-signal' : 'border-line text-muted'}`}>{p === 'Cash' ? 'Pay on board' : p}</button>)}
            </div>
            {pay !== 'Cash' && <p className="text-[11px] text-dim mt-1.5">Demo payment: no real money is charged.</p>}
          </div>

          <div className="rounded-xl border border-line bg-panel-3 px-4 py-3.5 flex items-end justify-between">
            <div className="text-sm text-muted">{fare ? <>{fare.distanceKm} km · ~{fare.travelMinutes} min<br />{inr(fare.farePerPassenger)} × {pax}</> : from === to ? 'Choose two different stops' : 'Calculating fare…'}</div>
            <div className="text-right"><div className="text-[11px] uppercase tracking-wider text-dim">Total</div><div className="font-display font-extrabold text-3xl leading-none">{fare ? inr(fare.totalFare) : '—'}</div></div>
          </div>

          {err && <div role="alert" className="text-sm text-danger bg-danger/10 border border-danger/25 rounded-xl px-3.5 py-2.5">{err}</div>}
          <button className={btnPrimary} disabled={busy || !fare}>{busy ? <Loader2 className="mx-auto animate-spin" size={18} /> : `Confirm booking${fare ? ` · ${inr(fare.totalFare)}` : ''}`}</button>
        </form>
      )}
    </Modal>
  );
}
