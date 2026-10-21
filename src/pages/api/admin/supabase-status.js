import { getSupabaseConfigStatus, getServiceSupabase, supabase } from '../../../lib/supabaseClient';
import { verifySessionToken, extractToken } from '../../../lib/authSession';

export default async function handler(req, res) {
  // Verificación de sesión de propietario
  const token = extractToken(req);
  const session = verifySessionToken(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado. Se requiere sesión activa de propietario.',
    });
  }

  const status = getSupabaseConfigStatus();

  let connectionTest = {
    tested: false,
    ok: false,
    message: 'Supabase no configurado aún con URL y llaves en .env',
  };

  // Si está configurado, intentamos un ping rápido
  const client = getServiceSupabase() || supabase;
  if (client) {
    try {
      connectionTest.tested = true;
      // Consultamos el health check o versión auth
      const { data, error } = await client.auth.getSession();
      if (!error) {
        connectionTest.ok = true;
        connectionTest.message = 'Conexión a Supabase exitosa (Auth Service activo)';
      } else {
        connectionTest.ok = false;
        connectionTest.message = error.message;
      }
    } catch (e) {
      connectionTest.tested = true;
      connectionTest.ok = false;
      connectionTest.message = e.message;
    }
  }

  return res.status(200).json({
    success: true,
    supabase: status,
    connectionTest,
    environmentVariablesDetected: {
      NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      SUPABASE_SECRET_KEY: Boolean(process.env.SUPABASE_SECRET_KEY),
      SUPABASE_JWT_SECRET: Boolean(process.env.SUPABASE_JWT_SECRET),
      POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
      POSTGRES_PRISMA_URL: Boolean(process.env.POSTGRES_PRISMA_URL),
      POSTGRES_URL_NON_POOLING: Boolean(process.env.POSTGRES_URL_NON_POOLING),
      POSTGRES_HOST: Boolean(process.env.POSTGRES_HOST),
      POSTGRES_USER: Boolean(process.env.POSTGRES_USER),
      POSTGRES_DATABASE: Boolean(process.env.POSTGRES_DATABASE),
      POSTGRES_PASSWORD: Boolean(process.env.POSTGRES_PASSWORD),
    },
  });
}
