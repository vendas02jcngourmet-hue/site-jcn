-- o que o dono do site faz à mão no Supabase: cria o próprio usuário e se torna administrador
insert into auth.users (id, email, encrypted_password, email_confirmed_at) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@jcn.test', crypt('Admin#2026', gen_salt('bf', 4)), now());
insert into perfis (id, nome, email, papel, empresa) values ('00000000-0000-0000-0000-00000000000a', 'Administração JCN', 'admin@jcn.test', 'admin', 'JCN Gourmet');
