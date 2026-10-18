import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function BrandManual() {
  const [copiedText, setCopiedText] = useState('');
  const [activeTab, setActiveTab] = useState('tech');
  const [activeCircle, setActiveCircle] = useState('why');
  const [customPreviewText, setCustomPreviewText] = useState('Transforma tu monólogo interno en sistemas de ejecución');

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label || text);
    setTimeout(() => setCopiedText(''), 2200);
  };

  const colorTokens = [
    {
      name: 'Dark Petrol',
      hex: '#0D222D',
      variable: 'var(--brand-navy)',
      role: 'Fondo Principal (Dark Base)',
      usage: 'Background de pantalla, estructura dark mode, contraste de alta concentración.',
      lightText: true,
      border: false,
    },
    {
      name: 'Glass Surface',
      hex: 'rgba(255, 255, 255, 0.05)',
      variable: 'var(--brand-surface)',
      role: 'Superficie de Tarjetas',
      usage: 'Tarjetas flotantes con blur(12px), elevación sutil y separación sin ruido.',
      lightText: true,
      border: true,
    },
    {
      name: 'Warm Cream',
      hex: '#F7EFC5',
      variable: 'var(--brand-cream)',
      role: 'Texto Primario & Acentos Claros',
      usage: 'Títulos, copy editorial, lectura descansada sobre fondo oscuro.',
      lightText: false,
      border: false,
    },
    {
      name: 'Brand Amber / Orange',
      hex: '#FFAA5B',
      variable: 'var(--brand-orange)',
      role: 'Acento Primario (Energía & Foco)',
      usage: 'Botones primarios, llamadas a la acción (CTA), badges y enlaces clave.',
      lightText: false,
      border: false,
    },
    {
      name: 'Deep Orange',
      hex: '#D96503',
      variable: 'var(--brand-orange-deep)',
      role: 'Acento Secundario de Tracción',
      usage: 'Hover states, sombras con brillo (glow) y degradados de energía.',
      lightText: true,
      border: false,
    },
    {
      name: 'Cris Gradient Amber',
      hex: '#FBBF24',
      variable: 'var(--brand-yellow)',
      role: 'Herencia de Marca Cris-Site',
      usage: 'Gradientes con naranja (#FBBF24 → #F97316), insignias y avatares.',
      lightText: false,
      border: false,
    },
    {
      name: 'Organic Green',
      hex: '#6DB758',
      variable: 'var(--brand-green)',
      role: 'Validación & Crecimiento (Kaizen)',
      usage: 'Badges de disponibilidad, métricas de éxito, checkmarks e impacto.',
      lightText: false,
      border: false,
    },
    {
      name: 'Warm Terracotta',
      hex: '#AB6552',
      variable: 'var(--brand-terracotta)',
      role: 'Estructura & Arquitectura',
      usage: 'Acento terroso en diagramas, detalles técnicos y balance cromático.',
      lightText: true,
      border: false,
    },
  ];

  const pitchVersions = {
    tech: {
      title: 'Para Tech Leads & Empresas (B2B / Reclutadores)',
      badge: 'Senior Engineering',
      headline: 'FullStack Engineer (+4 años) especializado en Arquitecturas Limpias y Resilientes',
      body: 'FullStack Software Engineer con sólida experiencia liderando desarrollo web y backend escalable con Vue 3 / Nuxt 3, React / Next.js y NestJS. Especialista en Clean Architecture (SOLID, DDD), despliegue serverless en AWS y automatización de flujos con N8N. Orientado a transformar requerimientos complejos en software mantenible y de alto rendimiento.',
      tags: ['Clean Architecture', 'Nuxt 3 & Next.js', 'NestJS / TypeScript', 'AWS Serverless', 'PostgreSQL / Supabase'],
    },
    startup: {
      title: 'Para Startups, Emprendedores & Clientes Freelance',
      badge: 'Product Delivery',
      headline: 'De la Idea al Producto Escalable: Desarrollo FullStack de Alto Impacto',
      body: 'Ayudo a fundadores y empresas a convertir visiones en plataformas SaaS operativas y productos digitales rápidos, pulidos y listos para escalar. Combino agilidad en frontend y backend robusto con integraciones de Inteligencia Artificial para acelerar el time-to-market sin deuda técnica.',
      tags: ['Lanzamiento de MVPs', 'SaaS Scalable', 'Integraciones IA / Webhooks', 'Diseño UX Moderno', 'Automatización Kaizen'],
    },
    community: {
      title: 'Para la Comunidad Tech & Creadores Indie (Indie Maker)',
      badge: 'Solopreneur & Maker',
      headline: 'Construyendo Herramientas para la Autogestión Cognitiva y la Ejecución',
      body: 'Creador de Yourfocus.io y aprendiz perpetuo (Platzi Eternal Student). Creo en el poder del efecto compuesto y en el método Kaizen para convertir el monólogo mental en sistemas medibles de ejecución. Compartiendo aprendizajes, código abierto y productos diseñados con autoagencia.',
      tags: ['Fundador de Yourfocus.io', 'Platzi Lifelong Learner', 'Ecosistema Focus', 'Open Source', 'Autoagencia'],
    },
  };

  const goldenCircleData = {
    why: {
      title: '¿Por qué? (Why) — El Propósito Fundamental',
      subtitle: 'Creemos que todos podemos ser geniales.',
      description:
        'Existimos para potenciar el éxito y la autoagencia de las personas. La atención consciente sobre el propio pensamiento es la semilla del carácter, y el carácter forja el destino. Buscamos eliminar la fricción entre lo que piensas y lo que ejecutas.',
      pill: 'Propósito & Misión',
      color: '#FFAA5B',
    },
    how: {
      title: '¿Cómo? (How) — El Método y la Disciplina',
      subtitle: 'Sistemas con disciplina bajo el principio Kaizen.',
      description:
        'Aplicamos ingeniería limpia (Clean Architecture, SOLID, DDD), automatización inteligente con IA y diseño centrado en el foco mental. No creemos en la motivación pasajera, sino en arquitecturas de hábitos y sistemas que funcionan de forma consistente cada día.',
      pill: 'Metodología & Arquitectura',
      color: '#AB6552',
    },
    what: {
      title: '¿Qué? (What) — Los Resultados Tangibles',
      subtitle: 'Software escalable, sistemas de ejecución y productos digitales.',
      description:
        'Creamos productos de software de alto impacto como Yourfocus.io, backends empresariales robustos, backoffices serverless y aplicaciones web reactivas que convierten el ruido informativo en progreso medible.',
      pill: 'Productos & Entrega',
      color: '#6DB758',
    },
  };

  return (
    <div className='brand-page min-h-screen text-slate-100 selection:bg-amber-400 selection:text-slate-900'>
      <Head>
        <title>Manual de Marca | Cristian Caraballo (@CrisOMG)</title>
        <meta
          name='description'
          content='Manual de Identidad Visual, Sistema de Diseño, Paleta de Colores y Propuesta de Valor de Cristian Caraballo (@CrisOMG) y Yourfocus.'
        />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      {/* Floating Copy Feedback Toast */}
      {copiedText && (
        <div className='fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-medium text-sm shadow-2xl shadow-amber-500/30 animate-bounce'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M5 13l4 4L19 7' />
          </svg>
          <span>¡Copiado: <strong>{copiedText}</strong>!</span>
        </div>
      )}

      {/* Top Sticky Navigation */}
      <header className='sticky top-0 z-40 backdrop-blur-xl bg-[#0D222D]/85 border-b border-white/10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Link href='/' className='flex items-center gap-2 group'>
              <span className='w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-bold text-slate-950 text-base shadow-md group-hover:scale-105 transition-transform'>
                C
              </span>
              <div className='flex flex-col'>
                <span className='font-bold text-lg leading-tight tracking-tight text-[#F7EFC5] group-hover:text-amber-400 transition-colors font-fredoka'>
                  Cristian Caraballo
                </span>
                <span className='text-xs text-white/50 tracking-wider uppercase font-medium'>
                  Brand Guidelines & Design System
                </span>
              </div>
            </Link>
          </div>

          <nav className='hidden md:flex items-center gap-6 text-sm font-medium text-[#F7EFC5]/80'>
            <a href='#proposito' className='hover:text-amber-400 transition-colors'>Propósito</a>
            <a href='#propuesta' className='hover:text-amber-400 transition-colors'>Propuesta de Valor</a>
            <a href='#colores' className='hover:text-amber-400 transition-colors'>Colores</a>
            <a href='#tipografia' className='hover:text-amber-400 transition-colors'>Tipografía</a>
            <a href='#tono' className='hover:text-amber-400 transition-colors'>Tono & Voz</a>
            <a href='#ecosistema' className='hover:text-amber-400 transition-colors'>Ecosistema</a>
          </nav>

          <div className='flex items-center gap-3'>
            <Link
              href='/'
              className='px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-[#F7EFC5] border border-white/15 transition-all flex items-center gap-1.5'
            >
              <span>← Volver al Sitio</span>
            </Link>
            <a
              href='https://yourfocus.io'
              target='_blank'
              rel='noreferrer'
              className='hidden sm:flex px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold hover:brightness-110 shadow-lg shadow-orange-500/20 transition-all items-center gap-1.5'
            >
              <span>Yourfocus.io</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24'>

        {/* HERO HEADER */}
        <section className='relative rounded-3xl p-8 sm:p-14 overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-transparent shadow-2xl'>
          <div className='absolute -top-24 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none' />
          <div className='absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none' />

          <div className='relative z-10 max-w-3xl'>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-wide uppercase mb-6'>
              <span className='w-2 h-2 rounded-full bg-amber-400 animate-pulse' />
              Manual de Identidad & Marca Personal v1.0
            </div>

            <h1 className='text-4xl sm:text-6xl font-bold tracking-tight text-[#F7EFC5] leading-[1.1] mb-6 font-fredoka'>
              Construyendo sistemas que transforman el <span className='text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200'>pensamiento en ejecución</span>.
            </h1>

            <p className='text-lg sm:text-xl text-white/75 leading-relaxed mb-8 font-lexend'>
              Este manual define los cimientos estratégicos, visuales y conceptuales de la marca personal de <strong>Cristian Caraballo (@CrisOMG)</strong> y su interconexión simbiótica con el ecosistema de producto <strong>Yourfocus</strong>.
            </p>

            <div className='flex flex-wrap gap-4'>
              <a
                href='#propuesta'
                className='px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all'
              >
                Explorar Propuesta de Valor
              </a>
              <button
                onClick={() => copyToClipboard(':root { --brand-navy: #0D222D; --brand-cream: #F7EFC5; --brand-orange: #FFAA5B; --brand-green: #6DB758; }', 'Variables CSS')}
                className='px-6 py-3 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/15 text-[#F7EFC5] border border-white/15 transition-all flex items-center gap-2'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' />
                </svg>
                <span>Copiar Tokens CSS</span>
              </button>
            </div>
          </div>
        </section>

        {/* SECCIÓN 1: PROPÓSITO & CÍRCULO DORADO */}
        <section id='proposito' className='space-y-10'>
          <div className='flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6'>
            <div>
              <span className='text-xs font-bold text-amber-400 tracking-widest uppercase'>01. Cimientos Estratégicos</span>
              <h2 className='text-3xl sm:text-4xl font-bold text-[#F7EFC5] font-fredoka mt-1'>
                Propósito & El Círculo Dorado
              </h2>
            </div>
            <p className='text-sm text-white/60 max-w-md font-lexend'>
              Inspirado en el modelo de Simon Sinek y en la filosofía Kaizen de mejora continua acumulativa.
            </p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-center'>
            {/* Interactive Visual Circle */}
            <div className='lg:col-span-5 flex flex-col items-center justify-center p-8 rounded-3xl bg-white/[0.03] border border-white/10 relative'>
              <div className='relative w-72 h-72 flex items-center justify-center'>
                {/* WHAT Outer Ring */}
                <button
                  onClick={() => setActiveCircle('what')}
                  className={`absolute inset-0 rounded-full border-2 transition-all flex items-start justify-center pt-3 cursor-pointer ${
                    activeCircle === 'what'
                      ? 'border-emerald-400 bg-emerald-950/40 shadow-xl shadow-emerald-500/20 scale-105'
                      : 'border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/60'
                  }`}
                >
                  <span className='text-xs font-bold text-emerald-300 tracking-wider uppercase'>¿QUÉ? (Resultados)</span>
                </button>

                {/* HOW Middle Ring */}
                <button
                  onClick={() => setActiveCircle('how')}
                  className={`absolute inset-9 rounded-full border-2 transition-all flex items-start justify-center pt-3 cursor-pointer ${
                    activeCircle === 'how'
                      ? 'border-[#AB6552] bg-[#602D1F]/50 shadow-xl shadow-[#AB6552]/20 scale-105'
                      : 'border-[#AB6552]/40 bg-[#602D1F]/20 hover:border-[#AB6552]/70'
                  }`}
                >
                  <span className='text-xs font-bold text-[#f2a996] tracking-wider uppercase'>¿CÓMO? (Sistemas)</span>
                </button>

                {/* WHY Center Ring */}
                <button
                  onClick={() => setActiveCircle('why')}
                  className={`absolute inset-20 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer text-center p-2 ${
                    activeCircle === 'why'
                      ? 'border-amber-400 bg-amber-500/40 shadow-2xl shadow-amber-500/40 scale-110 z-10'
                      : 'border-amber-400/50 bg-amber-500/20 hover:border-amber-400'
                  }`}
                >
                  <span className='text-xs font-black text-amber-200 tracking-wider uppercase leading-tight'>
                    ¿POR QUÉ?<br />(Propósito)
                  </span>
                </button>
              </div>

              <span className='text-xs text-white/50 mt-6'>Haz clic en los anillos para explorar cada capa</span>
            </div>

            {/* Explanation Card */}
            <div className='lg:col-span-7 space-y-6'>
              <div className='p-8 rounded-3xl bg-white/[0.04] border border-white/15 relative overflow-hidden'>
                <div
                  className='absolute top-0 left-0 h-1 w-full'
                  style={{ backgroundColor: goldenCircleData[activeCircle].color }}
                />
                <span
                  className='text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3'
                  style={{
                    backgroundColor: `${goldenCircleData[activeCircle].color}20`,
                    color: goldenCircleData[activeCircle].color,
                  }}
                >
                  {goldenCircleData[activeCircle].pill}
                </span>

                <h3 className='text-2xl font-bold text-[#F7EFC5] font-fredoka'>
                  {goldenCircleData[activeCircle].title}
                </h3>
                <h4 className='text-base font-semibold text-amber-300 mt-1 mb-4 font-lexend'>
                  {goldenCircleData[activeCircle].subtitle}
                </h4>
                <p className='text-white/80 leading-relaxed text-base font-lexend'>
                  {goldenCircleData[activeCircle].description}
                </p>
              </div>

              {/* Misión, Visión, Valores */}
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div className='p-5 rounded-2xl bg-white/[0.02] border border-white/10'>
                  <span className='text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1'>Misión</span>
                  <p className='text-sm text-white/80 font-medium'>Democratizar la autogestión cognitiva y la ejecución técnica.</p>
                </div>
                <div className='p-5 rounded-2xl bg-white/[0.02] border border-white/10'>
                  <span className='text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1'>Visión</span>
                  <p className='text-sm text-white/80 font-medium'>Que cada persona y proyecto cuente con un sistema de ejecución personal escalable.</p>
                </div>
                <div className='p-5 rounded-2xl bg-white/[0.02] border border-white/10'>
                  <span className='text-xs font-bold text-orange-400 uppercase tracking-wider block mb-1'>Valores</span>
                  <p className='text-sm text-white/80 font-medium'>Lucidez · Autoagencia · Rigor Técnico · Curiosidad · Kaizen</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 2: PROPUESTA DE VALOR MATRIZ */}
        <section id='propuesta' className='space-y-8'>
          <div className='flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6'>
            <div>
              <span className='text-xs font-bold text-amber-400 tracking-widest uppercase'>02. Posicionamiento</span>
              <h2 className='text-3xl sm:text-4xl font-bold text-[#F7EFC5] font-fredoka mt-1'>
                Propuesta de Valor & Pitch Matrix
              </h2>
            </div>
            <p className='text-sm text-white/60 max-w-md font-lexend'>
              Una narrativa coherente adaptada a cada uno de tus públicos clave.
            </p>
          </div>

          {/* Interactive Audience Tabs */}
          <div className='flex flex-wrap gap-2.5 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 w-fit'>
            <button
              onClick={() => setActiveTab('tech')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'tech'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              💼 Para Tech Leads & Empresas
            </button>
            <button
              onClick={() => setActiveTab('startup')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'startup'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              🚀 Para Startups & Clientes
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'community'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              🌱 Para Comunidad & Makers
            </button>
          </div>

          {/* Active Pitch Card */}
          <div className='p-8 sm:p-10 rounded-3xl bg-white/[0.04] border border-white/15 relative overflow-hidden backdrop-blur-md shadow-2xl'>
            <div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
              <span className='px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30'>
                {pitchVersions[activeTab].badge}
              </span>

              <button
                onClick={() => copyToClipboard(pitchVersions[activeTab].body, 'Elevator Pitch')}
                className='px-4 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-[#F7EFC5] border border-white/15 transition-all flex items-center gap-1.5'
              >
                <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' />
                </svg>
                <span>Copiar este pitch</span>
              </button>
            </div>

            <h3 className='text-2xl sm:text-3xl font-bold text-[#F7EFC5] font-fredoka leading-snug mb-4'>
              {pitchVersions[activeTab].headline}
            </h3>

            <p className='text-base sm:text-lg text-white/85 leading-relaxed font-lexend mb-8'>
              {pitchVersions[activeTab].body}
            </p>

            <div className='pt-6 border-t border-white/10 flex flex-wrap items-center gap-2'>
              <span className='text-xs font-bold text-white/50 uppercase tracking-wider mr-2'>Pilares Clave:</span>
              {pitchVersions[activeTab].tags.map((tag, i) => (
                <span
                  key={i}
                  className='px-3 py-1 rounded-lg text-xs font-semibold bg-white/5 text-amber-200/90 border border-white/10'
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* SECCIÓN 3: PALETA DE COLORES & TOKENS */}
        <section id='colores' className='space-y-8'>
          <div className='flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6'>
            <div>
              <span className='text-xs font-bold text-amber-400 tracking-widest uppercase'>03. Identidad Cromática</span>
              <h2 className='text-3xl sm:text-4xl font-bold text-[#F7EFC5] font-fredoka mt-1'>
                Paleta de Colores & Tokens
              </h2>
            </div>
            <p className='text-sm text-white/60 max-w-md font-lexend'>
              Haz clic en cualquier tarjeta de color para copiar su valor HEX al portapapeles.
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
            {colorTokens.map((token, idx) => (
              <div
                key={idx}
                onClick={() => copyToClipboard(token.hex, token.hex)}
                className='group cursor-pointer rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-400/50 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10'
              >
                {/* Color Swatch Preview Box */}
                <div
                  className={`w-full h-28 rounded-xl flex items-end justify-end p-3 relative overflow-hidden mb-4 shadow-inner ${
                    token.border ? 'border border-white/20' : ''
                  }`}
                  style={{ backgroundColor: token.hex }}
                >
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded backdrop-blur-md ${
                      token.lightText
                        ? 'bg-black/40 text-white'
                        : 'bg-white/70 text-slate-900'
                    }`}
                  >
                    Copiar
                  </span>
                </div>

                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between'>
                    <h3 className='font-bold text-base text-[#F7EFC5] font-fredoka'>{token.name}</h3>
                    <code className='text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-amber-300 font-bold'>
                      {token.hex}
                    </code>
                  </div>
                  <span className='text-xs font-semibold text-amber-400/90 block'>{token.role}</span>
                  <p className='text-xs text-white/65 leading-relaxed font-lexend pt-1'>{token.usage}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dosimetría / Regla de Proporción */}
          <div className='p-6 rounded-2xl bg-white/[0.03] border border-white/10'>
            <h4 className='text-sm font-bold uppercase tracking-wider text-white/60 mb-3'>
              Regla de Aplicación Cromática (60 - 30 - 10)
            </h4>
            <div className='h-4 rounded-full overflow-hidden flex shadow-inner'>
              <div className='w-[60%] bg-[#0D222D] border-r border-white/20' title='60% Dark Petrol' />
              <div className='w-[30%] bg-[#F7EFC5]' title='30% Warm Cream' />
              <div className='w-[10%] bg-[#FFAA5B]' title='10% Brand Orange / Green Accents' />
            </div>
            <div className='flex justify-between text-xs text-white/50 mt-2 font-mono'>
              <span>60% Dark Petrol (#0D222D)</span>
              <span>30% Warm Cream & Glass Surface</span>
              <span>10% Brand Orange & Accents</span>
            </div>
          </div>
        </section>

        {/* SECCIÓN 4: TIPOGRAFÍA */}
        <section id='tipografia' className='space-y-8'>
          <div className='flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6'>
            <div>
              <span className='text-xs font-bold text-amber-400 tracking-widest uppercase'>04. Sistema Tipográfico</span>
              <h2 className='text-3xl sm:text-4xl font-bold text-[#F7EFC5] font-fredoka mt-1'>
                Tipografía & Jerarquías
              </h2>
            </div>
            <p className='text-sm text-white/60 max-w-md font-lexend'>
              Una combinación diseñada para transmitir cercanía humana, rigor técnico y alta legibilidad.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {/* Font 1: Fredoka */}
            <div className='p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4'>
              <div className='flex items-center justify-between border-b border-white/10 pb-3'>
                <span className='text-xs font-bold uppercase tracking-wider text-amber-400'>Titulares & Display</span>
                <span className='text-xs font-mono text-white/40'>Google Fonts</span>
              </div>
              <h3 className='text-4xl font-bold text-[#F7EFC5] font-fredoka'>Fredoka</h3>
              <p className='text-xs text-white/70 font-lexend leading-relaxed'>
                Amigable, contemporánea y llena de personalidad. Se utiliza en titulares H1/H2, logotipos, banners de impacto y nombres de productos como Yourfocus.
              </p>
              <div className='pt-2 font-fredoka text-xl text-amber-300 space-y-1'>
                <p className='font-normal'>Regular 400</p>
                <p className='font-medium'>Medium 500</p>
                <p className='font-semibold'>SemiBold 600</p>
                <p className='font-bold'>Bold 700</p>
              </div>
            </div>

            {/* Font 2: Lexend */}
            <div className='p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4'>
              <div className='flex items-center justify-between border-b border-white/10 pb-3'>
                <span className='text-xs font-bold uppercase tracking-wider text-emerald-400'>Cuerpo & UI</span>
                <span className='text-xs font-mono text-white/40'>Google Fonts</span>
              </div>
              <h3 className='text-4xl font-semibold text-[#F7EFC5] font-lexend'>Lexend</h3>
              <p className='text-xs text-white/70 font-lexend leading-relaxed'>
                Diseñada científicamente por Thomas Jockin para reducir el esfuerzo cognitivo y maximizar la fluidez de lectura. Base del ecosistema de productividad.
              </p>
              <div className='pt-2 font-lexend text-base text-emerald-300 space-y-1'>
                <p className='font-light'>Light 300</p>
                <p className='font-normal'>Regular 400</p>
                <p className='font-medium'>Medium 500</p>
                <p className='font-semibold'>SemiBold 600</p>
              </div>
            </div>

            {/* Font 3: Grand Hotel */}
            <div className='p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4'>
              <div className='flex items-center justify-between border-b border-white/10 pb-3'>
                <span className='text-xs font-bold uppercase tracking-wider text-orange-400'>Firma & Toque Humano</span>
                <span className='text-xs font-mono text-white/40'>Google Fonts</span>
              </div>
              <h3 className='text-4xl font-normal text-[#F7EFC5] font-grand-hotel'>Grand Hotel</h3>
              <p className='text-xs text-white/70 font-lexend leading-relaxed'>
                Trazo script retro y artesanal. Se reserva exclusivamente para tu nombre propio (&quot;Cristian&quot;), firmas personales o micro-acentos de autor.
              </p>
              <div className='pt-2 font-grand-hotel text-3xl text-orange-300 space-y-1'>
                <p>Cristian Caraballo</p>
                <p className='text-2xl text-white/60'>Lifelong Learner</p>
              </div>
            </div>
          </div>

          {/* Live Type Tester Playground */}
          <div className='p-6 sm:p-8 rounded-3xl bg-white/[0.04] border border-white/15 space-y-4'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
              <h4 className='text-base font-bold text-[#F7EFC5] font-fredoka'>Probador Tipográfico en Vivo</h4>
              <span className='text-xs text-white/50'>Escribe una frase para probar su visualización</span>
            </div>

            <input
              type='text'
              value={customPreviewText}
              onChange={(e) => setCustomPreviewText(e.target.value)}
              placeholder='Escribe aquí para previsualizar...'
              className='w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-[#F7EFC5] placeholder:text-white/30 text-sm focus:outline-none focus:border-amber-400 transition-colors'
            />

            <div className='pt-6 space-y-6'>
              <div>
                <span className='text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1 font-mono'>
                  Fredoka Bold (Heading Display):
                </span>
                <p className='text-3xl sm:text-4xl font-bold font-fredoka text-[#F7EFC5]'>
                  {customPreviewText || 'Texto de ejemplo'}
                </p>
              </div>

              <div>
                <span className='text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1 font-mono'>
                  Lexend Regular (Cuerpo de texto / UI):
                </span>
                <p className='text-lg font-normal font-lexend text-white/80'>
                  {customPreviewText || 'Texto de ejemplo'}
                </p>
              </div>

              <div>
                <span className='text-xs font-bold uppercase tracking-wider text-orange-400 block mb-1 font-mono'>
                  Grand Hotel Script (Firma personal):
                </span>
                <p className='text-3xl font-normal font-grand-hotel text-amber-200'>
                  {customPreviewText || 'Texto de ejemplo'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 5: TONO & VOZ */}
        <section id='tono' className='space-y-8'>
          <div className='flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6'>
            <div>
              <span className='text-xs font-bold text-amber-400 tracking-widest uppercase'>05. Personalidad de Marca</span>
              <h2 className='text-3xl sm:text-4xl font-bold text-[#F7EFC5] font-fredoka mt-1'>
                Tono, Voz & Principios de Comunicación
              </h2>
            </div>
            <p className='text-sm text-white/60 max-w-md font-lexend'>
              Cómo hablamos, qué proyectamos y los filtros para mantener coherencia en cada mensaje.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Qué Sí Somos */}
            <div className='p-6 sm:p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-4'>
              <h3 className='text-xl font-bold text-emerald-300 font-fredoka flex items-center gap-2'>
                <span className='w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-sm font-bold'>
                  ✓
                </span>
                Cómo Hablamos (Nuestros Principios)
              </h3>
              <ul className='space-y-3.5 text-sm text-white/80 font-lexend'>
                <li className='flex items-start gap-2.5'>
                  <strong className='text-emerald-300'>Pragmáticos y Claros:</strong> Explicamos conceptos técnicos complejos con sencillez y utilidad directa.
                </li>
                <li className='flex items-start gap-2.5'>
                  <strong className='text-emerald-300'>Enfocados en la Ejecución:</strong> Valoramos el código limpio, los sistemas funcionando y los resultados medibles por encima de promesas abstractas.
                </li>
                <li className='flex items-start gap-2.5'>
                  <strong className='text-emerald-300'>Mentalidad Kaizen:</strong> Humildad intelectual para aprender continuamente (Platzi Eternal Student) combinada con rigor profesional.
                </li>
                <li className='flex items-start gap-2.5'>
                  <strong className='text-emerald-300'>Autoagencia Activa:</strong> Fomentamos la autonomía, la autorregulación y la creación de herramientas propias.
                </li>
              </ul>
            </div>

            {/* Qué No Somos */}
            <div className='p-6 sm:p-8 rounded-3xl bg-rose-950/20 border border-rose-500/30 space-y-4'>
              <h3 className='text-xl font-bold text-rose-300 font-fredoka flex items-center gap-2'>
                <span className='w-6 h-6 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-sm font-bold'>
                  ✕
                </span>
                Lo Que Evitamos (Anti-patrones de Marca)
              </h3>
              <ul className='space-y-3.5 text-sm text-white/80 font-lexend'>
                <li className='flex items-start gap-2.5'>
                  <strong className='text-rose-300'>No Vendemos Humo:</strong> Cero jerga de gurú de productividad sin sustento de código y arquitectura real.
                </li>
                <li className='flex items-start gap-2.5'>
                  <strong className='text-rose-300'>No Somos Corporativos Fríos:</strong> Mantenemos cercanía, calidez humana y autenticidad en cada interacción.
                </li>
                <li className='flex items-start gap-2.5'>
                  <strong className='text-rose-300'>No Caemos en la Sobre-Ingeniería:</strong> Construimos soluciones escalables, pero solo la complejidad que el problema real requiere.
                </li>
                <li className='flex items-start gap-2.5'>
                  <strong className='text-rose-300'>No Usamos Colores Genéricos:</strong> Rechazamos interfaces genéricas o sin identidad visual cuidada.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECCIÓN 6: ECOSISTEMA DE MARCA */}
        <section id='ecosistema' className='space-y-8'>
          <div className='flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6'>
            <div>
              <span className='text-xs font-bold text-amber-400 tracking-widest uppercase'>06. Arquitectura de Marca</span>
              <h2 className='text-3xl sm:text-4xl font-bold text-[#F7EFC5] font-fredoka mt-1'>
                Ecosistema: Marca Personal & Producto
              </h2>
            </div>
            <p className='text-sm text-white/60 max-w-md font-lexend'>
              Cómo conviven y se potencian mutuamente Cristian Caraballo (@CrisOMG) y Yourfocus.io.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Marca Personal */}
            <div className='p-8 rounded-3xl bg-white/[0.04] border border-white/15 space-y-5 relative overflow-hidden'>
              <div className='flex items-center gap-3'>
                <img
                  src='/assets/cris-photo.jpg'
                  alt='Cristian Caraballo'
                  className='w-14 h-14 rounded-full border-2 border-amber-400 object-cover shadow-lg'
                />
                <div>
                  <h3 className='text-xl font-bold text-[#F7EFC5] font-fredoka'>Cristian Caraballo (@CrisOMG)</h3>
                  <span className='text-xs text-amber-400 font-semibold'>Marca Matriz / Creador & Ingeniero</span>
                </div>
              </div>
              <p className='text-sm text-white/80 font-lexend leading-relaxed'>
                Representa el talento técnico, la experiencia en consultoría, la solidez en Clean Architecture y la capacidad de entregar software de alto valor. Es la mente detrás de la arquitectura y la visión.
              </p>
              <div className='pt-2 flex flex-wrap gap-2 text-xs'>
                <span className='px-3 py-1 rounded-md bg-white/10 text-white font-medium'>FullStack Engineer</span>
                <span className='px-3 py-1 rounded-md bg-white/10 text-white font-medium'>Nuxt & Next.js</span>
                <span className='px-3 py-1 rounded-md bg-white/10 text-white font-medium'>NestJS Serverless</span>
                <span className='px-3 py-1 rounded-md bg-white/10 text-white font-medium'>Platzi Eternal Student</span>
              </div>
            </div>

            {/* Producto Insignia: Yourfocus */}
            <div className='p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white/[0.03] to-transparent border border-amber-400/30 space-y-5 relative overflow-hidden'>
              <div className='flex items-center gap-3'>
                <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg text-slate-950 font-black text-xl'>
                  YF
                </div>
                <div>
                  <h3 className='text-xl font-bold text-[#F7EFC5] font-fredoka'>Yourfocus.io</h3>
                  <span className='text-xs text-emerald-400 font-semibold'>Producto Insignia / SaaS de Productividad</span>
                </div>
              </div>
              <p className='text-sm text-white/80 font-lexend leading-relaxed'>
                La manifestación tangible de la filosofía de ejecución. Un sistema cognitivo activo con Pomodoro timer, Bitácora de voz con IA, Agente personal, Base de conocimiento, Analytics y BYOK.
              </p>
              <div className='pt-2 flex flex-wrap gap-2 text-xs'>
                <span className='px-3 py-1 rounded-md bg-amber-400/20 text-amber-300 font-semibold'>Gestión Cognitiva</span>
                <span className='px-3 py-1 rounded-md bg-amber-400/20 text-amber-300 font-semibold'>Kaizen Driven</span>
                <span className='px-3 py-1 rounded-md bg-amber-400/20 text-amber-300 font-semibold'>Voice-first + AI</span>
                <span className='px-3 py-1 rounded-md bg-amber-400/20 text-amber-300 font-semibold'>Interoperable (API / Webhooks)</span>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className='border-t border-white/10 mt-24 py-12 bg-[#07151C]/80'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-white/60'>
          <div className='flex items-center gap-3'>
            <span className='font-bold text-[#F7EFC5] font-fredoka text-lg'>Cristian Caraballo</span>
            <span className='text-xs text-amber-400'>· Manual de Marca v1.0</span>
          </div>

          <p className='text-xs text-center text-white/50'>
            Diseñado para <Link href='/' className='text-amber-400 hover:underline'>crisomg.link</Link> y el ecosistema <a href='https://yourfocus.io' target='_blank' rel='noreferrer' className='text-amber-400 hover:underline'>Yourfocus.io</a>.
          </p>

          <div className='flex items-center gap-4 text-xs font-semibold'>
            <Link href='/' className='hover:text-amber-400 transition-colors'>Ir al Inicio</Link>
            <a href='https://github.com/CRISOMG' target='_blank' rel='noreferrer' className='hover:text-amber-400 transition-colors'>GitHub</a>
            <a href='https://linkedin.com/in/crisomg/' target='_blank' rel='noreferrer' className='hover:text-amber-400 transition-colors'>LinkedIn</a>
          </div>
        </div>
      </footer>

      {/* Embedded Page Scoped Styles */}
      <style jsx>{`
        .brand-page {
          background-color: var(--brand-navy, #0D222D);
          font-family: var(--font-lexend, sans-serif);
        }
        .font-fredoka {
          font-family: var(--font-fredoka, 'Fredoka', cursive, sans-serif);
        }
        .font-lexend {
          font-family: var(--font-lexend, 'Lexend', sans-serif);
        }
        .font-grand-hotel {
          font-family: var(--grand-hotel, 'Grand Hotel', cursive);
        }
      `}</style>
    </div>
  );
}
