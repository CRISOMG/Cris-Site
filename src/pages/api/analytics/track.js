import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getServiceSupabase } from '../../../lib/supabaseClient';

// Usar directorio .data/ fuera de src/ para evitar ciclos de Fast Refresh en Next.js
const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_PATH = path.join(STORE_DIR, 'analytics_store.json');
const LEGACY_PATH = path.join(process.cwd(), 'src', 'data', 'analytics_store.json');

function getStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    }
    if (fs.existsSync(LEGACY_PATH)) {
      const data = JSON.parse(fs.readFileSync(LEGACY_PATH, 'utf8'));
      saveStore(data);
      return data;
    }
  } catch (_) {}
  return {
    summary: { totalVisits: 0, uniqueVisitorsCount: 0, totalEvents: 0, whatsappClicks: 0, socialClicks: 0 },
    daily: {},
    pages: {},
    events: {},
    devices: { desktop: 0, mobile: 0 },
    recentLog: [],
  };
}

function saveStore(data) {
  try {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error guardando analytics:', err.message);
  }
}

export default function handler(req, res) {
  if (!res || typeof res.status !== 'function') {
    return null;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {
      body = {};
    }
  }

  const {
    type = 'pageview',
    path: rawPath = '/',
    action = '',
    label = '',
    device = 'desktop',
    referrer = 'direct',
    timestamp = Date.now(),
  } = body || {};

  const pagePath = rawPath.split('?')[0] || '/';

  // Omitir peticiones internas automáticas o estáticas si las hubiera
  if (pagePath.startsWith('/_next') || pagePath.startsWith('/api')) {
    return res.status(200).json({ ok: true });
  }

  // Generar hash diario anónimo para conteo de visitantes únicos sin cookies ni guardar IPs
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '127.0.0.1';
  const ua = req.headers['user-agent'] || 'unknown';
  const today = new Date().toISOString().slice(0, 10);
  const visitorHash = crypto
    .createHash('sha256')
    .update(`${ip}:${ua}:${today}:cris-analytics-salt`)
    .digest('hex')
    .slice(0, 12);

  const store = getStore();

  if (!store.daily[today]) {
    store.daily[today] = { visits: 0, uniques: [], events: {} };
  }

  const dayRecord = store.daily[today];

  if (type === 'pageview') {
    store.summary.totalVisits = (store.summary.totalVisits || 0) + 1;
    dayRecord.visits = (dayRecord.visits || 0) + 1;

    // Conteo de visitante único diario
    if (!dayRecord.uniques.includes(visitorHash)) {
      dayRecord.uniques.push(visitorHash);
      store.summary.uniqueVisitorsCount = (store.summary.uniqueVisitorsCount || 0) + 1;
    }

    store.pages[pagePath] = (store.pages[pagePath] || 0) + 1;
    store.devices[device] = (store.devices[device] || 0) + 1;

    // Log reciente (máximo 60 registros)
    store.recentLog.unshift({
      id: Math.random().toString(36).substring(2, 9),
      type: 'pageview',
      path: pagePath,
      device,
      referrer,
      timestamp,
    });
  } else if (type === 'event') {
    store.summary.totalEvents = (store.summary.totalEvents || 0) + 1;
    store.events[action] = (store.events[action] || 0) + 1;
    dayRecord.events[action] = (dayRecord.events[action] || 0) + 1;

    if (action === 'whatsapp_click') {
      store.summary.whatsappClicks = (store.summary.whatsappClicks || 0) + 1;
    }
    if (action.endsWith('_click')) {
      store.summary.socialClicks = (store.summary.socialClicks || 0) + 1;
    }

    store.recentLog.unshift({
      id: Math.random().toString(36).substring(2, 9),
      type: 'event',
      action,
      label,
      path: pagePath,
      device,
      referrer,
      timestamp,
    });
  }

  // Mantener log reciente acotado
  if (store.recentLog.length > 60) {
    store.recentLog = store.recentLog.slice(0, 60);
  }

  saveStore(store);

  // 3. Persistencia en la nube de Supabase (PostgreSQL en tiempo real)
  const supabase = getServiceSupabase();
  if (supabase) {
    supabase
      .from('site_analytics')
      .insert({
        id: Math.random().toString(36).substring(2, 9),
        type,
        action: action || null,
        label: label || null,
        path: pagePath,
        device,
        referrer,
        visitor_hash: visitorHash,
        created_at: new Date(timestamp).toISOString(),
      })
      .then(() => {})
      .catch((err) => console.error('Supabase track error:', err.message));
  }

  return res.status(200).json({ ok: true });
}
