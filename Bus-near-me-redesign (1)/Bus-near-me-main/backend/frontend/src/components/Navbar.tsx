import { useEffect, useState } from 'react';
import { Bus, Menu, X, ArrowUpRight, LogOut, Ticket } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const links = [
  { href: '#live', label: 'Live map' },
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#coverage', label: 'Coverage' },
];

export function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5 font-display font-bold text-lg tracking-tight">
      <span className="grid place-items-center size-9 rounded-xl bg-signal text-signal-ink">
        <Bus size={19} strokeWidth={2.6} />
      </span>
      <span>Bus<span className="text-signal">Near</span>Me</span>
    </a>
  );
}

export default function Navbar({ onLogin, onRegister, onTickets }: { onLogin: () => void; onRegister: () => void; onTickets: () => void }) {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-[2000] transition-all ${scrolled || open ? 'glass border-b border-line' : ''}`}>
      <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="px-3.5 py-2 text-sm font-medium text-muted hover:text-fg rounded-lg transition-colors">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button onClick={onTickets} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg px-3 py-2 rounded-lg"><Ticket size={15} /> My tickets</button>
              <span className="hidden lg:block text-sm text-muted max-w-[140px] truncate" title={user.email}>Hi, {user.name.split(' ')[0]}</span>
              <button onClick={logout} title="Log out" aria-label="Log out" className="inline-flex items-center gap-1.5 text-sm font-semibold border border-line-strong px-3.5 py-2.5 rounded-xl hover:bg-panel-2"><LogOut size={15} /><span className="hidden sm:inline">Log out</span></button>
            </>
          ) : (
            <>
              <button onClick={onLogin} className="hidden sm:inline-flex text-sm font-semibold text-fg px-3.5 py-2.5 rounded-xl hover:bg-panel-2">Log in</button>
              <button onClick={onRegister} className="hidden sm:inline-flex items-center gap-1.5 bg-signal text-signal-ink font-semibold text-sm px-4 py-2.5 rounded-xl hover:brightness-110 active:scale-[.97] transition">
                Sign up <ArrowUpRight size={16} strokeWidth={2.5} />
              </button>
            </>
          )}
          <button className="md:hidden p-2 rounded-lg border border-line text-fg" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden px-5 pb-5 pt-1 flex flex-col gap-1">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="px-3 py-3 rounded-lg text-fg font-medium hover:bg-panel-2">{l.label}</a>
          ))}
          {user ? (
            <>
              <button onClick={() => { setOpen(false); onTickets(); }} className="px-3 py-3 rounded-lg text-left font-medium hover:bg-panel-2">My tickets</button>
              <button onClick={() => { setOpen(false); logout(); }} className="px-3 py-3 rounded-lg text-left font-medium text-muted hover:bg-panel-2">Log out</button>
            </>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={() => { setOpen(false); onLogin(); }} className="py-3 rounded-xl border border-line-strong font-semibold">Log in</button>
              <button onClick={() => { setOpen(false); onRegister(); }} className="py-3 rounded-xl bg-signal text-signal-ink font-semibold">Sign up</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
