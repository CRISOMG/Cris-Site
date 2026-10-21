import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Error from 'next/error';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function PrivatePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('vault');
  const [quickNote, setQuickNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  // Feature flags locales
  const [featureFlags, setFeatureFlags] = useState({
    vipAvailability: true,
    showMetrics: true,
    extendedBrandTools: true,
  });

  // Cargar notas y flags guardados
  useEffect(() => {
    try {
      const savedNote = localStorage.getItem('cris_private_note');
      if (savedNote) setQuickNote(savedNote);

      const savedFlags = localStorage.getItem('cris_feature_flags');
      if (savedFlags) setFeatureFlags(JSON.parse(savedFlags));
    } catch (e) {}
  }, []);

  const handleSaveNote = () => {
    localStorage.setItem('cris_private_note', quickNote);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const toggleFlag = (key) => {
    const updated = { ...featureFlags, [key]: !featureFlags[key] };
    setFeatureFlags(updated);
    localStorage.setItem('cris_feature_flags', JSON.stringify(updated));
  };

  // Protección de ruta: Si aún está cargando el estado inicial
  if (isLoading) {
    return (
      <div className='min-h-screen bg-[#07151C] text-[#F7EFC5] flex items-center justify-center'>
        <div className='flex items-center gap-3'>
          <svg className='animate-spin h-6 w-6 text-[#FFAA5B]' fill='none' viewBox='0 0 24 24'>
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z'></path>
          </svg>
          <span className='text-sm'>Verificando autorización...</span>
        </div>
      </div>
    );
  }

  // Si no está autenticado, sigilo total: mostrar 404 nativo
  if (!isAuthenticated) {
    return <Error statusCode={404} />;
  }

  return (
    <div className='min-h-screen bg-[#07151C] text-[#F7EFC5] flex flex-col relative overflow-hidden'>
      <Head>
        <title>Área Privada & Características Especiales | Cris</title>
        <meta name='robots' content='noindex, nofollow' />
      </Head>

      {/* Glows de fondo */}
      <div className='absolute -top-40 -right-40 w-96 h-96 bg-[#FFAA5B]/15 rounded-full blur-3xl pointer-events-none' />
      <div className='absolute -bottom-40 -left-40 w-96 h-96 bg-[#6DB758]/10 rounded-full blur-3xl pointer-events-none' />

      {/* Barra superior de control */}
      <header className='border-b border-white/10 bg-[#0D222D]/80 backdrop-blur-xl sticky top-0 z-40'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <Link
              href='/'
              className='p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10'
              title='Ir al Home Público'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                />
              </svg>
            </Link>

            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-lg font-bold text-[#F7EFC5]'>Bóveda & Espacio Privado</h1>
                <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6DB758]/20 text-[#6DB758] border border-[#6DB758]/30 flex items-center gap-1'>
                  <span className='w-1.5 h-1.5 rounded-full bg-[#6DB758] animate-pulse' />
                  Sesión OTP Activa
                </span>
              </div>
              <p className='text-xs text-white/50'>Bienvenido de vuelta, {user?.name || 'Cristian'}</p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <Link
              href='/brand'
              className='text-xs text-white/80 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 transition-colors'
            >
              Ver Manual de Marca
            </Link>

            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className='flex items-center gap-2 text-xs font-semibold text-red-300 hover:text-red-100 bg-red-500/10 hover:bg-red-500/20 px-3.5 py-2 rounded-xl border border-red-500/30 transition-colors'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                />
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className='max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 relative z-10'>
        {/* Navegación por pestañas */}
        <div className='flex items-center gap-2 border-b border-white/10 pb-4 mb-8 overflow-x-auto'>
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'vault'
                ? 'bg-[#FFAA5B] text-[#0D222D] shadow-md shadow-[#FFAA5B]/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🔐</span>
            <span>Bóveda & Enlaces Confidenciales</span>
          </button>

          <button
            onClick={() => setActiveTab('features')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'features'
                ? 'bg-[#FFAA5B] text-[#0D222D] shadow-md shadow-[#FFAA5B]/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>⚡</span>
            <span>Características Especiales</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'notes'
                ? 'bg-[#FFAA5B] text-[#0D222D] shadow-md shadow-[#FFAA5B]/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>📝</span>
            <span>Bloc de Notas Privado</span>
          </button>
        </div>

        {/* Pestaña 1: Bóveda de Recursos */}
        {activeTab === 'vault' && (
          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'>
              {/* Card 1: Manual de Marca & Identidad (Privado) */}
              <div className='bg-[#0D222D] border border-[#FFAA5B]/30 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between'>
                <div>
                  <div className='flex items-center justify-between mb-4'>
                    <span className='text-2xl'>🎨</span>
                    <span className='text-[10px] font-bold uppercase tracking-wider text-[#FFAA5B] bg-[#FFAA5B]/10 px-2.5 py-1 rounded-full border border-[#FFAA5B]/20'>
                      Privado
                    </span>
                  </div>
                  <h3 className='text-lg font-bold text-[#F7EFC5] mb-2'>Manual de Identidad & Marca</h3>
                  <p className='text-xs text-white/70 mb-5 leading-relaxed'>
                    Sistema de diseño completo, tokens de color CSS, tipografía, tono y voz, y arquitectura de producto Yourfocus.
                  </p>
                </div>
                <Link
                  href='/brand'
                  className='flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#FFAA5B] to-[#FBBF24] text-xs font-bold text-[#0D222D] shadow-md transition-transform hover:scale-[1.02]'
                >
                  <span>Abrir Manual de Marca</span>
                  <span>&rarr;</span>
                </Link>
              </div>

              {/* Card 2: CV y Documentos */}
              <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between'>
                <div>
                  <div className='flex items-center justify-between mb-4'>
                    <span className='text-2xl'>📄</span>
                    <span className='text-[10px] font-bold uppercase tracking-wider text-[#FFAA5B] bg-[#FFAA5B]/10 px-2.5 py-1 rounded-full border border-[#FFAA5B]/20'>
                      Confidencial
                    </span>
                  </div>
                  <h3 className='text-lg font-bold text-[#F7EFC5] mb-2'>CV & Tarifario Profesional</h3>
                  <p className='text-xs text-white/70 mb-5 leading-relaxed'>
                    Versiones completas con pretensiones salariales, esquemas de consultoría por hora y datos de contacto directo.
                  </p>
                </div>
                <div className='space-y-2.5'>
                  <a
                    href='#'
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Descarga de CV Confidencial de Cristian Caraballo activada.');
                    }}
                    className='flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-colors border border-white/10'
                  >
                    <span>Descargar CV Confidencial (PDF)</span>
                    <span className='text-[#FFAA5B]'>&darr;</span>
                  </a>
                  <a
                    href='#'
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Propuesta estándar de servicios copiada al portapapeles.');
                    }}
                    className='flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-colors border border-white/10'
                  >
                    <span>Plantilla de Propuesta</span>
                    <span className='text-[#FFAA5B]'>&rarr;</span>
                  </a>
                </div>
              </div>

              {/* Card 3: Enlaces a Entornos de Desarrollo */}
              <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between'>
                <div>
                  <div className='flex items-center justify-between mb-4'>
                    <span className='text-2xl'>🚀</span>
                    <span className='text-[10px] font-bold uppercase tracking-wider text-[#6DB758] bg-[#6DB758]/10 px-2.5 py-1 rounded-full border border-[#6DB758]/20'>
                      Infraestructura
                    </span>
                  </div>
                  <h3 className='text-lg font-bold text-[#F7EFC5] mb-2'>Paneles & Staging</h3>
                  <p className='text-xs text-white/70 mb-5 leading-relaxed'>
                    Acceso directo a tus paneles de control en la nube, repositorios privados y analíticas.
                  </p>
                </div>
                <div className='space-y-2.5'>
                  <a
                    href='https://vercel.com/dashboard'
                    target='_blank'
                    rel='noreferrer'
                    className='flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-colors border border-white/10'
                  >
                    <span>Panel de Vercel</span>
                    <span className='text-white/40'>&nearr;</span>
                  </a>
                  <a
                    href='https://github.com'
                    target='_blank'
                    rel='noreferrer'
                    className='flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-colors border border-white/10'
                  >
                    <span>GitHub Repos</span>
                    <span className='text-white/40'>&nearr;</span>
                  </a>
                </div>
              </div>

              {/* Card 4: Credenciales & Seguridad */}
              <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between'>
                <div>
                  <div className='flex items-center justify-between mb-4'>
                    <span className='text-2xl'>🛡️</span>
                    <span className='text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20'>
                      Seguridad
                    </span>
                  </div>
                  <h3 className='text-lg font-bold text-[#F7EFC5] mb-2'>Gestor de OTP & Acceso</h3>
                  <p className='text-xs text-white/70 mb-5 leading-relaxed'>
                    Autenticación por OTP en Gmail activa con validación criptográfica sin estado para Vercel.
                  </p>
                </div>
                <div className='p-3 rounded-xl bg-black/40 border border-white/10 text-xs space-y-1.5'>
                  <div className='flex justify-between text-white/60'>
                    <span>PIN Maestro:</span>
                    <span className='font-mono text-[#FFAA5B]'>Configurado</span>
                  </div>
                  <div className='flex justify-between text-white/60'>
                    <span>Sesión:</span>
                    <span className='text-white/90'>24 horas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña 2: Características Especiales */}
        {activeTab === 'features' && (
          <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6'>
            <div>
              <h2 className='text-xl font-bold text-[#F7EFC5] mb-1'>Interruptores de Características Especiales</h2>
              <p className='text-xs text-white/60'>
                Controla en tiempo real elementos y comportamientos visibles en el sitio público.
              </p>
            </div>

            <div className='space-y-4'>
              {/* Feature 1 */}
              <div className='flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-semibold text-sm text-[#F7EFC5]'>
                      Modo &quot;Open to Work VIP&quot; en el Home
                    </span>
                    <span className='text-[10px] px-2 py-0.5 rounded-full bg-[#FFAA5B]/20 text-[#FFAA5B] border border-[#FFAA5B]/30'>
                      Home Público
                    </span>
                  </div>
                  <p className='text-xs text-white/60'>
                    Muestra un distintivo destacado que invita a reclutadores y clientes a contactarte prioritariamente.
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => toggleFlag('vipAvailability')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    featureFlags.vipAvailability ? 'bg-[#6DB758]' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      featureFlags.vipAvailability ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Feature 2 */}
              <div className='flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-semibold text-sm text-[#F7EFC5]'>Métricas de Rendimiento & Crecimiento</span>
                    <span className='text-[10px] px-2 py-0.5 rounded-full bg-[#6DB758]/20 text-[#6DB758] border border-[#6DB758]/30'>
                      Analítica
                    </span>
                  </div>
                  <p className='text-xs text-white/60'>
                    Habilita la visualización de estadísticas rápidas de lectura y visitas en el Manual de Marca.
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => toggleFlag('showMetrics')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    featureFlags.showMetrics ? 'bg-[#6DB758]' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      featureFlags.showMetrics ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Feature 3 */}
              <div className='flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-semibold text-sm text-[#F7EFC5]'>Herramientas Extendidas de Marca</span>
                    <span className='text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30'>
                      Brand Hub
                    </span>
                  </div>
                  <p className='text-xs text-white/60'>
                    Desbloquea exportación de paleta de colores CSS y JSON con un clic dentro de <code>/brand</code>.
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => toggleFlag('extendedBrandTools')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    featureFlags.extendedBrandTools ? 'bg-[#6DB758]' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      featureFlags.extendedBrandTools ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña 3: Bloc de Notas Privado */}
        {activeTab === 'notes' && (
          <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-xl font-bold text-[#F7EFC5]'>Bloc de Notas Privado (Scratchpad)</h2>
                <p className='text-xs text-white/60'>
                  Guarda recordatorios, ideas de arquitectura o fragmentos de código. Se almacena localmente de forma segura.
                </p>
              </div>
              {noteSaved && (
                <span className='text-xs font-semibold text-[#6DB758] flex items-center gap-1 bg-[#6DB758]/15 px-3 py-1 rounded-full border border-[#6DB758]/30'>
                  ✓ ¡Guardado con éxito!
                </span>
              )}
            </div>

            <textarea
              rows={8}
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder='Escribe aquí tus ideas privadas, proyectos en desarrollo o notas rápidas...'
              className='w-full rounded-xl bg-black/40 border border-white/10 p-4 text-sm text-[#F7EFC5] focus:outline-none focus:border-[#FFAA5B] transition-colors leading-relaxed'
            />

            <div className='flex justify-end'>
              <button
                type='button'
                onClick={handleSaveNote}
                className='px-5 py-2.5 rounded-xl font-semibold text-xs text-[#0D222D] bg-[#FFAA5B] hover:bg-[#FFAA5B]/90 transition-all hover:scale-105'
              >
                Guardar Notas
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
