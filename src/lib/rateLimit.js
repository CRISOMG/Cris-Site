import crypto from 'crypto';
import { getServiceSupabase } from './supabaseClient';

const SESSION_SECRET = process.env.SESSION_SECRET || 'cris-site-secret-token-key-2026';

// Memoria caché local para burst protection rápida (en caso de cold-start o dev offline)
const localMemoryStore = new Map();

/**
 * Obtiene la dirección IP del cliente de forma segura en Vercel Serverless
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Genera un hash pseudo-anónimo no reversible para la IP
 */
export function getIpHash(req) {
  const ip = getClientIp(req);
  return crypto.createHmac('sha256', SESSION_SECRET).update(ip).digest('hex');
}

/**
 * Verifica si una IP ha excedido el límite de intentos o se encuentra bloqueada.
 *
 * @param {object} req - Request de Next.js
 * @param {object} options
 * @param {string} options.action - Nombre de la acción ('otp_request', 'otp_verify')
 * @param {number} options.maxAttempts - Máximo número de intentos permitidos
 * @param {number} options.windowMs - Ventana de tiempo en milisegundos (ej: 60000 = 1 min)
 * @param {number} options.lockoutMs - Tiempo de bloqueo en milisegundos (ej: 900000 = 15 min)
 * @returns {Promise<{ allowed: boolean, reason?: string, remainingSeconds?: number, attemptsRemaining?: number }>}
 */
export async function checkRateLimit(req, { action, maxAttempts = 5, windowMs = 60000, lockoutMs = 15 * 60 * 1000 }) {
  const ipHash = getIpHash(req);
  const recordId = `${ipHash}_${action}`;
  const now = Date.now();

  // 1. Verificación rápida en memoria local
  const local = localMemoryStore.get(recordId);
  if (local && local.lockedUntil && now < local.lockedUntil) {
    const remainingSeconds = Math.ceil((local.lockedUntil - now) / 1000);
    return {
      allowed: false,
      reason: `Demasiados intentos. Tu dirección está bloqueada temporalmente. Intenta de nuevo en ${remainingSeconds} segundos.`,
      remainingSeconds,
    };
  }

  // 2. Verificación en Supabase (base de datos compartida entre todas las funciones serverless de Vercel)
  const supabase = getServiceSupabase();
  if (supabase) {
    try {
      const { data: row } = await supabase
        .from('auth_rate_limits')
        .select('*')
        .eq('id', recordId)
        .single();

      if (row) {
        const lockedUntil = row.locked_until ? new Date(row.locked_until).getTime() : null;
        if (lockedUntil && now < lockedUntil) {
          const remainingSeconds = Math.ceil((lockedUntil - now) / 1000);
          return {
            allowed: false,
            reason: `Demasiados intentos. Acceso bloqueado temporalmente por seguridad. Intenta en ${remainingSeconds} segundos.`,
            remainingSeconds,
          };
        }
      }
    } catch (_) {}
  }

  return { allowed: true };
}

/**
 * Registra un intento fallido o una solicitud. Si supera el umbral, bloquea la IP.
 */
export async function recordAttempt(req, { action, maxAttempts = 5, windowMs = 60000, lockoutMs = 15 * 60 * 1000 }) {
  const ipHash = getIpHash(req);
  const recordId = `${ipHash}_${action}`;
  const now = Date.now();
  const supabase = getServiceSupabase();

  let attempts = 1;
  let firstAttemptAt = new Date(now).toISOString();
  let lockedUntil = null;
  let isLocked = false;

  if (supabase) {
    try {
      const { data: row } = await supabase
        .from('auth_rate_limits')
        .select('*')
        .eq('id', recordId)
        .single();

      if (row) {
        const firstTime = new Date(row.first_attempt_at).getTime();
        const inWindow = now - firstTime < windowMs;

        if (inWindow) {
          attempts = (row.attempts || 0) + 1;
          firstAttemptAt = row.first_attempt_at;
        } else {
          // Ventana expirada, resetear contador
          attempts = 1;
          firstAttemptAt = new Date(now).toISOString();
        }

        if (attempts >= maxAttempts) {
          lockedUntil = new Date(now + lockoutMs).toISOString();
          isLocked = true;
        }
      }

      await supabase.from('auth_rate_limits').upsert({
        id: recordId,
        ip_hash: ipHash,
        action,
        attempts,
        first_attempt_at: firstAttemptAt,
        last_attempt_at: new Date(now).toISOString(),
        locked_until: lockedUntil,
      });
    } catch (err) {
      console.error('Error registrando rate limit en Supabase:', err.message);
    }
  }

  // Actualizar también caché local
  localMemoryStore.set(recordId, {
    attempts,
    lockedUntil: lockedUntil ? new Date(lockedUntil).getTime() : null,
  });

  return {
    isLocked,
    attemptsRemaining: Math.max(0, maxAttempts - attempts),
    lockoutSeconds: isLocked ? Math.ceil(lockoutMs / 1000) : 0,
  };
}

/**
 * Limpia el registro de intentos tras una autenticación exitosa
 */
export async function resetRateLimit(req, action) {
  const ipHash = getIpHash(req);
  const recordId = `${ipHash}_${action}`;

  localMemoryStore.delete(recordId);

  const supabase = getServiceSupabase();
  if (supabase) {
    try {
      await supabase.from('auth_rate_limits').delete().eq('id', recordId);
    } catch (_) {}
  }
}
