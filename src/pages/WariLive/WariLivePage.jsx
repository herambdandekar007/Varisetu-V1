import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  CalendarIcon,
  MapIcon,
  PlayIcon,
  SignalIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import { WARI_LIVE_CONFIG } from '../../config/wariLiveConfig';

function YouTubeEmbed({ videoId, title }) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => setHasError(true), []);

  if (hasError) {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-2xl bg-slate-100 p-8 text-center">
        <VideoCameraIcon className="h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-500">Unable to load video</p>
        <p className="mt-1 text-xs text-slate-400">Please try again later or watch on YouTube directly.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-black" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onError={handleError}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

function LiveBadge() {
  return (
    <span className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
      Live
    </span>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 px-6 py-16 text-center backdrop-blur-sm"
    >
      <div className="grid h-16 w-16 place-items-center rounded-full bg-saffron-50">
        <SignalIcon className="h-8 w-8 text-saffron" />
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight text-ink">{WARI_LIVE_CONFIG.liveTitle}</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
        Live coverage will be available during the Wari.
      </p>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
        Meanwhile, explore the Wari route, schedule and locations.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/navigation">
          <Button icon={MapIcon}>View Live Route</Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="outline" icon={ArrowRightIcon}>Open Dashboard</Button>
        </Link>
      </div>
    </motion.div>
  );
}

function PalkhiCard({ palkhi }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="surface p-6 transition-shadow hover:shadow-card-hover"
    >
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-saffron-50 text-xl">
          <span role="img" aria-label="Palkhi">🛕</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight text-ink">{palkhi.name}</h3>
          <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <MapIcon className="h-3.5 w-3.5" />
            {palkhi.origin} → {palkhi.destination}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500">{palkhi.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function DateRow({ item }) {
  return (
    <div className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-slate-50">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-forest-50">
        <CalendarIcon className="h-4.5 w-4.5 text-forest" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{item.event}</p>
      </div>
      <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
    </div>
  );
}

function HighlightCard({ item }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="group relative overflow-hidden rounded-2xl bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <img
          src={`https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white/90 shadow-lg">
            <PlayIcon className="h-6 w-6 text-saffron" />
          </div>
        </div>
        <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          Recorded
        </span>
      </div>
      <div className="p-4">
        <p className="text-sm font-bold text-ink">{item.title}</p>
      </div>
    </motion.div>
  );
}

export default function WariLivePage() {
  const { liveVideoId, isLive, liveTitle, liveSubtitle, highlights, palkhis, importantDates, route } = WARI_LIVE_CONFIG;
  const hasVideo = !!liveVideoId;

  return (
    <div className="min-h-screen bg-[#FCFDFC] text-ink">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-saffron text-lg font-bold text-white shadow-[0_8px_20px_rgba(255,122,0,.3)]">व</div>
          <div>
            <p className="text-lg font-bold tracking-tight">VariSetu</p>
            <p className="-mt-0.5 text-[10px] font-bold uppercase tracking-[.13em] text-forest">Wari 2026</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
          <Link to="/" className="hover:text-saffron transition-colors">Home</Link>
          <Link to="/wari-live" className="text-saffron">Wari Live</Link>
          <a href="#palkhis" className="hover:text-saffron transition-colors">Palkhis</a>
          <a href="#schedule" className="hover:text-saffron transition-colors">Schedule</a>
        </nav>
        <Link to="/select-role">
          <Button className="px-4 py-2.5">Open Dashboard <ArrowRightIcon className="h-4 w-4" /></Button>
        </Link>
      </header>

      <main>
        {/* Hero + Video Section */}
        <section className="relative isolate px-5 pt-36 pb-16 sm:px-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_74%_34%,rgba(215,244,221,.9),transparent_26%),radial-gradient(circle_at_18%_2%,rgba(255,226,196,.8),transparent_34%)]" />

          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/70 px-3 py-1.5 text-xs font-bold text-saffron shadow-sm backdrop-blur">
                {isLive ? (
                  <>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    Streaming Now
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                    Wari Live
                  </>
                )}
              </div>
              <h1 className="mt-7 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {isLive ? 'Watch the Wari Live' : 'Wari Live Streaming'}
              </h1>
              <p className="mt-4 max-w-xl mx-auto text-lg leading-7 text-slate-500">
                {isLive ? liveSubtitle : 'Live coverage will be available during the Wari. Meanwhile, explore the Wari route, schedule and locations.'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-10"
            >
              {hasVideo ? (
                <div className="relative rounded-3xl bg-ink p-3 shadow-float sm:p-4">
                  {isLive && <LiveBadge />}
                  <YouTubeEmbed videoId={liveVideoId} title={liveTitle} />
                </div>
              ) : (
                <EmptyState />
              )}
            </motion.div>

            {/* Quick actions */}
            {hasVideo && isLive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 flex flex-wrap justify-center gap-3"
              >
                <Link to="/navigation">
                  <Button variant="outline" icon={MapIcon}>View Live Route</Button>
                </Link>
                <Link to="/crowd">
                  <Button variant="outline" icon={SignalIcon}>Crowd Status</Button>
                </Link>
              </motion.div>
            )}
          </div>
        </section>

        {/* Palkhi Information */}
        <section id="palkhis" className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow">The Sacred Processions</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Palkhi Information</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              The Ashadhi Wari is led by the grand Palkhis of Sant Dnyaneshwar and Sant Tukaram Maharaj,
              walking the sacred path to Pandharpur.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {palkhis.map((palkhi) => (
              <PalkhiCard key={palkhi.name} palkhi={palkhi} />
            ))}
          </div>
        </section>

        {/* Route Overview */}
        <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
          <div className="surface overflow-hidden bg-gradient-to-br from-white to-forest-50 p-7 sm:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr]">
              <div>
                <p className="eyebrow">The Sacred Route</p>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{route.totalKm} km to Pandharpur</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Over {route.totalDays} days, millions of Warkaris walk this historic path filled with
                  devotion, community and the spirit of surrender.
                </p>
                <Link to="/navigation" className="mt-6 inline-block">
                  <Button icon={MapIcon}>Explore the Route</Button>
                </Link>
              </div>
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[.14em] text-slate-400">Key Stops</p>
                <div className="flex flex-wrap gap-2">
                  {route.keyStops.map((stop) => (
                    <span key={stop} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-forest shadow-sm">
                      {stop}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Important Dates */}
        <section id="schedule" className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow">Mark Your Calendar</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Important Wari Dates</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Key milestones of the 2026 Ashadhi Wari.
            </p>
          </div>
          <div className="mt-10 surface divide-y divide-slate-100 overflow-hidden">
            {importantDates.map((item) => (
              <DateRow key={item.event} item={item} />
            ))}
          </div>
        </section>

        {/* Previous Wari Highlights */}
        {highlights.length > 0 && (
          <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
            <div className="max-w-2xl">
              <p className="eyebrow">Relive the Devotion</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Previous Wari Highlights</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Recorded moments from past Wari celebrations.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {highlights.map((item) => (
                <HighlightCard key={item.videoId} item={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-ink px-5 py-10 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-saffron font-bold">व</div>
              <p className="text-lg font-bold">VariSetu</p>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
              Guiding a safer, calmer Wari — one informed decision at a time.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 self-end text-sm font-semibold text-slate-400">
            <span>v0.1.0</span>
            <span className="text-slate-600">·</span>
            <span>Wari Hackathon 2026</span>
            <span className="text-slate-600">·</span>
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-slate-600">·</span>
            <a href="#" className="hover:text-white transition-colors">About</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
