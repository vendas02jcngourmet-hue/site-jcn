-- imitação local de pg_net, Vault e pg_cron (no Supabase eles já existem)
create schema if not exists net; create schema if not exists vault; create schema if not exists cron;
create table if not exists net.pedidos (id bigint generated always as identity primary key, metodo text, url text, corpo jsonb, em timestamptz default now());
create table if not exists net._http_response (id bigint primary key, status_code int, content_type text, headers jsonb, content text, timed_out boolean, error_msg text, created timestamptz default now());
create or replace function net.http_post(url text, body jsonb default '{}', params jsonb default '{}', headers jsonb default '{}', timeout_milliseconds int default 5000) returns bigint
language sql as $$ insert into net.pedidos (metodo, url, corpo) values ('POST', url, body) returning id $$;
create or replace function net.http_get(url text, params jsonb default '{}', headers jsonb default '{}', timeout_milliseconds int default 5000) returns bigint
language sql as $$ insert into net.pedidos (metodo, url) values ('GET', url) returning id $$;
create table if not exists vault.secrets (id uuid primary key default gen_random_uuid(), name text unique, secret text, description text, created_at timestamptz default now());
create or replace view vault.decrypted_secrets as select id, name, secret as decrypted_secret, created_at from vault.secrets;
create or replace function vault.create_secret(new_secret text, new_name text default null, new_description text default '') returns uuid
language sql as $$ insert into vault.secrets (name, secret, description) values (new_name, new_secret, new_description) returning id $$;
create or replace function vault.update_secret(secret_id uuid, new_secret text default null, new_name text default null, new_description text default null) returns void
language sql as $$ update vault.secrets set secret = coalesce(new_secret, secret) where id = secret_id $$;
create table if not exists cron.job (jobid bigint generated always as identity primary key, jobname text unique, schedule text, command text);
create or replace function cron.schedule(job_name text, schedule text, command text) returns bigint
language sql as $$ insert into cron.job (jobname, schedule, command) values (job_name, schedule, command) on conflict (jobname) do update set schedule = excluded.schedule, command = excluded.command returning jobid $$;
