import { CircleMarker, Polyline } from 'react-leaflet';
import { routeCoordinates } from '../../data/mockData';

export default function RouteLine() {
  return (
    <>
      <Polyline
        positions={routeCoordinates}
        pathOptions={{
          color: '#008C45',
          weight: 6,
          opacity: 0.92,
          lineCap: 'round',
        }}
      />
      {routeCoordinates.map((position, index) => (
        <CircleMarker
          key={`${position[0]}-${position[1]}`}
          center={position}
          radius={index === 0 || index === routeCoordinates.length - 1 ? 7 : 4}
          pathOptions={{
            color: '#fff',
            fillColor: index === routeCoordinates.length - 1 ? '#FF7A00' : '#008C45',
            fillOpacity: 1,
            weight: 3,
          }}
        />
      ))}
    </>
  );
}
