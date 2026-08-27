-- Phase 3: per-camp inventory line items keyed to the resources (camps) table.
create table if not exists public.camp_inventory (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  zone_id uuid,
  zone_name text,
  item_name text not null,
  category text not null default 'GENERAL' check (category in ('WATER','FOOD','MEDICINE','CAMP','TRANSPORT','GENERAL')),
  quantity numeric not null default 0,
  unit text not null default 'units',
  status text not null default 'OK' check (status in ('OK','LOW','OUT')),
  updated_by uuid references public.profiles(id) on delete set null,
  noted_at timestamptz not null default now(),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists camp_inventory_resource_idx on public.camp_inventory(resource_id);
create index if not exists camp_inventory_category_idx on public.camp_inventory(category);

alter table public.camp_inventory enable row level security;

create policy "Inventory readable by authenticated"
  on public.camp_inventory for select
  to authenticated
  using (auth.role() = 'authenticated');

-- INSERT: camp managers OR demo/test rows (dev harness inserts is_demo=true)
create policy "Managers can add inventory"
  on public.camp_inventory for insert
  to authenticated
  with check (
    current_user_role() = any (array['CONTROLLER','police','medical','municipality'])
    or (is_demo = true)
  );

-- UPDATE: camp managers OR demo/test rows
create policy "Managers can update inventory"
  on public.camp_inventory for update
  to authenticated
  using (
    current_user_role() = any (array['CONTROLLER','police','medical','municipality'])
    or (is_demo = true)
  );

-- DELETE: camp managers only
create policy "Managers can delete inventory"
  on public.camp_inventory for delete
  to authenticated
  using (current_user_role() = any (array['CONTROLLER','police','medical','municipality']));

alter publication supabase_realtime add table public.camp_inventory;

-- Seed demo inventory across the existing camps/resources (is_demo=true for dev harness parity).
insert into public.camp_inventory (resource_id, zone_id, zone_name, item_name, category, quantity, unit, status, is_demo)
values
  ('f0f0f0f0-0001-0000-0000-000000000001', '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market', 'ORS Packets', 'MEDICINE', 200, 'packets', 'OK', true),
  ('f0f0f0f0-0001-0000-0000-000000000001', '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market', 'IV Fluids', 'MEDICINE', 40, 'units', 'LOW', true),
  ('f0f0f0f0-0001-0000-0000-000000000001', '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market', 'First Aid Kits', 'MEDICINE', 80, 'units', 'OK', true),
  ('f0f0f0f0-0001-0000-0000-000000000001', '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market', 'Paracetamol', 'MEDICINE', 150, 'units', 'OK', true),
  ('f0f0f0f0-0002-0000-0000-000000000002', '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market', 'Potable Water', 'WATER', 18400, 'liters', 'OK', true),
  ('f0f0f0f0-0002-0000-0000-000000000002', '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market', 'Water Tankers', 'WATER', 8, 'units', 'OK', true),
  ('f0f0f0f0-0003-0000-0000-000000000003', '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market', 'Meal Packets', 'FOOD', 5120, 'packets', 'OK', true),
  ('f0f0f0f0-0003-0000-0000-000000000003', '00000000-0000-0000-0000-000000000024', 'Zone 24 — Loni Market', 'Glucose Biscuits', 'FOOD', 900, 'packs', 'LOW', true)
on conflict do nothing;
