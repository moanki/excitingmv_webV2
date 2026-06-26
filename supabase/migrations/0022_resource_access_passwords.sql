-- Add server-side password storage for partner resource access.
-- Passwords are stored only as salted hashes and validated by server code.

alter table public.agents
  add column if not exists resource_password_hash text,
  add column if not exists resource_password_expires_at timestamptz;

