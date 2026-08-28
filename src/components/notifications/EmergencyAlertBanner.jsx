import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SpeakerWaveIcon, SpeakerXMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ambulanceService } from '../../services/ambulanceService';
import { useAuth } from '../../context/AuthContext';

/**
 * Emergency Alert Banner — shown to Pilgrim/Volunteer users targeted by an
 * active ambulance emergency.
 *
 * - "buzzer playing" vs "alert visible" are separate local states: STOP BUZZER
 *   silences sound/vibration but keeps the banner on screen until resolution.
 * - Uses Web Audio for the looping siren and navigator.vibrate() when available.
 * - NEVER changes the device system volume or silent mode.
 * - Real device push (FCM/APNs) is NOT wired into this repo yet; this in-app
 *   banner reacts to Supabase Realtime on the user's ambulance_alerts rows.
 */
export default function EmergencyAlertBanner() {
  const { user } = useAuth();
  const [alert, setAlert] = useState(null);
  const [resolved, setResolved] = useState(false);
  const [buzzerOn, setBuzzerOn] = useState(false);
  const audioCtxRef = useRef(null);
  const sirenTimerRef = useRef(null);
  const vibrationTimerRef = useRef(null);

  // Subscribe to the current user's realtime ambulance alerts.
  useEffect(() => {
    if (!user?.id) return;
    return ambulanceService.subscribeMyAlerts((a) => {
      // Only surface alerts that become active.
      if (a.status === 'active') {
        setResolved(false);
        setBuzzerOn(true);
        setAlert(a);
      } else if (a.status === 'resolved') {
        // Emergency resolved — show the "safely reached" state, stop buzzer.
        setResolved(true);
        setBuzzerOn(false);
      }
    }, user.id);
  }, [user?.id]);

  // Start/stop buzzing whenever buzzerOn toggles.
  useEffect(() => {
    if (buzzerOn) {
      startBuzzer();
    } else {
      stopBuzzer();
    }
    return () => stopBuzzer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buzzerOn]);

  const startBuzzer = () => {
    // Web Audio siren (looping).
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) throw new Error('no audio');
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const siren = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t0 = ctx.currentTime;
        osc.type = 'square';
        osc.frequency.setValueAtTime(700, t0);
        osc.frequency.linearRampToValueAtTime(1000, t0 + 0.25);
        osc.frequency.linearRampToValueAtTime(700, t0 + 0.5);
        gain.gain.setValueAtTime(0.1, t0);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.55);
      };
      siren();
      sirenTimerRef.current = setInterval(siren, 700);
    } catch (_e) { /* audio not supported — silent fallback */ }

    // Vibration pattern (where the platform allows it).
    try {
      if (navigator.vibrate) {
        navigator.vibrate([500, 300, 500]);
        vibrationTimerRef.current = setInterval(() => navigator.vibrate([500, 300, 500]), 2000);
      }
    } catch (_e) { /* vibration not supported */ }
  };

  const stopBuzzer = () => {
    if (sirenTimerRef.current) { clearInterval(sirenTimerRef.current); sirenTimerRef.current = null; }
    if (vibrationTimerRef.current) { clearInterval(vibrationTimerRef.current); vibrationTimerRef.current = null; }
    try { navigator.vibrate && navigator.vibrate(0); } catch (_e) {}
    try { audioCtxRef.current && audioCtxRef.current.close(); audioCtxRef.current = null; } catch (_e) {}
  };

  // When resolved, we stop the buzzer and show the "safely reached" toast-like banner briefly.
  useEffect(() => {
    if (!resolved) return;
    setBuzzerOn(false);
    const t = setTimeout(() => setAlert(null), 6000);
    return () => clearTimeout(t);
  }, [resolved]);

  if (!alert) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -80 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="fixed inset-x-0 top-0 z-[1000] px-3 pt-3"
      >
        {resolved ? (
          <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-600 px-5 py-4 text-white shadow-lg">
            <CheckCircleIcon className="h-7 w-7 shrink-0" />
            <div>
              <p className="text-sm font-bold">AMBULANCE SAFELY REACHED</p>
              <p className="mt-0.5 text-xs text-emerald-100">
                Thank you for giving the path and helping the ambulance.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-red-300 bg-red-600 text-white shadow-xl">
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-base font-extrabold">🚨🚑 AMBULANCE APPROACHING</p>
                <p className="mt-1 text-sm text-red-50">
                  An emergency ambulance is approaching this route.
                </p>
                <p className="mt-1 text-xs font-semibold text-amber-100">
                  ⚠️ PLEASE GIVE WAY — PLEASE CLEAR THE PATH FOR THE AMBULANCE
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => setBuzzerOn((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/25"
                >
                  {buzzerOn ? (
                    <>
                      <SpeakerXMarkIcon className="h-5 w-5" />
                      STOP BUZZER
                    </>
                  ) : (
                    <>
                      <SpeakerWaveIcon className="h-5 w-5" />
                      Buzzer OFF
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-red-500/40 bg-red-700/50 px-5 py-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-300" />
              <p className="text-[11px] font-bold uppercase tracking-wide">
                {buzzerOn ? '🔊 Emergency Buzzer Active' : 'Buzzer muted — alert still active'}
              </p>
              <span className="ml-auto text-[11px] text-red-200">{alert?.ambulance_public || ''}</span>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
