import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, MapPinIcon, BellIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import SectionTitle from '../../components/common/SectionTitle';
import { useApp } from '../../context/AppContext';
import { alertService } from '../../services/alertService';
import { cn } from '../../utils/format';

const severityTone = (s) => {
  if (s === 'CRITICAL') return 'red';
  if (s === 'HIGH') return 'orange';
  if (s === 'MEDIUM') return 'amber';
  if (s === 'LOW') return 'blue';
  return 'slate';
};

const severityLabel = (s) => {
  if (s === 'CRITICAL') return 'Critical';
  if (s === 'HIGH') return 'High';
  if (s === 'MEDIUM') return 'Medium';
  if (s === 'LOW') return 'Low';
  if (s === 'INFO') return 'Info';
  return s;
};

export default function AlertsPage() {
  const { t } = useTranslation();
  const { alerts, pilgrimLocation, crowdSummary, simulation } = useApp();
  const [zoneAlerts, setZoneAlerts] = useState([]);

  const currentZoneId = pilgrimLocation?.zoneId || crowdSummary?.highestRiskZone?.id;

  useEffect(() => {
    if (currentZoneId) {
      alertService.listForPilgrim(currentZoneId).then(setZoneAlerts);
    } else {
      alertService.listActive().then(setZoneAlerts);
    }
  }, [currentZoneId, alerts]);

  const allAlerts = useMemo(() => {
    const db = zoneAlerts.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      severity: a.severity,
      zone: a.zone_name,
      recommendedAction: a.recommended_action,
      broadcastBy: a.broadcast_by,
      createdAt: a.created_at,
      isRelevant: !a.zone_id || a.zone_id === currentZoneId,
    }));
    const sim = (simulation.activeAlerts || []).map((a, idx) => ({
      id: `sim-${idx}`,
      title: a.title || a.zone || 'Demo Alert',
      message: a.message || 'Simulated alert',
      severity: 'MEDIUM',
      zone: a.zone || null,
      recommendedAction: null,
      broadcastBy: 'Simulation',
      createdAt: new Date().toISOString(),
      isRelevant: true,
    }));
    return [...db, ...sim];
  }, [zoneAlerts, simulation.activeAlerts, currentZoneId]);

  const relevantCount = allAlerts.filter((a) => a.isRelevant).length;
  const criticalCount = allAlerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;

  return (
    <>
      <PageHeader
        eyebrow={t('alerts.eyebrow', 'Alert Feed')}
        title={t('alerts.title', 'Active Alerts')}
        description={t('alerts.description', currentZoneId ? `Showing alerts for your zone and nearby areas.` : 'All active alerts across the route.')}
      />

      {currentZoneId && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <MapPinIcon className="h-4 w-4 text-slate-400" />
          <span>Your zone: <span className="font-bold text-ink">{pilgrimLocation?.zoneName || 'Detecting...'}</span></span>
          <Badge tone={criticalCount > 0 ? 'red' : 'green'} className="ml-auto">
            {relevantCount} alert{relevantCount === 1 ? '' : 's'}
          </Badge>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-red-50 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{allAlerts.filter((a) => a.severity === 'CRITICAL').length}</p>
          <p className="label mt-1 text-red-600">Critical</p>
        </div>
        <div className="rounded-2xl bg-orange-50 p-4 text-center">
          <p className="text-2xl font-bold text-orange-700">{allAlerts.filter((a) => a.severity === 'HIGH').length}</p>
          <p className="label mt-1 text-orange-600">High</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{allAlerts.filter((a) => a.severity === 'MEDIUM' || a.severity === 'LOW' || a.severity === 'INFO').length}</p>
          <p className="label mt-1 text-amber-600">Medium / Low</p>
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle
          title="All Alerts"
          detail={`${allAlerts.length} total · ${relevantCount} in your zone`}
        />
        <div className="mt-4 space-y-3">
          {allAlerts.length === 0 ? (
            <div className="rounded-2xl bg-emerald-50 p-8 text-center">
              <ShieldCheckIcon className="mx-auto h-10 w-10 text-emerald-400" />
              <p className="mt-3 text-sm font-bold text-emerald-700">No active alerts</p>
              <p className="mt-1 text-xs text-emerald-600">All clear across the route.</p>
            </div>
          ) : (
            allAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'rounded-2xl border p-4 transition',
                  alert.isRelevant
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-100 bg-slate-50/60 opacity-70',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={severityTone(alert.severity)}>{severityLabel(alert.severity)}</Badge>
                      {alert.isRelevant && <Badge tone="green">Your zone</Badge>}
                    </div>
                    <h3 className="mt-2 text-sm font-bold text-ink">{alert.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{alert.message}</p>
                    {alert.zone && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPinIcon className="h-3 w-3" />
                        {alert.zone}
                      </p>
                    )}
                    {alert.recommendedAction && (
                      <div className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
                        <span className="font-bold">Recommended:</span> {alert.recommendedAction}
                      </div>
                    )}
                  </div>
                  <time className="shrink-0 text-[11px] text-slate-400">
                    {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>By {alert.broadcastBy || 'System'}</span>
                  {!alert.isRelevant && <span>Other zone</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-center text-xs text-slate-500">
        Alerts are broadcast by controllers and updated automatically. Zone-specific alerts are shown first.
        <Link to="/dashboard" className="ml-2 font-bold text-saffron">Return to Dashboard</Link>
      </div>
    </>
  );
}
