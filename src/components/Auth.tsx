import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '../types';
import { Tractor, ShieldCheck, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  signInAsDemo: () => void;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  signInAsDemo: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedDemo = sessionStorage.getItem('farmer_parts_demo_user');
      if (savedDemo) return JSON.parse(savedDemo);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(true);

  const signInAsDemo = async () => {
    const demoUser: User = {
      id: 'admin-local',
      name: 'Administrador Farmer Parts',
      email: 'rod.mx673@gmail.com',
      role: 'ADMIN',
    };
    try {
      sessionStorage.setItem('farmer_parts_demo_user', JSON.stringify(demoUser));
    } catch {}
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.warn('Anonymous sign-in not available:', e);
    }
    setUser(demoUser);
  };

  const signOut = async () => {
    try {
      sessionStorage.removeItem('farmer_parts_demo_user');
    } catch {}
    try {
      await auth.signOut();
    } catch (e) {
      console.warn('Error during sign out:', e);
    }
    setUser(null);
  };

  useEffect(() => {
    // 1. Atrapar el resultado de la redirección de Google (móvil)
    getRedirectResult(auth)
      .then((result) => {
        if (result) console.log("Sesión iniciada vía redirección");
      })
      .catch((error) => {
        console.error("Error en redirección:", error);
      });

    // 2. Escuchar el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !firebaseUser.isAnonymous) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as User;
            setUser({ id: firebaseUser.uid, ...data, role: 'ADMIN' } as User);
          } else {
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Administrador',
              email: firebaseUser.email || 'rod.mx673@gmail.com',
              role: 'ADMIN',
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setUser({ id: firebaseUser.uid, name: firebaseUser.displayName || 'Admin', email: firebaseUser.email || '', role: 'ADMIN' });
        }
      } else {
        try {
          const savedDemo = sessionStorage.getItem('farmer_parts_demo_user');
          if (savedDemo) {
            setUser(JSON.parse(savedDemo));
            setLoading(false);
            return;
          }
        } catch {}
        if (!firebaseUser) setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    try {
      if (isMobile) {
        // En Android/iOS usamos redirección porque bloquean las ventanas emergentes
        await signInWithRedirect(auth, provider);
      } else {
        // En computadora usamos popup normal
        await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        console.error('Error signing in:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, signInAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const LoginView: React.FC<{ onExploreStore?: () => void }> = ({ onExploreStore }) => {
  const { signIn, signInAsDemo } = React.useContext(AuthContext);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signIn();
    } finally {
      setTimeout(() => setIsSigningIn(false), 3000); // Evitar doble clic
    }
  };

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
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <ShieldCheck className="text-blue-600 shrink-0" size={20} />
            <p className="text-sm text-blue-800">
              Elige tu tipo de acceso. Los administradores entran directo con Google; los usuarios necesitan un código de registro.
            </p>
          </div>

          <button onClick={handleSignIn} disabled={isSigningIn} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary rounded-xl font-semibold text-white hover:bg-primary/90 transition-all shadow-md disabled:opacity-50">
            {isSigningIn ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
            )}
            {isSigningIn ? 'Conectando...' : 'Continuar con Google (Administrador)'}
          </button>

          <button onClick={signInAsDemo} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-98">
            <Tractor size={18} />
            <span>Acceso Inmediato al Punto de Venta (Admin Demo)</span>
          </button>

          {onExploreStore && (
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-xs text-gray-400 font-bold uppercase">o también</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
              <button type="button" onClick={onExploreStore} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl font-bold text-sm transition-all shadow-xs">
                <ShoppingBag size={18} className="text-emerald-700" />
                <span>Explorar Tienda Virtual como Cliente</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Powered by Farmer Parts OS</p>
        </div>
      </motion.div>
    </div>
  );
};