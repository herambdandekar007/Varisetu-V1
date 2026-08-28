import { CircleMarker, Marker, Polyline } from 'react-leaflet';
import { routeCoordinates } from '../../data/mockData';
import { createRouteEndpointIcon } from './markerIcons';

export default function RouteLine({ geometry = routeCoordinates }) {
  if (!geometry?.length) return null;

  const startPoint = geometry[0];
  const endPoint = geometry[geometry.length - 1];

  return (
    <>
      <Polyline
        positions={geometry}
        pathOptions={{
          color: '#008C45',
          weight: 6,
          opacity: 0.92,
          lineCap: 'round',
        }}
      />
      <Marker
        position={startPoint}
        icon={createRouteEndpointIcon(true)}
      />
      <Marker
        position={endPoint}
        icon={createRouteEndpointIcon(false)}
      />
      {geometry.slice(1, -1).map((latLng, index) => (
        <CircleMarker
          key={`${latLng[0]}-${latLng[1]}`}
          center={latLng}
          radius={4}
          pathOptions={{
            color: '#fff',
            fillColor: '#008C45',
            fillOpacity: 1,
            weight: 3,
          }}
        />
      ))}
    </>
  );
}
