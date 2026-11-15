import { ArrowRight, Users } from 'lucide-react';
import type { Ticket as T } from '../lib/api';

export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
export const niceDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

export default function Ticket({ t }: { t: T }) {
  const cancelled = t.status === 'CANCELLED';
  return (
    <div className={`rounded-2xl overflow-hidden border border-line-strong bg-panel ${cancelled ? 'opacity-60' : ''}`}>
      <div className="bg-signal text-signal-ink px-5 py-3 flex items-center justify-between">
        <span className="font-mono font-bold text-sm">{t.id}</span>
        <span className="text-xs font-bold uppercase tracking-wider">{cancelled ? 'Cancelled' : 'Confirmed'}</span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3 font-display font-bold text-xl leading-tight">
          <span className="min-w-0 break-words">{t.from}</span><ArrowRight size={18} className="shrink-0 text-signal" /><span className="min-w-0 break-words">{t.to}</span>
        </div>
        <div className="mt-1 text-sm text-muted">{niceDate(t.travelDate)} · departs {t.departureTime} · arrives ~{t.arrivalTime}</div>

        <div className="my-4 border-t border-dashed border-line-strong relative">
          <span className="absolute -left-8 -top-2.5 size-5 rounded-full bg-panel-2" /><span className="absolute -right-8 -top-2.5 size-5 rounded-full bg-panel-2" />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div><dt className="text-[11px] uppercase tracking-wider text-dim">Bus</dt><dd className="font-semibold">{t.routeNumber} · {t.busType === 'AC' ? 'AC Vajra' : 'Ordinary'}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wider text-dim">Passenger</dt><dd className="font-semibold truncate">{t.customerName}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wider text-dim flex items-center gap-1"><Users size={10} />Seats</dt><dd className="font-semibold font-mono">{t.seats.join(', ')}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wider text-dim">Distance</dt><dd className="font-semibold">{t.distanceKm} km</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wider text-dim">Payment</dt><dd className="font-semibold">{t.paymentStatus === 'PAID' ? 'Paid' : 'Pay on board'} · {t.paymentMethod}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wider text-dim">Total</dt><dd className="font-display font-extrabold text-2xl leading-none">{inr(t.totalFare)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
