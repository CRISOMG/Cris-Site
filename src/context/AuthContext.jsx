import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  emailInfo: null,
  triggerAuthIntent: () => {},
  hasAuthIntent: () => false,
  clearAuthIntent: () => {},
  requestOtp: async () => {},
  verifyOtp: async () => {},
  logout: () => {},
});

const STORAGE_KEY = 'cris_auth_session_v1';
const INTENT_KEY = 'cris_stealth_intent';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailInfo, setEmailInfo] = useState(null);
  const [challengeToken, setChallengeToken] = useState(null);

  // Cargar sesión guardada al iniciar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          setUser(parsed.user);
          setToken(parsed.token);
          // Validar con el backend en segundo plano
          fetch('/api/auth/session', {
            headers: { Authorization: `Bearer ${parsed.token}` },
          })
            .then((r) => r.json())
            .then((res) => {
              if (!res.authenticated) {
                logout();
              }
            })
            .catch(() => {});
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('Error cargando sesión:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerAuthIntent = useCallback(() => {
    try {
      sessionStorage.setItem(INTENT_KEY, Date.now().toString());
    } catch (e) {}
  }, []);

  const hasAuthIntent = useCallback(() => {
    try {
      if (typeof window === 'undefined') return false;
      const intent = sessionStorage.getItem(INTENT_KEY);
      if (!intent) return false;
      // Válido durante 10 minutos tras haber activado el trigger
      return Date.now() - parseInt(intent, 10) < 10 * 60 * 1000;
    } catch (e) {
      return false;
    }
  }, []);

  const clearAuthIntent = useCallback(() => {
    try {
      sessionStorage.removeItem(INTENT_KEY);
    } catch (e) {}
  }, []);

  const requestOtp = useCallback(async (force = false) => {
    try {
      const res = await fetch(`/api/auth/otp/request?force=${force ? 'true' : 'false'}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        if (data.challengeToken) {
          setChallengeToken(data.challengeToken);
        }
        setEmailInfo({
          emailSent: !!data.emailSent,
          maskedEmail: data.maskedEmail,
          message: data.message,
        });
        return data;
      }
      throw new Error(data.message || 'Error al solicitar OTP');
    } catch (err) {
      console.error('Error solicitando OTP:', err);
      throw err;
    }
  }, []);

  const verifyOtp = useCallback(async (code) => {
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, challengeToken }),
      });
      const data = await res.json();
      if (data.updatedChallengeToken) {
        setChallengeToken(data.updatedChallengeToken);
      }
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Código de seguridad incorrecto');
      }

      setUser(data.user);
      setToken(data.token);
      setChallengeToken(null);
      clearAuthIntent();

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: data.token,
          user: data.user,
          expiresAt: data.expiresAt,
        })
      );

      return data;
    } catch (err) {
      console.error('Error verificando OTP:', err);
      throw err;
    }
  }, [challengeToken, clearAuthIntent]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setEmailInfo(null);
    setChallengeToken(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(INTENT_KEY);
    } catch (e) {}
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        emailInfo,
        triggerAuthIntent,
        hasAuthIntent,
        clearAuthIntent,
        requestOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
