-- Execute este SQL no Supabase para criar o usuário admin
-- 1. Supabase Dashboard > SQL Editor > New query
-- 2. Cole o conteúdo abaixo e clique em Run
-- 3. Login: admin@loja.com / senha: admin123
--
-- IMPORTANTE: Rode as migrations primeiro (npx prisma migrate deploy)
-- se a tabela "User" ainda não existir.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin@loja.com',
  'Admin',
  crypt('admin123', gen_salt('bf', 10)),
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password = crypt('admin123', gen_salt('bf', 10)),
  name = 'Admin',
  "updatedAt" = NOW();
