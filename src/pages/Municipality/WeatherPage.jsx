import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CloudIcon, ExclamationTriangleIcon, MapPinIcon, SunIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';

export default function WeatherPage() {
  const { t } = useTranslation();
  const { weather, simulation, locationPermission, pilgrimLocation, weatherService } = useApp();

  const temp = weather?.temperature ?? simulation.temperature ?? 32;
  const humidity = weather?.humidity;
  const feelsLike = weather?.feelsLike ?? temp + 3;
  const windSpeed = weather?.windSpeed;
  const uvIndex = weather?.uvIndex;
  const condition = weather?.condition;
  const conditionIcon = weather?.conditionIcon;
  const hasRealData = !!weather;

  const advisory = useMemo(() => weatherService?.getAdvisory(temp) || {
    level: 'MODERATE', label: 'Moderate', color: 'green', action: 'Normal operations.',
  }, [temp, weatherService]);

  const heatIndex = useMemo(() => weatherService?.getHeatIndex(temp, humidity || 55) || temp, [temp, humidity, weatherService]);

  const advisoryToneMap = { EXTREME: 'red', SEVERE: 'red', HIGH: 'orange', MODERATE: 'green', LOW: 'blue' };

  return (
    <>
      <PageHeader
        eyebrow={t('weather.eyebrow', 'Civic Console')}
        title={t('weather.title', 'Weather')}
        description={t('weather.description', 'Current weather conditions on the Wari route.')}
      />

      {/* Location permission banner */}
      {locationPermission !== 'granted' && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-800">Location access required for real weather data</p>
              <p className="mt-1 text-sm text-amber-700">
                Enable location in your browser to get real-time temperature and weather for your current position.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main weather cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface p-5 text-center">
          <p className="label">Temperature</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            {conditionIcon && <span className="text-3xl">{conditionIcon}</span>}
            <p className="text-3xl font-bold text-ink">{temp}°C</p>
          </div>
          <p className="mt-1 text-xs text-slate-400">Feels like {feelsLike}°C</p>
          {condition && <p className="mt-1 text-xs font-medium text-slate-500">{condition}</p>}
          {!hasRealData && <p className="mt-1 text-xs text-amber-500">Simulated data</p>}
        </div>
        <div className="surface p-5 text-center">
          <p className="label">Humidity</p>
          <p className="mt-2 text-3xl font-bold text-ink">{humidity != null ? `${humidity}%` : '--'}</p>
          <p className="mt-1 text-xs text-slate-400">
            {humidity != null ? (humidity > 65 ? 'High' : humidity > 50 ? 'Moderate' : 'Low') : 'Unavailable'}
          </p>
        </div>
        <div className="surface p-5 text-center">
          <p className="label">Wind</p>
          <p className="mt-2 text-3xl font-bold text-ink">{windSpeed != null ? `${windSpeed}` : '--'} {windSpeed != null ? 'km/h' : ''}</p>
          <p className="mt-1 text-xs text-slate-400">
            {uvIndex != null ? `UV Index: ${uvIndex}` : 'UV unavailable'}
          </p>
        </div>
      </div>

      {/* Heat index */}
      {humidity != null && heatIndex > temp && (
        <div className="surface mt-4 p-5">
          <p className="label">Heat Index (Apparent Temperature)</p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-2xl font-bold text-ink">{heatIndex}°C</p>
            <Badge tone={heatIndex >= 40 ? 'red' : heatIndex >= 35 ? 'orange' : 'green'}>
              {heatIndex >= 40 ? 'Dangerous' : heatIndex >= 35 ? 'Caution' : 'Normal'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">Combined effect of temperature ({temp}°C) and humidity ({humidity}%)</p>
        </div>
      )}

      {/* Weather advisory */}
      <div className="surface mt-4 p-5">
        <div className="flex items-center justify-between">
          <p className="label">Weather Advisory</p>
          <Badge tone={advisoryToneMap[advisory.color] || 'green'}>{advisory.level}</Badge>
        </div>
        <p className="mt-3 text-sm text-slate-500">{advisory.action}</p>
        {!hasRealData && (
          <p className="mt-2 text-xs text-amber-500">Advisory based on simulated temperature. Enable location for real data.</p>
        )}
      </div>

      {/* Heat action plan */}
      {temp >= 35 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-800">Heat Action Plan Active</p>
              <p className="mt-1 text-sm text-amber-700">
                With temperatures above 35°C, ensure all water points are fully stocked and medical volunteers are on standby.
                Consider extending rest stop operating hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* UV warning */}
      {uvIndex != null && uvIndex >= 7 && (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <div className="flex items-start gap-3">
            <SunIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
            <div>
              <p className="text-sm font-bold text-orange-800">High UV Index ({uvIndex})</p>
              <p className="mt-1 text-sm text-orange-700">
                Strong sun exposure. Advise pilgrims to use sunscreen, wear hats, and seek shade during peak hours (10am–4pm).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rain notice */}
      {weather?.rainChance && (
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <CloudIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="text-sm font-bold text-blue-800">Rain Expected</p>
              <p className="mt-1 text-sm text-blue-700">
                Current conditions indicate rain. Ensure adequate shelter arrangements and advise pilgrims to carry rain gear.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data source footer */}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-400">
        <span>
          {hasRealData ? `Weather data for ${pilgrimLocation?.latitude?.toFixed(2)}°N, ${pilgrimLocation?.longitude?.toFixed(2)}°E` : 'Using simulated weather data'}
        </span>
        <span>{hasRealData ? `Updated ${new Date(weather.fetchedAt).toLocaleTimeString()}` : 'Enable GPS for live data'}</span>
      </div>
    </>
  );
}
