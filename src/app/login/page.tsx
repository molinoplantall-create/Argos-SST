'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useFeedback } from '@/components/common/FeedbackUI';
import { Lock, Mail, ShieldAlert, Loader2, Info, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useFeedback();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        // Registro
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          console.error('Signup Error:', error);
          if (error.status === 429) throw new Error('Demasiados intentos. Espera un momento y vuelve a intentarlo.');
          if (error.message.includes('already registered')) throw new Error('El correo ya está registrado. Cambia a "Iniciar Sesión".');
          if (error.status === 400 && error.message.includes('Signups are disabled')) {
            throw new Error('El registro de nuevos usuarios está deshabilitado. Contacta al administrador.');
          }
          throw error;
        }
        
        // Crear perfil base si el registro es exitoso
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email,
            full_name: email.split('@')[0].toUpperCase(),
          });
        }
        
        showToast('Cuenta creada con éxito. Revisa tu correo o intenta iniciar sesión.', 'success');
        setIsRegistering(false);
        
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Login Error:', error);
          if (error.status === 429) throw new Error('Demasiados intentos. Espera unos segundos.');
          
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('El correo electrónico no ha sido confirmado. Revisa tu bandeja de entrada o contacta al administrador.');
          }
          throw error;
        }

        showToast('¡Bienvenido al sistema SSOMA!', 'success');
        router.push('/');
      }
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F2EC] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF7F11] opacity-10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#1E93AB] opacity-10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="bg-white border border-[#DCDCDC] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
          
          {/* Header */}
          <div className="p-8 pb-6 border-b border-[#DCDCDC] text-center">
            <div className="w-16 h-16 bg-[#FF7F11]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#FF7F11]/20">
              <ShieldAlert className="w-8 h-8 text-[#FF7F11]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">ARGOS SST</h1>
            <p className="text-gray-500 text-sm">
              Sistema de Gestión de Seguridad y Salud Ocupacional
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleAuth} className="p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-[#DCDCDC] rounded-xl leading-5 bg-white text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7F11] focus:border-[#FF7F11] transition-all sm:text-sm"
                    placeholder="usuario@planta.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-[#DCDCDC] rounded-xl leading-5 bg-white text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7F11] focus:border-[#FF7F11] transition-all sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#FF7F11] focus:ring-[#FF7F11] border-[#DCDCDC] rounded bg-white"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-500">
                  Recordar sesión
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="font-medium text-[#1E93AB] hover:text-[#25a9c4] transition-colors"
                >
                  {isRegistering ? 'Volver a Login' : 'Crear Cuenta'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#FF7F11] hover:bg-[#e66f00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF7F11] focus:ring-offset-white transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>

        <div className="mt-8 bg-white border border-[#DCDCDC] shadow-sm rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <Info className="w-5 h-5 text-[#1E93AB] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-[#1a1a1a] mb-1">Acceso del sistema</h4>
            <p className="text-xs text-gray-500">
              Usa el correo creado en Supabase Auth. El administrador puede crear usuarios y asignar roles por cliente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
