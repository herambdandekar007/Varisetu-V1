import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const stats = [
  { label: '1.84L Pilgrims', sub: 'Active on route today' },
  { label: '36 Active Camps', sub: 'Water, medical & rest' },
  { label: 'AI Monitoring', sub: 'Real-time crowd analysis' },
  { label: 'Weather Stable', sub: 'Clear conditions ahead' },
];

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen bg-[#FCFDFC]">
      <div className="flex w-full items-center justify-center px-5 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-saffron text-lg font-bold text-white shadow-[0_8px_20px_rgba(255,122,0,.3)]">
              व
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-ink">VariSetu</p>
              <p className="-mt-0.5 text-[10px] font-bold uppercase tracking-[.13em] text-forest">Wari 2026</p>
            </div>
          </Link>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-2 text-base text-slate-500">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </motion.div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2">
        <div className="relative flex w-full items-center justify-center overflow-hidden bg-[#F1F7F1]">
          <div className="absolute inset-0">
            <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-saffron/5 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-forest/5 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-md px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-saffron/20 bg-white/80 px-3 py-1.5 text-xs font-bold text-saffron shadow-sm backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-saffron" />
              AI protecting every step
            </div>

            <h2 className="mt-8 text-3xl font-bold leading-tight text-ink">
              Your Wari journey,<br />
              <span className="text-saffron">intelligently guided.</span>
            </h2>

            <p className="mt-4 text-base leading-relaxed text-slate-500">
              Real-time crowd insights, resource tracking, and emergency coordination — all in one place.
            </p>

            <div className="mt-10 space-y-3">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-forest">
                    <ShieldCheckIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{stat.label}</p>
                    <p className="text-xs text-slate-400">{stat.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 flex justify-center gap-6">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -6 - i * 2, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3 + i * 0.5,
                    ease: 'easeInOut',
                  }}
                  className={`h-16 w-16 rounded-full border-4 border-white shadow-lg ${
                    i === 1 ? 'bg-saffron/20' : i === 2 ? 'bg-forest/20' : 'bg-amber-200/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
