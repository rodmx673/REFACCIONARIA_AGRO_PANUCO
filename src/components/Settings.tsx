import React, { useState, useEffect, useContext } from 'react';
import { 
  Building2, 
  Palette, 
  FileText, 
  Shield, 
  User, 
  LogOut, 
  Save, 
  Image as ImageIcon,
  CheckCircle2,
  Globe,
  Bot,
  Settings2
} from 'lucide-react';

import { BusinessConfig } from '../types';
import { AuthContext } from './Auth';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AssistantSettings } from './Assistant/AssistantSettings';

// ⚠️ CONFIGURACIÓN DE CLOUDINARY
const CLOUDINARY_CLOUD_NAME = 'dabe5peol'; 
const CLOUDINARY_UPLOAD_PRESET = 'REFACCIONARIA_PANUCO';

export const Settings: React.FC = () => {
  const { user, signOut } = useContext(AuthContext) as any;
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
  const [uploading, setUploading] = useState(false);

  // Estado para los módulos del sistema (POR DEFECTO APAGADOS)
  const [activeModules, setActiveModules] = useState<Record<string, boolean>>({
    pos: true, inventory: true, catalog: true, ecommerce: true, ocr: true, invoices: true,
    customers: true, vendors: true, reports: true, hr: false, commissions: false, 
    attendance: false, payroll: false, invoicing: true, sat: false, admin: true, settings: true
  });

  useEffect(() => {
    // Cargar configuración guardada
    const savedLogo = localStorage.getItem('fp_logo_url');
    const savedPrimary = localStorage.getItem('fp_primary_color');
    const savedSecondary = localStorage.getItem('fp_secondary_color');
    const savedModules = localStorage.getItem('fp_modules');

    setConfig(prev => ({
      ...prev,
      logo: savedLogo || prev.logo,
      primaryColor: savedPrimary || prev.primaryColor,
      secondaryColor: savedSecondary || prev.secondaryColor,
    }));

    if (savedModules) {
      try { setActiveModules(JSON.parse(savedModules)); } catch (e) {}
    }
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona un archivo de imagen válido.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setConfig({ ...config, logo: data.secure_url });
        toast.success('¡Logo subido a Cloudinary con éxito!');
      } else {
        throw new Error('Error al subir');
      }
    } catch (error) {
      toast.error('Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Guardar en localStorage
      localStorage.setItem('fp_logo_url', config.logo);
      localStorage.setItem('fp_primary_color', config.primaryColor);
      localStorage.setItem('fp_secondary_color', config.secondaryColor);
      localStorage.setItem('fp_modules', JSON.stringify(activeModules));
      
      // Aplicar color primario en tiempo real
      document.documentElement.style.setProperty('--primary-color', config.primaryColor);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'business', label: 'Empresa', icon: Building2 },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'modules', label: 'Módulos del Sistema', icon: Settings2 }, // <-- NUEVA SECCIÓN AQUÍ
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
              disabled={isSaving || uploading}
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
            
            {/* VISTA: MÓDULOS DEL SISTEMA */}
            {activeSection === 'modules' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 max-w-2xl"
              >
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
                  Activa o desactiva las funciones que se muestran en el menú lateral. Los cambios se aplicarán al guardar.
                </div>

                {[
                  { id: 'pos', label: 'Punto de Venta', desc: 'Caja registradora y ventas directas.' },
                  { id: 'inventory', label: 'Inventario y Stock', desc: 'Control de piezas y almacén.' },
                  { id: 'catalog', label: 'Catálogo de Partes', desc: 'Buscador de números OEM y distribuidores.' },
                  { id: 'ecommerce', label: 'Pedidos E-Commerce', desc: 'Gestión de tienda virtual.' },
                  { id: 'ocr', label: 'Extractor de Facturas', desc: 'Lectura de facturas con IA.' },
                  { id: 'invoices', label: 'Historial de Facturas', desc: 'Registro de compras a proveedores.' },
                  { id: 'customers', label: 'Clientes', desc: 'Directorio de clientes.' },
                  { id: 'vendors', label: 'Proveedores', desc: 'Directorio de proveedores.' },
                  { id: 'reports', label: 'Reportes', desc: 'Estadísticas y gráficas.' },
                  { id: 'invoicing', label: 'Facturación', desc: 'Generación de tickets y facturas.' },
                  { id: 'hr', label: 'Recursos Humanos', desc: 'Gestión de empleados y salarios.' },
                  { id: 'commissions', label: 'Comisiones', desc: 'Cálculo de comisiones.' },
                  { id: 'attendance', label: 'Asistencia', desc: 'Control de horarios.' },
                  { id: 'payroll', label: 'Nómina', desc: 'Pagos de nómina.' },
                  { id: 'sat', label: 'Configuración SAT', desc: 'Certificados fiscales.' },
                  { id: 'admin', label: 'Panel de Administración', desc: 'Gestión de usuarios y roles.' },
                ].map((mod) => (
                  <div key={mod.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{mod.label}</p>
                      <p className="text-xs text-gray-500">{mod.desc}</p>
                    </div>
                    <button
                      onClick={() => setActiveModules(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                      className={`w-12 h-6 rounded-full transition-colors relative ${activeModules[mod.id] ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${activeModules[mod.id] ? 'left-6.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

            {/* VISTA: EMPRESA */}
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

            {/* VISTA: APARIENCIA */}
            {activeSection === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                  <div className="w-32 h-32 rounded-3xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 group relative cursor-pointer shrink-0">
                    {uploading ? (
                      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <>
                        <img src={config.logo} alt="Logo" className="w-full h-full object-cover" />
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer">
                          <ImageIcon size={24} />
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      </>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Logotipo de la Empresa</h4>
                    <p className="text-sm text-gray-500 mb-4">Se recomienda una imagen cuadrada de al menos 400x400px. Da clic en la imagen para subir una nueva.</p>
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
                      <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-none" value={config.primaryColor} onChange={e => setConfig({...config, primaryColor: e.target.value})} />
                      <input type="text" className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-mono" value={config.primaryColor} onChange={e => setConfig({...config, primaryColor: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Color Secundario</label>
                    <div className="flex items-center gap-4">
                      <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-none" value={config.secondaryColor} onChange={e => setConfig({...config, secondaryColor: e.target.value})} />
                      <input type="text" className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-mono" value={config.secondaryColor} onChange={e => setConfig({...config, secondaryColor: e.target.value})} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* OTRAS VISTAS */}
            {activeSection === 'assistant' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <AssistantSettings />
              </motion.div>
            )}

            {activeSection === 'ticket' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Términos y Condiciones (Pie de Ticket)</label>
                  <textarea rows={6} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-primary transition-all font-medium resize-none" value={config.terms} onChange={e => setConfig({...config, terms: e.target.value})} />
                </div>
              </motion.div>
            )}

            {activeSection === 'profile' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
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
              </motion.div>
            )}

            {activeSection === 'security' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-900">Seguridad de la Cuenta</h4>
                    <p className="text-sm text-amber-700">Administra tus credenciales y la seguridad de tu acceso al sistema.</p>
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
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-8 right-8 z-[200] bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <CheckCircle2 size={24} />
            <span className="font-bold">Configuración guardada exitosamente</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};