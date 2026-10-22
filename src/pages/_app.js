import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { getAnalyticsConfig, trackPageView } from '../lib/analytics';
import '../styles/globals.css';

function FloatingAuthBadge() {
  const { isAuthenticated, user, token, logout } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  // No mostrar en la página de login /auth para evitar redundancia
  if (!isAuthenticated || router.pathname === '/auth') return null;

  const handleShareAdminLink = async () => {
    if (!token) return;
    const shareUrl = `${window.location.origin}/admin?token=${encodeURIComponent(token)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Acceso Directo al Panel Admin - Cristian',
          text: 'Enlace de acceso rápido al Panel de Administración:',
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback a clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      prompt('Copia este enlace de acceso rápido con token:', shareUrl);
    }
  };

  // Versión recogida (Mini-botón flotante no invasivo para móviles)
  if (isCollapsed) {
    return (
      <aside aria-label='Sesión de propietario activa' className='fixed bottom-4 right-4 z-50 animate-fadeIn'>
        <button
          type='button'
          onClick={() => setIsCollapsed(false)}
          title='Modo Propietario Activo (Toca para desplegar opciones)'
          className='w-11 h-11 rounded-full bg-[#0D222D]/95 hover:bg-[#07151C] backdrop-blur-md border border-[#FFAA5B]/60 shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 relative'
        >
          <span className='absolute top-1 right-1 flex h-2.5 w-2.5'>
            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6DB758] opacity-75'></span>
            <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-[#6DB758]'></span>
          </span>
          <span className='text-sm select-none'>🔐</span>
        </button>
      </aside>
    );
  }

  // Versión expandida completa
  return (
    <aside
      aria-label='Sesión de propietario'
      className='fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex items-center gap-2 sm:gap-2.5 bg-[#0D222D]/95 backdrop-blur-md border border-[#FFAA5B]/40 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-[#FFAA5B] hover:shadow-[0_10px_35px_rgba(255,170,91,0.25)] max-w-[calc(100vw-2rem)] animate-fadeIn'
    >
      <div className='flex items-center gap-1.5 sm:gap-2 shrink-0'>
        <span className='flex h-2.5 w-2.5 relative'>
          <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6DB758] opacity-75'></span>
          <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-[#6DB758]'></span>
        </span>
        <span className='text-xs font-semibold text-[#F7EFC5]'>
          <span className='hidden sm:inline'>Modo Propietario </span>
          <span>({user?.name?.split(' ')[0] || 'Cris'})</span>
        </span>
      </div>

      <div className='h-3.5 w-px bg-white/20 shrink-0' />

      <Link
        href='/admin'
        className='text-xs font-semibold text-[#FFAA5B] hover:text-white px-2 py-0.5 rounded-full hover:bg-white/10 transition-colors shrink-0'
      >
        Panel Admin &rarr;
      </Link>

      <div className='h-3.5 w-px bg-white/20 shrink-0' />

      {/* Botón para compartir enlace directo con token */}
      <button
        type='button'
        onClick={handleShareAdminLink}
        title='Compartir enlace directo con token de sesión de 24h para acceso rápido'
        className='text-xs text-white/70 hover:text-[#FFAA5B] p-1 sm:p-1.5 hover:bg-white/10 rounded-full transition-colors flex items-center gap-1 shrink-0'
      >
        {copied ? (
          <span className='text-[10px] text-[#6DB758] font-bold px-1'>✓ Copiado</span>
        ) : (
          <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
            />
          </svg>
        )}
      </button>

      {/* Botón Cerrar Sesión */}
      <button
        onClick={logout}
        title='Cerrar sesión'
        className='text-xs text-white/60 hover:text-red-400 p-1 hover:bg-white/10 rounded-full transition-colors shrink-0'
      >
        <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
          />
        </svg>
      </button>

      {/* Botón Recoger / Colapsar badge para no estorbar en móviles */}
      <button
        type='button'
        onClick={() => setIsCollapsed(true)}
        title='Recoger badge flotante'
        className='text-xs text-white/40 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors shrink-0'
      >
        <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
        </svg>
      </button>
    </aside>
  );
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [cfg, setCfg] = useState(() => getAnalyticsConfig());

  useEffect(() => {
    // Registrar la visita inicial
    trackPageView(window.location.pathname);

    // Registrar cambios de ruta en SPA
    const handleRouteChange = (url) => {
      trackPageView(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <AuthProvider>
      {/* 1. Google Analytics 4 Scripts (Condicionado por Feature Flag y Measurement ID válido) */}
      {cfg.gaEnabled && cfg.gaId && (
        <>
          <Script
            strategy='afterInteractive'
            src={`https://www.googletagmanager.com/gtag/js?id=${cfg.gaId}`}
          />
          <Script
            id='gtag-init'
            strategy='afterInteractive'
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${cfg.gaId}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}

      {/* 2. Vercel Web Analytics Component (Condicionado por Feature Flag) */}
      {cfg.vercelEnabled && <Analytics />}

      <Component {...pageProps} />
      <FloatingAuthBadge />
    </AuthProvider>
  );
}

export default MyApp;

