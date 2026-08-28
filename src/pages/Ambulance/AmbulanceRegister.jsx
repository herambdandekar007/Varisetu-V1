import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Smartphone, Lock, Truck, Palette, Building2, IdCard, Ambulance, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { ambulanceService } from '../../services/ambulanceService';
import AuthLayout from '../Auth/AuthLayout';
import Input from '../../components/common/Input';

export default function AmbulanceRegister() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    registrationNumber: '',
    color: 'white',
    hospitalAffiliation: '',
    driverLicense: '',
    ambulanceType: 'BLS',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please choose an image file'); return; }
    setError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { name, email, phone, password, confirmPassword, registrationNumber } = form;
    if (!name.trim() || !email.trim() || !phone.trim() || !registrationNumber.trim() || !password || !confirmPassword) {
      setError('Please fill in all required fields'); return;
    }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);

    const result = await signup(email.trim(), password);
    if (result.error) {
      setLoading(false);
      setError(result.error);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('No session after signup');
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: name.trim(),
        phone: phone.trim(),
        role: 'ambulance_driver',
      }, { onConflict: 'id' });

      let driverPhotoUrl = null;
      if (photoFile) {
        driverPhotoUrl = await ambulanceService.uploadDriverPhoto(photoFile);
        if (!driverPhotoUrl) console.warn('[AmbulanceRegister] photo upload failed; continuing without it.');
      }

      await ambulanceService.register({
        driverName: name.trim(),
        driverPhone: phone.trim(),
        registrationNumber: registrationNumber.trim(),
        color: form.color,
        hospitalAffiliation: form.hospitalAffiliation.trim() || null,
        driverLicense: form.driverLicense.trim(),
        ambulanceType: form.ambulanceType,
        driverPhotoUrl,
      });
    } catch (err) {
      console.error('[AmbulanceRegister] register error:', err);
      setLoading(false);
      setError('Registration failed. Please try again.');
      return;
    }
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <AuthLayout title="Registration sent for approval" subtitle="Your ambulance account is being reviewed.">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-forest">
            <Truck className="h-7 w-7" />
          </div>
          <p className="mt-4 text-slate-500">
            We've received your ambulance registration. An admin will review and approve your
            account before it appears in the app.
          </p>
          <Link
            to="/login"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-saffron py-3.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(249,115,22,.35)] transition hover:bg-saffron/90"
          >
            Go to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Register Ambulance" subtitle="Create an ambulance driver account for the Wari">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          label="Driver Full Name" placeholder="Heramb Dandekar"
          icon={User} required
          value={form.name} onChange={(e) => update('name', e.target.value)}
        />
        <Input
          label="Email" type="email" placeholder="you@example.com"
          icon={User} required
          value={form.email} onChange={(e) => update('email', e.target.value)}
        />
        <Input
          label="Phone" type="tel" placeholder="+91 98765 43210"
          icon={Smartphone} required
          value={form.phone} onChange={(e) => update('phone', e.target.value)}
        />
        <Input
          label="Ambulance Registration Number" placeholder="MH-12-JW-3456"
          icon={Truck} required
          value={form.registrationNumber} onChange={(e) => update('registrationNumber', e.target.value)}
        />
        <Input
          label="Driver License Number" placeholder="MH12 2020 00012345"
          icon={IdCard} required
          value={form.driverLicense} onChange={(e) => update('driverLicense', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-ink">
              Ambulance Color
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
              <Palette className="h-4 w-4 text-slate-400" />
              <select
                value={form.color}
                onChange={(e) => update('color', e.target.value)}
                className="w-full bg-transparent text-sm text-ink focus:outline-none"
              >
                <option value="white">White</option>
                <option value="red">Red</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="yellow">Yellow</option>
                <option value="orange">Orange</option>
              </select>
            </div>
          </div>
          <Input
            label="Hospital / Org (optional)"
            placeholder="Sassoon Hospital"
            icon={Building2}
            value={form.hospitalAffiliation} onChange={(e) => update('hospitalAffiliation', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-ink">Ambulance Type<span className="ml-0.5 text-red-500">*</span></label>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
            <Ambulance className="h-4 w-4 text-slate-400" />
            <select
              value={form.ambulanceType}
              onChange={(e) => update('ambulanceType', e.target.value)}
              className="w-full bg-transparent text-sm text-ink focus:outline-none"
            >
              <option value="BLS">BLS — Basic Life Support</option>
              <option value="ALS">ALS — Advanced Life Support</option>
              <option value="Van">Ambulance Van</option>
              <option value="Oxygen">Oxygen Ambulance</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-ink">Driver Photo (optional)</label>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
            {photoPreview ? (
              <img src={photoPreview} alt="Driver preview" className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <Camera className="h-4 w-4 text-slate-400" />
            )}
            <label className="flex-1 cursor-pointer text-sm text-slate-500">
              {photoFile ? photoFile.name : 'Upload a photo of the driver'}
              <input type="file" accept="image/*" className="sr-only" onChange={handlePhoto} />
            </label>
          </div>
        </div>
        <Input
          label="Password" type="password" placeholder="Min 6 characters"
          icon={Lock} required
          value={form.password} onChange={(e) => update('password', e.target.value)}
        />
        <Input
          label="Confirm Password" type="password" placeholder="••••••••"
          icon={Lock} required
          value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)}
        />

        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-saffron py-3.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(249,115,22,.35)] transition hover:bg-saffron/90 disabled:opacity-60"
        >
          {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <>Submit for Approval</>}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-saffron hover:text-saffron/80">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
