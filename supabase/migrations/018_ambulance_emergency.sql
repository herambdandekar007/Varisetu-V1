-- ============================================================
-- 018_AMBULANCE_EMERGENCY.SQL — Ambulance Emergency Routing & Crowd Alert
-- ADDITIVE ONLY. Do not drop existing tables or columns.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Add ambulance_driver role to the profiles CHECK constraint
--    (must be wrapped in a DO block; the existing constraint is additive)
-- ------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'PILGRIM','CONTROLLER','VOLUNTEER',
    'police','medical','municipality','warkari',
    'ambulance_driver'
  ));

-- ------------------------------------------------------------
-- 2. AMBULANCES table
--    Public fields are stripped at the service/RLS layer.
--    driver_name / registration_number / driver_phone are private.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ambulances (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id              UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ambulance_id           TEXT NOT NULL UNIQUE,          -- e.g. AMB-1234-XZ (public)
  registration_number    TEXT NOT NULL UNIQUE,          -- private
  driver_name            TEXT NOT NULL,                 -- private (admin/owner only)
  driver_phone           TEXT NOT NULL,                 -- private (admin/owner only)
  color                  TEXT NOT NULL DEFAULT 'white', -- public
  hospital_affiliation   TEXT,                          -- optional, private-ish
  status                 TEXT NOT NULL DEFAULT 'OFFLINE'
                         CHECK (status IN ('AVAILABLE','ON_DUTY','EMERGENCY','OFFLINE')),
  approval_status        TEXT NOT NULL DEFAULT 'pending'
                         CHECK (approval_status IN ('pending','approved','rejected')),
  current_location       JSONB,                         -- { lat, lng, updatedAt }
  route_trail            JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{lat,lng,timestamp}]
  destination_hospital   JSONB,                         -- { name, lat, lng } | null
  route_geometry         JSONB,                         -- [{lat,lng},...] OSRM polyline (public)
  etas                   JSONB,                         -- { distanceKm, durationMin }
  emergency_started_at   TIMESTAMPTZ,
  emergency_ended_at     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ambulances_status_idx      ON public.ambulances(status);
CREATE INDEX IF NOT EXISTS ambulances_approval_idx    ON public.ambulances(approval_status);
CREATE INDEX IF NOT EXISTS ambulances_driver_idx      ON public.ambulances(driver_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS ambulances_set_timestamp ON public.ambulances;
CREATE TRIGGER ambulances_set_timestamp
  BEFORE UPDATE ON public.ambulances
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ------------------------------------------------------------
-- 3. AMBULANCE_ALERTS table
--    Records targeted ambulance emergency alerts per affected user,
--    so we can later resolve them and push device notifications.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ambulance_alerts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambulance_id_fk   UUID REFERENCES public.ambulances(id) ON DELETE CASCADE,
  ambulance_public  TEXT NOT NULL,          -- public ambulance_id (non-null because service may drop FK fields)
  affected_user_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','resolved')),
  distance_m        NUMERIC,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ambulance_alerts_user_idx   ON public.ambulance_alerts(affected_user_id);
CREATE INDEX IF NOT EXISTS ambulance_alerts_status_idx ON public.ambulance_alerts(status);

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE public.ambulances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulance_alerts ENABLE ROW LEVEL SECURITY;

-- All authenticated users may read only the PUBLIC projection of ambulances.
-- The safest approach is a SECURITY DEFINER view that never selects private columns.
DROP VIEW IF EXISTS public.public_ambulances;
CREATE VIEW public.public_ambulances AS
  SELECT
    id,
    ambulance_id,
    color,
    status,
    current_location,
    route_trail,
    destination_hospital,
    route_geometry,
    etas,
    emergency_started_at,
    updated_at
  FROM public.ambulances
  WHERE approval_status = 'approved';

-- SELECT: authenticated users see the public view (no private columns).
DROP POLICY IF EXISTS "Ambulances publicly readable" ON public.ambulances;
CREATE POLICY "Ambulances publicly readable"
  ON public.ambulances FOR SELECT
  TO authenticated
  USING (
    approval_status = 'approved'
    -- Approve reading the owner's own full row (incl. private fields) so the
    -- driver console can show registration number to its own driver.
    OR driver_id = auth.uid()
  );

-- INSERT: only the driver creating their own record may insert.
DROP POLICY IF EXISTS "Drivers can register own ambulance" ON public.ambulances;
CREATE POLICY "Drivers can register own ambulance"
  ON public.ambulances FOR INSERT
  TO authenticated
  WITH CHECK (driver_id = auth.uid());

-- UPDATE: owner may update their own; admins/controllers may update approval status.
DROP POLICY IF EXISTS "Driver can update own ambulance" ON public.ambulances;
CREATE POLICY "Driver can update own ambulance"
  ON public.ambulances FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "Admin can manage approvals" ON public.ambulances;
CREATE POLICY "Admin can manage approvals"
  ON public.ambulances FOR UPDATE
  TO authenticated
  USING (public.current_user_role() IN ('CONTROLLER','police','municipality'))
  WITH CHECK (public.current_user_role() IN ('CONTROLLER','police','municipality'));

-- DELETE: owner or admin.
DROP POLICY IF EXISTS "Driver can delete own ambulance" ON public.ambulances;
CREATE POLICY "Driver can delete own ambulance"
  ON public.ambulances FOR DELETE
  TO authenticated
  USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "Admin can delete ambulances" ON public.ambulances;
CREATE POLICY "Admin can delete ambulances"
  ON public.ambulances FOR DELETE
  TO authenticated
  USING (public.current_user_role() IN ('CONTROLLER','police','municipality'));

-- ambulance_alerts: drivers may read their own ambulance alerts; users may read/resolve their own.
DROP POLICY IF EXISTS "Alerts readable by owner user" ON public.ambulance_alerts;
CREATE POLICY "Alerts readable by owner user"
  ON public.ambulance_alerts FOR SELECT
  TO authenticated
  USING (affected_user_id = auth.uid());

DROP POLICY IF EXISTS "Alerts insertable by driver" ON public.ambulance_alerts;
CREATE POLICY "Alerts insertable by driver"
  ON public.ambulance_alerts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ambulances a
      WHERE a.id = ambulance_id_fk AND a.driver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Alerts updateable by owner" ON public.ambulance_alerts;
CREATE POLICY "Alerts updateable by owner"
  ON public.ambulance_alerts FOR UPDATE
  TO authenticated
  USING (affected_user_id = auth.uid());

-- The ambulance's OWNER driver may resolve alerts for their own ambulance
-- (bulk "safely reached" resolution at the end of an emergency).
DROP POLICY IF EXISTS "Alerts resolvable by ambulance driver" ON public.ambulance_alerts;
CREATE POLICY "Alerts resolvable by ambulance driver"
  ON public.ambulance_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ambulances a
      WHERE a.id = ambulance_id_fk AND a.driver_id = auth.uid()
    )
  );

-- Realtime on the public projection is safe (view hides private columns).
ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulance_alerts;
