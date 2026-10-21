import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GithubIcon,
  TwitterIcon,
  PlatziIcon,
  LinkedinIcon,
  FigmaIcon,
  WhatsappIcon,
} from './svg-icons';

export default function FeaturesMatrixTab() {
  const { token } = useAuth();

  const [config, setConfig] = useState({
    flags: {
      vipAvailability: true,
      showMetrics: true,
      extendedBrandTools: true,
    },
    links: {
      whatsapp: {
        id: 'whatsapp',
        name: 'WhatsApp',
        enabled: true,
        url: 'https://wa.me/?text=Hola%20Cristian,%20vi%20tu%20sitio%20web!',
        color: '#25D366',
        description: 'Contacto directo vía chat',
      },
      linkedin: {
        id: 'linkedin',
        name: 'LinkedIn',
        enabled: true,
        url: 'https://linkedin.com/in/crisomg/',
        color: '#0A66C2',
        description: 'Perfil profesional',
      },
      github: {
        id: 'github',
        name: 'GitHub',
        enabled: true,
        url: 'https://github.com/CRISOMG',
        color: '#7C0052',
        description: 'Proyectos y repositorios',
      },
      platzi: {
        id: 'platzi',
        name: 'Platzi',
        enabled: true,
        url: 'https://platzi.com/@CrisOMG/',
        color: '#75FF34',
        description: 'Perfil de estudiante',
      },
      twitter: {
        id: 'twitter',
        name: 'Twitter / X',
        enabled: false,
        url: 'https://twitter.com/_crisomg',
        color: '#349DFF',
        description: 'Cuenta de X / Twitter',
      },
      figma: {
        id: 'figma',
        name: 'Figma',
        enabled: false,
        url: 'https://figma.com/@CrisOMg/',
        color: '#F24E1E',
        description: 'Diseños y prototipos',
      },
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [pushToGithub, setPushToGithub] = useState(false);
  const [commitMessage, setCommitMessage] = useState('chore(social): update link tree and feature flags matrix');
  const [branch, setBranch] = useState('main');
  const [isDev, setIsDev] = useState(true);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);

  // Cargar configuración de social.json
  useEffect(() => {
    fetch('/api/admin/features')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setConfig((prev) => ({
            flags: { ...prev.flags, ...res.data.flags },
            links: { ...prev.links, ...res.data.links },
          }));
        }
        if (res.branch) setBranch(res.branch);
        if (typeof res.isDev === 'boolean') setIsDev(res.isDev);
      })
      .catch((err) => console.error('Error cargando features:', err))
      .finally(() => setLoading(false));
  }, []);

  const toggleLink = (key) => {
    setConfig((prev) => ({
      ...prev,
      links: {
        ...prev.links,
        [key]: {
          ...prev.links[key],
          enabled: !prev.links[key]?.enabled,
        },
      },
    }));
  };

  const updateLinkUrl = (key, url) => {
    setConfig((prev) => ({
      ...prev,
      links: {
        ...prev.links,
        [key]: {
          ...prev.links[key],
          url,
        },
      },
    }));
  };

  const toggleFlag = (key) => {
    setConfig((prev) => ({
      ...prev,
      flags: {
        ...prev.flags,
        [key]: !prev.flags[key],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    setTerminalOutput('');

    try {
      const res = await fetch('/api/admin/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          socialConfig: config,
          gitAction: pushToGithub ? 'push' : 'none',
          commitMessage: commitMessage || 'chore(social): update link tree and feature flags matrix',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al guardar la matriz.');
      }

      // Guardar también en localStorage para flags cliente
      try {
        localStorage.setItem('cris_feature_flags', JSON.stringify(config.flags));
      } catch (_) {}

      const logs = [];
      if (data.results?.gitCommitOutput) logs.push('--- [GIT COMMIT] ---', data.results.gitCommitOutput);
      if (data.results?.gitPushOutput) logs.push('--- [GIT PUSH] ---', data.results.gitPushOutput);
      if (data.results?.gitError) logs.push('--- [GIT ERROR / ALERTA] ---', data.results.gitError);

      if (logs.length > 0) setTerminalOutput(logs.join('\n'));

      let msg = '✓ Matriz guardada exitosamente en el File System (src/data/social.json).';
      if (data.results?.pushed) msg += ' ¡Sincronizado con GitHub (Push)!';

      setStatus({
        type: data.results?.gitError && !data.results?.pushed ? 'warning' : 'success',
        text: msg,
      });
    } catch (err) {
      setStatus({
        type: 'error',
        text: err.message || 'Error inesperado al guardar.',
      });
    } finally {
      setSaving(false);
    }
  };

  const iconMap = {
    whatsapp: <WhatsappIcon />,
    linkedin: <LinkedinIcon />,
    github: <GithubIcon />,
    platzi: <PlatziIcon />,
    twitter: <TwitterIcon />,
    figma: <FigmaIcon />,
  };

  if (loading) {
    return (
      <div className='p-12 text-center text-white/60 flex items-center justify-center gap-3'>
        <svg className='animate-spin h-5 w-5 text-[#FFAA5B]' fill='none' viewBox='0 0 24 24'>
          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z'></path>
        </svg>
        <span>Cargando matriz de características...</span>
      </div>
    );
  }

  const activeLinksCount = Object.values(config.links).filter((l) => l.enabled).length;

  return (
    <div className='space-y-6'>
      {/* Banner Superior */}
      <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-xl'>⚡</span>
            <h2 className='text-lg font-bold text-[#F7EFC5]'>Matriz de Feature Flags & Link Tree Social</h2>
          </div>
          <p className='text-xs text-white/60 max-w-2xl leading-relaxed'>
            Administra qué enlaces sociales están activos en el Home público (incluyendo WhatsApp, LinkedIn, GitHub, Platzi)
            y oculta redes como Twitter/X o Figma con interruptores instantáneos. Guardado directo en{' '}
            <code className='text-[#FFAA5B] bg-black/40 px-1 py-0.5 rounded'>src/data/social.json</code>.
          </p>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          <span className='px-2.5 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-white/70 flex items-center gap-1.5'>
            <span className='w-2 h-2 rounded-full bg-[#6DB758]' />
            rama: <strong>{branch}</strong>
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
              : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}
        >
          <div className='flex items-center gap-2'>
            <span>{status.type === 'success' ? '✓' : '⚠'}</span>
            <span className='font-medium'>{status.text}</span>
          </div>
          <button onClick={() => setStatus(null)} className='text-white/40 hover:text-white'>✕</button>
        </div>
      )}

      {/* PREVISUALIZACIÓN EN VIVO DEL LINK TREE (Barra del Home) */}
      <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3'>
        <div className='flex items-center justify-between border-b border-white/10 pb-3'>
          <div className='flex items-center gap-2'>
            <span className='text-sm'>👁️</span>
            <h3 className='text-sm font-bold text-[#F7EFC5]'>Previsualización en Vivo de la Barra Social en el Home</h3>
          </div>
          <span className='text-xs font-medium text-[#FFAA5B] bg-[#FFAA5B]/10 px-2.5 py-1 rounded-full border border-[#FFAA5B]/20'>
            {activeLinksCount} enlaces activos
          </span>
        </div>

        {/* Mockup de la franja amarilla/naranja del Home */}
        <div className='rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 p-6 flex flex-col items-center justify-center shadow-inner'>
          <span className='text-[10px] uppercase font-bold text-black/60 tracking-wider mb-2 font-mono'>
            Vista del visitante en el Home
          </span>
          <div className='flex justify-around items-center w-full max-w-sm h-20 bg-black/5 rounded-2xl px-4 border border-black/10 backdrop-blur-sm'>
            {Object.entries(config.links).map(([key, item]) => {
              if (!item.enabled) return null;
              return (
                <div key={key} title={item.name} className='transform hover:scale-110 transition-transform'>
                  {iconMap[key]}
                </div>
              );
            })}
          </div>
          {activeLinksCount === 0 && (
            <p className='text-xs text-black/70 italic mt-2'>No hay enlaces habilitados en el link tree.</p>
          )}
        </div>
      </div>

      {/* MATRIZ DE ENLACES SOCIALES (Link Tree) */}
      <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4'>
        <div className='border-b border-white/10 pb-3'>
          <h3 className='text-base font-bold text-[#F7EFC5]'>Matriz de Redes & Botones Sociales</h3>
          <p className='text-xs text-white/60'>
            Activa o desactiva botones individuales y personaliza sus enlaces de destino.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Object.entries(config.links).map(([key, item]) => {
            const isEnabled = item.enabled;

            return (
              <div
                key={key}
                className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between space-y-3 ${
                  isEnabled
                    ? 'bg-white/5 border-white/15 shadow-md'
                    : 'bg-black/25 border-white/5 opacity-60'
                }`}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex items-center gap-3'>
                    <div
                      className='w-11 h-11 rounded-xl flex items-center justify-center border'
                      style={{
                        backgroundColor: `${item.color}15`,
                        borderColor: `${item.color}35`,
                      }}
                    >
                      <div className='scale-75 origin-center'>{iconMap[key]}</div>
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <h4 className='text-xs font-bold text-white'>{item.name}</h4>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isEnabled
                              ? 'bg-[#6DB758]/20 text-[#6DB758] border border-[#6DB758]/30'
                              : 'bg-white/10 text-white/50'
                          }`}
                        >
                          {isEnabled ? 'Activo' : 'Oculto'}
                        </span>
                      </div>
                      <p className='text-[10px] text-white/50'>{item.description}</p>
                    </div>
                  </div>

                  {/* Switch */}
                  <button
                    type='button'
                    onClick={() => toggleLink(key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? 'bg-[#6DB758]' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Input de URL */}
                <div>
                  <label className='block text-[10px] font-semibold text-white/60 mb-1'>URL de Destino</label>
                  <input
                    type='text'
                    value={item.url || ''}
                    onChange={(e) => updateLinkUrl(key, e.target.value)}
                    placeholder={
                      key === 'whatsapp'
                        ? 'https://wa.me/573000000000?text=Hola!'
                        : 'https://...'
                    }
                    className='w-full rounded-xl bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-[#F7EFC5] focus:outline-none focus:border-[#FFAA5B] font-mono'
                  />
                  {key === 'whatsapp' && (
                    <span className='text-[10px] text-white/40 block mt-1 leading-tight'>
                      Tip: Usa formato <code>https://wa.me/&lt;código_país&gt;&lt;número&gt;</code> para abrir chat directo.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MATRIZ DE FEATURE FLAGS DEL SITIO */}
      <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4'>
        <div className='border-b border-white/10 pb-3'>
          <h3 className='text-base font-bold text-[#F7EFC5]'>Interruptores de Características del Sitio</h3>
          <p className='text-xs text-white/60'>
            Configuraciones de comportamiento para el sitio público y el manual de marca.
          </p>
        </div>

        <div className='space-y-3'>
          {/* Flag 1 */}
          <div className='flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10'>
            <div className='space-y-0.5'>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-xs text-[#F7EFC5]'>Modo &quot;Open to Work VIP&quot; en el Home</span>
                <span className='text-[9px] px-2 py-0.5 rounded-full bg-[#FFAA5B]/20 text-[#FFAA5B] border border-[#FFAA5B]/30'>
                  Home Público
                </span>
              </div>
              <p className='text-[11px] text-white/60'>
                Muestra un distintivo destacado que invita a reclutadores y clientes a contactarte prioritariamente.
              </p>
            </div>
            <button
              type='button'
              onClick={() => toggleFlag('vipAvailability')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.flags.vipAvailability ? 'bg-[#6DB758]' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  config.flags.vipAvailability ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Flag 2 */}
          <div className='flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10'>
            <div className='space-y-0.5'>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-xs text-[#F7EFC5]'>Métricas de Rendimiento & Crecimiento</span>
                <span className='text-[9px] px-2 py-0.5 rounded-full bg-[#6DB758]/20 text-[#6DB758] border border-[#6DB758]/30'>
                  Analítica
                </span>
              </div>
              <p className='text-[11px] text-white/60'>
                Habilita la visualización de estadísticas rápidas de lectura y visitas en el Manual de Marca.
              </p>
            </div>
            <button
              type='button'
              onClick={() => toggleFlag('showMetrics')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.flags.showMetrics ? 'bg-[#6DB758]' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  config.flags.showMetrics ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Flag 3 */}
          <div className='flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10'>
            <div className='space-y-0.5'>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-xs text-[#F7EFC5]'>Herramientas Extendidas de Marca</span>
                <span className='text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30'>
                  Brand Hub
                </span>
              </div>
              <p className='text-[11px] text-white/60'>
                Desbloquea exportación de paleta de colores CSS y JSON con un clic dentro de <code>/brand</code>.
              </p>
            </div>
            <button
              type='button'
              onClick={() => toggleFlag('extendedBrandTools')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.flags.extendedBrandTools ? 'bg-[#6DB758]' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  config.flags.extendedBrandTools ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* BARRA DE ACCIÓN Y GUARDADO */}
      <div className='bg-[#0D222D] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          <label className='flex items-center gap-3 cursor-pointer'>
            <input
              type='checkbox'
              checked={pushToGithub}
              onChange={(e) => setPushToGithub(e.target.checked)}
              className='rounded border-white/20 bg-black/40 text-[#FFAA5B] focus:ring-[#FFAA5B]'
            />
            <div className='text-xs'>
              <span className='font-semibold text-[#F7EFC5]'>🚀 Subir al repositorio de GitHub (Push automático)</span>
              <span className='text-white/40 block text-[11px]'>
                Hará commit y push de <code className='text-[#6DB758]'>src/data/social.json</code> a <strong>{branch}</strong>.
              </span>
            </div>
          </label>

          <button
            type='button'
            disabled={saving}
            onClick={handleSave}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              pushToGithub
                ? 'bg-gradient-to-r from-[#6DB758] to-[#5BA546] text-white hover:brightness-110 shadow-lg shadow-[#6DB758]/20'
                : 'bg-gradient-to-r from-[#FFAA5B] to-[#FBBF24] text-[#0D222D] hover:scale-[1.02] shadow-lg shadow-[#FFAA5B]/20'
            } disabled:opacity-50`}
          >
            {saving ? (
              <>
                <svg className='animate-spin h-4 w-4' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z'></path>
                </svg>
                <span>Guardando...</span>
              </>
            ) : (
              <span>{pushToGithub ? '🚀 Guardar y Subir a GitHub' : '💾 Guardar en File System'}</span>
            )}
          </button>
        </div>

        {pushToGithub && (
          <div className='animate-fadeIn pl-2 border-l-2 border-[#6DB758] space-y-1'>
            <label className='block text-[11px] font-semibold text-white/70'>Mensaje de Commit</label>
            <input
              type='text'
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder='chore(social): update link tree and feature flags matrix'
              className='w-full rounded-lg bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-white/90 focus:outline-none focus:border-[#6DB758]'
            />
          </div>
        )}

        {/* Registro desplegable */}
        {terminalOutput && (
          <div className='pt-2 animate-fadeIn border-t border-white/10'>
            <button
              type='button'
              onClick={() => setShowTerminal(!showTerminal)}
              className='text-[11px] text-white/50 hover:text-white flex items-center justify-between w-full py-1'
            >
              <span>Salida de ejecución Git</span>
              <span>{showTerminal ? '▲ Ocultar' : '▼ Ver'}</span>
            </button>
            {showTerminal && (
              <pre className='mt-1 p-3 rounded-xl bg-black/80 border border-white/10 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-40 leading-relaxed whitespace-pre-wrap'>
                {terminalOutput}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
