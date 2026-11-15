import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal, { btnPrimary, inputCls, labelCls } from './Modal';
import { useAuth } from '../hooks/useAuth';
import { errMsg } from '../lib/api';

export default function AuthModal({ mode, setMode, onClose, onDone }: { mode: 'login' | 'register' | null; setMode: (m: 'login' | 'register') => void; onClose: () => void; onDone: () => void }) {
  const { login, register } = useAuth();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (mode === 'login') await login(f.email, f.password); else await register(f);
      setF({ name: '', email: '', phone: '', password: '' });
      onDone();
    } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };

  return (
    <Modal open={!!mode} onClose={onClose} title={mode === 'login' ? 'Welcome back' : 'Create your account'}>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && (
          <div><label className={labelCls} htmlFor="a-name">Full name</label><input id="a-name" className={inputCls} value={f.name} onChange={set('name')} placeholder="Asha Rao" autoComplete="name" required /></div>
        )}
        <div><label className={labelCls} htmlFor="a-email">Email</label><input id="a-email" type="email" className={inputCls} value={f.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" required /></div>
        {mode === 'register' && (
          <div><label className={labelCls} htmlFor="a-phone">Phone</label><input id="a-phone" type="tel" className={inputCls} value={f.phone} onChange={set('phone')} placeholder="98765 43210" autoComplete="tel" required /></div>
        )}
        <div><label className={labelCls} htmlFor="a-pass">Password</label><input id="a-pass" type="password" className={inputCls} value={f.password} onChange={set('password')} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 8 : undefined} required /></div>
        {err && <div role="alert" className="text-sm text-danger bg-danger/10 border border-danger/25 rounded-xl px-3.5 py-2.5">{err}</div>}
        <button className={btnPrimary} disabled={busy}>{busy ? <Loader2 className="mx-auto animate-spin" size={18} /> : mode === 'login' ? 'Log in' : 'Create account'}</button>
        <p className="text-center text-sm text-muted">
          {mode === 'login' ? 'New here? ' : 'Already have an account? '}
          <button type="button" onClick={() => { setErr(''); setMode(mode === 'login' ? 'register' : 'login'); }} className="text-signal font-semibold hover:underline">{mode === 'login' ? 'Create an account' : 'Log in'}</button>
        </p>
      </form>
    </Modal>
  );
}
