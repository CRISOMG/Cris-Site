import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SocialIcons from '../containers/SocialIcons';
import AuthConfirmModal from '../components/AuthConfirmModal';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [secretClicks, setSecretClicks] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Atajos de teclado sigilosos en el Home (Ctrl + K / Cmd + K o Ctrl + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmdOrCtrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
      const isCtrlShiftA = (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a';

      if (isCmdOrCtrlK || isCtrlShiftA) {
        e.preventDefault();
        setIsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Manejar toques y clicks múltiples sobre el lema de Platzi de forma sigilosa
  const handleSecretTrigger = () => {
    setSecretClicks((prev) => {
      const next = prev + 1;
      if (next >= 3) {
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

  return (
    <div className='bg-page bg-gradient-to-b from-yellow-400 to-orange-500 min-h-screen relative overflow-hidden'>
      <Head>
        <title>Cris Page</title>
        <link rel='icon' href='/favicon.ico' />
        <meta key='title' name='title' content='Cristian Caraballo - Frontend Developer with React.js | Next.js ' />
        <meta
          key='description'
          name='description'
          content='Desarrollador de Aplicaciones FullStack MERN | Next.js | Nest.js. Tecnologías/Metodologías: MERN & JAM Stack. visita mi pagina para saber más...'
        />

        <meta key='og:type' property='og:type' content='website' />
        <meta key='og:url' property='og:url' content='https://cris-page.vercel.app/' />
        <meta
          key='og:title'
          property='og:title'
          content='Cristian Caraballo - FullStack MERN | Next.js | Nest.js '
        />
        <meta
          key='og:description'
          property='og:description'
          content='Desarrollador de Aplicaciones FullStack MERN | Next.js | Nest.js. Tecnologías/Metodologías: MERN & JAM Stack. visita mi pagina para saber más...'
        />
        <meta key='og:image' property='og:image' content='https://cris-page.vercel.app/assets/meta-image.png' />

        <meta key='twitter:card' property='twitter:card' content='summary_large_image' />
        <meta key='twitter:url' property='twitter:url' content='https://cris-page.vercel.app/' />
        <meta
          key='twitter:title'
          property='twitter:title'
          content='Cristian Caraballo - FullStack MERN | Next.js | Nest.js '
        />
        <meta
          key='twitter:description'
          property='twitter:description'
          content='Desarrollador de Aplicaciones FullStack MERN | Next.js | Nest.js. Tecnologías/Metodologías: MERN & JAM Stack. visita mi pagina para saber más...'
        />
        <meta
          key='twitter:image'
          property='twitter:image'
          content='https://cris-page.vercel.app/assets/meta-image.jpg'
        />
      </Head>

      <main className='flex flex-col justify-center items-center text-center p-4 min-h-screen'>
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

        <SocialIcons />

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
        ._font-nova-round {
          font-family: var(--nova-round);
        }
      `}</style>
    </div>
  );
}
