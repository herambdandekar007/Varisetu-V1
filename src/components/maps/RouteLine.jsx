import { CircleMarker, Polyline } from 'react-leaflet';
// The geometry passed in comes in the same shape as the mock data: an array
// of `[lat, lng]` pairs.  When the component is used with the real OSRM
// response, the caller must pre‑process the geometry to that shape.
// If no geometry is supplied we fall back to the demo route.
import { routeCoordinates } from '../../data/mockData';

export default function RouteLine({ geometry = routeCoordinates }) {
  // Make sure we have at least a minimal path – otherwise the polyline goal
  // would fail silently.  A single point is not enough for a route.
  if (!geometry?.length) return null;

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
      {geometry.map((latLng, index) => (
        <CircleMarker
          key={`${latLng[0]}-${latLng[1]}`}
          center={latLng}
          radius={index === 0 || index === geometry.length - 1 ? 7 : 4}
          pathOptions={{
            color: '#fff',
            fillColor:
              index === geometry.length - 1 ? '#FF7A00' : '#008C45',
            fillOpacity: 1,
            weight: 3,
          }}
        />
      ))}
    </>
  );
}
