import React, { useState } from 'react';
import { ClipboardList, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { AuthResponse } from '../types/census';

interface LoginProps {
  onLogin: (auth: AuthResponse) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data);
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#141414]/10 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#005944] p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          </div>
          <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl p-4">
            <img src="/logo.png" alt="IMSS Bienestar" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-[#E4E3E0] font-serif italic text-3xl tracking-tight leading-tight mb-1">Censo Materno</h1>
          <p className="text-[#B38E5D] text-[10px] uppercase tracking-[0.3em] font-bold">Servicios Públicos de Salud</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="login-username" className="text-[10px] uppercase tracking-widest font-bold opacity-50 ml-1">Usuario</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
              <input
                id="login-username"
                type="text"
                required
                className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all font-medium"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="text-[10px] uppercase tracking-widest font-bold opacity-50 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
              <input
                id="login-password"
                type="password"
                required
                className="w-full bg-[#E4E3E0]/30 border border-[#141414]/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#141414] text-[#E4E3E0] py-4 rounded-xl font-bold tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'INICIANDO SESIÓN...' : 'ENTRAR AL SISTEMA'}
          </button>

          <div className="pt-4 text-center">
            <p className="text-[10px] opacity-30 uppercase tracking-tighter">
              Acceso restringido a personal autorizado
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
