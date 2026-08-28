import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Smartphone, ArrowRight, Truck, IdCard, Palette, Ambulance, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { ambulanceService } from '../../services/ambulanceService';
import AuthLayout from './AuthLayout';
import Input from '../../components/common/Input';
import { cn } from '../../utils/format';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signup, signInWithGoogle, user } = useAuth();
  const [role, setRole] = useState('PILGRIM'); // 'PILGRIM' | 'AMBULANCE'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [amb, setAmb] = useState({
    registrationNumber: '',
    driverLicense: '',
    color: 'white',
    ambulanceType: 'BLS',
    hospitalAffiliation: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateAmb = (key, value) => setAmb((prev) => ({ ...prev, [key]: value }));

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
    const { name, email, phone, password, confirmPassword } = form;
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields'); return;
    }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (role === 'AMBULANCE' && (!amb.registrationNumber.trim() || !amb.driverLicense.trim())) {
      setError('Please fill in the ambulance registration number and driver license'); return;
    }
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
      if (userId) {
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: name.trim(),
          phone: phone.trim(),
          role: role === 'AMBULANCE' ? 'ambulance_driver' : 'PILGRIM',
        }, { onConflict: 'id' });

        if (role === 'AMBULANCE') {
          let driverPhotoUrl = null;
          if (photoFile) {
            driverPhotoUrl = await ambulanceService.uploadDriverPhoto(photoFile);
            if (!driverPhotoUrl) console.warn('[RegisterPage] photo upload failed; continuing without it.');
          }
          await ambulanceService.register({
            driverName: name.trim(),
            driverPhone: phone.trim(),
            registrationNumber: amb.registrationNumber.trim(),
            color: amb.color,
            hospitalAffiliation: amb.hospitalAffiliation.trim() || null,
            driverLicense: amb.driverLicense.trim(),
            ambulanceType: amb.ambulanceType,
            driverPhotoUrl,
          });
        }
      }
    } catch (err) {
      console.error('[RegisterPage] post-signup error:', err);
      setLoading(false);
      setError('Registration failed. Please try again.');
      return;
    }
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent you a confirmation link.">
        <div className="text-center">
          <p className="text-slate-500 mb-4">
            Please check your inbox at {form.email}.
            {role === 'AMBULANCE' && <span> Your ambulance registration has been sent for admin approval.</span>}
          </p>
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-saffron py-3.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(249,115,22,.35)] transition hover:bg-saffron/90"
          >
            Go to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Join the Wari" subtitle="Create your account to get started">
      {/* Role toggle */}
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
        <button
          type="button"
          onClick={() => { setRole('PILGRIM'); setError(''); }}
          className={cn(
            'rounded-xl py-2.5 text-sm font-bold transition',
            role === 'PILGRIM' ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink',
          )}
        >
          👨‍🦯 Pilgrim
        </button>
        <button
          type="button"
          onClick={() => { setRole('AMBULANCE'); setError(''); }}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition',
            role === 'AMBULANCE' ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink',
          )}
        >
          <Truck className="h-4 w-4" /> Ambulance
        </button>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={signInWithGoogle}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">or</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          label="Full Name" placeholder="Heramb Dandekar"
          icon={User} required
          value={form.name} onChange={(e) => update('name', e.target.value)}
        />
        <Input
          label="Email" type="email" placeholder="you@example.com"
          icon={Mail} required
          value={form.email} onChange={(e) => update('email', e.target.value)}
        />
        <Input
          label="Phone" type="tel" placeholder="+91 98765 43210"
          icon={Smartphone} required
          value={form.phone} onChange={(e) => update('phone', e.target.value)}
        />
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

        {/* Ambulance driver fields */}
        {role === 'AMBULANCE' && (
          <div className="space-y-5 rounded-2xl border border-saffron-200 bg-orange-50/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-saffron-700">Ambulance Details (driver data)</p>
            <Input
              label="Ambulance Registration Number" placeholder="MH-12-JW-3456"
              icon={Truck} required
              value={amb.registrationNumber} onChange={(e) => updateAmb('registrationNumber', e.target.value)}
            />
            <Input
              label="Driver License Number" placeholder="MH12 2020 00012345"
              icon={IdCard} required
              value={amb.driverLicense} onChange={(e) => updateAmb('driverLicense', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-ink">Ambulance Color</label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                  <Palette className="h-4 w-4 text-slate-400" />
                  <select
                    value={amb.color}
                    onChange={(e) => updateAmb('color', e.target.value)}
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
                icon={Ambulance}
                value={amb.hospitalAffiliation} onChange={(e) => updateAmb('hospitalAffiliation', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-ink">Ambulance Type<span className="ml-0.5 text-red-500">*</span></label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                <Ambulance className="h-4 w-4 text-slate-400" />
                <select
                  value={amb.ambulanceType}
                  onChange={(e) => updateAmb('ambulanceType', e.target.value)}
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
            <p className="text-xs text-slate-400">
              Driver name and phone are reused from the account details above. Your ambulance must be approved by an admin before it goes live.
            </p>
          </div>
        )}

        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-saffron py-3.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(249,115,22,.35)] transition hover:bg-saffron/90 disabled:opacity-60"
        >
          {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-saffron hover:text-saffron/80">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
