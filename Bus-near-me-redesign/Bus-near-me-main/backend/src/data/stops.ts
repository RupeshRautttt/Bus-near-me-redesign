export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export const stops: Stop[] = [
  { id: 'STOP001', name: 'Kempegowda Bus Station (Majestic)', latitude: 12.9767, longitude: 77.5713 },
  { id: 'STOP002', name: 'Silk Board', latitude: 12.9172, longitude: 77.6228 },
  { id: 'STOP003', name: 'HSR Layout BDA Complex', latitude: 12.9116, longitude: 77.6389 },
  { id: 'STOP004', name: 'Agara Junction', latitude: 12.9227, longitude: 77.6490 },
  { id: 'STOP005', name: 'Iblur Junction', latitude: 12.9250, longitude: 77.6650 },
  { id: 'STOP006', name: 'Bellandur', latitude: 12.9304, longitude: 77.6784 },
  { id: 'STOP007', name: 'Marathahalli Bridge', latitude: 12.9569, longitude: 77.7011 },
  { id: 'STOP008', name: 'ITPL Whitefield', latitude: 12.9860, longitude: 77.7370 },
  { id: 'STOP009', name: 'Indiranagar 100ft Road', latitude: 12.9784, longitude: 77.6408 },
  { id: 'STOP010', name: 'Electronic City Phase 1', latitude: 12.8452, longitude: 77.6602 },
  { id: 'STOP011', name: 'Jayanagar 4th Block', latitude: 12.9250, longitude: 77.5838 },
  { id: 'STOP012', name: 'Hebbal Flyover', latitude: 13.0358, longitude: 77.5970 },
  { id: 'STOP013', name: 'Sony World Signal Koramangala', latitude: 12.9345, longitude: 77.6140 },
  { id: 'STOP014', name: 'Madiwala Checkpost', latitude: 12.9214, longitude: 77.6180 },
  { id: 'STOP015', name: 'Richmond Town', latitude: 12.9650, longitude: 77.6060 }
];
