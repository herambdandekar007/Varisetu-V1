import { useState } from 'react';
import { Circle, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';

const levelConfig = {
  low: { color: '#008C45', radius: 400, opacity: 0.18, label: 'Low' },
  moderate: { color: '#F4B400', radius: 500, opacity: 0.22, label: 'Moderate' },
  high: { color: '#E85D04', radius: 600, opacity: 0.25, label: 'High' },
  severe: { color: '#B71C1C', radius: 700, opacity: 0.35, label: 'Severe' },
};

export default function CrowdZone({ zone }) {
  const [hovered, setHovered] = useState(false);
  const config = levelConfig[zone.level] || levelConfig.low;

  return (
    <Circle
      center={zone.position}
      radius={hovered ? config.radius * 1.08 : config.radius}
      pathOptions={{
        color: config.color,
        fillColor: config.color,
        fillOpacity: hovered ? config.opacity + 0.1 : config.opacity,
        weight: hovered ? 3 : 2,
      }}
      eventHandlers={{
        mouseover: () => setHovered(true),
        mouseout: () => setHovered(false),
      }}
    >
      <Popup>
        <div className="wari-popup min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-800">{zone.name}</p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: config.color + '22', color: config.color }}>
              {config.label}
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600">
            <p><span className="font-bold text-slate-800">Current:</span> {zone.pilgrims.toLocaleString('en-IN')} Pilgrims</p>
            <p><span className="font-bold text-slate-800">Predicted:</span> {zone.predicted.toLocaleString('en-IN')}</p>
            <p><span className="font-bold text-slate-800">Risk:</span> {zone.risk}%</p>
          </div>
          <div className="mt-3 rounded-lg bg-saffron-50 p-2.5">
            <p className="text-[11px] font-bold text-saffron">Recommendation</p>
            <p className="text-xs text-slate-700 mt-0.5">{zone.recommendation}</p>
          </div>
        </div>
      </Popup>
    </Circle>
  );
}
