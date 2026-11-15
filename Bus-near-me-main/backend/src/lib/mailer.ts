import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { Booking } from './store';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const niceDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

function transport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port: Number(SMTP_PORT || 465),
    secure: Number(SMTP_PORT || 465) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

function rows(b: Booking): [string, string][] {
  return [
    ['Ticket ID', b.id],
    ['Status', b.status],
    ['Customer', b.customerName],
    ['Customer email', b.customerEmail],
    ['Customer phone', b.customerPhone],
    ['From', b.from],
    ['To', b.to],
    ['Bus / route', `${b.routeNumber} (${b.busType === 'AC' ? 'AC Vajra' : 'Ordinary'}) · ${b.busId}`],
    ['Travel date', niceDate(b.travelDate)],
    ['Departure', b.departureTime],
    ['Est. arrival', b.arrivalTime],
    ['Distance', `${b.distanceKm} km`],
    ['Passengers', String(b.passengers)],
    ['Seats', b.seats.join(', ')],
    ['Fare per passenger', inr(b.farePerPassenger)],
    ['Total fare', inr(b.totalFare)],
    ['Payment', `${b.paymentMethod} — ${b.paymentStatus === 'PAID' ? 'Paid' : 'Pay on board'}`],
    ['Booked at', new Date(b.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'],
  ];
}

export function renderEmail(b: Booking, forCustomer = false) {
  const r = rows(b);
  const title = forCustomer ? `Your ticket ${b.id} is confirmed` : `New ticket booked: ${b.id}`;
  const text = `${title}\n\n${r.map(([k, v]) => `${k}: ${v}`).join('\n')}\n`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
<div style="background:#b6f23a;color:#0b1200;padding:18px 22px"><div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase">Bus Near Me</div><div style="font-size:20px;font-weight:700;margin-top:4px">${esc(title)}</div></div>
<div style="padding:18px 22px"><div style="font-size:22px;font-weight:700">${esc(b.from)} → ${esc(b.to)}</div>
<div style="color:#6b7280;margin:4px 0 16px">${esc(niceDate(b.travelDate))} · departs ${esc(b.departureTime)} · ${inr(b.totalFare)}</div>
<table style="width:100%;border-collapse:collapse;font-size:14px">${r.map(([k, v]) => `<tr><td style="padding:7px 0;border-top:1px solid #f0f0f0;color:#6b7280;width:42%">${esc(k)}</td><td style="padding:7px 0;border-top:1px solid #f0f0f0;font-weight:600">${esc(v)}</td></tr>`).join('')}</table></div></div>`;
  return { subject: `${forCustomer ? 'Ticket confirmed' : 'New booking'} · ${b.id} · ${b.from} → ${b.to} · ${inr(b.totalFare)}`, text, html };
}

interface Mail { to: string; subject: string; text: string; html: string }

async function sendViaResend(key: string, from: string, m: Mail) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [m.to], subject: m.subject, html: m.html, text: m.text }),
  });
  if (!r.ok) {
    const body = (await r.json().catch(() => ({}))) as { message?: string };
    throw new Error(`Resend ${r.status}: ${body.message || r.statusText}`);
  }
}

/**
 * Emails the booking to OWNER_EMAIL (plus a copy to the customer).
 * Provider order: Resend (RESEND_API_KEY) → SMTP (SMTP_USER/SMTP_PASS) → saved to data/outbox/.
 */
export async function sendBookingEmails(b: Booking): Promise<{ sent: boolean; note: string }> {
  const owner = process.env.OWNER_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;
  const smtp = transport();
  const from = process.env.MAIL_FROM || (resendKey ? 'Bus Near Me <onboarding@resend.dev>' : `Bus Near Me <${process.env.SMTP_USER || 'no-reply@busnearme.local'}>`);
  const ownerMail = { ...renderEmail(b, false), to: owner || '' };
  const customerMail = { ...renderEmail(b, true), to: b.customerEmail };

  if ((!resendKey && !smtp) || !owner) {
    const dir = path.join(__dirname, '..', '..', 'data', 'outbox');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${b.id}.html`), ownerMail.html);
    console.warn(`[mail] Email not configured — saved ${b.id} to data/outbox/${b.id}.html. Set OWNER_EMAIL and RESEND_API_KEY (or SMTP_USER + SMTP_PASS) in backend/.env.`);
    return { sent: false, note: 'Email saved locally (not configured).' };
  }

  const send = (m: Mail) => resendKey ? sendViaResend(resendKey, from, m) : smtp!.sendMail({ from, ...m }).then(() => undefined);
  try {
    await send(ownerMail);
  } catch (e: any) {
    console.error('[mail] owner email failed:', e.message);
    return { sent: false, note: 'Email could not be sent: ' + e.message };
  }
  // Customer copy is best-effort. On Resend, it only works once you verify your own domain.
  await send(customerMail).catch((e) => console.warn('[mail] customer copy not sent:', e.message));
  return { sent: true, note: 'Email sent.' };
}
