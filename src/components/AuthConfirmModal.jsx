import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function AuthConfirmModal({ isOpen, onClose }) {
  const router = useRouter();
  const { requestOtp, triggerAuthIntent } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleProceed = async () => {
    setIsSubmitting(true);
    triggerAuthIntent();
    try {
      // Generar OTP inicial automáticamente para que esté listo al llegar a /auth
      await requestOtp(true);
      router.push('/auth');
    } catch (err) {
      console.error('Error al iniciar flujo de auth:', err);
      router.push('/auth');
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div
      role='dialog'
      aria-modal='true'
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity duration-300 animate-fadeIn'
      onClick={onClose}
    >
      <div
        className='relative w-full max-w-md bg-[#0D222D] border border-[#FFAA5B]/40 rounded-2xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(255,170,91,0.15)] text-left transform transition-all animate-scaleUp'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decorativo de fondo */}
        <div className='absolute -top-12 -right-12 w-36 h-36 bg-[#FFAA5B]/15 rounded-full blur-2xl pointer-events-none' />
        <div className='absolute -bottom-12 -left-12 w-36 h-36 bg-[#6DB758]/10 rounded-full blur-2xl pointer-events-none' />

        {/* Encabezado con Icono */}
        <div className='flex items-center gap-4 mb-5 relative z-10'>
          <div className='flex items-center justify-center w-12 h-12 rounded-xl bg-[#FFAA5B]/15 border border-[#FFAA5B]/40 text-[#FFAA5B] shadow-inner'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
              />
            </svg>
          </div>
          <div>
            <span className='inline-block text-[11px] font-bold uppercase tracking-wider text-[#FFAA5B] bg-[#FFAA5B]/10 px-2.5 py-0.5 rounded-full border border-[#FFAA5B]/20 mb-1'>
              Acceso Seguro de Propietario
            </span>
            <h3 className='text-xl font-bold text-[#F7EFC5]'>¿Iniciar sesión en tu Espacio Privado?</h3>
          </div>
        </div>

        {/* Mensaje descriptivo */}
        <div className='space-y-3 text-sm text-[#F7EFC5]/85 leading-relaxed relative z-10 mb-6'>
          <p>
            Has activado la secuencia de acceso para <strong className='text-[#FFAA5B]'>Cristian Caraballo</strong>.
          </p>
          <p className='text-xs text-white/70 bg-white/5 p-3 rounded-lg border border-white/10'>
            🔐 Al continuar, se generará tu código temporal de un solo uso (OTP) y serás redirigido al formulario de verificación para desbloquear tus secciones y características especiales.
          </p>
        </div>

        {/* Botones de acción */}
        <div className='flex flex-col-reverse sm:flex-row items-center justify-end gap-3 relative z-10'>
          <button
            type='button'
            onClick={onClose}
            disabled={isSubmitting}
            className='w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors border border-transparent'
          >
            Cancelar
          </button>

          <button
            type='button'
            onClick={handleProceed}
            disabled={isSubmitting}
            className='w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0D222D] bg-gradient-to-r from-[#FFAA5B] to-[#FBBF24] hover:from-[#FFAA5B]/90 hover:to-[#FBBF24]/90 shadow-[0_4px_20px_rgba(255,170,91,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50'
          >
            {isSubmitting ? (
              <>
                <svg className='animate-spin h-4 w-4 text-[#0D222D]' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z'></path>
                </svg>
                <span>Generando OTP...</span>
              </>
            ) : (
              <>
                <span>Continuar a Verificación</span>
                <span>&rarr;</span>
              </>
            )}
          </button>
        </div>

        <div className='mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50'>
          <span>Atajo: [Ctrl + K] o 3 taps</span>
          <span>Presiona [Esc] para cerrar</span>
        </div>
      </div>
    </div>
  );
}
