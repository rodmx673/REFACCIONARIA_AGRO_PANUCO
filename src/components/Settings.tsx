import React, { useState, useEffect, useContext } from 'react';
import { 
  Settings as SettingsIcon, 
  Building2, 
  Palette, 
  FileText, 
  Shield, 
  User, 
  LogOut, 
  Save, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Bell,
  Database,
  Globe,
  Bot
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { BusinessConfig, User as UserType } from '../types';
import { AuthContext } from './Auth';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AssistantSettings } from './Assistant/AssistantSettings';

export const Settings: React.FC = () => {
  const { user, signOut } = useContext(AuthContext);
  const [config, setConfig] = useState<BusinessConfig>({
    name: 'Farmer Parts',
    logo: 'https://picsum.photos/seed/logo/200/200',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    rfc: 'FPA123456789',
    address: 'Av. Agrícola 123, Col. Centro, México',
    terms: 'Garantía de 30 días en partes eléctricas. No hay devoluciones en partes usadas.'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState('business');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'businessConfig', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as BusinessConfig);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'businessConfig/main');
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'businessConfig', 'main'), config);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'business', label: 'Empresa', icon: Building2 },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'assistant', label: 'Asistente Virtual', icon: Bot },
    { id: 'ticket', label: 'Ticket', icon: FileText },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Seguridad', icon: Shield },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-12">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 shrink-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto pb-4 lg:pb-0 scrollbar-hide">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all whitespace-nowrap lg:w-full",
              activeSection === section.id 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-gray-500 hover:bg-white hover:text-primary"
            )}
          >
            <section.icon size={20} />
            <span className={cn(activeSection === section.id ? "block" : "hidden lg:block")}>{section.label}</span>
          </button>
        ))}
        <div className="hidden lg:block pt-8">
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50/50 gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {sections.find(s => s.id === activeSection)?.label}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Configuración</p>
          </div>
          {activeSection !== 'assistant' && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 w-full sm:w-auto"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Guardar
                </>
              )}
            </button>
          )}
        </div>

        <div className="p-4 sm:p-8">
          <AnimatePresence mode="wait">
            {activeSection === 'business' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre Comercial</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-medium"
                      value={config.name}
                      onChange={e => setConfig({...config, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">RFC</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-medium"
                      value={config.rfc}
                      onChange={e => setConfig({...config, rfc: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dirección Fiscal</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-medium"
                      value={config.address}
                      onChange={e => setConfig({...config, address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900">Configuración Global</h4>
                    <p className="text-sm text-blue-700">Estos datos se utilizarán para la generación de facturas y tickets de venta.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-8">
                  <div className="w-32 h-32 rounded-3xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 group relative cursor-pointer">
                    <img src={config.logo} alt="Logo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <ImageIcon size={24} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Logotipo de la Empresa</h4>
                    <p className="text-sm text-gray-500 mb-4">Se recomienda una imagen cuadrada de al menos 400x400px.</p>
                    <input 
                      type="text"
                      placeholder="URL del logo..."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-medium text-sm"
                      value={config.logo}
                      onChange={e => setConfig({...config, logo: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Color Primario</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color"
                        className="w-12 h-12 rounded-xl cursor-pointer border-none"
                        value={config.primaryColor}
                        onChange={e => setConfig({...config, primaryColor: e.target.value})}
                      />
                      <input 
                        type="text"
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-mono"
                        value={config.primaryColor}
                        onChange={e => setConfig({...config, primaryColor: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Color Secundario</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color"
                        className="w-12 h-12 rounded-xl cursor-pointer border-none"
                        value={config.secondaryColor}
                        onChange={e => setConfig({...config, secondaryColor: e.target.value})}
                      />
                      <input 
                        type="text"
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-mono"
                        value={config.secondaryColor}
                        onChange={e => setConfig({...config, secondaryColor: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'assistant' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <AssistantSettings />
              </motion.div>
            )}

            {activeSection === 'ticket' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Términos y Condiciones (Pie de Ticket)</label>
                  <textarea 
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-primary transition-all font-medium resize-none"
                    value={config.terms}
                    onChange={e => setConfig({...config, terms: e.target.value})}
                  />
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-4">Vista Previa</h4>
                  <div className="max-w-[300px] mx-auto bg-white p-6 shadow-lg border border-gray-100 text-[10px] font-mono space-y-2">
                    <div className="text-center border-b border-dashed pb-2">
                      <p className="font-black text-xs uppercase">{config.name}</p>
                      <p>{config.rfc}</p>
                      <p>{config.address}</p>
                    </div>
                    <div className="py-2 space-y-1">
                      <div className="flex justify-between"><span>1x BOMBA AGUA</span><span>$1,450.00</span></div>
                      <div className="flex justify-between"><span>2x FILTRO ACEITE</span><span>$490.00</span></div>
                    </div>
                    <div className="border-t border-dashed pt-2 space-y-1">
                      <div className="flex justify-between font-bold"><span>TOTAL</span><span>$1,940.00</span></div>
                    </div>
                    <div className="text-center pt-4 text-[8px] text-gray-400 italic">
                      {config.terms}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'profile' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="w-20 h-20 rounded-2xl bg-primary text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-primary/20">
                    {user?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">{user?.name}</h3>
                    <p className="text-gray-500 font-medium">{user?.email}</p>
                    <div className="mt-2 inline-flex px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                      {user?.role}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre Completo</label>
                    <input 
                      disabled
                      type="text"
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-100 rounded-xl outline-none font-medium text-gray-500 cursor-not-allowed"
                      value={user?.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Correo Electrónico</label>
                    <input 
                      disabled
                      type="email"
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-100 rounded-xl outline-none font-medium text-gray-500 cursor-not-allowed"
                      value={user?.email}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'security' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-900">Seguridad de la Cuenta</h4>
                    <p className="text-sm text-amber-700">Administra tus credenciales y la seguridad de tu acceso al sistema.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      <h5 className="font-bold text-gray-900">Cambiar Contraseña</h5>
                      <p className="text-xs text-gray-500">Se enviará un correo para restablecer tu contraseña.</p>
                    </div>
                    <button 
                      onClick={() => toast.info('Funcionalidad de restablecimiento de contraseña enviada al correo')}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                    >
                      Solicitar Cambio
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      <h5 className="font-bold text-gray-900">Autenticación de Dos Factores</h5>
                      <p className="text-xs text-gray-500">Añade una capa extra de seguridad a tu cuenta.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Desactivado</span>
                      <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Sesiones Activas</h5>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Globe size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">Chrome en Windows (Actual)</p>
                            <p className="text-[10px] text-gray-400">Ciudad de México, México • IP: 189.210.XX.XX</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">En línea</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-[200] bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle2 size={24} />
            <span className="font-bold">Configuración guardada exitosamente</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
