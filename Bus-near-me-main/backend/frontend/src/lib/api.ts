import axios from 'axios';
import { API_URL } from './transit';

const KEY = 'bnm_token';
export const getToken = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
export const setToken = (t: string | null) => { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch { /* private mode */ } };

export const http = axios.create({ baseURL: API_URL, timeout: 8000 });
http.interceptors.request.use((c) => { const t = getToken(); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

export function errMsg(e: unknown): string {
  const err = e as { response?: { data?: { error?: string } }; code?: string };
  if (err.response?.data?.error) return err.response.data.error;
  return 'Can’t reach the server. Make sure the backend is running (npm run dev in /backend).';
}

export interface User { id: string; name: string; email: string; phone: string }
export interface Ticket {
  id: string; customerName: string; customerEmail: string; customerPhone: string;
  busId: string; routeNumber: string; busType: 'Ordinary' | 'AC';
  from: string; to: string; distanceKm: number;
  travelDate: string; departureTime: string; arrivalTime: string;
  passengers: number; seats: string[]; farePerPassenger: number; totalFare: number;
  paymentMethod: string; paymentStatus: 'PAID' | 'PAY_ON_BOARD'; status: 'CONFIRMED' | 'CANCELLED'; createdAt: string;
}
