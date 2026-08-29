export const WARI_LIVE_CONFIG = {
  // YouTube video ID for the live stream (extract from URL: youtube.com/watch?v=VIDEO_ID)
  // Set to null or empty string when no live stream is active
  liveVideoId: null,

  // Set to true only when the stream is actively live
  isLive: false,

  // Title shown above the video player
  liveTitle: 'Wari Live Streaming',

  // Subtitle shown during live state
  liveSubtitle: 'Experience the Ashadhi Wari from anywhere in the world.',

  // Stream start time (ISO string) — used to show countdown or "starting soon"
  streamStartTime: null,

  // Previous Wari highlights (YouTube video IDs)
  highlights: [
    { videoId: 'ZRTamVFgTWk', title: 'Ashadhi Wari 2025 Highlights' },
  ],

  // Palkhi information
  palkhis: [
    {
      name: 'Sant Dnyaneshwar Maharaj Palkhi',
      origin: 'Alandi',
      destination: 'Pandharpur',
      startLabel: 'Alandi',
      description: 'The eldest and most revered Palkhi, carrying the Padukas of Sant Dnyaneshwar Maharaj. One of the most iconic processions of the Wari.',
    },
    {
      name: 'Sant Tukaram Maharaj Palkhi',
      origin: 'Dehu',
      destination: 'Pandharpur',
      startLabel: 'Dehu',
      description: 'The Palkhi of Sant Tukaram Maharaj, departing from Dehu. Known for its vibrant Warkari devotion and Abhang chanting.',
    },
  ],

  // Important Wari dates for 2026
  importantDates: [
    { event: 'Ala Uttham (Dnyaneshwar Palkhi departs)', date: '2026-06-24' },
    { event: 'Tukaram Palkhi departs from Dehu', date: '2026-06-25' },
    { event: 'Modhbhav (Mass gathering at Pandharpur)', date: '2026-07-06' },
    { event: 'Ashadi Ekadashi', date: '2026-07-07' },
    { event: 'Pandharpur Palkhi Arrival', date: '2026-07-07' },
  ],

  // Route overview
  route: {
    totalKm: 250,
    totalDays: 15,
    keyStops: ['Alandi', 'Dehu', 'Narayanpur', 'Kedgaon', 'Patas', 'Saswad', 'Jejuri', 'Pandharpur'],
  },
};
