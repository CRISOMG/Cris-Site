import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { getAnalyticsConfig, trackPageView } from '../lib/analytics';
import '../styles/globals.css';

function FloatingAuthBadge() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  // No mostrar en la página de login /auth para evitar redundancia
  if (!isAuthenticated || router.pathname === '/auth') return null;

  return (
    <aside
      aria-label='Sesión de propietario'
      className='fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-[#0D222D]/90 backdrop-blur-md border border-[#FFAA5B]/40 px-3.5 py-2 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-[#FFAA5B] hover:shadow-[0_10px_35px_rgba(255,170,91,0.25)]'
    >
      <div className='flex items-center gap-2'>
        <span className='flex h-2.5 w-2.5 relative'>
          <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6DB758] opacity-75'></span>
          <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-[#6DB758]'></span>
        </span>
        <span className='text-xs font-semibold text-[#F7EFC5]'>
          Modo Propietario ({user?.name?.split(' ')[0] || 'Cris'})
        </span>
      </div>

      <div className='h-3.5 w-px bg-white/20' />

      <Link
        href='/private'
        className='text-xs font-medium text-[#FFAA5B] hover:text-white px-2 py-0.5 rounded-full hover:bg-white/10 transition-colors'
      >
        Área Privada &rarr;
      </Link>

      <button
        onClick={logout}
        title='Cerrar sesión'
        className='text-xs text-white/60 hover:text-red-400 p-1 hover:bg-white/10 rounded-full transition-colors'
      >
        <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
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

