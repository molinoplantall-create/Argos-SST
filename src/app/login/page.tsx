'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useFeedback } from '@/components/common/FeedbackUI';
import { Lock, Mail, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

const REMEMBER_KEY = 'argos_remember_email';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useFeedback();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Al montar, recuperar email guardado
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Gestionar email recordado
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.status === 429)
          throw new Error('Demasiados intentos. Espera unos segundos e intenta de nuevo.');
        if (error.message.includes('Invalid login credentials'))
          throw new Error('Correo o contraseña incorrectos. Verifica tus datos.');
        if (error.message.includes('Email not confirmed'))
          throw new Error('Confirma tu correo electrónico o contacta al administrador.');
        throw error;
      }

      showToast('¡Bienvenido a ARGOS SST!', 'success');
      const redirectTo = searchParams.get('redirectTo') || '/';
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Error al iniciar sesión.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm z-10">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">

        {/* Header con logo */}
        <div className="px-8 pt-10 pb-6 text-center border-b border-gray-100">
          <div className="flex justify-center mb-5">
            <img 
              src="/logo.png" 
              alt="Logo Corporativo" 
              className="h-20 w-auto object-contain"
              onError={(e) => {
                // Fallback por si la ruta no coincide exactamente
                (e.target as HTMLImageElement).src = '/logo-minera.png';
              }}
            />
          </div>
          <p className="text-gray-500 text-sm font-medium">
            Sistema de Gestión SST
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="px-8 py-7 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="block w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                id="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye className="h-4 w-4" />
                }
              </button>
            </div>
          </div>

          {/* Recordar cuenta */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="remember-me-toggle"
              role="checkbox"
              aria-checked={rememberMe}
              onClick={() => setRememberMe(!rememberMe)}
              className={`relative w-9 h-5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white ${
                rememberMe ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  rememberMe ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-gray-600 select-none cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
              Recordar cuenta
            </span>
          </div>

          {/* Botón principal */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Footer */}
        <div className="px-8 pb-7 text-center">
          <p className="text-[11px] text-gray-500">
            ¿Problemas para acceder? Contacta a tu administrador
          </p>
        </div>
      </div>

      {/* Badge de seguridad */}
      <div className="mt-5 flex items-center justify-center gap-2 text-gray-500">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span className="text-[11px]">Acceso Seguro · Sistema SST</span>
      </div>
    </div>
  );
}

// ─── Página exportada con Suspense para evitar error de prerendering ──────────
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo decorativo simple */}
      <div className="absolute top-0 left-0 w-full h-64 bg-blue-600 rounded-b-[100px] opacity-10 pointer-events-none" />

      <Suspense fallback={
        <div className="flex items-center justify-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
