export const routeStops = [
  { name: 'Alandi Start', time: '05:30', status: 'passed' },
  { name: 'Pune', time: '07:15', status: 'passed' },
  { name: 'Saswad', time: '09:00', status: 'passed' },
  { name: 'Loni Kalbhor', time: '09:45', status: 'current' },
  { name: 'Yawat Halt', time: '13:15', status: 'next' },
  { name: 'Jejuri', time: '15:30', status: 'planned' },
  { name: 'Lonand', time: '17:00', status: 'planned' },
  { name: 'Phaltan', time: '19:45', status: 'planned' },
  { name: 'Pandharpur', time: '23:59', status: 'planned' },
];

export const crowdTrend = [
  { time: '06:00', pilgrims: 38, risk: 24 },
  { time: '08:00', pilgrims: 62, risk: 39 },
  { time: '10:00', pilgrims: 84, risk: 68 },
  { time: '12:00', pilgrims: 71, risk: 54 },
  { time: '14:00', pilgrims: 58, risk: 31 },
  { time: '16:00', pilgrims: 66, risk: 45 },
  { time: '18:00', pilgrims: 49, risk: 26 },
];

export const resourceUsage = [
  { name: 'Water', available: 82, used: 18 },
  { name: 'Food', available: 64, used: 36 },
  { name: 'Medical', available: 91, used: 9 },
  { name: 'Sanitation', available: 71, used: 29 },
];

export const resources = [
  { id: 1, name: 'Water Point W-14', area: 'Loni Kalbhor', available: 82, amount: '18,400 L', icon: 'water', tone: 'blue', note: 'Stock stable for 5 hours', queue: 18, distance: '180 m', status: 'Available' },
  { id: 2, name: 'Food Distribution Centre', area: 'Yawat Halt', available: 64, amount: '5,120 plates', icon: 'food', tone: 'orange', note: 'Delivery scheduled at 12:30', queue: 34, distance: '420 m', status: 'Serving' },
  { id: 3, name: 'Medical Camp M-03', area: 'Saswad Camp', available: 91, amount: '364 kits', icon: 'medical', tone: 'red', note: 'Fully stocked', queue: 4, distance: '650 m', status: 'Available' },
  { id: 4, name: 'Rest Shelter R-07', area: 'Loni Kalbhor', available: 46, amount: '1,140 beds', icon: 'rest', tone: 'green', note: 'High demand after 16:00', queue: 12, distance: '2.1 km', status: 'Available' },
  { id: 5, name: 'Toilet Block T-01', area: 'Canal Junction', available: 8, amount: '8 units', icon: 'toilet', tone: 'slate', note: 'Cleaning in progress', queue: 6, distance: '50 m', status: 'Available' },
  { id: 6, name: 'Police Post PP-02', area: 'Saswad Gate', available: 4, amount: '4 officers', icon: 'police', tone: 'blue', note: 'Helpline 112', queue: 0, distance: '300 m', status: 'Active' },
  { id: 7, name: 'Parking Zone P-03', area: 'Loni Kalbhor', available: 42, amount: '42 slots', icon: 'parking', tone: 'orange', note: 'Bus parking available', queue: 0, distance: '800 m', status: 'Available' },
  { id: 8, name: 'Ambulance Station A-01', area: 'Yawat Halt', available: 2, amount: '2 units', icon: 'ambulance', tone: 'red', note: 'Medic 08 on route', queue: 0, distance: '1.5 km', status: 'Ready' },
];

export const notifications = [
  { id: 1, title: 'Safer route available', text: 'Use the canal-side passage to avoid Loni Market congestion.', time: '2 min ago', type: 'route' },
  { id: 2, title: 'Hydration reminder', text: 'Water point W-14 is 180 m ahead on your route.', time: '18 min ago', type: 'water' },
  { id: 3, title: 'Light rain expected', text: 'Carry a cover between 15:00 and 16:30.', time: '34 min ago', type: 'weather' },
];

export const zones = [
  { name: 'Alandi', density: 'Low', people: '3,200', risk: 15, color: '#008C45', detail: 'Departure point, low congregation', areaRisk: 'low' },
  { name: 'Loni Market', density: 'High', people: '14,820', risk: 78, color: '#E53935', detail: 'Narrow road, procession crossing at 10:40', areaRisk: 'severe' },
  { name: 'Canal Junction', density: 'Moderate', people: '9,460', risk: 52, color: '#F4B400', detail: 'Flow improves after 11:15', areaRisk: 'high' },
  { name: 'Saswad Gate', density: 'High', people: '11,200', risk: 67, color: '#E85D04', detail: 'Entry bottleneck, volunteer assistance posted', areaRisk: 'high' },
  { name: 'Yawat Road', density: 'Low', people: '5,210', risk: 22, color: '#008C45', detail: 'Recommended diversion corridor', areaRisk: 'low' },
  { name: 'Jejuri Camp', density: 'Moderate', people: '8,040', risk: 45, color: '#F4B400', detail: 'Rest point, water and food available', areaRisk: 'moderate' },
  { name: 'Lonand Crossing', density: 'Severe', people: '18,480', risk: 88, color: '#B71C1C', detail: 'High congestion expected, use canal diversion', areaRisk: 'severe' },
  { name: 'Phaltan Bypass', density: 'Moderate', people: '7,600', risk: 38, color: '#F4B400', detail: 'Steady flow, medical camp at exit', areaRisk: 'moderate' },
];

export const crowdZones = [
  { id: 'cz1', name: 'Alandi', position: [18.678, 73.976], level: 'low', pilgrims: 3200, predicted: 3800, risk: 15, recommendation: 'Normal flow, no action needed' },
  { id: 'cz2', name: 'Loni Market', position: [18.493, 74.100], level: 'severe', pilgrims: 14820, predicted: 18100, risk: 78, recommendation: 'Use Canal Side Route to bypass' },
  { id: 'cz3', name: 'Canal Junction', position: [18.505, 74.109], level: 'high', pilgrims: 9460, predicted: 11200, risk: 52, recommendation: 'Deploy additional volunteers' },
  { id: 'cz4', name: 'Saswad Gate', position: [18.515, 74.118], level: 'high', pilgrims: 11200, predicted: 13800, risk: 67, recommendation: 'Open west entry gate' },
  { id: 'cz5', name: 'Yawat Road', position: [18.462, 74.125], level: 'low', pilgrims: 5210, predicted: 6400, risk: 22, recommendation: 'Divert incoming groups here' },
  { id: 'cz6', name: 'Jejuri Camp', position: [18.428, 74.138], level: 'moderate', pilgrims: 8040, predicted: 10200, risk: 45, recommendation: 'Rest point, monitor water supply' },
  { id: 'cz7', name: 'Lonand Crossing', position: [18.395, 74.152], level: 'severe', pilgrims: 18480, predicted: 22400, risk: 88, recommendation: 'Activate canal diversion NOW' },
  { id: 'cz8', name: 'Phaltan Bypass', position: [18.358, 74.170], level: 'moderate', pilgrims: 7600, predicted: 9200, risk: 38, recommendation: 'Medical camp at exit, steady flow' },
];

export const emergencyCases = [
  { id: 'SOS-2481', title: 'Heat exhaustion', location: 'Loni Market · Gate 3', level: 'high', elapsed: '03:12', status: 'Ambulance arriving', team: 'Medic 08' },
  { id: 'SOS-2482', title: 'Separated child', location: 'Canal Junction · Info booth', level: 'medium', elapsed: '08:34', status: 'Volunteer assigned', team: 'Volunteer 26' },
  { id: 'SOS-2483', title: 'Mobility assistance', location: 'Yawat Road · KM 18', level: 'low', elapsed: '14:06', status: 'Support on route', team: 'Assist 04' },
];

export const volunteers = [
  { name: 'Aditi Kulkarni', zone: 'Loni Kalbhor', task: 'Assist water-point queue', status: 'On site', completion: 68 },
  { name: 'Rohan Patil', zone: 'Canal Junction', task: 'Guide route diversion', status: 'On site', completion: 82 },
  { name: 'Meera Jadhav', zone: 'Yawat Halt', task: 'Meal distribution audit', status: 'Scheduled', completion: 20 },
];

export const adminKpis = [
  { label: 'Pilgrims on route', value: '1,84,260', change: '+8.2%', trend: 'up' },
  { label: 'Zones under watch', value: '04', change: '1 critical', trend: 'alert' },
  { label: 'Active responders', value: '382', change: '94% deployed', trend: 'up' },
  { label: 'Open incidents', value: '12', change: '↓ 3 this hour', trend: 'down' },
];

export const mapPoints = [
  { id: 'mp1', type: 'palkhi', position: [18.486, 74.083], label: 'Palkhi Procession', detail: 'Sant Dnyaneshwar Palkhi · KM 0', status: 'Moving' },
  { id: 'mp2', type: 'water', position: [18.502, 74.091], label: 'Water Point W-14', detail: 'Available: 850 L · Queue: 18 people', status: 'Available' },
  { id: 'mp3', type: 'medical', position: [18.491, 74.103], label: 'Medical Camp M-03', detail: 'Available: 12 kits · Queue: 4 people', status: 'Available' },
  { id: 'mp4', type: 'food', position: [18.495, 74.097], label: 'Food Dist. Centre F-02', detail: 'Available: 420 plates · Queue: 34 people', status: 'Serving' },
  { id: 'mp5', type: 'toilet', position: [18.478, 74.108], label: 'Toilet Block T-01', detail: 'Available: 8 units · Queue: 6 people', status: 'Available' },
  { id: 'mp6', type: 'parking', position: [18.470, 74.095], label: 'Parking Zone P-03', detail: 'Available: 42 slots · Bus parking', status: 'Available' },
  { id: 'mp7', type: 'police', position: [18.488, 74.110], label: 'Police Post PP-02', detail: 'Staff: 4 officers · Helpline: 112', status: 'Active' },
  { id: 'mp8', type: 'ambulance', position: [18.496, 74.113], label: 'Ambulance Station A-01', detail: 'Available: 2 units · Medic 08 on route', status: 'Ready' },
  { id: 'mp9', type: 'rest', position: [18.512, 74.115], label: 'Rest Shelter R-07', detail: 'Capacity: 120 beds · Available: 46 beds', status: 'Available' },
  { id: 'mp10', type: 'emergency', position: [18.483, 74.114], label: 'Congestion Watch', detail: 'Slow movement · Volunteers deployed', status: 'Watch' },
];

export const routeCoordinates = [
  [18.678, 73.976], [18.640, 73.991], [18.600, 74.005], [18.565, 74.020],
  [18.530, 74.045], [18.515, 74.065], [18.500, 74.083], [18.486, 74.083],
  [18.491, 74.091], [18.495, 74.097], [18.500, 74.103], [18.505, 74.110],
  [18.512, 74.116], [18.515, 74.118], [18.500, 74.130], [18.480, 74.135],
  [18.462, 74.125], [18.440, 74.130], [18.428, 74.138], [18.410, 74.145],
  [18.395, 74.152], [18.375, 74.160], [18.358, 74.170], [18.340, 74.185],
  [18.320, 74.200],
];

export const wariStatus = {
  currentHalt: 'Loni Kalbhor',
  nextHalt: 'Yawat Halt',
  eta: '1h 45m',
  totalPilgrims: '1,84,260',
  weather: '29°C · Light rain',
  crowdStatus: 'Moderate',
  aiStatus: 'Normal',
};
