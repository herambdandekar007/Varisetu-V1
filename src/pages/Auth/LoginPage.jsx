import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getHomeRoute } from '../../routes/roleRoutes';
import AuthLayout from './AuthLayout';
import Input from '../../components/common/Input';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signInWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    const result = await login(form.email.trim(), form.password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/select-role');
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Wari command center">
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
          label="Email" type="email" placeholder="you@example.com"
          icon={Mail} required
          value={form.email} onChange={(e) => update('email', e.target.value)}
        />
        <Input
          label="Password" type="password" placeholder="••••••••"
          icon={Lock} required
          value={form.password} onChange={(e) => update('password', e.target.value)}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-saffron accent-saffron" />
            <span className="text-slate-500">Remember me</span>
          </label>
          <button type="button" className="font-bold text-saffron transition hover:text-saffron/80">
            Forgot password?
          </button>
        </div>

        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-saffron py-3.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(249,115,22,.35)] transition hover:bg-saffron/90 disabled:opacity-60"
        >
          {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
        </button>

        <p className="text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-saffron hover:text-saffron/80">Register</Link>
        </p>
      </form>

      {/* Ambulance driver quick access */}
      <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/60 p-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600">
            <Truck className="h-4 w-4" />
          </div>
          <p className="text-sm font-bold text-red-700">Ambulance Driver</p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-red-600">
          Sign in with your ambulance account to open your driver console, set your mode
          (Available / On Duty / Emergency / Offline), track your route, and route to a hospital.
          Your ambulance ID is shown in the console — driver details stay private.
        </p>
        <Link
          to="/register"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-red-700"
        >
          Register an ambulance <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </AuthLayout>
  );
}
