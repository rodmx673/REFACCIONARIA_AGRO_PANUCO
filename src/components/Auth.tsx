import React, { useState, useEffect, createContext, useContext } from 'react';
import { User } from '../types';
import { Tractor, ShieldCheck, ShoppingBag, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

// Interfaz para el token de Google
interface GoogleUserInfo {
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: (credential: string) => void;
  signInAsDemo: () => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: () => {},
  signInAsDemo: () => {},
  signOut: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar sesión guardada en el navegador
    try {
      const savedUser = localStorage.getItem('farmer_parts_user');
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (e) {
      console.error("Error cargando sesión", e);
    }
    setLoading(false);
  }, []);

  const signInWithGoogle = (credential: string) => {
    try {
      // Decodificar el JWT de Google (sin librerías externas)
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const googleData: GoogleUserInfo = JSON.parse(jsonPayload);

      const newUser: User = {
        id: googleData.email, // Usamos el email como ID único
        name: googleData.name,
        email: googleData.email,
        role: 'ADMIN', // Por ahora todos los que entren con Google serán Admin
      };

      localStorage.setItem('farmer_parts_user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (error) {
      console.error("Error procesando inicio de sesión:", error);
    }
  };

  const signInAsDemo = () => {
    const demoUser: User = {
      id: 'admin-local',
      name: 'Administrador Demo',
      email: 'demo@farmerparts.com',
      role: 'ADMIN',
    };
    localStorage.setItem('farmer_parts_user', JSON.stringify(demoUser));
    setUser(demoUser);
  };

  const signOut = () => {
    localStorage.removeItem('farmer_parts_user');
    setUser(null);
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInAsDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

declare global {
  interface Window {
    google: any;
  }
}

export const LoginView: React.FC<{ onExploreStore?: () => void }> = ({ onExploreStore }) => {
  const { signInWithGoogle, signInAsDemo } = useContext(AuthContext);
  const buttonRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar el script oficial de Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google?.accounts?.id && buttonRef.current) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            if (response.credential) signInWithGoogle(response.credential);
          }
        });

        // Renderizar el botón oficial de Google
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "continue_with",
          shape: "rectangular"
        });
      }
    };

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [signInWithGoogle]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4 overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-3xl"></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary text-white mb-4 shadow-lg">
            <Tractor size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Farmer Parts</h1>
          <p className="text-gray-500 mt-2">Punto de Venta e Inventario Agrícola</p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 mb-6">
            <ShieldCheck className="text-blue-600 shrink-0" size={20} />
            <p className="text-sm text-blue-800">
              Inicia sesión de forma segura con tu cuenta corporativa de Google.
            </p>
          </div>

          {/* Contenedor donde Google dibuja su botón oficial */}
          <div ref={buttonRef} className="w-full flex justify-center min-h-[50px]"></div>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-xs text-gray-400 font-bold uppercase">o también</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button onClick={signInAsDemo} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-98">
            <Tractor size={18} />
            <span>Acceso Inmediato al Punto de Venta (Admin Demo)</span>
          </button>

          {onExploreStore && (
            <button type="button" onClick={onExploreStore} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl font-bold text-sm transition-all shadow-xs mt-4">
              <ShoppingBag size={18} className="text-emerald-700" />
              <span>Explorar Tienda Virtual como Cliente</span>
            </button>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Powered by Farmer Parts OS</p>
        </div>
      </motion.div>
    </div>
  );
};