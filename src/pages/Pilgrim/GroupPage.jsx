import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon, MapPinIcon, PhoneIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import RouteMap from '../../components/maps/RouteMap';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

export default function GroupPage() {
  const { t } = useTranslation();
  const { groupMembers, pilgrimLocation, haversineDistance, recallGroupMember } = useApp();

  const membersWithDistance = useMemo(() => {
    if (!pilgrimLocation?.latitude) return groupMembers.map((m) => ({ ...m, distanceM: 0 }));
    return groupMembers.map((m) => ({
      ...m,
      distanceM: Math.round(haversineDistance(pilgrimLocation.latitude, pilgrimLocation.longitude, m.lat, m.lng)),
    }));
  }, [groupMembers, pilgrimLocation, haversineDistance]);

  const separatedCount = membersWithDistance.filter((m) => m.distanceM > 200).length;
  const anySeparated = separatedCount > 0;

  const handleNavigateBack = (member) => {
    toast(`Navigating back to ${member.name}'s location...`, { icon: '🧭' });
  };

  return (
    <>
      <PageHeader
        eyebrow={t('group.eyebrow', 'My Group')}
        title={t('group.title', 'Family & Group Tracker')}
        description={anySeparated
          ? `${separatedCount} member${separatedCount > 1 ? 's' : ''} more than 200m away`
          : t('group.description', 'Track your group members on the Wari route')}
        actions={
          anySeparated && (
            <Badge tone="red" dot>{separatedCount} Separated</Badge>
          )
        }
      />

      <section className="grid gap-6 2xl:grid-cols-[1.42fr_.58fr]">
        <article className="surface overflow-hidden p-4 sm:p-5">
          <div className="relative h-[500px] overflow-hidden rounded-2xl">
            <RouteMap />
          </div>
        </article>

        <aside className="space-y-5">
          <article className="surface p-5">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-saffron" />
              <p className="text-sm font-bold text-ink">Group Members</p>
            </div>

            <div className="mt-4 space-y-3">
              {membersWithDistance.map((member) => {
                const isSeparated = member.distanceM > 200;
                return (
                  <div
                    key={member.id}
                    className={`rounded-2xl border p-4 transition ${
                      isSeparated
                        ? 'border-red-200 bg-red-50'
                        : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${isSeparated ? 'text-red-700' : 'text-ink'}`}>
                          {member.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {member.distanceM}m away
                        </p>
                      </div>
                      {isSeparated ? (
                        <div className="flex items-center gap-1.5">
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                          <Badge tone="red">Separated</Badge>
                        </div>
                      ) : (
                        <Badge tone="green">Nearby</Badge>
                      )}
                    </div>
                    {isSeparated && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          className="!py-1.5 !px-3 text-xs"
                          icon={MapPinIcon}
                          onClick={() => handleNavigateBack(member)}
                        >
                          Navigate back
                        </Button>
                        <Button
                          variant="ghost"
                          className="!py-1.5 !px-3 text-xs"
                          icon={PhoneIcon}
                          onClick={() => toast.success(`Calling ${member.name}...`)}
                        >
                          Call
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </article>

          {anySeparated && (
            <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-bold text-red-700">Group Separation Alert</p>
                  <p className="mt-1 text-xs leading-5 text-red-600">
                    One or more group members are more than 200m away. Use "Navigate back" to rejoin or "Call" to contact them.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!anySeparated && (
            <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
              <div className="flex items-start gap-3">
                <UserGroupIcon className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-forest">Group together</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-600">
                    All group members are within 200m. Your group is safe and close.
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}
