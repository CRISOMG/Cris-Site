import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Custom404() {
  return (
    <div className='min-h-screen bg-[#07151C] text-[#F7EFC5] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden'>
      <Head>
        <title>404 - Página no encontrada | Cris Site</title>
      </Head>

      {/* Glows de fondo */}
      <div className='absolute -top-32 -right-32 w-80 h-80 bg-[#FFAA5B]/15 rounded-full blur-3xl pointer-events-none' />
      <div className='absolute -bottom-32 -left-32 w-80 h-80 bg-[#6DB758]/10 rounded-full blur-3xl pointer-events-none' />

      <div className='max-w-md w-full bg-[#0D222D] border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 space-y-4'>
        <div className='w-16 h-16 mx-auto rounded-2xl bg-[#FFAA5B]/15 border border-[#FFAA5B]/30 flex items-center justify-center text-3xl'>
          🧭
        </div>

        <h1 className='text-4xl font-extrabold text-[#FFAA5B] tracking-tight'>404</h1>
        <h2 className='text-lg font-bold text-[#F7EFC5]'>Página no encontrada</h2>
        <p className='text-xs text-white/60 leading-relaxed'>
          La ruta que intentas visitar no existe o ha sido movida.
        </p>

        <div className='pt-2'>
          <Link
            href='/'
            className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFAA5B] to-[#FBBF24] text-xs font-bold text-[#0D222D] shadow-lg shadow-[#FFAA5B]/20 hover:scale-105 transition-all'
          >
            <span>&larr;</span>
            <span>Volver al Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
