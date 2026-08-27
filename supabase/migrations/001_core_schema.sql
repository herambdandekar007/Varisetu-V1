-- ============================================================
-- 001_CORE_SCHEMA.SQL — Vari-Setu Hackathon Core Schema
-- ADDITIVE ONLY. Do not drop existing tables or profiles data.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Fix existing profiles role column: add CHECK constraint
--    Map legacy default 'warkari' → 'PILGRIM', accept CONTROLLER/VOLUNTEER
--    Also accept legacy: police, medical, municipality (for route compat)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    -- Backfill legacy 'warkari' rows first so CHECK passes
    UPDATE public.profiles SET role = 'PILGRIM' WHERE role IS NULL OR role = 'warkari';

    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN (
        'PILGRIM','CONTROLLER','VOLUNTEER',
        'police','medical','municipality','warkari'
      ));
  END IF;
END $$;

-- Also make phone default empty string if null (harmless)
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'PILGRIM';

-- ------------------------------------------------------------
-- 2. Generic updated_at trigger function (one for all tables)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$;

-- ------------------------------------------------------------
-- 3. INCIDENTS table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incidents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL DEFAULT 'OTHER'
                CHECK (type IN ('SOS','MEDICAL','CROWD_SURGE','MISSING_PERSON','ROAD_BLOCK','OTHER','CAMP_SHORTAGE')),
  title         TEXT NOT NULL,
  description   TEXT,
  latitude      NUMERIC,
  longitude     NUMERIC,
  severity      TEXT NOT NULL DEFAULT 'MEDIUM'
                CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status        TEXT NOT NULL DEFAULT 'OPEN'
                CHECK (status IN ('OPEN','ACKNOWLEDGED','IN_PROGRESS','RESPONDING','RESOLVED','CLOSED')),
  reported_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  zone_id       UUID, -- will reference crowd_zones once created (added below)
  source        TEXT DEFAULT 'MANUAL',
  priority      TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  zone_name     TEXT,
  pilgrim_name  TEXT,
  contacts      JSONB DEFAULT '{}'::jsonb,
  distance_km   NUMERIC,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. CROWD_ZONES table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crowd_zones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  center_latitude NUMERIC,
  center_longitude NUMERIC,
  people_count    INTEGER NOT NULL DEFAULT 0,
  capacity        INTEGER,
  density         TEXT NOT NULL DEFAULT 'LOW'
                  CHECK (density IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  risk_score      NUMERIC(5,2) NOT NULL DEFAULT 0
                  CHECK (risk_score >= 0 AND risk_score <= 100),
  growth_rate     NUMERIC(5,2) NOT NULL DEFAULT 0,
  bounds          JSONB,
  forecast_30m    INTEGER,
  forecast_60m    INTEGER,
  reasons_high_risk TEXT[] DEFAULT '{}',
  is_demo         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Now add FK: incidents.zone_id → crowd_zones.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'incidents_zone_id_fkey'
  ) THEN
    ALTER TABLE public.incidents
      ADD CONSTRAINT incidents_zone_id_fkey
      FOREIGN KEY (zone_id) REFERENCES public.crowd_zones(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 5. TASKS table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id   UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  assigned_to   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  instructions  TEXT,
  priority      TEXT NOT NULL DEFAULT 'MEDIUM'
                CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status        TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING','ACCEPTED','IN_PROGRESS','COMPLETED')),
  latitude      NUMERIC,
  longitude     NUMERIC,
  zone_id       UUID REFERENCES public.crowd_zones(id) ON DELETE SET NULL,
  zone_name     TEXT,
  distance_km   NUMERIC,
  eta_minutes   INTEGER,
  category      TEXT,
  incident_title TEXT,
  accepted_at   TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  assigned_to_name TEXT,
  is_demo       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. ALERTS table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  severity      TEXT NOT NULL DEFAULT 'MEDIUM'
                CHECK (severity IN ('INFO','LOW','WARNING','MEDIUM','HIGH','CRITICAL')),
  zone_id       UUID REFERENCES public.crowd_zones(id) ON DELETE SET NULL,
  zone_name     TEXT,
  category      TEXT,
  source        TEXT,
  recommended_action TEXT,
  broadcast_by  TEXT,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  acknowledged  BOOLEAN NOT NULL DEFAULT FALSE,
  demo_only     BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo       BOOLEAN NOT NULL DEFAULT FALSE
);

-- ------------------------------------------------------------
-- 7. ROUTES table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.routes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  type                TEXT DEFAULT 'PRIMARY',
  from_text           TEXT,
  to_text             TEXT,
  source_latitude     NUMERIC,
  source_longitude    NUMERIC,
  destination_latitude NUMERIC,
  destination_longitude NUMERIC,
  distance_km         NUMERIC,
  estimated_minutes   INTEGER,
  crowd_score         NUMERIC(5,2) DEFAULT 0 CHECK (crowd_score >= 0 AND crowd_score <= 100),
  risk_score          NUMERIC(5,2) DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk                TEXT DEFAULT 'LOW' CHECK (risk IN ('LOW','MEDIUM','HIGH','SEVERE','CRITICAL')),
  status              TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN','SLOW','BLOCKED','CLOSED')),
  crowd_level         TEXT DEFAULT 'LOW' CHECK (crowd_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  route_geometry      JSONB,
  is_recommended      BOOLEAN NOT NULL DEFAULT FALSE,
  recommended_by_ai   BOOLEAN NOT NULL DEFAULT FALSE,
  highlights          TEXT[] DEFAULT '{}',
  description         TEXT,
  is_demo             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 8. RESOURCES table (replaces camps for hackathon use)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  type          TEXT NOT NULL
                CHECK (type IN ('MEDICAL','WATER','FOOD','TOILET','CAMP','AMBULANCE','REST','MEDICINE','DOCTOR','BARRICADE')),
  category      TEXT,
  latitude      NUMERIC,
  longitude     NUMERIC,
  zone_id       UUID REFERENCES public.crowd_zones(id) ON DELETE SET NULL,
  zone_name     TEXT,
  capacity      INTEGER,
  available     INTEGER,
  stock_liters  INTEGER,
  stock_pct     INTEGER,
  doctors       INTEGER,
  beds_total    INTEGER,
  beds_available INTEGER,
  waiting_count INTEGER,
  queue         INTEGER,
  meals_remaining INTEGER,
  ambulance_available BOOLEAN,
  status        TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED','SERVING','LOW_STOCK','MAINTENANCE')),
  last_updated  TIMESTAMPTZ,
  is_demo       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 9. LOCATIONS (optional — lightweight pilgrim tracking)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude      NUMERIC NOT NULL,
  longitude     NUMERIC NOT NULL,
  accuracy      NUMERIC,
  zone_id       UUID REFERENCES public.crowd_zones(id) ON DELETE SET NULL,
  zone_name     TEXT,
  heading_deg   NUMERIC,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES — targeted, not excessive
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- incidents
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_zone_id ON public.incidents(zone_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON public.incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at DESC);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON public.tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_incident_id ON public.tasks(incident_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- crowd_zones
CREATE INDEX IF NOT EXISTS idx_crowd_zones_updated_at ON public.crowd_zones(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_crowd_zones_risk ON public.crowd_zones(risk_score DESC);

-- alerts
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_zone_id ON public.alerts(zone_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_by ON public.alerts(created_by);

-- routes
CREATE INDEX IF NOT EXISTS idx_routes_recommended ON public.routes(is_recommended) WHERE is_recommended = TRUE;

-- resources
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_zone_id ON public.resources(zone_id);

-- locations
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON public.locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON public.locations(timestamp DESC);

-- ============================================================
-- UPDATED_AT triggers
-- ============================================================
DROP TRIGGER IF EXISTS set_public_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_public_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_public_incidents_updated_at ON public.incidents;
CREATE TRIGGER set_public_incidents_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_public_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_public_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_public_crowd_zones_updated_at ON public.crowd_zones;
CREATE TRIGGER set_public_crowd_zones_updated_at
BEFORE UPDATE ON public.crowd_zones
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_public_resources_updated_at ON public.resources;
CREATE TRIGGER set_public_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ============================================================
-- Also update handle_new_user() so phone and role are set
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'PILGRIM')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
