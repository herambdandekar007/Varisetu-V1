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

export function createPilgrimIcon(isSimulated = false) {
  const color = isSimulated ? '#F59E0B' : '#16A34A';
  return L.divIcon({
    className: 'wari-location-pin',
    html: `<div class="wari-pin-inner" style="background:${color}">
      <svg viewBox="0 0 24 24" fill="white" width="14" height="14">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -44],
  });
}

export function createFamilyMemberIcon(color) {
  return L.divIcon({
    className: 'wari-location-pin',
    html: `<div class="wari-pin-inner" style="background:${color}">
      <svg viewBox="0 0 24 24" fill="white" width="12" height="12">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    </div>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38],
  });
}

export function createRouteEndpointIcon(isStart) {
  const color = isStart ? '#008C45' : '#FF7A00';
  return L.divIcon({
    className: 'wari-location-pin',
    html: `<div class="wari-pin-inner wari-pin-sm" style="background:${color}">
      <svg viewBox="0 0 24 24" fill="white" width="10" height="10">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>`,
    iconSize: [22, 30],
    iconAnchor: [11, 30],
    popupAnchor: [0, -32],
  });
}

// Ambulance marker — colored by the ambulance's registered color, with a pulsing
// dot when it's in EMERGENCY mode.
export function createAmbulanceIcon(color = '#D32F2F', emergency = false) {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color || '') ? color : '#D32F2F';
  return L.divIcon({
    className: 'wari-ambulance-marker',
    html: `
      <div class="wari-ambulance-wrap ${emergency ? 'wari-ambulance-pulse' : ''}" style="--ambulance-color:${hex}">
        <div class="wari-ambulance-inner">
          <span style="font-size:20px">🚑</span>
        </div>
        ${emergency ? '<span class="wari-ambulance-halo"></span>' : ''}
      </div>`,
    iconSize: [40, 44],
    iconAnchor: [20, 44],
    popupAnchor: [0, -46],
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
