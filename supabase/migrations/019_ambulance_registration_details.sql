-- ============================================================
-- 019_AMBULANCE_REGISTRATION_DETAILS.SQL
-- Adds driver-registration detail fields to `ambulances`.
-- ADDITIVE ONLY. Does not drop existing tables or columns.
--
-- Privacy note:
--  - driver_license / driver_photo_url are PRIVATE (owner/admin only).
--    They are deliberately NOT added to the `public_ambulances` view.
--  - ambulance_type is treated as public metadata (BLS/ALS/Van/Oxygen) so the
--    pilgrim/volunteer status screen can show what kind of vehicle is coming.
--    It IS added to the public view.
-- ============================================================

ALTER TABLE public.ambulances
  ADD COLUMN IF NOT EXISTS driver_license   TEXT,          -- private
  ADD COLUMN IF NOT EXISTS driver_photo_url TEXT,          -- private
  ADD COLUMN IF NOT EXISTS ambulance_type   TEXT;          -- public: 'BLS'|'ALS'|'Van'|'Other'

-- Expose ambulance_type on the public projection (recreate view additively).
DROP VIEW IF EXISTS public.public_ambulances;
CREATE VIEW public.public_ambulances AS
  SELECT
    id,
    ambulance_id,
    color,
    status,
    ambulance_type,
    current_location,
    route_trail,
    destination_hospital,
    route_geometry,
    etas,
    emergency_started_at,
    updated_at
  FROM public.ambulances
  WHERE approval_status = 'approved';
