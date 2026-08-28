-- Add purpose column to camp_inventory table for medicine descriptions
alter table public.camp_inventory
  add column if not exists purpose text;

comment on column public.camp_inventory.purpose is 'Purpose or usage description for the inventory item (e.g., "For fever and pain relief")';
