import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ${name} não configurada`);
  }
  return value;
}

// Client com a service role: ignora RLS, por isso só pode existir no servidor
export const db = createClient<Database>(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);
