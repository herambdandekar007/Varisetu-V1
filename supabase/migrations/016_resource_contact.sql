-- Migration 016: Add contact column to resources for clickable camp cards.

-- 1. Add contact phone column to resources table
alter table public.resources add column if not exists contact text;

-- 2. Seed contact numbers for medical/ambulance resources
update public.resources set contact = '1800-112-233' where id = 'f0f0f0f0-0001-0000-0000-000000000001'; -- Medical Camp M-03
update public.resources set contact = '108' where id = 'f0f0f0f0-0006-0000-0000-000000000006'; -- Ambulance A-08
