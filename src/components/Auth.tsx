import React, { useState, useEffect, useCallback } from 'react';
import {
  initializeGoogleAuth,
  promptGoogleLogin,
  getStoredGoogleUser,
  clearGoogleSession,
  GoogleUser,
} from '../lib/googleAuth';
import {
  validateRegistrationCode,
  useRegistrationCode,
  registerUserInSheet,
  getMyUser,
  getAllRoles,
  sheetRoleToPermissions,
  SheetUser,
} from '../lib/sheetsApi';
import { User, Role } from '../types';
import { LogIn, Tractor, ShieldCheck, ShoppingBag, KeyRound, UserPlus, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GoogleIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className={className}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

// ═══════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════

interface UserPermissions {
  canAccessPOS: boolean;
  canModifyPrices: boolean;
  canApplyDiscounts: boolean;
  canAccessInventory: boolean;
  canAdjustStock: boolean;
  canAccessOCR: boolean;
  canAccessCustomers: boolean;
  canManageCredits: boolean;
  canAccessVendors: boolean;
  canAccessReports: boolean;
  canAccessHR: boolean;
  canManageEmployees: boolean;
  canManagePermissions: boolean;
  canAccessInvoicing: boolean;
  canCloseCashRegister: boolean;
  canAccessSettings: boolean;
  canManageBlog: boolean;
  canManageStore: boolean;
}

interface AuthContextType {
  user: User | null;
  permissions: UserPermissions | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  signInAsDemo: () => void;
  isAdmin: boolean;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  permissions: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  signInAsDemo: () => {},
  isAdmin: false,
});

const SESSION_KEY = 'farmer_parts_session';
const PERMISSIONS_KEY = 'farmer_parts_permissions';

/**
 * Emails que se auto-registran como ADMIN sin necesidad de código.
 * Deben coincidir con la columna adminEmails de la hoja auth_config.
 */
const BOOTSTRAP_ADMIN_EMAILS = [
  'rod.mx673@gmail.com',
];

const ALL_PERMISSIONS_TRUE: UserPermissions = {
  canAccessPOS: true, canModifyPrices: true, canApplyDiscounts: true,
  canAccessInventory: true, canAdjustStock: true, canAccessOCR: true,
  canAccessCustomers: true, canManageCredits: true, canAccessVendors: true,
  canAccessReports: true, canAccessHR: true, canManageEmployees: true,
  canManagePermissions: true, canAccessInvoicing: true, canCloseCashRegister: true,
  canAccessSettings: true, canManageBlog: true, canManageStore: true,
};

function getStoredSession(): { user: User; permissions: UserPermissions } | null {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(PERMISSIONS_KEY);
        return null;
      }
      return parsed;
    }
  } catch {}
  return null;
}

function saveSession(user: User, permissions: UserPermissions, expiresInHours: number = 24): void {
  try {
    const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, permissions, expiresAt }));
  } catch {}
}

function loadPermissionsFromRole(roleCode: string, rolesData: any[]): UserPermissions {
  // ADMIN gets everything
  if (roleCode === 'ADMIN') return ALL_PERMISSIONS_TRUE;

  const role = rolesData.find((r: any) => r.code === roleCode);
  if (!role) return { ...ALL_PERMISSIONS_TRUE, canManagePermissions: false };

  return {
    canAccessPOS: role.canAccessPOS === true || role.canAccessPOS === 'TRUE',
    canModifyPrices: role.canModifyPrices === true || role.canModifyPrices === 'TRUE',
    canApplyDiscounts: role.canApplyDiscounts === true || role.canApplyDiscounts === 'TRUE',
    canAccessInventory: role.canAccessInventory === true || role.canAccessInventory === 'TRUE',
    canAdjustStock: role.canAdjustStock === true || role.canAdjustStock === 'TRUE',
    canAccessOCR: role.canAccessOCR === true || role.canAccessOCR === 'TRUE',
    canAccessCustomers: role.canAccessCustomers === true || role.canAccessCustomers === 'TRUE',
    canManageCredits: role.canManageCredits === true || role.canManageCredits === 'TRUE',
    canAccessVendors: role.canAccessVendors === true || role.canAccessVendors === 'TRUE',
    canAccessReports: role.canAccessReports === true || role.canAccessReports === 'TRUE',
    canAccessHR: role.canAccessHR === true || role.canAccessHR === 'TRUE',
    canManageEmployees: role.canManageEmployees === true || role.canManageEmployees === 'TRUE',
    canManagePermissions: role.canManagePermissions === true || role.canManagePermissions === 'TRUE',
    canAccessInvoicing: role.canAccessInvoicing === true || role.canAccessInvoicing === 'TRUE',
    canCloseCashRegister: role.canCloseCashRegister === true || role.canCloseCashRegister === 'TRUE',
    canAccessSettings: role.canAccessSettings === true || role.canAccessSettings === 'TRUE',
    canManageBlog: role.canManageBlog === true || role.canManageBlog === 'TRUE',
    canManageStore: role.canManageStore === true || role.canManageStore === 'TRUE',
  };
}


// ═══════════════════════════════════════════════════
//  AUTH PROVIDER
// ═══════════════════════════════════════════════════

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<GoogleUser | null>(null);

  // Restore session on mount
  useEffect(() => {
    const stored = getStoredSession();
    if (stored) {
      setUser(stored.user);
      setPermissions(stored.permissions);
    }
    setLoading(false);
  }, []);

  // Initialize Google GIS
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await initializeGoogleAuth(async (googleUser) => {
          if (!cancelled) {
            await handleGoogleUser(googleUser);
          }
        });
      } catch (err) {
        console.error('Failed to initialize Google Auth:', err);
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // After Google auth, check if user exists in sheet
  const handleGoogleUser = useCallback(async (googleUser: GoogleUser) => {
    const isBootstrapAdmin = BOOTSTRAP_ADMIN_EMAILS
      .map(e => e.toLowerCase())
      .includes((googleUser.email || '').toLowerCase());

    try {
      // Look up user in Google Sheets
      const result = await getMyUser(googleUser.id, googleUser.email);

      if (result.success && result.data) {
        // Existing user — load their role and permissions
        const sheetUser = result.data;
        if (sheetUser.isActive === 'FALSE') {
          alert('Tu cuenta está desactivada. Contacta al administrador.');
          clearGoogleSession();
          return;
        }

        const appUser: User = {
          id: sheetUser._id,
          name: sheetUser.name || googleUser.name,
          email: sheetUser.email,
          role: sheetUser.role,
        };

        // Load permissions from roles sheet
        let userPerms: UserPermissions;
        if (sheetUser.role === 'ADMIN') {
          userPerms = ALL_PERMISSIONS_TRUE;
        } else {
          const rolesResult = await getAllRoles();
          if (rolesResult.success && rolesResult.data) {
            userPerms = loadPermissionsFromRole(sheetUser.role, rolesResult.data);
          } else {
            userPerms = { ...ALL_PERMISSIONS_TRUE, canManagePermissions: false };
          }
        }

        saveSession(appUser, userPerms);
        setUser(appUser);
        setPermissions(userPerms);
        setPendingGoogleUser(null);
      } else if (isBootstrapAdmin) {
        // Bootstrap admin — auto-register as ADMIN without code
        const registerResult = await registerUserInSheet(
          googleUser.id,
          googleUser.name,
          googleUser.email,
          'ADMIN',
          googleUser.picture
        );

        const appUser: User = {
          id: registerResult.data?._id || googleUser.id,
          name: googleUser.name,
          email: googleUser.email,
          role: 'ADMIN',
        };

        saveSession(appUser, ALL_PERMISSIONS_TRUE);
        setUser(appUser);
        setPermissions(ALL_PERMISSIONS_TRUE);
        setPendingGoogleUser(null);
      } else {
        // New user — needs registration code
        setPendingGoogleUser(googleUser);
      }
    } catch (err) {
      console.error('Error looking up user:', err);
      // Offline or API error — if bootstrap admin, allow in
      if (isBootstrapAdmin) {
        const appUser: User = {
          id: googleUser.id,
          name: googleUser.name,
          email: googleUser.email,
          role: 'ADMIN',
        };
        saveSession(appUser, ALL_PERMISSIONS_TRUE);
        setUser(appUser);
        setPermissions(ALL_PERMISSIONS_TRUE);
        setPendingGoogleUser(null);
      } else {
        setPendingGoogleUser(googleUser);
      }
    }
  }, []);

  const completeRegistration = useCallback(async (code: string): Promise<string | null> => {
    if (!pendingGoogleUser) return 'No hay usuario de Google pendiente';

    // Validate the code
    const validateResult = await validateRegistrationCode(code);
    if (!validateResult.success || !validateResult.data) {
      return validateResult.error || 'Código inválido';
    }

    const role = validateResult.data.role;

    // Register user in sheet
    const registerResult = await registerUserInSheet(
      pendingGoogleUser.id,
      pendingGoogleUser.name,
      pendingGoogleUser.email,
      role,
      pendingGoogleUser.picture
    );

    if (!registerResult.success || !registerResult.data) {
      return registerResult.error || 'Error al registrar usuario';
    }

    // Mark code as used
    await useRegistrationCode(code, pendingGoogleUser.email);

    // Load permissions
    let userPerms: UserPermissions;
    if (role === 'ADMIN') {
      userPerms = ALL_PERMISSIONS_TRUE;
    } else {
      const rolesResult = await getAllRoles();
      if (rolesResult.success && rolesResult.data) {
        userPerms = loadPermissionsFromRole(role, rolesResult.data);
      } else {
        userPerms = { ...ALL_PERMISSIONS_TRUE, canManagePermissions: false };
      }
    }

    const appUser: User = {
      id: registerResult.data._id,
      name: pendingGoogleUser.name,
      email: pendingGoogleUser.email,
      role: role,
    };

    saveSession(appUser, userPerms);
    setUser(appUser);
    setPermissions(userPerms);
    setPendingGoogleUser(null);
    return null; // success
  }, [pendingGoogleUser]);

  const skipRegistration = useCallback(() => {
    setPendingGoogleUser(null);
    clearGoogleSession();
  }, []);

  const signIn = async () => {
    try {
      await promptGoogleLogin();
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const signOut = async () => {
    clearGoogleSession();
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(PERMISSIONS_KEY);
    } catch {}
    setUser(null);
    setPermissions(null);
  };

  const signInAsDemo = async () => {
    const demoUser: User = {
      id: 'admin-local',
      name: 'Administrador Farmer Parts',
      email: 'rod.mx673@gmail.com',
      role: 'ADMIN',
    };
    saveSession(demoUser, ALL_PERMISSIONS_TRUE, 8);
    setUser(demoUser);
    setPermissions(ALL_PERMISSIONS_TRUE);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, permissions, loading, signIn, signOut, signInAsDemo, isAdmin }}>
      {children}
      <AnimatePresence>
        {pendingGoogleUser && (
          <RegistrationModal
            googleUser={pendingGoogleUser}
            onComplete={completeRegistration}
            onCancel={skipRegistration}
          />
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
};


// ═══════════════════════════════════════════════════
//  REGISTRATION MODAL (code entry)
// ═══════════════════════════════════════════════════

const RegistrationModal: React.FC<{
  googleUser: GoogleUser;
  onComplete: (code: string) => Promise<string | null>;
  onCancel: () => void;
}> = ({ googleUser, onComplete, onCancel }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || verifying) return;

    setVerifying(true);
    setError('');

    const result = await onComplete(code.trim().toUpperCase());

    if (result === null) {
      setVerified(true);
      setTimeout(() => {}, 1500);
    } else {
      setError(result);
      setVerifying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
      >
        {verified ? (
          <div className="text-center py-8">
            <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">¡Registro exitoso!</h2>
            <p className="text-gray-500 mt-2">Bienvenido a Farmer Parts</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-4">
                <KeyRound size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Código de Registro</h2>
              <p className="text-gray-500 mt-2 text-sm">
                Bienvenido, <strong>{googleUser.name}</strong>
              </p>
              <p className="text-gray-400 text-xs mt-1">{googleUser.email}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
              <ShieldCheck className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-amber-800">
                Necesitas un código de registro proporcionado por el administrador para acceder al sistema.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de acceso
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  maxLength={10}
                  className="w-full text-center text-2xl font-mono font-bold tracking-widest px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none uppercase"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
                  <XCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!code.trim() || verifying}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Registrar Cuenta
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full py-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};


// ═══════════════════════════════════════════════════
//  LOGIN VIEW
// ═══════════════════════════════════════════════════

export const LoginView: React.FC<{ onExploreStore?: () => void }> = ({ onExploreStore }) => {
  const { signIn, signInAsDemo } = React.useContext(AuthContext);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showNativeFallback, setShowNativeFallback] = useState(false);
  const buttonContainerRef = React.useRef<HTMLDivElement>(null);

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signIn();
    } finally {
      setIsSigningIn(false);
    }
  };

  useEffect(() => {
    if (!showNativeFallback) return;
    let mounted = true;
    const renderButton = async () => {
      try {
        const { renderGoogleButton, isGoogleAuthLoaded } = await import('../lib/googleAuth');
        let attempts = 0;
        const waitForGIS = setInterval(() => {
          if (!mounted) { clearInterval(waitForGIS); return; }
          if (isGoogleAuthLoaded() && buttonContainerRef.current) {
            clearInterval(waitForGIS);
            renderGoogleButton(buttonContainerRef.current);
          }
          attempts++;
          if (attempts > 50) clearInterval(waitForGIS);
        }, 200);
      } catch (err) {
        console.warn('Could not render Google button:', err);
      }
    };
    renderButton();
    return () => { mounted = false; };
  }, [showNativeFallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4 overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 relative z-10"
      >
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

          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <GoogleIcon size={20} className="shrink-0" />
            )}
            {isSigningIn ? 'Iniciando sesión...' : 'Continuar con Google (Administrador)'}
          </button>

          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <GoogleIcon size={20} className="shrink-0" />
            )}
            {isSigningIn ? 'Iniciando sesión...' : 'Continuar con Google (Usuario)'}
          </button>

          {!showNativeFallback && (
            <button
              type="button"
              onClick={() => setShowNativeFallback(true)}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
            >
              ¿No funciona? Usa el botón oficial de Google
            </button>
          )}

          <div
            ref={buttonContainerRef}
            className={showNativeFallback ? 'flex justify-center pt-1' : 'hidden'}
          />

          <button
            onClick={signInAsDemo}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-98"
          >
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
              <button
                type="button"
                onClick={onExploreStore}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl font-bold text-sm transition-all shadow-xs"
              >
                <ShoppingBag size={18} className="text-emerald-700" />
                <span>Explorar Tienda Virtual como Cliente</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            Powered by Farmer Parts OS
          </p>
        </div>
      </motion.div>
    </div>
  );
};
