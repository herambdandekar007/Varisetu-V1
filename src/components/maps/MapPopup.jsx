import { Popup } from 'react-leaflet';

const typeLabels = {
  water: '🚰 Water Point',
  medical: '🏥 Medical Camp',
  food: '🍛 Food Distribution',
  toilet: '🚻 Toilet',
  parking: '🅿 Parking',
  police: '👮 Police',
  ambulance: '🚑 Ambulance',
  rest: '🏕 Rest Area',
  palkhi: '🛕 Palkhi',
  emergency: '⚠ Emergency',
  family: '👨‍👩‍👧 Family Member',
};

const statusColors = {
  Available: 'text-emerald-600 bg-emerald-50',
  Serving: 'text-amber-600 bg-amber-50',
  Active: 'text-blue-600 bg-blue-50',
  Ready: 'text-green-600 bg-green-50',
  Watch: 'text-orange-600 bg-orange-50',
  Moving: 'text-purple-600 bg-purple-50',
};

export default function MapPopup({ point }) {
  const label = typeLabels[point.type] || point.type;
  const statusClass = statusColors[point.status] || 'text-slate-600 bg-slate-50';
  return (
    <Popup>
      <div className="wari-popup">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{label.split(' ')[0]}</span>
          <p className="text-sm font-bold text-slate-800">{label}</p>
        </div>
        <p className="text-base font-bold text-slate-900 mb-1">{point.label}</p>
        <p className="text-xs text-slate-500 mb-3">{point.detail}</p>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusClass}`}>
            {point.status}
          </span>
        </div>
        <button
          className="mt-3 w-full rounded-lg bg-saffron px-3 py-1.5 text-xs font-bold text-white hover:bg-saffron-600 transition-colors"
          onClick={() => {}}
        >
          Navigate Here
        </button>
      </div>
    </Popup>
  );
}
