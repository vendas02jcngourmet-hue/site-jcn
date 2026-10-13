-- Imitação local do que o Supabase traz pronto (papéis, auth, storage), para testar o site com as regras de verdade
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create extension if not exists pgcrypto;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text unique, encrypted_password text, email_confirmed_at timestamptz,
  created_at timestamptz default now(), updated_at timestamptz default now());
create table auth.sessions (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users on delete cascade, token text, refresh text, criado timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create schema storage;
create table storage.buckets (id text primary key, name text not null, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets, name text, owner uuid, owner_id text, metadata jsonb, created_at timestamptz default now(), unique (bucket_id, name));
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
grant all on storage.objects, storage.buckets to anon, authenticated, service_role;
