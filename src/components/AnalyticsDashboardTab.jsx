import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AnalyticsDashboardTab({ onSwitchToFeatures }) {
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error('Error fetching analytics stats:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/analytics/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'reset' }),
      });
      if (res.ok) {
        await fetchStats();
        setConfirmReset(false);
      }
    } catch (e) {
      console.error('Error resetting analytics:', e);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className='p-16 text-center text-white/60 flex items-center justify-center gap-3'>
        <svg className='animate-spin h-5 w-5 text-[#FFAA5B]' fill='none' viewBox='0 0 24 24'>
          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z'></path>
        </svg>
        <span>Cargando métricas y estadísticas...</span>
      </div>
    );
  }

  const stats = data?.stats || {};
  const flags = data?.flags || {};

  // Calcular proporciones de dispositivos
  const totalDev = (stats.devices?.desktop || 0) + (stats.devices?.mobile || 0);
  const desktopPct = totalDev > 0 ? Math.round(((stats.devices?.desktop || 0) / totalDev) * 100) : 50;
  const mobilePct = totalDev > 0 ? 100 - desktopPct : 50;

  // Interacciones sociales ordenadas
  const socialEvents = [
    { key: 'whatsapp_click', name: 'WhatsApp', color: '#25D366', icon: '💬', count: stats.events?.whatsapp_click || 0 },
    { key: 'linkedin_click', name: 'LinkedIn', color: '#0A66C2', icon: '💼', count: stats.events?.linkedin_click || 0 },
    { key: 'github_click', name: 'GitHub', color: '#7C0052', icon: '🐙', count: stats.events?.github_click || 0 },
    { key: 'platzi_click', name: 'Platzi', color: '#75FF34', icon: '💚', count: stats.events?.platzi_click || 0 },
    { key: 'twitter_click', name: 'Twitter / X', color: '#349DFF', icon: '🐦', count: stats.events?.twitter_click || 0 },
    { key: 'figma_click', name: 'Figma', color: '#F24E1E', icon: '🎨', count: stats.events?.figma_click || 0 },
  ];
  const maxClicks = Math.max(...socialEvents.map((s) => s.count), 1);

  // Páginas ordenadas
  const pageEntries = Object.entries(stats.pages || {}).sort((a, b) => b[1] - a[1]);
  const maxPageViews = pageEntries.length > 0 ? Math.max(...pageEntries.map((p) => p[1]), 1) : 1;

  // Formatear hora relativa
  const formatRelativeTime = (ts) => {
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return 'hace unos segundos';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `hace ${diffHr} h`;
    return new Date(ts).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className='space-y-6'>
      {/* Header Banner */}
      <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-xl'>📊</span>
            <h2 className='text-lg font-bold text-[#F7EFC5]'>Analíticas de Tráfico & Conversión en Tiempo Real</h2>
          </div>
          <p className='text-xs text-white/60 max-w-2xl leading-relaxed'>
            Medición integral de visitantes únicos, páginas vistas y clics de contacto a WhatsApp y redes sociales.
            Totalmente compatible con Google Analytics 4, Vercel Web Analytics y el motor interno de métricas.
          </p>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          <button
            type='button'
            onClick={handleRefresh}
            disabled={refreshing}
            className='p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-colors text-xs font-semibold flex items-center gap-2'
          >
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            <span>{refreshing ? 'Actualizando...' : 'Refrescar'}</span>
          </button>

          <button
            type='button'
            onClick={() => setConfirmReset(true)}
            className='p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-100 border border-red-500/20 transition-colors text-xs font-semibold'
            title='Reiniciar conteos'
          >
            Reiniciar
          </button>
        </div>
      </div>

      {/* Modal / Confirmación de Reset */}
      {confirmReset && (
        <div className='p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn'>
          <div className='flex items-center gap-2'>
            <span>⚠️</span>
            <span>¿Estás seguro de que deseas reiniciar todos los contadores de analítica interna a cero?</span>
          </div>
          <div className='flex items-center gap-2 shrink-0'>
            <button
              onClick={handleReset}
              disabled={resetting}
              className='px-3 py-1.5 rounded-lg bg-red-500 text-white font-bold text-xs hover:bg-red-600'
            >
              {resetting ? 'Reiniciando...' : 'Sí, reiniciar'}
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className='px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white'
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Card 1: Visitantes Únicos */}
        <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden'>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-2xl'>👥</span>
            <span className='text-[10px] font-bold uppercase tracking-wider text-[#FFAA5B] bg-[#FFAA5B]/10 px-2 py-0.5 rounded-full border border-[#FFAA5B]/20'>
              Hoy: +{stats.today?.uniqueVisitors || 0}
            </span>
          </div>
          <div>
            <span className='text-3xl font-extrabold text-[#F7EFC5] block mb-1'>
              {stats.uniqueVisitors || 0}
            </span>
            <h4 className='text-xs font-bold text-white/80'>Visitantes Únicos</h4>
            <p className='text-[11px] text-white/50 mt-1'>Calculado con hash diario anónimo sin cookies</p>
          </div>
        </div>

        {/* Card 2: Páginas Vistas */}
        <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden'>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-2xl'>📈</span>
            <span className='text-[10px] font-bold uppercase tracking-wider text-[#6DB758] bg-[#6DB758]/10 px-2 py-0.5 rounded-full border border-[#6DB758]/20'>
              Hoy: +{stats.today?.visits || 0}
            </span>
          </div>
          <div>
            <span className='text-3xl font-extrabold text-[#6DB758] block mb-1'>
              {stats.totalVisits || 0}
            </span>
            <h4 className='text-xs font-bold text-white/80'>Vistas Totales de Página</h4>
            <p className='text-[11px] text-white/50 mt-1'>Vistas de ruta acumuladas</p>
          </div>
        </div>

        {/* Card 3: Clics en WhatsApp (Conversión) */}
        <div className='bg-[#0D222D] border border-[#25D366]/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden'>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-2xl'>💬</span>
            <span className='text-[10px] font-bold uppercase tracking-wider text-[#25D366] bg-[#25D366]/15 px-2 py-0.5 rounded-full border border-[#25D366]/30'>
              Conversión
            </span>
          </div>
          <div>
            <span className='text-3xl font-extrabold text-[#25D366] block mb-1'>
              {stats.whatsappClicks || 0}
            </span>
            <h4 className='text-xs font-bold text-white/80'>Clics en WhatsApp</h4>
            <p className='text-[11px] text-white/50 mt-1'>Intentos de contacto directo vía chat</p>
          </div>
        </div>

        {/* Card 4: Clics Totales en Redes */}
        <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden'>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-2xl'>🌐</span>
            <span className='text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20'>
              Link Tree
            </span>
          </div>
          <div>
            <span className='text-3xl font-extrabold text-[#FFAA5B] block mb-1'>
              {stats.socialClicks || 0}
            </span>
            <h4 className='text-xs font-bold text-white/80'>Clics en Redes Sociales</h4>
            <p className='text-[11px] text-white/50 mt-1'>Interacciones hacia LinkedIn, GitHub, Platzi, etc.</p>
          </div>
        </div>
      </div>

      {/* Grid de 2 Columnas: Clics por Red Social & Páginas Más Vistas */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        
        {/* Columna Izquierda: Clics en Redes Sociales (7 cols) */}
        <div className='lg:col-span-7 bg-[#0D222D] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4'>
          <div className='flex items-center justify-between border-b border-white/10 pb-3'>
            <div>
              <h3 className='text-sm font-bold text-[#F7EFC5]'>Interacciones por Red Social (Link Tree)</h3>
              <p className='text-xs text-white/50'>Número de veces que los visitantes hicieron clic en cada red.</p>
            </div>
            <span className='text-xs font-mono text-white/60'>{stats.socialClicks || 0} clics totales</span>
          </div>

          <div className='space-y-3.5 pt-1'>
            {socialEvents.map((item) => {
              const pct = stats.socialClicks > 0 ? Math.round((item.count / stats.socialClicks) * 100) : 0;

              return (
                <div key={item.key} className='space-y-1.5'>
                  <div className='flex items-center justify-between text-xs'>
                    <div className='flex items-center gap-2'>
                      <span>{item.icon}</span>
                      <span className='font-bold text-white'>{item.name}</span>
                    </div>
                    <div className='flex items-center gap-2 font-mono text-[11px]'>
                      <span className='text-white font-bold'>{item.count} clics</span>
                      <span className='text-white/40'>({pct}%)</span>
                    </div>
                  </div>

                  <div className='h-2.5 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5'>
                    <div
                      className='h-full rounded-full transition-all duration-500'
                      style={{
                        width: `${Math.max((item.count / maxClicks) * 100, item.count > 0 ? 5 : 0)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Páginas Más Visitadas & Dispositivos (5 cols) */}
        <div className='lg:col-span-5 space-y-5'>
          
          {/* Páginas Más Vistas */}
          <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3'>
            <div className='border-b border-white/10 pb-2.5'>
              <h3 className='text-sm font-bold text-[#F7EFC5]'>Páginas Más Visitadas</h3>
              <p className='text-[11px] text-white/50'>Rutas navegadas en el sitio web.</p>
            </div>

            {pageEntries.length === 0 ? (
              <p className='text-xs text-white/40 italic py-4 text-center'>Aún no hay visitas registradas.</p>
            ) : (
              <div className='space-y-2.5'>
                {pageEntries.slice(0, 5).map(([route, count]) => {
                  const pct = Math.round((count / maxPageViews) * 100);

                  return (
                    <div key={route} className='space-y-1'>
                      <div className='flex items-center justify-between text-xs'>
                        <span className='font-mono text-white/90 truncate max-w-[200px]'>{route}</span>
                        <span className='font-mono font-bold text-[#FFAA5B]'>{count} vistas</span>
                      </div>
                      <div className='h-1.5 w-full bg-black/40 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-gradient-to-r from-[#FFAA5B] to-[#FBBF24] rounded-full'
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dispositivos (Móvil vs Desktop) */}
          <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3'>
            <div className='border-b border-white/10 pb-2'>
              <h3 className='text-sm font-bold text-[#F7EFC5]'>Distribución de Dispositivos</h3>
            </div>

            <div className='flex items-center justify-around text-xs py-2'>
              <div className='text-center space-y-1'>
                <span className='text-2xl block'>💻</span>
                <span className='text-xs text-white/60 block'>Desktop</span>
                <span className='font-mono font-bold text-[#F7EFC5] text-sm'>{desktopPct}%</span>
                <span className='text-[10px] text-white/40 block'>({stats.devices?.desktop || 0})</span>
              </div>

              <div className='h-12 w-px bg-white/10' />

              <div className='text-center space-y-1'>
                <span className='text-2xl block'>📱</span>
                <span className='text-xs text-white/60 block'>Móvil</span>
                <span className='font-mono font-bold text-[#6DB758] text-sm'>{mobilePct}%</span>
                <span className='text-[10px] text-white/40 block'>({stats.devices?.mobile || 0})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed de Actividad Reciente en Vivo */}
      <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4'>
        <div className='flex items-center justify-between border-b border-white/10 pb-3'>
          <div>
            <div className='flex items-center gap-2'>
              <span className='w-2 h-2 rounded-full bg-[#6DB758] animate-pulse' />
              <h3 className='text-sm font-bold text-[#F7EFC5]'>Registro de Actividad en Vivo (Últimos Eventos)</h3>
            </div>
            <p className='text-xs text-white/50'>Eventos e interacciones registradas en tiempo real.</p>
          </div>
          <span className='text-xs font-mono text-white/50'>{stats.recentLog?.length || 0} registros</span>
        </div>

        {(!stats.recentLog || stats.recentLog.length === 0) ? (
          <p className='text-xs text-white/40 italic py-6 text-center'>
            Aún no se han capturado eventos. Haz clic en tus enlaces del Home para verlos aquí.
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead>
                <tr className='border-b border-white/10 text-white/50 text-[10px] uppercase font-mono'>
                  <th className='pb-2'>Tipo</th>
                  <th className='pb-2'>Acción / Detalle</th>
                  <th className='pb-2'>Ruta</th>
                  <th className='pb-2'>Dispositivo</th>
                  <th className='pb-2 text-right'>Tiempo</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-white/5'>
                {stats.recentLog.slice(0, 15).map((log) => {
                  const isWhatsapp = log.action === 'whatsapp_click';
                  const isPageview = log.type === 'pageview';

                  return (
                    <tr key={log.id} className='hover:bg-white/5 transition-colors'>
                      <td className='py-2.5'>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isWhatsapp
                              ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30'
                              : isPageview
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-[#FFAA5B]/20 text-[#FFAA5B] border border-[#FFAA5B]/30'
                          }`}
                        >
                          {isWhatsapp ? 'WhatsApp' : isPageview ? 'Vista' : 'Evento'}
                        </span>
                      </td>
                      <td className='py-2.5 font-medium text-white/90'>
                        {log.label || log.action || 'Página cargada'}
                      </td>
                      <td className='py-2.5 font-mono text-white/60 text-[11px]'>{log.path}</td>
                      <td className='py-2.5 text-white/60'>
                        {log.device === 'mobile' ? '📱 Móvil' : '💻 Desktop'}
                      </td>
                      <td className='py-2.5 text-right font-mono text-white/40 text-[11px]'>
                        {formatRelativeTime(log.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tarjeta de Estado de los 3 Proveedores con Acceso a Feature Flags */}
      <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4'>
        <div className='flex flex-wrap items-center gap-3'>
          <span className='text-xs font-bold text-white/80'>Estado de Proveedores:</span>
          
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
              flags.googleAnalytics?.enabled
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'bg-white/5 text-white/40'
            }`}
          >
            <span>🌐 GA4:</span>
            <strong>{flags.googleAnalytics?.enabled ? 'Activo' : 'Inactivo'}</strong>
          </span>

          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
              flags.vercelAnalytics?.enabled
                ? 'bg-white/15 text-white border border-white/30'
                : 'bg-white/5 text-white/40'
            }`}
          >
            <span>▲ Vercel:</span>
            <strong>{flags.vercelAnalytics?.enabled ? 'Activo' : 'Inactivo'}</strong>
          </span>

          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
              flags.internalAnalytics?.enabled !== false
                ? 'bg-[#6DB758]/15 text-[#6DB758] border border-[#6DB758]/30'
                : 'bg-white/5 text-white/40'
            }`}
          >
            <span>📈 Interno:</span>
            <strong>{flags.internalAnalytics?.enabled !== false ? 'Activo' : 'Inactivo'}</strong>
          </span>
        </div>

        {onSwitchToFeatures && (
          <button
            type='button'
            onClick={onSwitchToFeatures}
            className='text-xs font-bold text-[#FFAA5B] hover:text-white bg-[#FFAA5B]/10 hover:bg-[#FFAA5B]/20 border border-[#FFAA5B]/30 px-3.5 py-2 rounded-xl transition-colors'
          >
            Configurar Feature Flags &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
