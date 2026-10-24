import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { trackEvent } from '../../lib/analytics';

export default function OidcAuthPage() {
  const router = useRouter();
  const { client_id, redirect_uri, state } = router.query;

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('cristiancaraballo112@gmail.com');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputsRef = useRef([]);

  // Auto-focus en la primera casilla al cargar
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

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
      setError('Por favor ingresa los 6 dígitos de Google Authenticator');
      return;
    }

    if (!redirect_uri) {
      setError('Falta el parámetro redirect_uri de Cloudflare Access.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/oidc/verify-and-authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totpCode: code,
          email,
          clientId: client_id || 'cloudflare-access-crisomg',
          redirectUri: redirect_uri,
          state,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error validando código 2FA');
      }

      setSuccess(true);
      trackEvent({
        action: 'oidc_2fa_success',
        category: 'auth_oidc',
        label: 'Túnel autorizado con 2FA',
      });

      // Redirigir hacia Cloudflare Access callback
      setTimeout(() => {
        window.location.href = data.redirectUrl;
      }, 800);
    } catch (err) {
      setError(err.message || 'Código 2FA incorrecto o expirado');
      setDigits(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className='min-h-screen bg-[#07151C] text-[#F7EFC5] flex flex-col justify-between relative overflow-hidden'>
      <Head>
        <title>Acceso Túnel &bull; Verificación 2FA</title>
        <meta name='robots' content='noindex, nofollow' />
      </Head>

      {/* Glows ambientales */}
      <div className='absolute -top-32 -right-32 w-96 h-96 bg-[#FFAA5B]/15 rounded-full blur-3xl pointer-events-none' />
      <div className='absolute -bottom-32 -left-32 w-96 h-96 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none' />

      {/* Barra superior */}
      <header className='p-6 flex items-center justify-between relative z-10 max-w-4xl w-full mx-auto'>
        <Link
          href='/'
          className='inline-flex items-center gap-2 text-sm text-[#F7EFC5]/80 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10'
        >
          <span>&larr;</span>
          <span>Volver al inicio</span>
        </Link>
        <span className='text-xs font-mono px-3 py-1 rounded-full bg-[#FFAA5B]/10 border border-[#FFAA5B]/30 text-[#FFAA5B]'>
          Zero Trust Tunnel
        </span>
      </header>

      {/* Contenedor Principal */}
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
                    d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                  />
                </svg>
              )}
            </div>

            <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-[#F7EFC5] mb-2'>
              {success ? 'Túnel Desbloqueado' : 'Autenticación 2FA'}
            </h1>
            <p className='text-sm text-[#F7EFC5]/80 max-w-xs mx-auto'>
              {success
                ? 'Concediendo acceso al servicio privado en Cloudflare...'
                : 'Ingresa el código de 6 dígitos que aparece en tu app Google Authenticator.'}
            </p>
          </div>

          {!success && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitCode();
              }}
              className='space-y-6'
            >
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
                    <span>Validando con Google Authenticator...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar 2FA & Abrir Túnel</span>
                    <span>&rarr;</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Botón de WhatsApp para visitantes / clientes */}
          {!success && (
            <div className='mt-8 pt-6 border-t border-white/10 text-center'>
              <p className='text-xs text-[#F7EFC5]/75 mb-3 font-medium'>
                ¿Interesado en acceder a mis demos privadas o colaborar?
              </p>
              <a
                href='https://wa.me/584128315538?text=Hola%20Cristian,%20estoy%20intentando%20acceder%20a%20uno%20de%20tus%20servicios%20en%20Cloudflare%20Access.%20%C2%BFPodr%C3%ADas%20compartirme%20un%20c%C3%B3digo%202FA%20temporal%3F'
                target='_blank'
                rel='noopener noreferrer'
                onClick={() => {
                  trackEvent({
                    action: 'whatsapp_oidc_2fa_request',
                    category: 'auth_oidc',
                    label: 'Solicitud 2FA Túnel vía WhatsApp',
                  });
                }}
                className='w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide text-white bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/50 hover:border-[#25D366] transition-all duration-200 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(37,211,102,0.2)] hover:scale-[1.01] active:scale-[0.99] group'
              >
                <svg className='w-5 h-5 fill-[#25D366] group-hover:scale-110 transition-transform shrink-0' viewBox='0 0 24 24'>
                  <path d='M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01zm-7.01 15.24c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.22 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.06 0 1.21.89 2.39 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z' />
                </svg>
                <span>Solicitar código 2FA vía WhatsApp</span>
              </a>
            </div>
          )}
        </div>
      </main>

      <footer className='p-6 text-center text-xs text-white/20 relative z-10'>
        <span>CrisOMG Zero Trust Access Bridge &bull; OpenID Connect</span>
      </footer>
    </div>
  );
}
