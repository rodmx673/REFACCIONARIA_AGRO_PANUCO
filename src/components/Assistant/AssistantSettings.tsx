import React, { useState, useEffect, useContext } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Settings as SettingsIcon,
  Bot,
  Sparkles,
  ShieldCheck,
  History,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';


import { VirtualAssistant, AssistantGlobalSettings } from '../../types';
import { AssistantCard } from './AssistantCard';
import { AssistantConfigModal } from './AssistantConfigModal';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { AuthContext } from '../Auth';

export const AssistantSettings: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [assistants, setAssistants] = useState<VirtualAssistant[]>([]);
  const [globalSettings, setGlobalSettings] = useState<AssistantGlobalSettings>({
    autoSwitchByContext: true,
    defaultAssistantId: '',
    maxConcurrentAssistants: 5,
    allowCustomAssistants: true
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<VirtualAssistant | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
    const savedAssistants = localStorage.getItem('fp_assistants');
    const savedGlobal = localStorage.getItem('fp_global_assistant');
    
    if (savedAssistants) {
      setAssistants(JSON.parse(savedAssistants));
    } else {
      setAssistants([{
        id: 'default',
        name: 'Asistente AgroParts',
        avatar: '🤖',
        color: '#2563eb',
        specialty: 'general',
        isActive: true,
        identity: { description: '¿En qué te puedo ayudar?', instructions: 'Eres un experto en refacciones agrícolas.' },
        behavior: { tone: 'friendly', language: 'Español', quickCommands: ['¿Cómo va el día?', 'Alertas de stock'], autonomyLevel: 1, sessionDuration: 30, contextMemory: true },
        enabledFunctions: ['consult_stock', 'search_customers'],
        permissions: { canAccessInventory: true, canAccessSales: true, canAccessCustomers: true, canAccessReports: true, canExecuteActions: true },
        notifications: { enableAlerts: true, alertTypes: ['low_stock'] }
      }]);
    }

    if (savedGlobal) setGlobalSettings(JSON.parse(savedGlobal));
    setLoading(false);
  }, [user]);

    const saveToLocal = (newAssistants: VirtualAssistant[]) => {
    setAssistants(newAssistants);
    localStorage.setItem('fp_assistants', JSON.stringify(newAssistants));
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const updated = assistants.map(a => a.id === id ? { ...a, isActive } : a);
    saveToLocal(updated);
    toast.success(isActive ? "Asistente activado" : "Asistente desactivado");
  };

  const handleSaveAssistant = async (data: Partial<VirtualAssistant>) => {
    if (selectedAssistant) {
      const updated = assistants.map(a => a.id === selectedAssistant.id ? { ...a, ...data } as VirtualAssistant : a);
      saveToLocal(updated);
      toast.success("Asistente actualizado");
    } else {
      const newAssistant = { ...data, id: Date.now().toString() } as VirtualAssistant;
      saveToLocal([...assistants, newAssistant]);
      toast.success("Asistente creado");
    }
  };

  const handleDuplicate = async (assistant: VirtualAssistant) => {
    const newAssistant = { ...assistant, id: Date.now().toString(), name: `${assistant.name} (Copia)` };
    saveToLocal([...assistants, newAssistant]);
    toast.success("Asistente duplicado");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este asistente?")) return;
    saveToLocal(assistants.filter(a => a.id !== id));
    toast.success("Asistente eliminado");
  };

  const updateGlobalSettings = async (updates: Partial<AssistantGlobalSettings>) => {
    const newSettings = { ...globalSettings, ...updates };
    setGlobalSettings(newSettings);
    localStorage.setItem('fp_global_assistant', JSON.stringify(newSettings));
    toast.success("Ajustes globales actualizados");
  };

  const filteredAssistants = assistants.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Cargando configuración de asistentes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-blue-600">
            <Bot className="w-8 h-8" />
            <h1 className="text-3xl font-black tracking-tight text-gray-900">Asistentes Virtuales</h1>
          </div>
          <p className="text-gray-500 max-w-2xl">
            Gestiona y especializa múltiples asistentes inteligentes para cada área de tu negocio. 
            Configura su personalidad, funciones y nivel de autonomía.
          </p>
        </div>
        
        <button 
          onClick={() => {
            setSelectedAssistant(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Crear Asistente
        </button>
      </div>

      {/* Global Settings Quick Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cambio Contextual</p>
              <p className="text-sm font-bold text-gray-700">Auto-cambio por módulo</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={globalSettings.autoSwitchByContext}
              onChange={e => updateGlobalSettings({ autoSwitchByContext: e.target.checked })}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="bg-white p-4 rounded-2xl border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Seguridad</p>
              <p className="text-sm font-bold text-gray-700">Respetar roles de usuario</p>
            </div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>

        <div className="bg-white p-4 rounded-2xl border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Capacidad</p>
              <p className="text-sm font-bold text-gray-700">{assistants.length} de {globalSettings.maxConcurrentAssistants} activos</p>
            </div>
          </div>
          <div className="w-12 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500" 
              style={{ width: `${(assistants.length / globalSettings.maxConcurrentAssistants) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o especialidad..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-white rounded-xl border p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  viewMode === 'grid' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  viewMode === 'list' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>

        {/* Assistants Grid */}
        <div className={cn(
          'grid gap-6',
          viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
        )}>
          <AnimatePresence mode="popLayout">
            {filteredAssistants.map((assistant) => (
              <motion.div
                key={assistant.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <AssistantCard 
                  assistant={assistant}
                  onToggle={handleToggle}
                  onConfigure={(a) => {
                    setSelectedAssistant(a);
                    setIsModalOpen(true);
                  }}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  isActive={assistant.id === globalSettings.defaultAssistantId}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredAssistants.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-6 bg-gray-50 rounded-full text-gray-300">
                <Bot className="w-16 h-16" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-900">No se encontraron asistentes</p>
                <p className="text-sm text-gray-500">Intenta con otra búsqueda o crea uno nuevo.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Section */}
      <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Sparkles className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black">Modo Entrenamiento IA</h2>
            <p className="text-gray-400 max-w-xl">
              Permite que tus asistentes aprendan de las correcciones de los usuarios para mejorar su precisión 
              y capacidad de resolución de problemas específicos de tu negocio.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-blue-600 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2">
              Configurar Entrenamiento
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-6 py-3 bg-white/10 rounded-2xl font-bold hover:bg-white/20 transition-all flex items-center gap-2">
              Ver Historial de Aprendizaje
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Config Modal */}
      {isModalOpen && (
        <AssistantConfigModal 
          assistant={selectedAssistant}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveAssistant}
        />
      )}
    </div>
  );
};
