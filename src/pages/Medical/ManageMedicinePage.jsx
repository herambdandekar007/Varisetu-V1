import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { BeakerIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const MEDICINE_CATEGORIES = ['MEDICINE', 'GENERAL'];

export default function ManageMedicinePage() {
  const { t } = useTranslation();
  const { camps, campInventory, campService } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    quantity: '',
    unit: 'units',
    category: 'MEDICINE',
    campId: '',
  });

  // Get all medical camps for the dropdown
  const medicalCamps = useMemo(() => camps.filter((c) => c.type === 'MEDICAL' || c.type === 'CAMP'), [camps]);

  // Get all medicine inventory items
  const medicineItems = useMemo(() =>
    (campInventory || []).filter((item) => item.category === 'MEDICINE'),
    [campInventory]
  );

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      purpose: '',
      quantity: '',
      unit: 'units',
      category: 'MEDICINE',
      campId: medicalCamps[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.item_name,
      purpose: item.purpose || '',
      quantity: item.quantity || '',
      unit: item.unit || 'units',
      category: item.category || 'MEDICINE',
      campId: item.resource_id || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      name: '',
      purpose: '',
      quantity: '',
      unit: 'units',
      category: 'MEDICINE',
      campId: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Medicine name is required');
      return;
    }

    if (!formData.campId) {
      toast.error('Please select a medical camp');
      return;
    }

    const camp = medicalCamps.find((c) => c.id === formData.campId);
    const quantity = parseFloat(formData.quantity) || 0;

    // Determine status based on quantity
    let status = 'OK';
    if (quantity === 0) status = 'OUT';
    else if (quantity < 50) status = 'LOW';

    const payload = {
      item_name: formData.name.trim(),
      purpose: formData.purpose.trim(),
      category: formData.category,
      quantity: quantity,
      unit: formData.unit.trim() || 'units',
      status: status,
      resource_id: formData.campId,
      zone_id: camp?.zone_id || null,
      zone_name: camp?.zone_name || '',
      is_demo: false,
    };

    try {
      if (editingItem) {
        // Update existing
        const result = await campService.updateInventoryItem(editingItem.id, payload);
        if (result) {
          toast.success('Medicine updated successfully');
          closeModal();
        } else {
          toast.error('Failed to update medicine');
        }
      } else {
        // Create new
        const result = await campService.createInventoryItem(payload);
        if (result) {
          toast.success('Medicine added successfully');
          closeModal();
        } else {
          toast.error('Failed to add medicine');
        }
      }
    } catch (error) {
      console.error('Error saving medicine:', error);
      toast.error('An error occurred while saving');
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete "${item.item_name}"?`)) return;

    try {
      const success = await campService.deleteInventoryItem(item.id);
      if (success) {
        toast.success('Medicine deleted successfully');
      } else {
        toast.error('Failed to delete medicine');
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      toast.error('An error occurred while deleting');
    }
  };

  const statusTone = (status) => {
    if (status === 'OUT') return 'red';
    if (status === 'LOW') return 'orange';
    return 'green';
  };

  return (
    <>
      <PageHeader
        eyebrow={t('Medical Command', 'Medical Command')}
        title={t('Manage Medicine Stock', 'Manage Medicine Stock')}
        description={t('Add, edit, and manage medicine inventory across all camps.', 'Add, edit, and manage medicine inventory across all camps.')}
        actions={[
          <Button key="add" variant="primary" icon={PlusIcon} onClick={openAddModal}>
            {t('Add Medicine', 'Add Medicine')}
          </Button>,
        ]}
      />

      {medicineItems.length === 0 ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <BeakerIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">{t('No medicines found', 'No medicines found')}</p>
          <p className="mt-1 text-sm text-slate-400">{t('Add your first medicine to get started.', 'Add your first medicine to get started.')}</p>
          <Button className="mt-4" variant="primary" icon={PlusIcon} onClick={openAddModal}>
            {t('Add Medicine', 'Add Medicine')}
          </Button>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Medicine Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Camp Location</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicineItems.map((item) => {
                  const camp = camps.find((c) => c.id === item.resource_id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-ink">{item.item_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">{item.purpose || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">{camp?.name || item.zone_name || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-ink">
                          {Number(item.quantity || 0).toLocaleString()} {item.unit}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete"
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
                  <BeakerIcon className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">
                    {editingItem ? 'Edit Medicine' : 'Add New Medicine'}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {editingItem ? 'Update medicine details' : 'Enter medicine information'}
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
                <label className="label mb-1">Medicine Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                  placeholder="e.g., Paracetamol, ORS Packets"
                  required
                />
              </div>

              <div>
                <label className="label mb-1">Purpose / Usage</label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                  placeholder="e.g., For fever and pain relief"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="label mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                    placeholder="units, packets, bottles"
                  />
                </div>
              </div>

              <div>
                <label className="label mb-1">Medical Camp *</label>
                <select
                  value={formData.campId}
                  onChange={(e) => setFormData({ ...formData, campId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                  required
                >
                  <option value="">Select a camp</option>
                  {medicalCamps.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.name} {camp.zone_name ? `— ${camp.zone_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
                >
                  {editingItem ? 'Update Medicine' : 'Add Medicine'}
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
