import { useMemo } from 'react';
import CustomMarker from './CustomMarker';
import MapPopup from './MapPopup';
import { useApp } from '../../context/AppContext';

export default function MapMarkers({ activeLayers = {} }) {
  const { mapPoints } = useApp();

  const filtered = useMemo(() => {
    return mapPoints.filter((p) => {
      if (activeLayers.crowd === false && p.type === 'emergency') return false;
      if (activeLayers.resources === false && ['water', 'rest'].includes(p.type)) return false;
      if (activeLayers.food === false && p.type === 'food') return false;
      if (activeLayers.toilets === false && p.type === 'toilet') return false;
      if (activeLayers.medical === false && p.type === 'medical') return false;
      if (activeLayers.police === false && p.type === 'police') return false;
      if (activeLayers.parking === false && p.type === 'parking') return false;
      if (activeLayers.palkhi === false && p.type === 'palkhi') return false;
      if (activeLayers.family === false && p.type === 'family') return false;
      return true;
    });
  }, [mapPoints, activeLayers]);

  return filtered.map((point) => (
    <CustomMarker key={point.id} point={point}>
      <MapPopup point={point} />
    </CustomMarker>
  ));
}
