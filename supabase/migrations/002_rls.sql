-- ============================================================
-- 002_RLS.SQL — Row Level Security policies
-- Enable RLS + practical policies.
-- Role mapping for DB checks:
--   profiles.role IN ('PILGRIM', 'police') → PILGRIM route access OK
--   profiles.role = 'CONTROLLER' OR profiles.role = 'police' → CONTROLLER
--   profiles.role = 'VOLUNTEER' → VOLUNTEER
-- ============================================================

-- ---------- Helper: current_user_role() ----------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'UNKNOWN'
  );
$$;

-- ---------- Enable RLS on all operational tables ----------
ALTER TABLE public.incidents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowd_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- INCIDENTS
-- ============================================================
-- All authenticated users can see incidents (Controller, Volunteer, Pilgrim read)
DROP POLICY IF EXISTS "Incidents readable by authenticated" ON public.incidents;
CREATE POLICY "Incidents readable by authenticated"
  ON public.incidents FOR SELECT
  USING (auth.role() = 'authenticated');

-- Pilgrim can create SOS / own-reported incidents
DROP POLICY IF EXISTS "Pilgrims can create own reported incidents" ON public.incidents;
CREATE POLICY "Pilgrims can create own reported incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (reported_by = auth.uid() OR reported_by IS NULL)
  );

-- Controller + Volunteer can UPDATE incidents
DROP POLICY IF EXISTS "Controller/Volunteer can update incidents" ON public.incidents;
CREATE POLICY "Controller/Volunteer can update incidents"
  ON public.incidents FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND (
      public.current_user_role() IN ('CONTROLLER','police')
      OR public.current_user_role() = 'VOLUNTEER'
      OR assigned_to = auth.uid()
    )
  );

-- ============================================================
-- TASKS
-- ============================================================
-- Read: Authenticated users + Volunteers see assigned or pending + controller see all
DROP POLICY IF EXISTS "Tasks readable by authenticated" ON public.tasks;
CREATE POLICY "Tasks readable by authenticated"
  ON public.tasks FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      -- Controllers see all
      public.current_user_role() IN ('CONTROLLER','police')
      -- Volunteers see assigned_to = self OR status = PENDING OR assigned_by = self
      OR (public.current_user_role() = 'VOLUNTEER' AND (assigned_to = auth.uid() OR status = 'PENDING'))
      -- Pilgrims see tasks linked to their own incidents (rare but safe)
      OR public.current_user_role() = 'PILGRIM'
    )
  );

-- Insert: Controller or assignee creation
DROP POLICY IF EXISTS "Controller can create tasks" ON public.tasks;
CREATE POLICY "Controller can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      public.current_user_role() IN ('CONTROLLER','police')
      OR assigned_by = auth.uid()
      OR assigned_by IS NULL
    )
  );

-- Update: Volunteer can update tasks assigned to them (lifecycle: accept/start/complete)
-- Controller can update any task
DROP POLICY IF EXISTS "Assigned volunteer or controller can update tasks" ON public.tasks;
CREATE POLICY "Assigned volunteer or controller can update tasks"
  ON public.tasks FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND (
      public.current_user_role() IN ('CONTROLLER','police')
      OR assigned_to = auth.uid()
      OR (status = 'PENDING' AND public.current_user_role() = 'VOLUNTEER')
    )
  );

-- ============================================================
-- CROWD_ZONES
-- ============================================================
-- Readable by everyone authenticated
DROP POLICY IF EXISTS "Crowd zones readable by authenticated" ON public.crowd_zones;
CREATE POLICY "Crowd zones readable by authenticated"
  ON public.crowd_zones FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only Controller can insert/update crowd zones
DROP POLICY IF EXISTS "Controller can insert crowd zones" ON public.crowd_zones;
CREATE POLICY "Controller can insert crowd zones"
  ON public.crowd_zones FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND public.current_user_role() IN ('CONTROLLER','police')
  );

DROP POLICY IF EXISTS "Controller can update crowd zones" ON public.crowd_zones;
CREATE POLICY "Controller can update crowd zones"
  ON public.crowd_zones FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND public.current_user_role() IN ('CONTROLLER','police')
  );

-- ============================================================
-- ALERTS
-- ============================================================
-- All authenticated users can READ alerts (public broadcast)
DROP POLICY IF EXISTS "Alerts readable by authenticated" ON public.alerts;
CREATE POLICY "Alerts readable by authenticated"
  ON public.alerts FOR SELECT
  USING (auth.role() = 'authenticated');

-- Controller can CREATE alerts (broadcast)
DROP POLICY IF EXISTS "Controller can create alerts" ON public.alerts;
CREATE POLICY "Controller can create alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      public.current_user_role() IN ('CONTROLLER','police')
      OR created_by = auth.uid()
      OR created_by IS NULL
    )
  );

-- Controller can UPDATE alerts (ack/expire)
DROP POLICY IF EXISTS "Controller can update alerts" ON public.alerts;
CREATE POLICY "Controller can update alerts"
  ON public.alerts FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND public.current_user_role() IN ('CONTROLLER','police')
  );

-- ============================================================
-- ROUTES
-- ============================================================
DROP POLICY IF EXISTS "Routes readable by authenticated" ON public.routes;
CREATE POLICY "Routes readable by authenticated"
  ON public.routes FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Controller can manage routes" ON public.routes;
CREATE POLICY "Controller can manage routes"
  ON public.routes FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND public.current_user_role() IN ('CONTROLLER','police')
  );

DROP POLICY IF EXISTS "Controller can update routes" ON public.routes;
CREATE POLICY "Controller can update routes"
  ON public.routes FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND public.current_user_role() IN ('CONTROLLER','police')
  );

-- ============================================================
-- RESOURCES
-- ============================================================
DROP POLICY IF EXISTS "Resources readable by authenticated" ON public.resources;
CREATE POLICY "Resources readable by authenticated"
  ON public.resources FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Controller can manage resources" ON public.resources;
CREATE POLICY "Controller can manage resources"
  ON public.resources FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND public.current_user_role() IN ('CONTROLLER','police','medical','municipality')
  );

DROP POLICY IF EXISTS "Controller can update resources" ON public.resources;
CREATE POLICY "Controller can update resources"
  ON public.resources FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND public.current_user_role() IN ('CONTROLLER','police','medical','municipality')
  );

-- ============================================================
-- LOCATIONS
-- ============================================================
-- Users can only see their own locations (privacy)
DROP POLICY IF EXISTS "Users read own locations" ON public.locations;
CREATE POLICY "Users read own locations"
  ON public.locations FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (user_id = auth.uid() OR public.current_user_role() IN ('CONTROLLER','police'))
  );

DROP POLICY IF EXISTS "Users insert own locations" ON public.locations;
CREATE POLICY "Users insert own locations"
  ON public.locations FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );
