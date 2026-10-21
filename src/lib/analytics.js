import socialConfig from '../data/social.json';

/**
 * Retorna la configuración consolidada de analítica desde social.json y variables de entorno
 */
export function getAnalyticsConfig() {
  const flags = socialConfig.flags?.analytics || {};
  const gaId =
    flags.googleAnalytics?.measurementId && flags.googleAnalytics.measurementId !== 'G-XXXXXXXXXX'
      ? flags.googleAnalytics.measurementId
      : process.env.NEXT_PUBLIC_GA_ID || '';

  return {
    gaEnabled: Boolean(flags.googleAnalytics?.enabled && gaId),
    gaId,
    vercelEnabled: Boolean(flags.vercelAnalytics?.enabled),
    internalEnabled: Boolean(flags.internalAnalytics?.enabled !== false),
  };
}

let lastTrackedPath = null;
let lastTrackedTime = 0;

/**
 * Registra una vista de página en todos los proveedores activos
 */
export function trackPageView(url) {
  if (typeof window === 'undefined') return;

  const path = url || window.location.pathname;
  const now = Date.now();

  // Prevenir duplicados inmediatos por re-renderizados o Fast Refresh en el mismo segundo
  if (lastTrackedPath === path && now - lastTrackedTime < 2000) {
    return;
  }
  lastTrackedPath = path;
  lastTrackedTime = now;

  const cfg = getAnalyticsConfig();

  // 1. Google Analytics 4
  if (cfg.gaEnabled && cfg.gaId && window.gtag) {
    try {
      window.gtag('config', cfg.gaId, {
        page_path: path,
        page_title: document.title,
      });
    } catch (_) {}
  }

  // 2. Analítica Interna (sin cookies, IP anónima)
  if (cfg.internalEnabled) {
    sendInternal({
      type: 'pageview',
      path,
      title: document.title,
    });
  }
}

/**
 * Registra una interacción o evento específico (clics a WhatsApp, redes sociales, etc.)
 */
export function trackEvent({ action, category = 'engagement', label = '', metadata = {} }) {
  if (typeof window === 'undefined') return;

  const cfg = getAnalyticsConfig();
  const path = window.location.pathname;

  // 1. Google Analytics 4
  if (cfg.gaEnabled && cfg.gaId && window.gtag) {
    try {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        ...metadata,
      });
    } catch (_) {}
  }

  // 2. Analítica Interna
  if (cfg.internalEnabled) {
    sendInternal({
      type: 'event',
      action,
      category,
      label,
      metadata,
      path,
    });
  }
}

/**
 * Envío seguro y asíncrono al endpoint interno de analítica mediante Beacon API
 */
function sendInternal(payload) {
  try {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    const data = JSON.stringify({
      ...payload,
      timestamp: Date.now(),
      device: isMobile ? 'mobile' : 'desktop',
      referrer: document.referrer || 'direct',
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/track', data);
    } else {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (_) {}
}
