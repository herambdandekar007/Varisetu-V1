-- ============================================================
-- 003_REALTIME_AND_SEED.SQL — Enable realtime + insert demo data
-- ============================================================

-- ------------------------------------------------------------
-- REALTIME: add to supabase_realtime publication
-- ------------------------------------------------------------
-- If publication does not exist yet, create it (Supabase standard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime
  ADD TABLE public.incidents,
  ADD TABLE public.tasks,
  ADD TABLE public.crowd_zones,
  ADD TABLE public.alerts;

-- ------------------------------------------------------------
-- REPLICA IDENTITY FULL for tables so UPDATE/DELETE sends full row
-- ------------------------------------------------------------
ALTER TABLE public.incidents   REPLICA IDENTITY FULL;
ALTER TABLE public.tasks       REPLICA IDENTITY FULL;
ALTER TABLE public.crowd_zones REPLICA IDENTITY FULL;
ALTER TABLE public.alerts      REPLICA IDENTITY FULL;

-- ============================================================
-- SEED DEMO DATA — all marked is_demo = TRUE for safe cleanup
-- Do NOT touch existing real profiles.
-- ============================================================

-- ------------------------------------------------------------
-- CROWD ZONES (3 from user spec + extra from existing demo UI)
-- ------------------------------------------------------------
INSERT INTO public.crowd_zones
  (id, name, center_latitude, center_longitude, people_count, capacity, density, risk_score, growth_rate,
   bounds, forecast_30m, forecast_60m, reasons_high_risk, is_demo, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market', 18.493, 74.100,
    14820, 9000, 'CRITICAL', 78.00, 18.00,
    '[[18.485,74.092],[18.501,74.108]]'::jsonb,
    18100, 22400, ARRAY['Rapid crowd growth','High current density','Incident nearby','Narrow road bottleneck'],
    TRUE, NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000025', 'Zone 25 — Saswad Gate', 18.515, 74.118,
    11200, 9500, 'HIGH', 67.00, 12.00,
    '[[18.507,74.110],[18.523,74.126]]'::jsonb,
    13800, 15600, ARRAY['Entry bottleneck','Single-file checkpoint'],
    TRUE, NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000026', 'Zone 26 — Lonand Crossing', 18.395, 74.152,
    18480, 10000, 'CRITICAL', 88.00, 22.00,
    '[[18.387,74.144],[18.403,74.160]]'::jsonb,
    22400, 26800, ARRAY['Highway intersection','Market crowd overlap','No alternate sidewalk'],
    TRUE, NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000001', 'Zone 01 — Alandi Start', 18.678, 73.976,
    3200, 8000, 'LOW', 15.00, 4.00,
    '[[18.670,73.968],[18.686,73.984]]'::jsonb,
    3800, 4200, ARRAY[]::TEXT[],
    TRUE, NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000012', 'Zone 12 — Canal Junction', 18.505, 74.109,
    9460, 11000, 'MEDIUM', 52.00, 10.00,
    '[[18.497,74.101],[18.513,74.117]]'::jsonb,
    11200, 13800, ARRAY['Canal bridge bottleneck'],
    TRUE, NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000018', 'Zone 18 — Yawat Road', 18.462, 74.125,
    5210, 14000, 'LOW', 22.00, 5.00,
    '[[18.454,74.117],[18.470,74.133]]'::jsonb,
    6400, 7800, ARRAY[]::TEXT[],
    TRUE, NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000021', 'Zone 21 — Jejuri Camp', 18.428, 74.138,
    8040, 12000, 'MEDIUM', 45.00, 7.00,
    '[[18.420,74.130],[18.436,74.146]]'::jsonb,
    10200, 11800, ARRAY['Rest point congregation'],
    TRUE, NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- DEMO INCIDENTS (do not assign reported_by to real profiles)
-- ------------------------------------------------------------
INSERT INTO public.incidents
  (id, type, title, description, latitude, longitude, severity, status, source, priority,
   zone_id, zone_name, pilgrim_name, distance_km, created_at, updated_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111001', 'MEDICAL',
    'Heat exhaustion — elderly pilgrim',
    '72yo male with dizziness and dehydration at Gate 3',
    18.491, 74.102, 'HIGH', 'RESPONDING', 'OBSERVER', 'HIGH',
    '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market',
    NULL, 0.2, NOW() - INTERVAL '10 minutes', NOW()
  ),
  (
    '11111111-1111-1111-1111-111111111002', 'CROWD_SURGE',
    'Crowd surge building at market crossing',
    'Sudden density increase at Loni Market pedestrian crossing',
    18.493, 74.100, 'CRITICAL', 'ACKNOWLEDGED', 'AI', 'CRITICAL',
    '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market',
    NULL, 0.3, NOW() - INTERVAL '25 minutes', NOW()
  ),
  (
    '11111111-1111-1111-1111-111111111003', 'MISSING_PERSON',
    'Separated child — 8yo male',
    'Ganesh Kale separated from family at Yawat rest area',
    18.462, 74.125, 'HIGH', 'RESPONDING', 'PILGRIM_SOS', 'HIGH',
    '00000000-0000-0000-0000-000000000018', 'Zone 18 — Yawat Road',
    'Ganesh Kale', 2.1, NOW() - INTERVAL '40 minutes', NOW()
  ),
  (
    '11111111-1111-1111-1111-111111111004', 'ROAD_BLOCK',
    'Fallen tree partially blocking Lonand bypass',
    'Neem tree across 1 lane; traffic slowed but moving',
    18.395, 74.152, 'MEDIUM', 'ACKNOWLEDGED', 'POLICE', 'MEDIUM',
    '00000000-0000-0000-0000-000000000026', 'Zone 26 — Lonand Crossing',
    NULL, 5.4, NOW() - INTERVAL '55 minutes', NOW()
  ),
  (
    '11111111-1111-1111-1111-111111111005', 'CAMP_SHORTAGE',
    'Water stock low at Jejuri Camp',
    'Water reserve below 25%; next tanker ETA 45 min',
    18.428, 74.138, 'MEDIUM', 'OPEN', 'SYSTEM', 'MEDIUM',
    '00000000-0000-0000-0000-000000000021', 'Zone 21 — Jejuri Camp',
    NULL, 3.8, NOW() - INTERVAL '18 minutes', NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- DEMO TASKS (no assigned_to real profile IDs)
-- ------------------------------------------------------------
INSERT INTO public.tasks
  (id, incident_id, title, description, instructions, priority, status,
   latitude, longitude, zone_id, zone_name, distance_km, eta_minutes, category,
   incident_title, is_demo, created_at, updated_at)
VALUES
  (
    '22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111002',
    'Crowd Control at Loni Market Crossing',
    'Assist volunteers in directing pilgrims to the canal-side bypass to relieve the bottleneck.',
    '1. Report to Zone-24 checkpoint  2. Coordinate with PP-02 police post  3. Direct groups >10 to Canal Route',
    'CRITICAL', 'PENDING',
    18.493, 74.100, '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market',
    1.2, 8, 'CROWD', 'Crowd surge at market crossing',
    TRUE, NOW() - INTERVAL '8 minutes', NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222002', NULL,
    'Water Distribution — W-14 queue management',
    'Manage queue discipline and carry refilled containers at Water Point W-14.',
    '1. Reach W-14 booth  2. Assist elderly in queue  3. Report when tanks drop to 20%',
    'MEDIUM', 'PENDING',
    18.502, 74.091, '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market',
    0.6, 5, 'CAMP', NULL,
    TRUE, NOW() - INTERVAL '20 minutes', NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222003', '11111111-1111-1111-1111-111111111001',
    'Medical Camp M-03 — first-aid support',
    'Assist medics with first-aid triage and guide incoming cases.',
    '1. Report to Dr. Kulkarni at M-03  2. Log incoming patients  3. Guide ambulance arrivals',
    'HIGH', 'PENDING',
    18.491, 74.103, '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market',
    1.5, 10, 'MEDICAL', 'Heat exhaustion — elderly pilgrim',
    TRUE, NOW() - INTERVAL '30 minutes', NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- DEMO ALERTS
-- ------------------------------------------------------------
INSERT INTO public.alerts
  (id, title, message, severity, zone_id, zone_name, category, source,
   recommended_action, broadcast_by, created_at, expires_at, demo_only, is_demo)
VALUES
  (
    '33333333-3333-3333-3333-333333333001',
    'Safer route available — Canal-side diversion',
    'Use the canal-side passage to avoid Loni Market congestion. Adds 0.5 km but cuts travel time by ~12 min.',
    'HIGH', '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market',
    'ROUTE', 'AI', 'Take canal-side safer route', 'AI Forecast',
    NOW() - INTERVAL '5 minutes', NOW() + INTERVAL '1 hour', TRUE, TRUE
  ),
  (
    '33333333-3333-3333-3333-333333333002',
    'Hydration reminder',
    'Water point W-14 is 180 m ahead on your route. Temperature is climbing.',
    'LOW', NULL, NULL, 'RESOURCE', 'SYSTEM',
    'Drink water at W-14', 'System',
    NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '2 hours', TRUE, TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- DEMO ROUTES (3: main procession, canal-side safer, emergency)
-- ------------------------------------------------------------
INSERT INTO public.routes
  (id, name, type, from_text, to_text, source_latitude, source_longitude,
   destination_latitude, destination_longitude, distance_km, estimated_minutes,
   crowd_score, risk_score, risk, status, crowd_level, route_geometry,
   is_recommended, recommended_by_ai, highlights, description, is_demo, created_at)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Main procession route', 'PRIMARY',
    'Alandi Start', 'Pandharpur', 18.678, 73.976, 18.320, 74.200,
    7.9, 149, 68.00, 68.00, 'HIGH', 'SLOW', 'HIGH',
    '[[18.678,73.976],[18.640,73.991],[18.600,74.005],[18.565,74.020],[18.530,74.045],[18.515,74.065],[18.500,74.083],[18.493,74.100],[18.505,74.110],[18.515,74.118],[18.462,74.125],[18.428,74.138],[18.395,74.152],[18.358,74.170],[18.320,74.200]]'::jsonb,
    FALSE, FALSE,
    ARRAY['Shorter distance','Direct palkhi route','More shops along way'],
    'Shorter distance but congestion expected at Loni Market crossing.',
    TRUE, NOW()
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Canal-side safer route', 'CANAL',
    'Alandi Start', 'Pandharpur', 18.678, 73.976, 18.320, 74.200,
    8.4, 138, 28.00, 28.00, 'LOW', 'OPEN', 'LOW',
    '[[18.678,73.976],[18.640,73.991],[18.600,74.005],[18.565,74.020],[18.530,74.045],[18.520,74.060],[18.510,74.095],[18.505,74.109],[18.490,74.115],[18.470,74.122],[18.462,74.125],[18.428,74.138],[18.395,74.152],[18.358,74.170],[18.320,74.200]]'::jsonb,
    TRUE, TRUE,
    ARRAY['Avoids Loni Market bottleneck','Medical every 3 km','Water points every 1.5 km'],
    'Avoids the Loni Market crowd surge. Longer distance but faster overall with lower risk.',
    TRUE, NOW()
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Emergency corridor (closed to public)', 'EMERGENCY',
    'Loni Kalbhor', 'Saswad Medical', 18.491, 74.100, 18.515, 74.118,
    3.2, 8, 12.00, 12.00, 'LOW', 'OPEN', 'LOW',
    '[[18.491,74.100],[18.495,74.110],[18.500,74.120],[18.510,74.125],[18.515,74.118]]'::jsonb,
    FALSE, FALSE,
    ARRAY['For ambulances only','Direct to Saswad trauma center'],
    'Emergency corridor for ambulances and responder vehicles.',
    TRUE, NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- DEMO RESOURCES (camps)
-- ------------------------------------------------------------
INSERT INTO public.resources
  (id, name, type, category, latitude, longitude, zone_id, zone_name,
   capacity, available, stock_liters, stock_pct, doctors, beds_total, beds_available,
   waiting_count, queue, meals_remaining, ambulance_available, status, last_updated,
   is_demo, created_at, updated_at)
VALUES
  (
    'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrr1', 'Medical Camp M-03', 'MEDICAL', 'MEDICAL',
    18.491, 74.103, '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market',
    NULL, NULL, NULL, NULL, 2, 12, 5, 4, NULL, NULL, TRUE, 'OPEN', NOW(),
    TRUE, NOW(), NOW()
  ),
  (
    'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrr2', 'Water Point W-14', 'WATER', 'WATER',
    18.502, 74.091, '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market',
    NULL, NULL, 18400, 82, NULL, NULL, NULL, NULL, 18, NULL, NULL, 'OPEN', NOW(),
    TRUE, NOW(), NOW()
  ),
  (
    'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrr3', 'Food Distribution F-02', 'FOOD', 'FOOD',
    18.495, 74.097, '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 34, 5120, NULL, 'SERVING', NOW(),
    TRUE, NOW(), NOW()
  ),
  (
    'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrr4', 'Rest Shelter R-07', 'REST', 'REST',
    18.512, 74.115, '00000000-0000-0000-0000-000000000025', 'Zone 25 — Saswad Gate',
    1140, 46, NULL, NULL, NULL, 1140, 46, NULL, 12, NULL, NULL, 'OPEN', NOW(),
    TRUE, NOW(), NOW()
  ),
  (
    'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrr5', 'Camp R-07 Toilet Block', 'TOILET', 'TOILET',
    18.513, 74.116, '00000000-0000-0000-0000-000000000025', 'Zone 25 — Saswad Gate',
    24, 18, NULL, NULL, NULL, NULL, NULL, NULL, 6, NULL, NULL, 'OPEN', NOW(),
    TRUE, NOW(), NOW()
  ),
  (
    'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrr6', 'Ambulance A-08 (Standby)', 'AMBULANCE', 'AMBULANCE',
    18.492, 74.102, '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, 'OPEN', NOW(),
    TRUE, NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;
