import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SocialIcons from '../containers/SocialIcons';
import AuthConfirmModal from '../components/AuthConfirmModal';
import { useAuth } from '../context/AuthContext';
import metadata from '../data/metadata.json';
import socialConfig from '../data/social.json';
import { getGradientTheme } from '../data/gradients';
import LavaLampBackground from '../components/LavaLampBackground';
import { trackEvent } from '../lib/analytics';

export default function Home({ initialConfig }) {
  const { isAuthenticated } = useAuth();
  const [config, setConfig] = useState(initialConfig || socialConfig);
  const [secretClicks, setSecretClicks] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sincronizar en cliente si cambian las props
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  // Atajos de teclado sigilosos en el Home (Ctrl + K / Cmd + K o Ctrl + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmdOrCtrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
      const isCtrlShiftA = (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a';

      if (isCmdOrCtrlK || isCtrlShiftA) {
        e.preventDefault();
        trackEvent({ action: 'stealth_shortcut_used', category: 'admin_auth' });
        setIsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Manejar toques y clicks múltiples sobre el lema de Platzi de forma sigilosa
  const handleSecretTrigger = () => {
    trackEvent({ action: 'secret_trigger_click', category: 'easter_egg' });
    setSecretClicks((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        trackEvent({ action: 'secret_modal_unlocked', category: 'admin_auth' });
        setIsModalOpen(true);
        return 0;
      }
      return next;
    });
  };

  // Resetear contador de clicks si transcurren más de 1.5s sin nuevo toque
  useEffect(() => {
    if (secretClicks > 0) {
      const timer = setTimeout(() => setSecretClicks(0), 1500);
      return () => clearTimeout(timer);
    }
  }, [secretClicks]);

  const activeGradientId = config.flags?.heroGradient || 'default';
  const theme = getGradientTheme(activeGradientId);

  return (
    <div
      className={`bg-page min-h-screen relative overflow-hidden transition-all duration-700 ${theme.wrapperClass}`}
      style={theme.style || {}}
    >
      {/* Efecto Lámpara de Lava (Burbujas ascendentes y descendentes de Blooker20) */}
      {theme.hasLavaLamp && <LavaLampBackground isDark={theme.isDark} />}

      {/* Orbes atmosféricos para temas Mesh Aurora sin lava lamp */}
      {theme.hasMeshOrbs && !theme.hasLavaLamp && (
        <>
          <div className='absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#F9D423]/30 blur-3xl pointer-events-none animate-pulse' />
          <div className='absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-[#E65C00]/25 blur-3xl pointer-events-none' />
          <div className='absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-[#FFAA5B]/20 blur-3xl pointer-events-none' />
        </>
      )}
      <Head>
        <title>{metadata.pageTitle || 'Cris Page'}</title>
        <link rel='icon' href='/favicon.ico' />
        <meta key='title' name='title' content={metadata.metaTitle || 'Cristian Caraballo'} />
        <meta key='description' name='description' content={metadata.description || ''} />
        {metadata.author && <meta name='author' content={metadata.author} />}
        {metadata.keywords && <meta name='keywords' content={metadata.keywords} />}

        <meta key='og:type' property='og:type' content={metadata.og?.type || 'website'} />
        <meta key='og:url' property='og:url' content={metadata.og?.url || metadata.canonicalUrl} />
        <meta key='og:title' property='og:title' content={metadata.og?.title || metadata.metaTitle} />
        <meta key='og:description' property='og:description' content={metadata.og?.description || metadata.description} />
        <meta key='og:image' property='og:image' content={metadata.og?.image || 'https://cris-page.vercel.app/assets/meta-image.png'} />
        {metadata.og?.imageAlt && <meta property='og:image:alt' content={metadata.og.imageAlt} />}

        <meta key='twitter:card' property='twitter:card' content={metadata.twitter?.card || 'summary_large_image'} />
        <meta key='twitter:url' property='twitter:url' content={metadata.twitter?.url || metadata.canonicalUrl} />
        <meta key='twitter:title' property='twitter:title' content={metadata.twitter?.title || metadata.metaTitle} />
        <meta key='twitter:description' property='twitter:description' content={metadata.twitter?.description || metadata.description} />
        <meta key='twitter:image' property='twitter:image' content={metadata.twitter?.image || 'https://cris-page.vercel.app/assets/meta-image.jpg'} />
      </Head>

      <main className='flex flex-col justify-center items-center text-center p-4 min-h-screen relative z-10'>
        <div>
          <h2 className='_font-grand-hotel text-5xl'>Cristian Caraballo</h2>
        </div>

        <div className='my-4'>
          <img
            width='240'
            height='240'
            className='mx-auto rounded-full w-60'
            src='/assets/cris-photo.jpg'
            alt='Cristian - Foto de perfil'
          />
        </div>

        <div className='text-center mb-4'>
          <h1 className='_font-grand-hotel text-5xl'>Javascript Product Engineer</h1>

          {/* Elemento Secreto: Apariencia 100% idéntica a texto normal estático sin estilos ni semántica de botón */}
          <div
            onClick={handleSecretTrigger}
            className='flex ml-4'
          >
            <img
              className='object-contain -mb-1'
              width='25'
              height='25'
              src='/assets/platzi-icon.png'
              alt='platzi logo'
            />
            <h2 className='_font-arial text-2xl pt-2 italic'>
              Relentless intellectual curiosity
            </h2>
          </div>

          <h3 className='_font-nova-round font-bold italic text-xl '>Lifelong Learner at Platzi</h3>
        </div>

        <SocialIcons config={config} />

        {/* Solo visible si el propietario ha iniciado sesión */}
        {isAuthenticated && (
          <div className='mt-4 flex flex-wrap items-center justify-center gap-3'>
            <Link
              href='/private'
              className='inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0D222D] hover:bg-[#07151C] text-[#FFAA5B] text-sm font-semibold backdrop-blur-md transition-all hover:scale-105 border border-[#FFAA5B]/50 shadow-xl'
            >
              <span>🔐 Bóveda Privada</span>
              <span className='text-xs bg-[#6DB758] text-white px-1.5 py-0.5 rounded-full font-mono'>Activo</span>
            </Link>

            <Link
              href='/brand'
              className='inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/25 hover:bg-black/40 text-white text-sm font-semibold backdrop-blur-md transition-all hover:scale-105 border border-white/25 shadow-lg'
            >
              <span>✨ Manual de Marca</span>
              <span>&rarr;</span>
            </Link>
          </div>
        )}
      </main>

      {/* Modal de Confirmación para inicio de flujo de autenticación */}
      <AuthConfirmModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <style jsx>{`
        .bg-page {
        }

        ._font-grand-hotel {
          font-family: var(--grand-hotel);
        }
        ._font-arial {
          font-family: Arial, Helvetica, sans-serif;
        }
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}

export async function getServerSideProps() {
  const { getServiceSupabase } = await import('../lib/supabaseClient');
  const defaultSocial = await import('../data/social.json');
  const supabase = getServiceSupabase();

  let liveConfig = defaultSocial.default || defaultSocial;
  if (supabase) {
    try {
      const { data: row } = await supabase
        .from('site_config')
        .select('data')
        .eq('key', 'social')
        .single();
      if (row?.data) {
        liveConfig = row.data;
      }
    } catch (_) {}
  }

  return {
    props: {
      initialConfig: liveConfig,
    },
  };
}
