import { useEffect, useState } from 'react';
import { Loader2, Ticket as TicketIcon } from 'lucide-react';
import Modal from './Modal';
import Ticket from './Ticket';
import { errMsg, http, type Ticket as T } from '../lib/api';

export default function TicketsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [list, setList] = useState<T[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!open) return;
    setList(null); setErr('');
    http.get('/api/bookings').then((r) => setList(r.data)).catch((e) => setErr(errMsg(e)));
  }, [open]);

  const cancel = async (id: string) => {
    try { const r = await http.post(`/api/bookings/${id}/cancel`); setList((l) => l!.map((t) => (t.id === id ? r.data : t))); } catch (e) { setErr(errMsg(e)); }
  };

  return (
    <Modal open={open} onClose={onClose} title="My tickets" wide>
      {err && <div role="alert" className="text-sm text-danger bg-danger/10 border border-danger/25 rounded-xl px-3.5 py-2.5 mb-4">{err}</div>}
      {!list && !err && <div className="py-10 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>}
      {list && list.length === 0 && <div className="py-12 text-center text-muted"><TicketIcon className="mx-auto mb-3 opacity-40" size={30} /><p>No tickets yet. Pick a bus on the map and tap Book.</p></div>}
      <div className="space-y-5">
        {list?.map((t) => (
          <div key={t.id}>
            <Ticket t={t} />
            {t.status === 'CONFIRMED' && <button onClick={() => cancel(t.id)} className="mt-2 text-xs text-muted hover:text-danger">Cancel this ticket</button>}
          </div>
        ))}
      </div>
    </Modal>
  );
}
