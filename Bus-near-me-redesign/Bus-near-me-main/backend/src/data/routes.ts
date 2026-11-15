export interface Route {
  id: string;
  name: string;
  stops: string[];
}

export const routes: Route[] = [
  { id: '500D', name: 'Silk Board – Hebbal', stops: ['STOP002', 'STOP003', 'STOP004', 'STOP012'] },
  { id: '335E', name: 'Majestic – Whitefield', stops: ['STOP001', 'STOP009', 'STOP007', 'STOP008'] },
  { id: '201', name: 'Majestic – Jayanagar', stops: ['STOP001', 'STOP011'] },
  { id: 'K-3', name: 'Electronic City – Majestic', stops: ['STOP010', 'STOP002', 'STOP001'] },
  { id: '356C', name: 'Electronic City – Marathahalli', stops: ['STOP010', 'STOP002', 'STOP007'] }
];
