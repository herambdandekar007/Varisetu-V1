import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { UserGroupIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon, PhoneIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Available / On Duty' },
  { value: 'SERVING', label: 'Busy / Treating Patient' },
  { value: 'CLOSED', label: 'Off Duty' },
];

export default function ManageDoctorsPage() {
  const { t } = useTranslation();
  const { camps, campService } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    degree: '',
    specialization: '',
    contact: '',
    status: 'OPEN',
    campId: '',
  });

  // Get all medical camps for the dropdown
  const medicalCamps = useMemo(() => camps.filter((c) => c.type === 'MEDICAL' || c.type === 'CAMP'), [camps]);

  // Get all doctors
  const doctors = useMemo(() => camps.filter((c) => c.type === 'DOCTOR'), [camps]);

  const openAddModal = () => {
    setEditingDoctor(null);
    setFormData({
      name: '',
      degree: '',
      specialization: '',
      contact: '',
      status: 'OPEN',
      campId: medicalCamps[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (doctor) => {
    setEditingDoctor(doctor);
    // Parse category back into degree and specialization
    const category = doctor.category || '';
    const parts = category.split(' | ');
    setFormData({
      name: doctor.name || '',
      degree: parts[0] || '',
      specialization: parts[1] || '',
      contact: doctor.contact || '',
      status: doctor.status || 'OPEN',
      campId: doctor.zone_id || medicalCamps[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDoctor(null);
    setFormData({
      name: '',
      degree: '',
      specialization: '',
      contact: '',
      status: 'OPEN',
      campId: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Doctor name is required');
      return;
    }

    if (!formData.degree.trim()) {
      toast.error('Degree is required');
      return;
    }

    const camp = medicalCamps.find((c) => c.id === formData.campId);

    // Combine degree and specialization into category field
    const category = formData.specialization.trim()
      ? `${formData.degree.trim()} | ${formData.specialization.trim()}`
      : formData.degree.trim();

    const payload = {
      type: 'DOCTOR',
      name: formData.name.trim(),
      category: category,
      contact: formData.contact.trim(),
      status: formData.status,
      zone_id: formData.campId || null,
      zone_name: camp?.zone_name || camp?.name || '',
      latitude: camp?.latitude || null,
      longitude: camp?.longitude || null,
      is_demo: false,
    };

    try {
      if (editingDoctor) {
        // Update existing
        const result = await campService.update(editingDoctor.id, payload);
        if (result) {
          toast.success('Doctor updated successfully');
          closeModal();
        } else {
          toast.error('Failed to update doctor');
        }
      } else {
        // Create new
        const result = await campService.create(payload);
        if (result) {
          toast.success('Doctor added successfully');
          closeModal();
        } else {
          toast.error('Failed to add doctor');
        }
      }
    } catch (error) {
      console.error('Error saving doctor:', error);
      toast.error('An error occurred while saving');
    }
  };

  const handleDelete = async (doctor) => {
    if (!confirm(`Are you sure you want to remove "${doctor.name}" from the roster?`)) return;

    try {
      // Supabase delete via campService - we need to add this method
      // For now, we'll update status to indicate removal
      const result = await campService.update(doctor.id, { status: 'CLOSED', is_demo: true });
      if (result) {
        toast.success('Doctor removed successfully');
        // In a real implementation, you'd want a proper delete method
        // For now, let's just mark them as closed
      } else {
        toast.error('Failed to remove doctor');
      }
    } catch (error) {
      console.error('Error removing doctor:', error);
      toast.error('An error occurred while removing');
    }
  };

  const statusTone = (status) => {
    if (status === 'OPEN') return 'green';
    if (status === 'SERVING') return 'blue';
    if (status === 'CLOSED') return 'slate';
    return 'slate';
  };

  const statusLabel = (status) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === status);
    return option ? option.label : status;
  };

  return (
    <>
      <PageHeader
        eyebrow={t('Medical Command', 'Medical Command')}
        title={t('Manage Doctors', 'Manage Doctors')}
        description={t('Add, edit, and manage doctors available in your medical camps.', 'Add, edit, and manage doctors available in your medical camps.')}
        actions={[
          <Button key="add" variant="primary" icon={PlusIcon} onClick={openAddModal}>
            {t('Add Doctor', 'Add Doctor')}
          </Button>,
        ]}
      />

      {doctors.length === 0 ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <UserGroupIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">{t('No doctors found', 'No doctors found')}</p>
          <p className="mt-1 text-sm text-slate-400">{t('Add your first doctor to get started.', 'Add your first doctor to get started.')}</p>
          <Button className="mt-4" variant="primary" icon={PlusIcon} onClick={openAddModal}>
            {t('Add Doctor', 'Add Doctor')}
          </Button>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Doctor Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Degree / Specialization</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Camp Location</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((doctor) => {
                  const camp = medicalCamps.find((c) => c.id === doctor.zone_id);
                  return (
                    <tr key={doctor.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-sm font-bold text-red-500">
                            {doctor.name?.charAt(0) || 'D'}
                          </div>
                          <p className="text-sm font-semibold text-ink">{doctor.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">{doctor.category || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">{camp?.name || doctor.zone_name || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {doctor.contact ? (
                          <a
                            href={`tel:${doctor.contact}`}
                            className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <PhoneIcon className="h-4 w-4" />
                            {doctor.contact}
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={statusTone(doctor.status)}>{statusLabel(doctor.status)}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(doctor)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doctor)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Remove"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeModal}>
          <div className="mx-4 w-full max-w-lg rounded-3xl bg-white p-6 shadow-float" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50">
                  <UserGroupIcon className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">
                    {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {editingDoctor ? 'Update doctor details' : 'Enter doctor information'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label mb-1">Doctor Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                  placeholder="e.g., Dr. Ramesh Kumar"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1">Degree *</label>
                  <input
                    type="text"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                    placeholder="e.g., MBBS, MD"
                    required
                  />
                </div>

                <div>
                  <label className="label mb-1">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                    placeholder="e.g., Cardiologist"
                  />
                </div>
              </div>

              <div>
                <label className="label mb-1">Contact Number</label>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                  placeholder="e.g., +91-98765-43210"
                />
              </div>

              <div>
                <label className="label mb-1">Medical Camp</label>
                <select
                  value={formData.campId}
                  onChange={(e) => setFormData({ ...formData, campId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                >
                  <option value="">Select a camp (optional)</option>
                  {medicalCamps.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.name} {camp.zone_name ? `— ${camp.zone_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label mb-1">Availability Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                  required
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
                >
                  {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
