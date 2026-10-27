import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { User, Role } from '../types';
import { Tractor, ShieldCheck, ShoppingBag, Key, AlertCircle, Loader2, User as UserIcon, Crown } from 'lucide-react';
import { motion } from 'motion/react';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
const BOOTSTRAP_ADMIN = import.meta.env.VITE_BOOTSTRAP_ADMIN_EMAIL || 'rod.mx673@gmail.com';

async function callApi(action: string, data: any = {}) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 👈 CAMBIO CLAVE
    body: JSON.stringify({ action, data })
  });
  return res.json();
}

interface AuthContextType {
  permissions?: any;
  user: User | null;
  loading: boolean;
  signInWithGoogle: (credential: string, code?: string, intent?: 'admin' | 'user') => Promise<void>;
  signInAsDemo: () => void;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  signInWithGoogle: async () => {}, signInAsDemo: () => {}, signOut: () => {}, refreshUser: async () => {},
});

function decodeJwt(credential: string): any {
  const base64Url = credential.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(decodeURIComponent(window.atob(base64).split('').map(c => 
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('farmer_parts_user');
      if (saved) setUser(JSON.parse(saved));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const persistUser = (u: User) => {
    localStorage.setItem('farmer_parts_user', JSON.stringify(u));
    setUser(u);
  };

  const signInWithGoogle = async (credential: string, code?: string, intent: 'admin' | 'user' = 'user') => {
    const googleData = decodeJwt(credential);
    const isBootstrap = googleData.email === BOOTSTRAP_ADMIN;

    // 1. Buscar al usuario en Google Sheets
    const myUserRes = await callApi('getMyUser', { email: googleData.email });

    if (myUserRes.success && myUserRes.data) {
      const dbUser = myUserRes.data;
      
      if (intent === 'admin' && dbUser.role !== 'ADMIN' && !isBootstrap) {
        throw new Error('Esta cuenta de Google no tiene privilegios de Administrador.');
      }

      persistUser({
        id: dbUser._id || googleData.email,
        name: dbUser.name || googleData.name,
        email: googleData.email,
        role: dbUser.role as Role,
      });
      return;
    }

    // 2. Si es el Admin Bootstrap (dueño) y no existe, registrarlo como ADMIN directo
    if (isBootstrap && intent === 'admin') {
      const regRes = await callApi('registerUser', {
        googleId: googleData.email, name: googleData.name,
        email: googleData.email, role: 'ADMIN', photoURL: googleData.picture,
      });
      persistUser({
        id: regRes.data?._id || googleData.email,
        name: googleData.name, email: googleData.email, role: 'ADMIN',
      });
      return;
    }

    // 3. Si es Usuario y trae código, validarlo y registrarlo
    if (intent === 'user' && code && code.trim()) {
      const v = await callApi('validateCode', { code: code.trim().toUpperCase() });
      if (!v.success) throw new Error(v.error || 'Código de registro inválido o expirado');

      const role = v.data.role as Role;
      const reg = await callApi('registerUser', {
        googleId: googleData.email, name: googleData.name,
        email: googleData.email, role, photoURL: googleData.picture,
      });
      if (!reg.success) throw new Error(reg.error || 'Error al registrar usuario');

      await callApi('useCode', { code: code.trim().toUpperCase(), userEmail: googleData.email });

      persistUser({
        id: reg.data?._id || googleData.email,
        name: googleData.name, email: googleData.email, role,
      });
      return;
    }

    // 4. Casos de error
    if (intent === 'admin') {
      throw new Error('Tu cuenta no está registrada como Administrador.');
    } else {
      throw new Error('Para entrar como Usuario, necesitas un Código de Registro válido.');
    }
  };

  const signInAsDemo = () => {
    persistUser({ id: 'admin-local', name: 'Admin Demo', email: 'demo@farmerparts.com', role: 'ADMIN' });
  };

  const signOut = () => {
    localStorage.removeItem('farmer_parts_user');
    setUser(null);
    if ((window as any).google?.accounts?.id) (window as any).google.accounts.id.disableAutoSelect();
  };

  const refreshUser = async () => {
    if (!user) return;
    const res = await callApi('getMyUser', { email: user.email });
    if (res.success && res.data) {
      persistUser({ ...user, role: res.data.role as Role, name: res.data.name });
    }
  };

  const permissions = user && (user as any).customPermissions ? (user as any).customPermissions : null;

  return (
    <AuthContext.Provider value={{ user, loading, permissions, signInWithGoogle, signInAsDemo, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const LoginView: React.FC<{ onExploreStore?: () => void }> = ({ onExploreStore }) => {
  const { signInWithGoogle, signInAsDemo } = useContext(AuthContext);
  const buttonRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef('');
  const intentRef = useRef<'admin' | 'user'>('admin');
  
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [intent, setIntent] = useState<'admin' | 'user'>('admin');
  const [code, setCode] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => { intentRef.current = intent; }, [intent]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) { setError('Falta VITE_GOOGLE_CLIENT_ID en el .env'); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    document.body.appendChild(s);
    s.onload = () => setScriptLoaded(true);
    
    return () => { if (document.body.contains(s)) document.body.removeChild(s); };
  }, []);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!scriptLoaded || !window.google?.accounts?.id || !buttonRef.current || !clientId) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: any) => {
        if (!response.credential) return;
        setIsSigningIn(true); setError(null);
        try {
          await signInWithGoogle(response.credential, codeRef.current, intentRef.current);
        } catch (err: any) {
          setError(err.message || 'Error de autenticación');
        } finally {
          setIsSigningIn(false);
        }
      }
    });

        window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline", size: "large", width: 380, // ✅ Cambiado "100%" por 380
      text: "continue_with", shape: "rectangular"
    });
  }, [scriptLoaded, signInWithGoogle]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4 overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-3xl"></div>
      </div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-3 shadow-lg">
            <Tractor size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Farmer Parts</h1>
          <p className="text-sm text-gray-500 mt-1">Selecciona tu tipo de acceso</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 text-sm text-red-700 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="shrink-0" size={18} />
            <p>{error}</p>
          </div>
        )}

        {/* Selector de Tipo de Acceso */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button 
            onClick={() => { setIntent('admin'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${intent === 'admin' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Crown size={16} /> Administrador
          </button>
          <button 
            onClick={() => { setIntent('user'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${intent === 'user' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <UserIcon size={16} /> Usuario
          </button>
        </div>

        <div className="space-y-4">
          {/* Input de Código (Solo visible si es Usuario) */}
          {intent === 'user' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 flex justify-between">
                <span>Código de Registro</span>
                <span className="text-red-500">* Requerido</span>
              </label>
              <div className="relative">
                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Ej. ABCD-1234" 
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setError(null); }}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 ring-primary/20 transition-all" 
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">Pide este código al Administrador para poder registrarte.</p>
            </div>
          )}

          {intent === 'admin' && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2 text-xs text-blue-800 animate-in fade-in slide-in-from-top-2">
              <ShieldCheck size={16} className="shrink-0" />
              <p>El acceso de Administrador no requiere código. Entra directo con tu cuenta corporativa.</p>
            </div>
          )}

          {/* Botón de Google */}
          <div ref={buttonRef} className="w-full flex justify-center min-h-[50px] pt-2">
            {isSigningIn && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 size={16} className="animate-spin" /> Verificando...</div>}
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-3 text-xs text-gray-400 font-bold uppercase">o también</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button onClick={signInAsDemo} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all active:scale-98">
            <Tractor size={18} />
            <span>Acceso Demo (Administrador)</span>
          </button>

          {onExploreStore && (
            <button onClick={onExploreStore} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl font-bold text-sm transition-all">
              <ShoppingBag size={18} className="text-emerald-700" />
              <span>Explorar Tienda Virtual</span>
            </button>
          )}
        </div>

        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold text-center mt-6 pt-4 border-t border-gray-100">
          Powered by Farmer Parts OS
        </p>
      </motion.div>
    </div>
  );
};