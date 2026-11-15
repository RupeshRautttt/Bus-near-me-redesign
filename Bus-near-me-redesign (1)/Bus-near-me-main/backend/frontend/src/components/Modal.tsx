import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[3000] grid place-items-end sm:place-items-center p-0 sm:p-5" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} max-h-[92vh] overflow-y-auto scroll-thin rounded-t-3xl sm:rounded-3xl border border-line-strong bg-panel-2 shadow-2xl`}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-panel-2/95 backdrop-blur border-b border-line">
          <h2 className="font-display font-bold text-xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="size-8 grid place-items-center rounded-full bg-white/5 text-muted hover:text-fg"><X size={16} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export const inputCls = 'w-full bg-panel-3 border border-line focus:border-signal/60 outline-none rounded-xl px-3.5 py-3 text-sm placeholder:text-dim';
export const labelCls = 'block text-xs font-semibold text-muted mb-1.5';
export const btnPrimary = 'w-full bg-signal text-signal-ink font-bold py-3.5 rounded-xl hover:brightness-110 active:scale-[.98] transition disabled:opacity-60 disabled:cursor-not-allowed';
