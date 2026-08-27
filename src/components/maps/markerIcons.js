import L from 'leaflet';

const icons = {
  palkhi: '<span style="font-size:18px">🛕</span>',
  water: '<span style="font-size:16px">🚰</span>',
  medical: '<span style="font-size:16px">🏥</span>',
  food: '<span style="font-size:16px">🍛</span>',
  toilet: '<span style="font-size:16px">🚻</span>',
  parking: '<span style="font-size:16px">🅿</span>',
  police: '<span style="font-size:16px">👮</span>',
  ambulance: '<span style="font-size:16px">🚑</span>',
  rest: '<span style="font-size:16px">🏕</span>',
  family: '<span style="font-size:16px">👨‍👩‍👧</span>',
  emergency: '<span style="font-size:16px">⚠</span>',
};

const colors = {
  palkhi: '#FF6B35',
  water: '#1976D2',
  medical: '#E53935',
  food: '#F9A825',
  toilet: '#78909C',
  parking: '#FF8F00',
  police: '#1565C0',
  ambulance: '#D32F2F',
  rest: '#2E7D32',
  family: '#7B1FA2',
  emergency: '#C62828',
  default: '#616161',
};

export function createMarkerIcon(type) {
  const emoji = icons[type] || '';
  const bg = colors[type] || colors.default;
  return L.divIcon({
    className: 'wari-marker',
    html: `<div class="wari-marker-inner" style="background:${bg}">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -40],
  });
}

export function createCrowdIcon(level) {
  const config = {
    low: { bg: '#008C45', label: 'Low' },
    moderate: { bg: '#F4B400', label: 'Mod' },
    high: { bg: '#E85D04', label: 'High' },
    severe: { bg: '#B71C1C', label: 'Sev' },
  };
  const c = config[level] || config.low;
  return L.divIcon({
    className: 'wari-crowd-marker',
    html: `<div class="wari-crowd-inner" style="background:${c.bg}"><span>${c.label}</span></div>`,
    iconSize: level === 'severe' ? [52, 52] : level === 'high' ? [44, 44] : [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}
