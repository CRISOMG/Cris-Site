import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function MetaEditorTab() {
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    pageTitle: '',
    metaTitle: '',
    description: '',
    canonicalUrl: 'https://cris-page.vercel.app/',
    author: 'Cristian Caraballo',
    keywords: '',
    og: {
      type: 'website',
      url: 'https://cris-page.vercel.app/',
      title: '',
      description: '',
      image: 'https://cris-page.vercel.app/assets/meta-image.png',
      imageAlt: '',
    },
    twitter: {
      card: 'summary_large_image',
      url: 'https://cris-page.vercel.app/',
      title: '',
      description: '',
      image: 'https://cris-page.vercel.app/assets/meta-image.jpg',
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePreview, setActivePreview] = useState('twitter'); // 'twitter' | 'google' | 'whatsapp'
  const [gitInfo, setGitInfo] = useState({ branch: 'main', available: true, hasUncommitted: false });
  const [isDev, setIsDev] = useState(true);
  const [commitMessage, setCommitMessage] = useState('chore(seo): update meta tags and social preview');
  const [regenerateImages, setRegenerateImages] = useState(false);
  const [pushToGithub, setPushToGithub] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', text: '', details: '' }
  const [terminalOutput, setTerminalOutput] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());

  // Cargar metadatos iniciales desde la API
  useEffect(() => {
    fetch('/api/admin/meta')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.metadata) {
          setFormData((prev) => ({
            ...prev,
            ...data.metadata,
            og: { ...prev.og, ...data.metadata.og },
            twitter: { ...prev.twitter, ...data.metadata.twitter },
          }));
        }
        if (data.git) setGitInfo(data.git);
        if (typeof data.isDev === 'boolean') setIsDev(data.isDev);
      })
      .catch((err) => {
        console.error('Error al cargar metadatos:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Sincronizar campos principales a OG y Twitter con 1 clic
  const handleSyncToSocial = () => {
    setFormData((prev) => ({
      ...prev,
      og: {
        ...prev.og,
        title: prev.metaTitle || prev.pageTitle,
        description: prev.description,
      },
      twitter: {
        ...prev.twitter,
        title: prev.metaTitle || prev.pageTitle,
        description: prev.description,
      },
    }));
    setStatus({
      type: 'info',
      text: 'Campos copiados a Open Graph y Twitter Cards.',
    });
    setTimeout(() => setStatus(null), 3000);
  };

  // Guardar en File System y opcionalmente Commit/Push
  const handleSave = async (options = {}) => {
    const doRegenerate = options.regenerate ?? regenerateImages;
    const doPush = options.push ?? pushToGithub;
    const gitAction = doPush ? 'push' : options.commit ? 'commit' : 'none';

    setSaving(true);
    setStatus(null);
    setTerminalOutput('');

    try {
      const res = await fetch('/api/admin/meta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          metadata: formData,
          regenerateImages: doRegenerate,
          gitAction,
          commitMessage: commitMessage || 'chore(seo): update meta tags and social preview',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al guardar los metadatos.');
      }

      // Consolidar logs de terminal si se ejecutaron screenshots o git
      const logs = [];
      if (data.results?.imageOutput) {
        logs.push('--- [SCREENSHOT GENERATOR] ---', data.results.imageOutput);
      }
      if (data.results?.gitCommitOutput) {
        logs.push('--- [GIT COMMIT] ---', data.results.gitCommitOutput);
      }
      if (data.results?.gitPushOutput) {
        logs.push('--- [GIT PUSH] ---', data.results.gitPushOutput);
      }
      if (data.results?.gitError) {
        logs.push('--- [GIT ERROR / ALERTA] ---', data.results.gitError);
      }

      if (logs.length > 0) {
        setTerminalOutput(logs.join('\n'));
      }

      // Si se regeneraron imágenes, forzar recarga en el navegador con nuevo timestamp
      if (data.results?.imagesRegenerated) {
        setImageTimestamp(Date.now());
      }

      let successText = '✓ Guardado exitoso en el File System (src/data/metadata.json).';
      if (data.results?.imagesRegenerated) {
        successText += ' ¡Screenshots de Hero regenerados!';
      }
      if (data.results?.pushed) {
        successText += ' y cambios subidos a GitHub correctamente.';
      } else if (data.results?.gitError) {
        successText += ' (Nota: Git push reportó un detalle, revisa la consola abajo).';
      }

      setStatus({
        type: data.results?.gitError && !data.results?.pushed ? 'warning' : 'success',
        text: successText,
      });

      // Actualizar estado de git
      setGitInfo((prev) => ({
        ...prev,
        hasUncommitted: false,
      }));
    } catch (err) {
      setStatus({
        type: 'error',
        text: err.message || 'Error inesperado al guardar.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Contador de caracteres para la meta descripción
  const descLength = formData.description?.length || 0;
  const getLengthColor = () => {
    if (descLength === 0) return 'text-white/40';
    if (descLength >= 120 && descLength <= 160) return 'text-[#6DB758]';
    if (descLength < 120) return 'text-[#FFAA5B]';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className='p-12 text-center text-white/60 flex items-center justify-center gap-3'>
        <svg className='animate-spin h-5 w-5 text-[#FFAA5B]' fill='none' viewBox='0 0 24 24'>
          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z'></path>
        </svg>
        <span>Cargando configuración de meta tags...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Banner Superior con Estado */}
      <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-xl'>🏷️</span>
            <h2 className='text-lg font-bold text-[#F7EFC5]'>Editor de Meta Tags, SEO & Social Cards</h2>
          </div>
          <p className='text-xs text-white/60 max-w-2xl leading-relaxed'>
            Administra los títulos, descripciones y portadas Open Graph / Twitter Cards. Los cambios se guardan
            directamente en <code className='text-[#FFAA5B] bg-black/40 px-1 py-0.5 rounded'>src/data/metadata.json</code> y se sincronizan con el Home público en tiempo real.
          </p>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          <span className='px-2.5 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-white/70 flex items-center gap-1.5'>
            <span className='w-2 h-2 rounded-full bg-[#6DB758]' />
            rama: <strong>{gitInfo.branch}</strong>
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isDev ? 'bg-[#FFAA5B]/15 text-[#FFAA5B] border border-[#FFAA5B]/30' : 'bg-white/10 text-white/70'}`}>
            {isDev ? 'Modo Dev (FS Activo)' : 'Producción'}
          </span>
        </div>
      </div>

      {/* Alerta de Estado */}
      {status && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            status.type === 'success'
              ? 'bg-[#6DB758]/15 border-[#6DB758]/40 text-[#6DB758]'
              : status.type === 'warning'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : status.type === 'info'
              ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
              : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}
        >
          <div className='flex items-center gap-2'>
            <span>{status.type === 'success' ? '✓' : 'ℹ'}</span>
            <span className='font-medium'>{status.text}</span>
          </div>
          <button onClick={() => setStatus(null)} className='text-white/40 hover:text-white'>✕</button>
        </div>
      )}

      {/* Layout de 2 Columnas: Formulario a la Izquierda | Vista Previa a la Derecha */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        
        {/* =======================================================
            COLUMNA IZQUIERDA: FORMULARIO (7 cols)
        ======================================================= */}
        <div className='lg:col-span-7 space-y-5'>
          
          {/* Sección 1: SEO Básico & General */}
          <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4'>
            <div className='flex items-center justify-between pb-3 border-b border-white/10'>
              <div className='flex items-center gap-2'>
                <span className='text-sm'>🔍</span>
                <h3 className='text-sm font-bold text-[#F7EFC5]'>SEO General & Búsqueda</h3>
              </div>
              <button
                type='button'
                onClick={handleSyncToSocial}
                title='Copia el título y descripción general a Open Graph y Twitter Cards automáticamente'
                className='text-[11px] font-semibold text-[#FFAA5B] hover:text-white bg-[#FFAA5B]/10 hover:bg-[#FFAA5B]/20 border border-[#FFAA5B]/30 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5'
              >
                <span>⚡</span>
                <span>Copiar a Social Cards</span>
              </button>
            </div>

            {/* Title Tag */}
            <div>
              <label className='block text-xs font-semibold text-white/80 mb-1.5'>
                Título de la Pestaña del Navegador (<code>&lt;title&gt;</code>)
              </label>
              <input
                type='text'
                value={formData.pageTitle}
                onChange={(e) => setFormData({ ...formData, pageTitle: e.target.value })}
                placeholder='Cris Page - Cristian Caraballo'
                className='w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2 text-xs text-[#F7EFC5] focus:outline-none focus:border-[#FFAA5B] transition-colors font-medium'
              />
            </div>

            {/* Meta Title */}
            <div>
              <label className='block text-xs font-semibold text-white/80 mb-1.5'>
                Título Principal SEO (<code>meta name=&quot;title&quot;</code>)
              </label>
              <input
                type='text'
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder='Cristian Caraballo - Javascript Product Engineer'
                className='w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2 text-xs text-[#F7EFC5] focus:outline-none focus:border-[#FFAA5B] transition-colors font-medium'
              />
            </div>

            {/* Meta Description */}
            <div>
              <div className='flex items-center justify-between mb-1.5'>
                <label className='text-xs font-semibold text-white/80'>
                  Meta Descripción (<code>meta name=&quot;description&quot;</code>)
                </label>
                <span className={`text-[11px] font-mono ${getLengthColor()}`}>
                  {descLength} / 160 caracteres {descLength >= 120 && descLength <= 160 ? '(Óptimo)' : ''}
                </span>
              </div>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder='Descripción concisa que resume tu perfil profesional y tecnologías...'
                className='w-full rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-[#F7EFC5] focus:outline-none focus:border-[#FFAA5B] transition-colors leading-relaxed'
              />
            </div>

            {/* URL Canónica & Autor */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1'>
              <div>
                <label className='block text-xs font-semibold text-white/70 mb-1'>URL Canónica</label>
                <input
                  type='url'
                  value={formData.canonicalUrl}
                  onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                  placeholder='https://cris-page.vercel.app/'
                  className='w-full rounded-xl bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-white/90 focus:outline-none focus:border-[#FFAA5B]'
                />
              </div>
              <div>
                <label className='block text-xs font-semibold text-white/70 mb-1'>Autor</label>
                <input
                  type='text'
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder='Cristian Caraballo'
                  className='w-full rounded-xl bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-white/90 focus:outline-none focus:border-[#FFAA5B]'
                />
              </div>
            </div>

            {/* Palabras Clave */}
            <div>
              <label className='block text-xs font-semibold text-white/70 mb-1'>
                Palabras Clave (Keywords, separadas por comas)
              </label>
              <input
                type='text'
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder='Javascript Product Engineer, React, Next.js, Platzi'
                className='w-full rounded-xl bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-white/90 focus:outline-none focus:border-[#FFAA5B]'
              />
            </div>
          </div>

          {/* Sección 2: Open Graph (WhatsApp, Facebook, LinkedIn) */}
          <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4'>
            <div className='flex items-center gap-2 pb-3 border-b border-white/10'>
              <span className='text-sm'>💬</span>
              <h3 className='text-sm font-bold text-[#F7EFC5]'>Open Graph (WhatsApp, LinkedIn, Slack)</h3>
            </div>

            <div>
              <label className='block text-xs font-semibold text-white/80 mb-1'>
                og:title (Título para enlaces sociales)
              </label>
              <input
                type='text'
                value={formData.og?.title || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    og: { ...formData.og, title: e.target.value },
                  })
                }
                placeholder={formData.metaTitle}
                className='w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2 text-xs text-[#F7EFC5] focus:outline-none focus:border-[#FFAA5B]'
              />
            </div>

            <div>
              <label className='block text-xs font-semibold text-white/80 mb-1'>
                og:description
              </label>
              <textarea
                rows={2}
                value={formData.og?.description || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    og: { ...formData.og, description: e.target.value },
                  })
                }
                placeholder={formData.description}
                className='w-full rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-[#F7EFC5] focus:outline-none focus:border-[#FFAA5B]'
              />
            </div>

            <div>
              <label className='block text-xs font-semibold text-white/80 mb-1'>
                og:image (Ruta de la imagen de portada cuadrada)
              </label>
              <input
                type='text'
                value={formData.og?.image || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    og: { ...formData.og, image: e.target.value },
                  })
                }
                placeholder='https://cris-page.vercel.app/assets/meta-image.png'
                className='w-full rounded-xl bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-white/80 font-mono focus:outline-none focus:border-[#FFAA5B]'
              />
            </div>
          </div>

          {/* Sección 3: Twitter / X Card */}
          <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4'>
            <div className='flex items-center gap-2 pb-3 border-b border-white/10'>
              <span className='text-sm'>🐦</span>
              <h3 className='text-sm font-bold text-[#F7EFC5]'>Twitter / X Card</h3>
            </div>

            <div>
              <label className='block text-xs font-semibold text-white/80 mb-1'>
                twitter:title
              </label>
              <input
                type='text'
                value={formData.twitter?.title || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    twitter: { ...formData.twitter, title: e.target.value },
                  })
                }
                placeholder={formData.metaTitle}
                className='w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2 text-xs text-[#F7EFC5] focus:outline-none focus:border-[#FFAA5B]'
              />
            </div>

            <div>
              <label className='block text-xs font-semibold text-white/80 mb-1'>
                twitter:description
              </label>
              <textarea
                rows={2}
                value={formData.twitter?.description || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    twitter: { ...formData.twitter, description: e.target.value },
                  })
                }
                placeholder={formData.description}
                className='w-full rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-[#F7EFC5] focus:outline-none focus:border-[#FFAA5B]'
              />
            </div>

            <div>
              <label className='block text-xs font-semibold text-white/80 mb-1'>
                twitter:image (Ruta de la imagen de portada horizontal 1200x628)
              </label>
              <input
                type='text'
                value={formData.twitter?.image || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    twitter: { ...formData.twitter, image: e.target.value },
                  })
                }
                placeholder='https://cris-page.vercel.app/assets/meta-image.jpg'
                className='w-full rounded-xl bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-white/80 font-mono focus:outline-none focus:border-[#FFAA5B]'
              />
            </div>
          </div>
        </div>

        {/* =======================================================
            COLUMNA DERECHA: PREVIEWS & CONTROLES DE ACCIÓN (5 cols)
        ======================================================= */}
        <div className='lg:col-span-5 space-y-5'>
          
          {/* Panel de Previsualización en Vivo */}
          <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 sticky top-24'>
            <div className='flex items-center justify-between pb-3 border-b border-white/10'>
              <div className='flex items-center gap-2'>
                <span className='text-sm'>👁️</span>
                <h3 className='text-sm font-bold text-[#F7EFC5]'>Previsualización en Vivo</h3>
              </div>

              {/* Selector de plataforma */}
              <div className='flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10'>
                <button
                  type='button'
                  onClick={() => setActivePreview('twitter')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    activePreview === 'twitter'
                      ? 'bg-[#FFAA5B] text-[#0D222D]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  X / Twitter
                </button>
                <button
                  type='button'
                  onClick={() => setActivePreview('google')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    activePreview === 'google'
                      ? 'bg-[#FFAA5B] text-[#0D222D]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Google
                </button>
                <button
                  type='button'
                  onClick={() => setActivePreview('whatsapp')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    activePreview === 'whatsapp'
                      ? 'bg-[#FFAA5B] text-[#0D222D]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  WhatsApp
                </button>
              </div>
            </div>

            {/* PREVIEW: Twitter / X Card (Landscape) */}
            {activePreview === 'twitter' && (
              <div className='bg-black border border-white/15 rounded-2xl overflow-hidden shadow-2xl animate-fadeIn'>
                {/* Imagen Landscape */}
                <div className='relative aspect-[1200/628] w-full bg-[#D96503] overflow-hidden'>
                  <img
                    src={`/assets/meta-image.jpg?t=${imageTimestamp}`}
                    alt='Twitter Card Preview'
                    className='w-full h-full object-cover'
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className='absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white/80 font-mono'>
                    1200 × 628
                  </div>
                </div>
                {/* Detalles de la card */}
                <div className='p-3 bg-[#16181c] border-t border-white/10 space-y-1'>
                  <span className='text-[11px] text-white/50 block'>cris-page.vercel.app</span>
                  <h4 className='text-xs font-bold text-white line-clamp-1'>
                    {formData.twitter?.title || formData.metaTitle || formData.pageTitle}
                  </h4>
                  <p className='text-[11px] text-white/70 line-clamp-2 leading-relaxed'>
                    {formData.twitter?.description || formData.description}
                  </p>
                </div>
              </div>
            )}

            {/* PREVIEW: Google SERP */}
            {activePreview === 'google' && (
              <div className='bg-[#202124] border border-white/15 rounded-2xl p-4 shadow-2xl animate-fadeIn space-y-1.5'>
                <div className='flex items-center gap-2 text-xs'>
                  <span className='w-4 h-4 rounded-full bg-[#FFAA5B] flex items-center justify-center text-[10px] text-[#0D222D] font-bold'>
                    C
                  </span>
                  <div className='leading-tight'>
                    <div className='text-xs text-white/90 font-medium'>Cristian Caraballo</div>
                    <div className='text-[10px] text-white/50'>https://cris-page.vercel.app</div>
                  </div>
                </div>
                <h4 className='text-sm text-[#8ab4f8] hover:underline cursor-pointer font-medium pt-1 line-clamp-1'>
                  {formData.metaTitle || formData.pageTitle}
                </h4>
                <p className='text-xs text-[#bdc1c6] line-clamp-2 leading-relaxed'>
                  {formData.description}
                </p>
              </div>
            )}

            {/* PREVIEW: WhatsApp / Messenger (Square) */}
            {activePreview === 'whatsapp' && (
              <div className='bg-[#0b141a] border border-[#202c33] rounded-2xl p-3 shadow-2xl animate-fadeIn'>
                <div className='bg-[#202c33] rounded-xl overflow-hidden max-w-sm'>
                  <div className='aspect-square w-full bg-[#D96503] relative overflow-hidden'>
                    <img
                      src={`/assets/meta-image.png?t=${imageTimestamp}`}
                      alt='WhatsApp Square Preview'
                      className='w-full h-full object-cover'
                    />
                    <div className='absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white/80 font-mono'>
                      600 × 600
                    </div>
                  </div>
                  <div className='p-2.5 space-y-1 border-t border-white/5'>
                    <h5 className='text-xs font-semibold text-white line-clamp-1'>
                      {formData.og?.title || formData.metaTitle || formData.pageTitle}
                    </h5>
                    <p className='text-[11px] text-white/70 line-clamp-2'>
                      {formData.og?.description || formData.description}
                    </p>
                    <span className='text-[10px] text-white/40 block pt-0.5'>cris-page.vercel.app</span>
                  </div>
                </div>
              </div>
            )}

            {/* Opciones y Automatización al Guardar */}
            <div className='pt-3 border-t border-white/10 space-y-3'>
              <h4 className='text-xs font-bold text-white/80 uppercase tracking-wider'>
                Opciones de Sincronización
              </h4>

              {/* Toggle: Regenerar Screenshots del Hero */}
              <label className='flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors'>
                <input
                  type='checkbox'
                  checked={regenerateImages}
                  onChange={(e) => setRegenerateImages(e.target.checked)}
                  className='mt-0.5 rounded border-white/20 bg-black/40 text-[#FFAA5B] focus:ring-[#FFAA5B]'
                />
                <div className='text-xs'>
                  <span className='font-semibold text-[#F7EFC5] block'>📸 Regenerar Screenshots del Hero</span>
                  <span className='text-white/50 text-[11px]'>
                    Ejecuta el script headless para actualizar <code className='text-[#FFAA5B]'>meta-image.jpg</code> y <code className='text-[#FFAA5B]'>.png</code> automáticamente.
                  </span>
                </div>
              </label>

              {/* Toggle: Commit & Push a GitHub */}
              <label className='flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors'>
                <input
                  type='checkbox'
                  checked={pushToGithub}
                  onChange={(e) => setPushToGithub(e.target.checked)}
                  className='mt-0.5 rounded border-white/20 bg-black/40 text-[#FFAA5B] focus:ring-[#FFAA5B]'
                />
                <div className='text-xs'>
                  <span className='font-semibold text-[#F7EFC5] block'>🚀 Subir al repositorio de GitHub (Push)</span>
                  <span className='text-white/50 text-[11px]'>
                    Hace <code className='text-[#6DB758]'>git commit</code> y <code className='text-[#6DB758]'>git push origin {gitInfo.branch}</code> directamente.
                  </span>
                </div>
              </label>

              {/* Input mensaje de commit si Push está activado */}
              {pushToGithub && (
                <div className='animate-fadeIn pl-2 border-l-2 border-[#6DB758] space-y-1'>
                  <label className='block text-[11px] font-semibold text-white/70'>Mensaje de Commit</label>
                  <input
                    type='text'
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder='chore(seo): update meta tags and social preview'
                    className='w-full rounded-lg bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-white/90 focus:outline-none focus:border-[#6DB758]'
                  />
                </div>
              )}

              {/* Botones Principales de Acción */}
              <div className='space-y-2 pt-2'>
                <button
                  type='button'
                  disabled={saving}
                  onClick={() => handleSave()}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    pushToGithub
                      ? 'bg-gradient-to-r from-[#6DB758] to-[#5BA546] text-white hover:brightness-110 shadow-lg shadow-[#6DB758]/20'
                      : 'bg-gradient-to-r from-[#FFAA5B] to-[#FBBF24] text-[#0D222D] hover:scale-[1.02] shadow-lg shadow-[#FFAA5B]/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {saving ? (
                    <>
                      <svg className='animate-spin h-4 w-4' fill='none' viewBox='0 0 24 24'>
                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z'></path>
                      </svg>
                      <span>Procesando y guardando...</span>
                    </>
                  ) : (
                    <>
                      <span>{pushToGithub ? '🚀 Guardar y Subir a GitHub' : '💾 Guardar en File System'}</span>
                    </>
                  )}
                </button>

                {/* Botón rápido solo para capturar imágenes */}
                <button
                  type='button'
                  disabled={saving}
                  onClick={() => handleSave({ regenerate: true, push: false })}
                  className='w-full py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-1.5'
                >
                  <span>📸</span>
                  <span>Solo Capturar Fotos del Hero Ahora</span>
                </button>
              </div>

              {/* Acordeón de Salida de Terminal / Logs */}
              {terminalOutput && (
                <div className='pt-2 animate-fadeIn'>
                  <button
                    type='button'
                    onClick={() => setShowTerminal(!showTerminal)}
                    className='text-[11px] text-white/50 hover:text-white flex items-center justify-between w-full py-1'
                  >
                    <span>Registro de ejecución (Git / Headless)</span>
                    <span>{showTerminal ? '▲ Ocultar' : '▼ Ver'}</span>
                  </button>
                  {showTerminal && (
                    <pre className='mt-1 p-3 rounded-xl bg-black/80 border border-white/10 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-48 leading-relaxed whitespace-pre-wrap'>
                      {terminalOutput}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
