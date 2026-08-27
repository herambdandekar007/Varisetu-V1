import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { MapPinIcon, PlusIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import RouteMap from '../../components/maps/RouteMap';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/format';

const AVATAR_COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-orange-500', 'bg-violet-500', 'bg-pink-500'];

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function TrackingPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { pilgrimLocation, familyMembers = [] } = useApp();
  const [activeMember, setActiveMember] = useState(null);

  const pilgrimName = profile?.full_name || 'You';

  const members = useMemo(() => {
    if (familyMembers.length > 0) {
      return familyMembers.map((m, i) => ({
        ...m,
        initials: getInitials(m.name),
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
      }));
    }
    return [
      { name: pilgrimName, relation: 'You', location: pilgrimLocation?.zoneName || 'Starting point', updated: 'Live now', status: 'Safe', initials: getInitials(pilgrimName), color: 'bg-forest' },
    ];
  }, [familyMembers, pilgrimName, pilgrimLocation]);

  const selected = activeMember !== null ? members.find((m) => m.name === activeMember) : members[0];

  return (
    <>
      <PageHeader
        eyebrow={t('tracking.eyebrow')}
        title={t('tracking.title')}
        description={t('tracking.description')}
        actions={
          <Button icon={PlusIcon} onClick={() => toast.success('Invite link created. Share it with a family member to add them.')}>
            {t('tracking.addFamily')}
          </Button>
        }
      />

      <section className="grid gap-6 2xl:grid-cols-[1.35fr_.65fr]">
        <article className="surface overflow-hidden p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-ink">{t('tracking.familyOnRoute')}</p>
              <p className="mt-1 text-xs text-slate-500">
                {members.length === 1 ? 'Just you on the route' : `All ${members.length} members within 1.2 km`}
              </p>
            </div>
            <Badge tone="green" dot>{members.length} {t('common.live')}</Badge>
          </div>
          <div className="relative h-[520px]">
            <RouteMap />
            <div className="absolute bottom-5 left-4 z-[401] rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
              <div className="flex -space-x-2">
                {members.map((m) => (
                  <span key={m.name} className={cn('grid h-8 w-8 place-items-center rounded-full border-2 border-white text-[10px] font-bold text-white', m.color)}>
                    {m.initials}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs font-bold text-ink">{t('common.safe')}</p>
            </div>
          </div>
        </article>

        <aside className="surface p-5">
          <p className="eyebrow">{t('tracking.yourCircle')}</p>
          <h2 className="text-xl font-bold text-ink">{t('tracking.familyMembers')}</h2>
          <div className="mt-5 space-y-3">
            {members.map((member) => (
              <button
                key={member.name}
                onClick={() => setActiveMember(member.name)}
                className={cn(
                  'w-full rounded-2xl border p-4 text-left transition',
                  (selected?.name === member.name) ? 'border-forest bg-emerald-50' : 'border-slate-100 hover:border-slate-300',
                )}
              >
                <div className="flex items-start gap-3">
                  <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white', member.color)}>
                    {member.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-ink">{member.name}</p>
                      <Badge tone={member.status === 'Safe' || member.status === 'Together' ? 'green' : 'orange'}>{member.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{member.relation}</p>
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
                      <MapPinIcon className="h-3 w-3" aria-hidden="true" />
                      {member.location}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">{member.updated}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </section>
    </>
  );
}
