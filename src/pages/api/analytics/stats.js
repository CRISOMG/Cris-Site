import fs from 'fs';
import path from 'path';
import { verifySessionToken, extractToken } from '../../../lib/authSession';
import { getServiceSupabase } from '../../../lib/supabaseClient';

// Usar directorio .data/ fuera de src/ para evitar ciclos de Fast Refresh en Next.js
const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_PATH = path.join(STORE_DIR, 'analytics_store.json');
const LEGACY_PATH = path.join(process.cwd(), 'src', 'data', 'analytics_store.json');
const SOCIAL_PATH = path.join(process.cwd(), 'src', 'data', 'social.json');

function getStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    }
    if (fs.existsSync(LEGACY_PATH)) {
      const data = JSON.parse(fs.readFileSync(LEGACY_PATH, 'utf8'));
      try {
        if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
        fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
      } catch (_) {}
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

export default async function handler(req, res) {
  const token = extractToken(req);
  const session = verifySessionToken(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado. Se requiere sesión de propietario.',
    });
  }

  const supabase = getServiceSupabase();

  // 1. GET: Retorna estadísticas completas (desde Supabase si está disponible, o fallback a JSON)
  if (req.method === 'GET') {
    const store = getStore();

    // Obtener flags activas
    let flags = {};
    if (supabase) {
      try {
        const { data: configRow } = await supabase.from('site_config').select('data').eq('key', 'social').single();
        if (configRow?.data?.flags?.analytics) {
          flags = configRow.data.flags.analytics;
        }
      } catch (_) {}
    }

    if (Object.keys(flags).length === 0) {
      try {
        if (fs.existsSync(SOCIAL_PATH)) {
          const socialData = JSON.parse(fs.readFileSync(SOCIAL_PATH, 'utf8'));
          flags = socialData.flags?.analytics || {};
        }
      } catch (_) {}
    }

    // Intentar consultar datos agregados de Supabase
    let stats = null;
    let persistenceProvider = 'local';

    if (supabase) {
      try {
        const { data: rows, error } = await supabase
          .from('site_analytics')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000);

        if (!error && rows && rows.length > 0) {
          persistenceProvider = 'supabase';
          let totalVisits = 0;
          let totalEvents = 0;
          let whatsappClicks = 0;
          let socialClicks = 0;
          const pages = {};
          const events = {};
          const devices = { desktop: 0, mobile: 0 };
          const uniqueHashes = new Set();
          const todayHashes = new Set();
          let todayVisits = 0;
          let todayWhatsapp = 0;

          const today = new Date().toISOString().slice(0, 10);

          for (const r of rows) {
            const isToday = (r.created_at || '').startsWith(today);
            if (r.visitor_hash) {
              uniqueHashes.add(r.visitor_hash);
              if (isToday) todayHashes.add(r.visitor_hash);
            }

            if (r.type === 'pageview') {
              totalVisits++;
              if (isToday) todayVisits++;
              const p = r.path || '/';
              pages[p] = (pages[p] || 0) + 1;
              const dev = r.device === 'mobile' ? 'mobile' : 'desktop';
              devices[dev] = (devices[dev] || 0) + 1;
            } else if (r.type === 'event') {
              totalEvents++;
              const act = r.action || 'event';
              events[act] = (events[act] || 0) + 1;
              if (act === 'whatsapp_click') {
                whatsappClicks++;
                if (isToday) todayWhatsapp++;
              }
              if (act.endsWith('_click')) {
                socialClicks++;
              }
            }
          }

          stats = {
            totalVisits,
            uniqueVisitors: uniqueHashes.size,
            totalEvents,
            whatsappClicks,
            socialClicks,
            today: {
              visits: todayVisits,
              uniqueVisitors: todayHashes.size,
              whatsappClicks: todayWhatsapp,
            },
            pages,
            events,
            devices,
            recentLog: rows.slice(0, 30).map((r) => ({
              id: r.id,
              type: r.type,
              action: r.action,
              label: r.label,
              path: r.path,
              device: r.device,
              referrer: r.referrer,
              timestamp: new Date(r.created_at).getTime(),
            })),
          };
        }
      } catch (err) {
        console.error('Error calculando stats en Supabase:', err.message);
      }
    }

    // Fallback a almacenamiento local si Supabase no tiene datos o está offline
    if (!stats) {
      const today = new Date().toISOString().slice(0, 10);
      const todayData = store.daily[today] || { visits: 0, uniques: [], events: {} };

      stats = {
        totalVisits: store.summary.totalVisits || 0,
        uniqueVisitors: store.summary.uniqueVisitorsCount || 0,
        totalEvents: store.summary.totalEvents || 0,
        whatsappClicks: store.summary.whatsappClicks || 0,
        socialClicks: store.summary.socialClicks || 0,
        today: {
          visits: todayData.visits || 0,
          uniqueVisitors: todayData.uniques?.length || 0,
          whatsappClicks: todayData.events?.whatsapp_click || 0,
        },
        pages: store.pages || {},
        events: store.events || {},
        devices: store.devices || { desktop: 0, mobile: 0 },
        recentLog: store.recentLog || [],
      };
    }

    return res.status(200).json({
      success: true,
      stats,
      flags,
      persistence: {
        provider: persistenceProvider,
        supabaseConnected: Boolean(supabase),
      },
    });
  }

  // 2. POST: Resetear estadísticas
  if (req.method === 'POST') {
    if (req.body?.action === 'reset') {
      if (supabase) {
        try {
          await supabase.from('site_analytics').delete().neq('id', '');
        } catch (_) {}
      }

      const emptyStore = {
        summary: { totalVisits: 0, uniqueVisitorsCount: 0, totalEvents: 0, whatsappClicks: 0, socialClicks: 0 },
        daily: {},
        pages: {},
        events: {},
        devices: { desktop: 0, mobile: 0 },
        recentLog: [],
      };
      try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(emptyStore, null, 2), 'utf8');
      } catch (_) {}

      return res.status(200).json({ success: true, message: 'Estadísticas reiniciadas con éxito.' });
    }
  }

  return res.status(405).json({ message: 'Método no permitido' });
}
