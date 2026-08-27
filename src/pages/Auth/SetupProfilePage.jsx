import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Smartphone, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from './AuthLayout';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Toggle from '../../components/common/Toggle';

const districts = [
  'Pune', 'Ahmednagar', 'Solapur', 'Satara', 'Sangli',
  'Kolhapur', 'Nashik', 'Mumbai', 'Thane', 'Raigad',
];

const languages = [
  { value: 'mr', label: 'मराठी' },
  { value: 'hi', label: 'हिंदी' },
  { value: 'en', label: 'English' },
];

export default function SetupProfilePage() {
  const navigate = useNavigate();
  const { saveProfile } = useAuth();
  const [form, setForm] = useState({
    fullName: '', age: '', gender: '', emergencyContact: '',
    district: '', language: 'mr', accessibility: false,
    medicalConditions: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { fullName, age, gender, emergencyContact, district } = form;
    if (!fullName.trim() || !age || !gender || !emergencyContact.trim() || !district) {
      setError('Please fill all required fields'); return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    saveProfile({ ...form, fullName: fullName.trim(), emergencyContact: emergencyContact.trim() });
    setLoading(false);
    navigate('/select-role');
  };

  const progress = 60;

  return (
    <AuthLayout title="Complete your profile" subtitle="Help us personalize your Wari experience">
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Registration</span>
          <span>Profile</span>
          <span>Role</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-saffron transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          label="Full Name" placeholder="Heramb Dandekar"
          icon={User} required
          value={form.fullName} onChange={(e) => update('fullName', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Age" type="number" placeholder="25" required
            value={form.age} onChange={(e) => update('age', e.target.value)}
          />
          <Select
            label="Gender"
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
            value={form.gender} onChange={(v) => update('gender', v)}
            placeholder="Select"
          />
        </div>

        <Input
          label="Emergency Contact" placeholder="+91 98765 43210"
          icon={Smartphone} required
          value={form.emergencyContact} onChange={(e) => update('emergencyContact', e.target.value)}
        />

        <Select
          label="District"
          options={districts.map((d) => ({ value: d.toLowerCase(), label: d }))}
          value={form.district} onChange={(v) => update('district', v)}
          placeholder="Select your district"
        />

        <Select
          label="Preferred Language"
          options={languages}
          value={form.language} onChange={(v) => update('language', v)}
        />

        <Toggle
          label="Accessibility Mode"
          description="Larger touch targets, high contrast, screen reader support"
          checked={form.accessibility} onChange={(v) => update('accessibility', v)}
        />

        <Input
          label="Medical Conditions (optional)"
          placeholder="Diabetes, asthma, allergies, etc."
          value={form.medicalConditions} onChange={(e) => update('medicalConditions', e.target.value)}
        />

        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-saffron py-3.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(249,115,22,.35)] transition hover:bg-saffron/90 disabled:opacity-60"
        >
          {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
    </AuthLayout>
  );
}
