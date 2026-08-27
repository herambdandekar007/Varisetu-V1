import { Marker, Popup } from 'react-leaflet';
import { createMarkerIcon } from './markerIcons';

export default function CustomMarker({ point, children }) {
  return (
    <Marker position={point.position} icon={createMarkerIcon(point.type)}>
      {children}
    </Marker>
  );
}
