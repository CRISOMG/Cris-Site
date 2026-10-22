import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Error from 'next/error';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated, verifyOtp, requestOtp, emailInfo, hasAuthIntent } = useAuth();

  const [isAllowed, setIsAllowed] = useState(false);
  const [checkingIntent, setCheckingIntent] = useState(true);

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(300);

  const inputsRef = useRef([]);

  // Sigilo total: si el usuario no tiene intención activa ni está autenticado, no permitir acceso
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/admin');
      return;
    }

    if (!hasAuthIntent()) {
      setIsAllowed(false);
      setCheckingIntent(false);
      router.replace('/');
      return;
    }

    setIsAllowed(true);
    setCheckingIntent(false);
  }, [isAuthenticated, hasAuthIntent, router]);

  // Temporizador de cuenta regresiva
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    setError('');
    const newDigits = [...digits];

    if (cleanVal.length > 1) {
      handlePasteString(cleanVal);
      return;
    }

    newDigits[index] = cleanVal;
    setDigits(newDigits);

    if (cleanVal && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (cleanVal && index === 5 && newDigits.every((d) => d !== '')) {
      submitCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pasted) {
      handlePasteString(pasted);
    }
  };

  const handlePasteString = (str) => {
    const chars = str.slice(0, 6).split('');
    const newDigits = ['', '', '', '', '', ''];
    chars.forEach((c, idx) => {
      newDigits[idx] = c;
    });
    setDigits(newDigits);
    setError('');

    const focusIdx = Math.min(chars.length, 5);
    inputsRef.current[focusIdx]?.focus();

    if (chars.length === 6) {
      submitCode(chars.join(''));
    }
  };

  const submitCode = async (codeToSubmit) => {
    const code = codeToSubmit || digits.join('');
    if (code.length !== 6) {
      setError('Por favor ingresa los 6 dígitos del código');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await verifyOtp(code);
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Código incorrecto o expirado');
      setDigits(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegenerateOtp = async () => {
    setIsRegenerating(true);
    setError('');
    try {
      const data = await requestOtp(true);
      setSecondsRemaining(data.expiresInSeconds || 300);
      setDigits(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError('No se pudo enviar un nuevo código');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Si no está autorizado a ver la página, devolver un 404 estricto para terceros
  if (checkingIntent) return null;
  if (!isAllowed) {
    return <Error statusCode={404} />;
  }

  return (
    <div className='min-h-screen bg-[#07151C] text-[#F7EFC5] flex flex-col justify-between relative overflow-hidden'>
      <Head>
        <title>Verificación de Seguridad</title>
        <meta name='robots' content='noindex, nofollow' />
      </Head>

      {/* Glows ambientales */}
      <div className='absolute -top-32 -right-32 w-96 h-96 bg-[#FFAA5B]/15 rounded-full blur-3xl pointer-events-none' />
      <div className='absolute -bottom-32 -left-32 w-96 h-96 bg-[#6DB758]/10 rounded-full blur-3xl pointer-events-none' />

      {/* Barra superior sin detalles reveladores */}
      <header className='p-6 flex items-center justify-between relative z-10 max-w-4xl w-full mx-auto'>
        <Link
          href='/'
          className='inline-flex items-center gap-2 text-sm text-[#F7EFC5]/80 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10'
        >
          <span>&larr;</span>
          <span>Volver al inicio</span>
        </Link>
      </header>

      {/* Contenedor Principal del Formulario 100% Ciego */}
      <main className='flex-1 flex items-center justify-center p-4 relative z-10'>
        <div className='w-full max-w-md bg-[#0D222D]/95 backdrop-blur-xl border border-[#FFAA5B]/30 rounded-3xl p-6 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.8)]'>
          {/* Encabezado */}
          <div className='text-center mb-6'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FFAA5B]/15 border border-[#FFAA5B]/40 text-[#FFAA5B] mb-4 shadow-[0_0_25px_rgba(255,170,91,0.25)]'>
              {success ? (
                <svg className='w-8 h-8 text-[#6DB758] animate-bounce' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M5 13l4 4L19 7' />
                </svg>
              ) : (
                <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                  />
                </svg>
              )}
            </div>

            <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-[#F7EFC5] mb-2'>
              {success ? 'Identidad Autorizada' : 'Verificación de Seguridad'}
            </h1>
            <p className='text-sm text-[#F7EFC5]/80 max-w-xs mx-auto'>
              {success
                ? 'Sesión autorizada. Accediendo al espacio protegido...'
                : 'Ingresa el código OTP de 6 dígitos que fue enviado a tu correo registrado.'}
            </p>
          </div>

          {/* Notificación de envío por correo */}
          {!success && emailInfo?.maskedEmail && (
            <div className='mb-6 p-3 rounded-2xl bg-[#6DB758]/15 border border-[#6DB758]/30 text-xs text-[#F7EFC5] flex items-center gap-2.5'>
              <span className='text-base'>📧</span>
              <span>Código despachado a <strong>{emailInfo.maskedEmail}</strong></span>
            </div>
          )}

          {/* Formulario OTP Ciego */}
          {!success && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitCode();
              }}
              className='space-y-6'
            >
              {/* Campo Honeypot invisible para atrapar bots automatizados */}
              <input
                type='text'
                name='website_url'
                tabIndex={-1}
                autoComplete='off'
                aria-hidden='true'
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0, left: '-9999px' }}
              />

              {/* Casillas numéricas */}
              <div className='flex justify-between items-center gap-2 sm:gap-3' onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputsRef.current[idx] = el)}
                    type='text'
                    inputMode='numeric'
                    autoComplete='one-time-code'
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isVerifying}
                    className={`w-11 sm:w-13 h-14 sm:h-16 text-center text-2xl font-bold rounded-xl bg-white/5 border ${
                      error
                        ? 'border-red-500/70 focus:border-red-500 text-red-300'
                        : digit
                        ? 'border-[#FFAA5B] bg-[#FFAA5B]/10 text-white'
                        : 'border-white/20 focus:border-[#FFAA5B] text-[#F7EFC5]'
                    } outline-none transition-all duration-200 focus:scale-105 shadow-inner`}
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className='p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 animate-shake'>
                  <svg className='w-4 h-4 shrink-0 text-red-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Botón de envío */}
              <button
                type='submit'
                disabled={isVerifying || digits.some((d) => !d)}
                className='w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide text-[#0D222D] bg-gradient-to-r from-[#FFAA5B] to-[#FBBF24] hover:from-[#FFAA5B]/90 hover:to-[#FBBF24]/90 shadow-[0_6px_25px_rgba(255,170,91,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2'
              >
                {isVerifying ? (
                  <>
                    <svg className='animate-spin h-4 w-4 text-[#0D222D]' fill='none' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z'></path>
                    </svg>
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Validar Código & Desbloquear</span>
                    <span>&rarr;</span>
                  </>
                )}
              </button>

              {/* Temporizador y regeneración */}
              <div className='flex items-center justify-between text-xs text-white/60 pt-2 border-t border-white/10'>
                <div className='flex items-center gap-1.5'>
                  <svg className='w-4 h-4 text-[#FFAA5B]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <span>
                    Expira en:{' '}
                    <strong className={secondsRemaining < 60 ? 'text-red-400 font-mono' : 'text-[#FFAA5B] font-mono'}>
                      {formatTime(secondsRemaining)}
                    </strong>
                  </span>
                </div>

                <button
                  type='button'
                  onClick={handleRegenerateOtp}
                  disabled={isRegenerating}
                  className='text-[#FFAA5B] hover:text-white transition-colors underline disabled:opacity-50'
                >
                  {isRegenerating ? 'Enviando...' : 'Reenviar código'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className='p-6 text-center text-xs text-white/20 relative z-10'>
        <span>Sistema de Autenticación &bull; Conexión Segura</span>
      </footer>
    </div>
  );
}
