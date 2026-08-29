import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMap } from 'react-leaflet';
import { AdjustmentsHorizontalIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function MapControls({ onToggleLayers }) {
  const map = useMap();
  const { t } = useTranslation();

  return (
    <div className="absolute right-4 top-4 z-[500] flex flex-col gap-1.5">
      <button
        onClick={() => map.zoomIn()}
        className="grid h-9 w-9 place-items-center rounded-lg bg-white/90 shadow-md backdrop-blur text-slate-600 hover:text-ink hover:bg-white transition-all"
        aria-label={t('map.zoomIn')}
      >
        <MagnifyingGlassPlusIcon className="h-4 w-4" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="grid h-9 w-9 place-items-center rounded-lg bg-white/90 shadow-md backdrop-blur text-slate-600 hover:text-ink hover:bg-white transition-all"
        aria-label={t('map.zoomOut')}
      >
        <MagnifyingGlassMinusIcon className="h-4 w-4" />
      </button>
      <button
        onClick={() => map.locate({ setView: true, maxZoom: 15 })}
        className="grid h-9 w-9 place-items-center rounded-lg bg-white/90 shadow-md backdrop-blur text-slate-600 hover:text-ink hover:bg-white transition-all"
        aria-label={t('map.myLocation')}
      >
        <span className="text-sm">📍</span>
      </button>
      <button
        onClick={onToggleLayers}
        className="grid h-9 w-9 place-items-center rounded-lg bg-white/90 shadow-md backdrop-blur text-slate-600 hover:text-ink hover:bg-white transition-all"
        aria-label={t('map.toggleLayers')}
      >
        <AdjustmentsHorizontalIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
