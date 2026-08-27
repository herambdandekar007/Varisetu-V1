import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardDocumentListIcon, HeartIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/common/PageHeader';
import MetricCard from '../../components/cards/MetricCard';
import Button from '../../components/common/Button';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';

export default function VolunteerDashboard() {
  const { resources, updateResource, tasks, incidents, pilgrimLocation, crowdCells, alerts } = useApp();
  const { profile } = useAuth();
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [editForm, setEditForm] = useState({ available: '', queue: '' });

  const volunteerName = profile?.full_name || 'Volunteer';
  const zoneName = pilgrimLocation?.zoneName || 'Assigned zone';

  const openTasks = useMemo(() => tasks?.filter((t) => t.status !== 'COMPLETED') || [], [tasks]);
  const completedTasks = useMemo(() => tasks?.filter((t) => t.status === 'COMPLETED') || [], [tasks]);
  const openIncidents = useMemo(() => incidents?.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED') || [], [incidents]);

  const nearbyPilgrims = crowdCells?.reduce((s, z) => s + (z.people_count || 0), 0) || 0;

  const metrics = [
    { icon: MapPinIcon, label: 'Assigned Zone', value: zoneName, helper: volunteerName, trend: { label: 'On duty', direction: 'up' }, tone: 'green' },
    { icon: ClipboardDocumentListIcon, label: 'Open Requests', value: String(openIncidents.length), helper: `${incidents?.length || 0} total`, trend: { label: openIncidents.length > 0 ? 'Action needed' : 'All clear', direction: openIncidents.length > 0 ? 'alert' : 'up' }, tone: 'orange' },
    { icon: HeartIcon, label: "Today's Tasks", value: String(tasks?.length || 0), helper: `${completedTasks.length} completed, ${openTasks.length} pending`, trend: { label: tasks?.length ? `${Math.round((completedTasks.length / (tasks.length || 1)) * 100)}% done` : 'No tasks', direction: 'up' }, tone: 'blue' },
    { icon: UserGroupIcon, label: 'Nearby Pilgrims', value: nearbyPilgrims.toLocaleString('en-IN'), helper: 'Across monitored zones', trend: { label: alerts?.length ? `${alerts.length} alerts` : 'Calm', direction: alerts?.length ? 'alert' : 'up' }, tone: 'violet' },
  ];

  const quickActions = [
    { label: 'Distribute Water', action: () => toast.success('Water distribution logged.') },
    { label: 'First Aid Kit', action: () => toast.success('First aid kit request sent.') },
    { label: 'Call Supervisor', action: () => toast.success('Connecting to supervisor...') },
    { label: 'Mark Safe Zone', action: () => toast.success('Zone marked as safe.') },
  ];

  const recentActivity = useMemo(() => {
    const items = [];
    (tasks || []).slice(0, 3).forEach((t) => {
      items.push({
        time: t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        text: t.title || 'Task update',
      });
    });
    (incidents || []).slice(0, 2).forEach((i) => {
      items.push({
        time: i.created_at ? new Date(i.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        text: i.title || 'Incident update',
      });
    });
    return items.length ? items : [
      { time: 'No recent activity', text: 'No tasks or incidents yet today.' },
    ];
  }, [tasks, incidents]);

  const handleEdit = (resource) => {
    setEditingResourceId(resource.id);
    setEditForm({ available: resource.available.toString(), queue: resource.queue.toString() });
  };

  const handleSave = () => {
    if (editingResourceId !== null) {
      updateResource(editingResourceId, {
        available: parseInt(editForm.available, 10),
        queue: parseInt(editForm.queue, 10),
      });
      setEditingResourceId(null);
    }
  };

  const handleCancel = () => {
    setEditingResourceId(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Volunteer Command Center"
        title="Volunteer Dashboard"
        description="Monitor your zone, manage requests, and assist pilgrims in real time."
        actions={[
          <Button key="report" variant="outline" icon={ClipboardDocumentListIcon}>View Requests</Button>,
          <Button key="checkin" variant="primary" icon={MapPinIcon}>Check In</Button>,
        ]}
      />
      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((m, i) => <MetricCard key={m.label} {...m} index={i} />)}
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface p-5">
          <p className="label">Quick Actions</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <button key={a.label} onClick={a.action} className="rounded-2xl border border-slate-100 bg-[#F9FAFB] p-4 text-left text-sm font-bold text-ink transition hover:border-saffron hover:bg-saffron-50 hover:text-saffron">
                {a.label}
              </button>
            ))}
          </div>
        </motion.div>
        
        {/* Resource Update Section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface p-5">
          <p className="label">Update Resource Availability</p>
          <div className="mt-4 space-y-4">
            {resources.filter(r => ['water', 'food', 'medical', 'toilet'].includes(r.icon)).map((resource) => (
              <div key={resource.id} className="border border-slate-100 rounded-2xl p-3 bg-slate-50">
                {editingResourceId === resource.id ? (
                  <>
                    <p className="text-sm font-bold text-ink mb-2">{resource.name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Availability %"
                        type="number"
                        min="0"
                        max="100"
                        value={editForm.available}
                        onChange={(e) => setEditForm(prev => ({ ...prev, available: e.target.value }))}
                      />
                      <Input
                        label="Queue Length"
                        type="number"
                        min="0"
                        value={editForm.queue}
                        onChange={(e) => setEditForm(prev => ({ ...prev, queue: e.target.value }))}
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button onClick={handleSave} className="flex-1 py-2 text-sm">Save</Button>
                      <Button variant="outline" onClick={handleCancel} className="flex-1 py-2 text-sm">Cancel</Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-ink">{resource.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {resource.available}% available · Queue: {resource.queue}
                      </p>
                    </div>
                    <Button variant="outline" className="py-1.5 text-xs" onClick={() => handleEdit(resource)}>Update</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface p-5">
          <p className="label">Recent Activity</p>
          <div className="mt-4 space-y-3">
            {recentActivity.map((a) => (
              <div key={a.time} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-ink">{a.text}</p>
                  <p className="text-xs text-slate-400">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </>
  );
}
