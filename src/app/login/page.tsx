'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useFeedback } from '@/components/common/FeedbackUI';
import { Lock, Mail, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const REMEMBER_KEY = 'argos_remember_email';

export default function LoginPage() {
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
    <div className="min-h-screen bg-[#0F1923] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Fondo decorativo — círculos de radar/sonar */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        {[400, 600, 800, 1000].map((size, i) => (
          <div
            key={size}
            className="absolute rounded-full border border-white/[0.04]"
            style={{ width: size, height: size, animationDelay: `${i * 0.5}s` }}
          />
        ))}
      </div>
      {/* Glow naranja — esquina superior derecha */}
      <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-[#FF7F11] opacity-[0.07] rounded-full blur-[100px] pointer-events-none" />
      {/* Glow teal — esquina inferior izquierda */}
      <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-[#1E93AB] opacity-[0.07] rounded-full blur-[100px] pointer-events-none" />

      {/* Tarjeta principal */}
      <div className="w-full max-w-sm z-10">
        <div className="bg-[#162230] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

          {/* Header con logo */}
          <div className="px-8 pt-10 pb-6 text-center border-b border-white/10">
            {/* Logo ARGOS SST */}
            <div className="flex justify-center mb-5">
              <div className="relative flex items-center gap-3">
                {/* Ícono del ojo/radar que caracteriza ARGOS */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1E93AB] to-[#134686] flex items-center justify-center shadow-lg shadow-[#1E93AB]/30">
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#FF7F11] rounded-full flex items-center justify-center shadow-md">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
                {/* Texto ARGOS SST */}
                <div className="text-left">
                  <div className="text-3xl font-black text-white leading-none tracking-tight">ARGOS</div>
                  <div className="text-lg font-black text-[#1E93AB] leading-none tracking-[0.3em]">SST</div>
                </div>
              </div>
            </div>
            <p className="text-gray-400 text-sm font-medium">
              Inspecciona · Controla · Previene
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLogin} className="px-8 py-7 space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest">
                Correo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="luis@argos.com"
                  className="block w-full pl-11 pr-4 py-3 bg-[#0F1923] border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E93AB] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="block w-full pl-11 pr-12 py-3 bg-[#0F1923] border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E93AB] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  id="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
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
                className={`relative w-9 h-5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1E93AB] focus:ring-offset-2 focus:ring-offset-[#162230] ${
                  rememberMe ? 'bg-[#1E93AB]' : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    rememberMe ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-400 select-none cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                Recordar cuenta
              </span>
            </div>

            {/* Botón principal */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-black text-white bg-gradient-to-r from-[#FF7F11] to-[#e66f00] hover:from-[#e66f00] hover:to-[#cc5f00] shadow-lg shadow-orange-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-7 text-center">
            <p className="text-[11px] text-gray-600">
              ¿Sin acceso? Contacta a tu administrador SST
            </p>
          </div>
        </div>

        {/* Badge de seguridad */}
        <div className="mt-5 flex items-center justify-center gap-2 text-gray-600">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[11px]">Acceso protegido · ARGOS SST v1.0</span>
        </div>
      </div>
    </div>
  );
}
