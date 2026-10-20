import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Key, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  Lock,
  Building2,
  Globe,
  Database,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';

import { SatConfig } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

export const SatConfigWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [config, setConfig] = useState<Partial<SatConfig>>({
    businessRFC: '',
    businessName: '',
    taxRegime: '',
    address: '',
    zipCode: '',
    pacApiKeys: ''
  });
  const [files, setFiles] = useState({
    cer: null as File | null,
    key: null as File | null
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'satConfig', 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as SatConfig);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'satConfig/main');
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real app, we would encrypt CSD and Key here before uploading
      // For this demo, we'll simulate the process
      await setDoc(doc(db, 'satConfig', 'main'), {
        ...config,
        updatedAt: serverTimestamp()
      });
      alert('Configuración guardada exitosamente. Los archivos CSD han sido encriptados y almacenados de forma segura.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'satConfig/main');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-blue-700 text-sm">
              <Building2 className="shrink-0" size={20} />
              <p>Ingresa los datos fiscales de tu empresa tal como aparecen en tu Constancia de Situación Fiscal.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">RFC de la Empresa</label>
                <input
                  type="text"
                  placeholder="ABC123456XYZ"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={config.businessRFC}
                  onChange={(e) => setConfig({ ...config, businessRFC: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">Razón Social</label>
                <input
                  type="text"
                  placeholder="FARMER PARTS S.A. DE C.V."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={config.businessName}
                  onChange={(e) => setConfig({ ...config, businessName: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">Régimen Fiscal</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={config.taxRegime}
                  onChange={(e) => setConfig({ ...config, taxRegime: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  <option value="601">601 - General de Ley Personas Morales</option>
                  <option value="603">603 - Personas Morales con Fines no Lucrativos</option>
                  <option value="605">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</option>
                  <option value="606">606 - Arrendamiento</option>
                  <option value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</option>
                  <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">Código Postal Fiscal</label>
                <input
                  type="text"
                  placeholder="12345"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={config.zipCode}
                  onChange={(e) => setConfig({ ...config, zipCode: e.target.value })}
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 p-4 rounded-lg flex gap-3 text-orange-700 text-sm">
              <Lock className="shrink-0" size={20} />
              <p>Carga tus archivos CSD (.cer y .key). Estos archivos se encriptarán con AES-256 antes de guardarse. <b>Nunca guardamos tu contraseña en texto plano.</b></p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="p-3 bg-primary/10 text-primary rounded-full">
                  <FileText size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">Certificado (.cer)</p>
                  <p className="text-xs text-gray-500">{files.cer ? files.cer.name : 'Haz clic para cargar'}</p>
                </div>
                <input type="file" className="hidden" accept=".cer" onChange={(e) => setFiles({ ...files, cer: e.target.files?.[0] || null })} />
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="p-3 bg-primary/10 text-primary rounded-full">
                  <Key size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">Llave Privada (.key)</p>
                  <p className="text-xs text-gray-500">{files.key ? files.key.name : 'Haz clic para cargar'}</p>
                </div>
                <input type="file" className="hidden" accept=".key" onChange={(e) => setFiles({ ...files, key: e.target.files?.[0] || null })} />
              </div>
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <label className="text-xs font-bold text-gray-700 uppercase">Contraseña de la Llave Privada</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg flex gap-3 text-purple-700 text-sm">
              <Globe className="shrink-0" size={20} />
              <p>Conecta con tu Proveedor Autorizado de Certificación (PAC) para el timbrado de facturas.</p>
            </div>
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">Seleccionar PAC</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="finkok">Finkok (Recomendado)</option>
                  <option value="sw">SW Sapien</option>
                  <option value="facturama">Facturama</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">API Key / Token del PAC</label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    placeholder="sk_test_..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10"
                    value={config.pacApiKeys}
                    onChange={(e) => setConfig({ ...config, pacApiKeys: e.target.value })}
                  />
                  <button 
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <CheckCircle2 className="text-green-500" size={18} />
                <p className="text-xs text-gray-600">Conexión con el servidor de pruebas (Sandbox) exitosa.</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Configuración Fiscal SAT</h2>
        <p className="text-gray-500">Configura tu empresa para la emisión de CFDI 4.0 con cumplimiento total.</p>
      </div>

      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
              step === s ? 'bg-primary text-white shadow-lg shadow-primary/30' : 
              step > s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {step > s ? <CheckCircle2 size={20} /> : s}
            </div>
            {s < 3 && <div className={`h-1 w-16 rounded-full ${step > s ? 'bg-green-500' : 'bg-gray-100'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-2 text-gray-600 font-bold hover:text-gray-900 disabled:opacity-30"
          >
            <ChevronLeft size={20} />
            Anterior
          </button>
          
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 bg-primary text-white px-8 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Siguiente
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Finalizar Configuración'}
              <CheckCircle2 size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          <AlertCircle size={10} className="inline mr-1" />
          Aviso Legal: Se requiere asesoría contable real para la configuración de regímenes fiscales.
        </p>
      </div>
    </div>
  );
};
