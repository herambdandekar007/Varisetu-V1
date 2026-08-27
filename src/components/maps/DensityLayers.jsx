import CrowdZone from './CrowdZone';
import { useApp } from '../../context/AppContext';

export default function DensityLayers({ activeLayers = {} }) {
  const { crowdZones } = useApp();

  if (activeLayers.crowd === false) return null;

  return crowdZones.map((zone) => (
    <CrowdZone key={zone.id} zone={zone} />
  ));
}
