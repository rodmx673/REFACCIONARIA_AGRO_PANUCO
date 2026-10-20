import React, { useState } from 'react';
import { 
  X, 
  User, 
  Settings, 
  Shield, 
  Zap, 
  Bell, 
  Save, 
  Copy, 
  Trash2, 
  Plus, 
  Check,
  ChevronRight,
  Info,
  MessageSquare,
  Layout,
  Globe,
  Clock,
  Lock
} from 'lucide-react';
import { VirtualAssistant, Role } from '../../types';
import { AssistantAvatar } from './AssistantAvatar';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AssistantConfigModalProps {
  assistant: VirtualAssistant | null;
  onClose: () => void;
  onSave: (assistant: Partial<VirtualAssistant>) => void;
}

type Tab = 'identity' | 'functions' | 'behavior' | 'permissions' | 'notifications';

export const AssistantConfigModal: React.FC<AssistantConfigModalProps> = ({
  assistant,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('identity');
  const [formData, setFormData] = useState<Partial<VirtualAssistant>>(
    assistant || {
      name: '',
      avatar: '🤖',
      color: '#3b82f6',
      specialty: 'general',
      isActive: true,
      identity: {
        description: '¡Hola! ¿En qué puedo ayudarte hoy?',
        instructions: ''
      },
      behavior: {
        tone: 'friendly',
        language: 'Español',
        quickCommands: ['¿Cómo va el día?', 'Alertas de stock'],
        autonomyLevel: 1,
        sessionDuration: 30,
        contextMemory: true
      },
      enabledFunctions: ['consult_stock', 'search_customers'],
      permissions: {
        canAccessInventory: true,
        canAccessSales: true,
        canAccessCustomers: true,
        canAccessReports: true,
        canExecuteActions: true
      },
      notifications: {
        enableAlerts: true,
        alertTypes: ['low_stock']
      }
    }
  );

  const roles: Role[] = ['ADMIN', 'GERENTE', 'VENDEDOR', 'ALMACENISTA', 'CAJERO'];
  const specialties = [
    { id: 'pos', label: 'Punto de Venta' },
    { id: 'inventory', label: 'Inventario' },
    { id: 'finance', label: 'Finanzas' },
    { id: 'hr', label: 'Recursos Humanos' },
    { id: 'fiscal', label: 'Fiscal/SAT' },
    { id: 'general', label: 'General' }
  ];

  const functions = [
    { id: 'consult_stock', label: 'Consultar stock' },
    { id: 'quick_sales', label: 'Ventas rápidas' },
    { id: 'generate_reports', label: 'Generar reportes' },
    { id: 'search_customers', label: 'Buscar clientes' },
    { id: 'check_commissions', label: 'Consultar comisiones' },
    { id: 'verify_invoices', label: 'Verificar facturas' },
    { id: 'low_stock_alerts', label: 'Alertas stock bajo' }
  ];

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const toggleFunction = (func: string) => {
    const current = formData.enabledFunctions || [];
    if (current.includes(func)) {
      setFormData({ ...formData, enabledFunctions: current.filter(f => f !== func) });
    } else {
      setFormData({ ...formData, enabledFunctions: [...current, func] });
    }
  };

  const tabs = [
    { id: 'identity', label: 'Identidad', icon: User },
    { id: 'functions', label: 'Funciones', icon: Zap },
    { id: 'behavior', label: 'Comportamiento', icon: Settings },
    { id: 'permissions', label: 'Seguridad', icon: Lock },
    { id: 'notifications', label: 'Alertas', icon: Bell }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {assistant ? `Configurar: ${assistant.name}` : 'Nuevo Asistente Virtual'}
              </h2>
              <p className="text-xs text-gray-500">Personaliza la identidad y funciones de tu asistente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r bg-gray-50/30 p-4 flex flex-col gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  activeTab === tab.id 
                    ? 'bg-white text-blue-600 shadow-sm border border-gray-100' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                )}
              >
                <tab.icon className={cn('w-4 h-4', activeTab === tab.id ? 'text-blue-600' : 'text-gray-400')} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'identity' && (
                <motion.div 
                  key="identity"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-6 p-6 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                    <AssistantAvatar 
                      avatar={formData.avatar || '🤖'} 
                      color={formData.color || '#3b82f6'} 
                      size="lg" 
                    />
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre del Asistente</label>
                          <input 
                            type="text" 
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Ej: Experto en Ventas"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Color de Identidad</label>
                          <div className="flex items-center gap-3">
                            <input 
                              type="color" 
                              value={formData.color}
                              onChange={e => setFormData({ ...formData, color: e.target.value })}
                              className="w-12 h-10 rounded-lg border p-1 cursor-pointer"
                            />
                            <span className="text-sm font-mono text-gray-500">{formData.color}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avatar / Icono</label>
                      <div className="flex flex-wrap gap-2">
                        {['🤖', '👨‍🌾', '👩‍💼', '🛠️', '📊', '🛡️', '🚜'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => setFormData({ ...formData, avatar: emoji })}
                            className={cn(
                              'w-10 h-10 rounded-xl border flex items-center justify-center text-xl transition-all',
                              formData.avatar === emoji ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                            )}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tono de Comunicación</label>
                      <select 
                        value={formData.behavior?.tone}
                        onChange={e => setFormData({ 
                          ...formData, 
                          behavior: { ...formData.behavior!, tone: e.target.value } 
                        })}
                        className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="friendly">Amigable</option>
                        <option value="formal">Formal</option>
                        <option value="technical">Técnico</option>
                        <option value="direct">Directo</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción / Saludo</label>
                    <textarea 
                      value={formData.identity?.description}
                      onChange={e => setFormData({ 
                        ...formData, 
                        identity: { ...formData.identity!, description: e.target.value } 
                      })}
                      rows={3}
                      className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Escribe el mensaje de bienvenida..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Instrucciones del Sistema</label>
                    <textarea 
                      value={formData.identity?.instructions}
                      onChange={e => setFormData({ 
                        ...formData, 
                        identity: { ...formData.identity!, instructions: e.target.value } 
                      })}
                      rows={4}
                      className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Instrucciones específicas para la IA..."
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'functions' && (
                <motion.div 
                  key="functions"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Zap className="w-5 h-5" />
                      <h3 className="font-bold">Especialización y Funciones</h3>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Módulo Principal (Especialidad)</label>
                      <div className="grid grid-cols-3 gap-3">
                        {specialties.map(s => (
                          <button
                            key={s.id}
                            onClick={() => setFormData({ ...formData, specialty: s.id as any })}
                            className={cn(
                              'px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left flex flex-col gap-1',
                              formData.specialty === s.id 
                                ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                                : 'hover:bg-gray-50 text-gray-600'
                            )}
                          >
                            {s.label}
                            <span className="text-[10px] text-gray-400 font-normal">Optimizado para {s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Funciones Habilitadas</label>
                      <div className="grid grid-cols-2 gap-3">
                        {functions.map(f => (
                          <label 
                            key={f.id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                              formData.enabledFunctions?.includes(f.id) ? 'bg-blue-50/50 border-blue-200' : 'hover:bg-gray-50'
                            )}
                          >
                            <input 
                              type="checkbox" 
                              checked={formData.enabledFunctions?.includes(f.id)}
                              onChange={() => toggleFunction(f.id)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">{f.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'behavior' && (
                <motion.div 
                  key="behavior"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-gray-900">Nivel de Autonomía</h3>
                        <p className="text-xs text-gray-500">Define qué tanto puede hacer el asistente por sí solo</p>
                      </div>
                      <span className={cn(
                        'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                        formData.behavior?.autonomyLevel === 1 ? 'bg-gray-100 text-gray-600' :
                        formData.behavior?.autonomyLevel === 2 ? 'bg-blue-100 text-blue-600' :
                        'bg-purple-100 text-purple-600'
                      )}>
                        {formData.behavior?.autonomyLevel === 1 ? 'Básico' : 
                         formData.behavior?.autonomyLevel === 2 ? 'Intermedio' : 'Avanzado'}
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="1"
                      value={formData.behavior?.autonomyLevel}
                      onChange={e => setFormData({ 
                        ...formData, 
                        behavior: { ...formData.behavior!, autonomyLevel: parseInt(e.target.value) } 
                      })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                      <span>Solo responde</span>
                      <span>Sugiere acciones</span>
                      <span>Ejecuta acciones</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 rounded-2xl border bg-gray-50/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-gray-700">Idioma</span>
                        </div>
                        <select 
                          value={formData.behavior?.language}
                          onChange={e => setFormData({ 
                            ...formData, 
                            behavior: { ...formData.behavior!, language: e.target.value } 
                          })}
                          className="bg-transparent text-sm font-medium text-blue-600 outline-none"
                        >
                          <option>Español</option>
                          <option>Inglés</option>
                          <option>Bilingüe</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-gray-700">Sesión</span>
                        </div>
                        <select 
                          value={formData.behavior?.sessionDuration}
                          onChange={e => setFormData({ 
                            ...formData, 
                            behavior: { ...formData.behavior!, sessionDuration: parseInt(e.target.value) } 
                          })}
                          className="bg-transparent text-sm font-medium text-blue-600 outline-none"
                        >
                          <option value={15}>15 min</option>
                          <option value={30}>30 min</option>
                          <option value={60}>1 hora</option>
                          <option value={0}>Ilimitado</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border bg-gray-50/50 flex flex-col justify-center gap-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-bold text-gray-700">Memoria de Contexto</span>
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.behavior?.contextMemory}
                            onChange={e => setFormData({ 
                              ...formData, 
                              behavior: { ...formData.behavior!, contextMemory: e.target.checked } 
                            })}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'permissions' && (
                <motion.div 
                  key="permissions"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-orange-600">
                      <Lock className="w-5 h-5" />
                      <h3 className="font-bold">Permisos y Seguridad</h3>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Permisos de Acceso</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'canAccessInventory', label: 'Acceso a Inventario' },
                          { id: 'canAccessSales', label: 'Acceso a Ventas' },
                          { id: 'canAccessCustomers', label: 'Acceso a Clientes' },
                          { id: 'canAccessReports', label: 'Acceso a Reportes' },
                          { id: 'canExecuteActions', label: 'Ejecutar Acciones' }
                        ].map(p => (
                          <label 
                            key={p.id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                              (formData.permissions as any)?.[p.id] ? 'bg-orange-50/50 border-orange-200' : 'hover:bg-gray-50'
                            )}
                          >
                            <input 
                              type="checkbox" 
                              checked={(formData.permissions as any)?.[p.id]}
                              onChange={e => setFormData({
                                ...formData,
                                permissions: { ...formData.permissions!, [p.id]: e.target.checked }
                              })}
                              className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-sm font-medium text-gray-700">{p.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex gap-4">
                      <Shield className="w-6 h-6 text-orange-500 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-orange-800">Restricciones de Seguridad</p>
                        <p className="text-xs text-orange-700/70 leading-relaxed">
                          El asistente nunca podrá realizar acciones que superen los permisos del rol del usuario actual, 
                          independientemente de su configuración de autonomía.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div 
                  key="notifications"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-purple-600">
                      <Bell className="w-5 h-5" />
                      <h3 className="font-bold">Notificaciones y Alertas Proactivas</h3>
                    </div>

                    <label className="flex items-center justify-between p-4 rounded-2xl border hover:bg-gray-50 transition-all cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold text-gray-700">Notificaciones Activas</span>
                        <p className="text-xs text-gray-500">Permitir que el asistente envíe alertas al sistema</p>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.notifications?.enableAlerts}
                          onChange={e => setFormData({ 
                            ...formData, 
                            notifications: { ...formData.notifications!, enableAlerts: e.target.checked } 
                          })}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </div>
                    </label>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipos de Alerta</label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'STOCK_LOW', label: 'Stock bajo de productos críticos' },
                          { id: 'NEW_SALE', label: 'Nuevas ventas realizadas' },
                          { id: 'OVERDUE_PAYMENT', label: 'Pagos vencidos' }
                        ].map(alert => (
                          <label 
                            key={alert.id}
                            className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 cursor-pointer transition-all"
                          >
                            <input 
                              type="checkbox"
                              checked={formData.notifications?.alertTypes.includes(alert.id)}
                              onChange={e => {
                                const current = formData.notifications?.alertTypes || [];
                                const next = e.target.checked 
                                  ? [...current, alert.id] 
                                  : current.filter(id => id !== alert.id);
                                setFormData({
                                  ...formData,
                                  notifications: { ...formData.notifications!, alertTypes: next }
                                });
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium text-gray-700">{alert.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Info className="w-4 h-4" />
            <span>Los cambios se aplicarán inmediatamente para todos los usuarios autorizados.</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="px-8 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
