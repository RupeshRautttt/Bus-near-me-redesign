import L from 'leaflet';
import type { Bus } from './transit';

export function busIcon(bus: Bus, selected: boolean) {
  const pct = (bus.occupancy / bus.capacity) * 100;
  let tone = 'ok';
  if (bus.status === 'Inactive') tone = 'off';
  else if (bus.status === 'Delayed' || pct > 80) tone = 'danger';
  else if (pct > 55) tone = 'warn';
  return L.divIcon({
    className: `bus-pin tone-${tone} ${selected ? 'selected' : ''}`,
    html: `<div class="pin">${bus.routeNumber}</div>`,
    iconSize: [0, 0],
  });
}

export const stopIcon = L.divIcon({ className: 'stop-pin', html: '<span></span>', iconSize: [0, 0] });
export const meIcon = L.divIcon({ className: 'me-pin', html: '<span></span>', iconSize: [0, 0] });
export const hubIcon = L.divIcon({ className: 'hub-pin', html: '<span></span>', iconSize: [0, 0] });
