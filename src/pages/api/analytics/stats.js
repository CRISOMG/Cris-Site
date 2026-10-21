import fs from 'fs';
import path from 'path';
import { verifySessionToken, extractToken } from '../../../lib/authSession';

const STORE_PATH = path.join(process.cwd(), 'src', 'data', 'analytics_store.json');
const SOCIAL_PATH = path.join(process.cwd(), 'src', 'data', 'social.json');

function getStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
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

export default function handler(req, res) {
  const token = extractToken(req);
  const session = verifySessionToken(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado. Se requiere sesión de propietario.',
    });
  }

  // 1. GET: Retorna estadísticas completas
  if (req.method === 'GET') {
    const store = getStore();

    // Obtener flags activas
    let flags = {};
    try {
      if (fs.existsSync(SOCIAL_PATH)) {
        const socialData = JSON.parse(fs.readFileSync(SOCIAL_PATH, 'utf8'));
        flags = socialData.flags?.analytics || {};
      }
    } catch (_) {}

    // Calcular métricas de hoy
    const today = new Date().toISOString().slice(0, 10);
    const todayData = store.daily[today] || { visits: 0, uniques: [], events: {} };

    return res.status(200).json({
      success: true,
      stats: {
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
      },
      flags,
    });
  }

  // 2. POST: Resetear estadísticas
  if (req.method === 'POST') {
    if (req.body?.action === 'reset') {
      const emptyStore = {
        summary: { totalVisits: 0, uniqueVisitorsCount: 0, totalEvents: 0, whatsappClicks: 0, socialClicks: 0 },
        daily: {},
        pages: {},
        events: {},
        devices: { desktop: 0, mobile: 0 },
        recentLog: [],
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(emptyStore, null, 2), 'utf8');
      return res.status(200).json({ success: true, message: 'Estadísticas reiniciadas con éxito.' });
    }
  }

  return res.status(405).json({ message: 'Método no permitido' });
}
