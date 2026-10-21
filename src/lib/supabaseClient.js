import { createClient } from '@supabase/supabase-js';

// 1. Obtener variables con compatibilidad para los nombres estándar de Vercel y Supabase
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  '';

/**
 * Cliente público de Supabase para el navegador y frontend.
 * Usa la clave anónima pública con políticas Row Level Security (RLS).
 */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

/**
 * Retorna una instancia de Supabase con permisos de Service Role (Admin).
 * EXCLUSIVO para funciones Serverless en /api/. NUNCA exponer al navegador.
 */
export function getServiceSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Helper de diagnóstico para verificar el estado de configuración de Supabase
 */
export function getSupabaseConfigStatus() {
  return {
    isConfigured: Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceRoleKey)),
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
    hasServiceRoleKey: Boolean(supabaseServiceRoleKey),
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL),
    hasPostgresDirect: Boolean(process.env.POSTGRES_HOST && process.env.POSTGRES_PASSWORD),
    url: supabaseUrl ? supabaseUrl.replace(/https?:\/\//, '').split('.')[0] + '.supabase.co' : null,
  };
}
