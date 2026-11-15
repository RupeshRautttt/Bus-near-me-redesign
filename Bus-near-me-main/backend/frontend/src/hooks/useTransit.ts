import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  API_URL, LOCATIONS, generateDemoFleet, nearbyFromFleet, nearestStops, stepDemoFleet,
  type Bus, type LocationOption, type NearbyResult, type Stop,
} from '../lib/transit';

/**
 * Talks to the Express backend. If it can't be reached, transparently falls back to a
 * client-side simulation ("demo mode") so the site always works.
 */
export function useTransit(location: LocationOption) {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>(LOCATIONS);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [running, setRunning] = useState(true);
  const demoRef = useRef(false);
  const runningRef = useRef(true);
  const locRef = useRef(location);
  locRef.current = location;
  runningRef.current = running;

  // Initial: locations + first fleet
  useEffect(() => {
    axios.get(`${API_URL}/api/locations`, { timeout: 4000 })
      .then((r) => Array.isArray(r.data) && r.data.length && setLocations(r.data))
      .catch(() => {});
  }, []);

  const switchLocation = useCallback(async (loc: LocationOption) => {
    setStops(nearestStops(loc.lat, loc.lng));
    try {
      const res = await axios.post(`${API_URL}/api/location`, loc, { timeout: 4000 });
      demoRef.current = false; setDemo(false);
      setBuses(res.data.buses);
      const s = await axios.get(`${API_URL}/api/stops/nearby`, { params: { lat: loc.lat, lng: loc.lng }, timeout: 4000 });
      setStops(s.data);
    } catch {
      demoRef.current = true; setDemo(true);
      setBuses(generateDemoFleet(loc));
    }
    setLoading(false);
  }, []);

  useEffect(() => { switchLocation(location); /* eslint-disable-next-line */ }, []);

  // Polling / simulation tick
  useEffect(() => {
    const id = setInterval(async () => {
      if (demoRef.current) {
        if (runningRef.current) setBuses((b) => stepDemoFleet(b));
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/api/buses`, { timeout: 4000 });
        setBuses(res.data);
      } catch {
        demoRef.current = true; setDemo(true);
        setBuses((b) => (b.length ? b : generateDemoFleet(locRef.current)));
      }
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const toggle = useCallback(async () => {
    const next = !runningRef.current;
    setRunning(next);
    if (!demoRef.current) {
      axios.post(`${API_URL}/api/simulation/${next ? 'start' : 'pause'}`).catch(() => {});
    }
  }, []);

  const reset = useCallback(async () => {
    if (demoRef.current) return setBuses(generateDemoFleet(locRef.current));
    try { const r = await axios.post(`${API_URL}/api/simulation/reset`); setBuses(r.data.buses); } catch { /* noop */ }
  }, []);

  const findNearby = useCallback(async (lat: number, lng: number, radius = 3): Promise<NearbyResult> => {
    if (!demoRef.current) {
      try {
        const r = await axios.post(`${API_URL}/api/buses/nearby`, { latitude: lat, longitude: lng, radius }, { timeout: 4000 });
        return r.data;
      } catch { /* fall through */ }
    }
    return nearbyFromFleet(buses, lat, lng, radius);
  }, [buses]);

  return { buses, stops, locations, loading, demo, running, switchLocation, toggle, reset, findNearby };
}
