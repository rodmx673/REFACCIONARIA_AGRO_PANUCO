import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  X, Send, Bot, User, Loader2, Maximize2, Minimize2,
  Sparkles, GripVertical, Command, History, Settings as SettingsIcon
} from 'lucide-react';
import { generateContentWithFallback } from '../../lib/gemini';
import { cn } from '../../lib/utils';
import { VirtualAssistant, AssistantMessage } from '../../types';
import { AssistantAvatar } from './AssistantAvatar';
import { AssistantSelector } from './AssistantSelector';
import { QuickCommandButton } from './QuickCommandButton';
import { AuthContext } from '../Auth';
import { toast } from 'sonner';

export const MultiAssistantChat: React.FC = () => {
  const { user } = useContext(AuthContext) as any;
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [assistants, setAssistants] = useState<VirtualAssistant[]>([]);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('');
  const [conversations, setConversations] = useState<Record<string, AssistantMessage[]>>({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // 1. Cargar asistentes activos desde LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('fp_assistants');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const activeOnly = parsed.filter((a: VirtualAssistant) => a.isActive);
        setAssistants(activeOnly);
        if (activeOnly.length > 0 && !selectedAssistantId) {
          setSelectedAssistantId(activeOnly[0].id);
        }
      } catch (e) {}
    } else {
      // Asistente por defecto si no hay nada guardado
      const now = new Date().toISOString();
      const defaultAssistant: VirtualAssistant = {
        id: 'default',
        name: 'Asistente AgroParts',
        avatar: '🤖',
        color: '#2563eb',
        specialty: 'general',
        isActive: true,
        identity: { description: '¿En qué te puedo ayudar?', instructions: 'Eres un experto en refacciones agrícolas.' },
        behavior: { tone: 'friendly', language: 'Español', quickCommands: ['¿Qué tienes en stock?', 'Buscar número de parte'], autonomyLevel: 1, sessionDuration: 30, contextMemory: true },
        enabledFunctions: ['consult_stock'],
        permissions: { canAccessInventory: true, canAccessSales: false, canAccessCustomers: false, canAccessReports: false, canExecuteActions: false },
        notifications: { enableAlerts: false, alertTypes: [] },
        createdAt: now,
        updatedAt: now
      };
      setAssistants([defaultAssistant]);
      setSelectedAssistantId('default');
    }
  }, [selectedAssistantId]);

  // 2. Cargar historial de chat
  useEffect(() => {
    if (!selectedAssistantId) return;
    const savedChats = localStorage.getItem('fp_chat_history');
    if (savedChats) {
      try {
        setConversations(JSON.parse(savedChats));
      } catch (e) {}
    }
  }, [selectedAssistantId]);

  // 3. Auto-scroll al final
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations, isLoading]);

  const currentAssistant = assistants.find(a => a.id === selectedAssistantId);
  const currentMessages = conversations[selectedAssistantId] || [];

  // 4. Obtener inventario real para dar contexto a la IA
  const getInventoryContext = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'getProducts', data: {} })
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        const products = data.data.slice(0, 50).map((p: any) => ({
          parte: p.pieceNumber,
          desc: p.description,
          stock: p.stock,
          precio: p.salePrice
        }));
        return `INVENTARIO ACTUAL (Muestra):\n${JSON.stringify(products)}`;
      }
      return "No se pudo cargar el inventario.";
    } catch (error) {
      return "Error al consultar inventario.";
    }
  };

  // 5. Función para enviar mensaje
  const handleSend = async (textOverride?: string) => {
    const messageText = textOverride || input;
    if (!messageText.trim() || isLoading || !currentAssistant) return;

    const userMessage: AssistantMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    // Agregar mensaje del usuario a la UI
    setConversations(prev => {
      const updated = { ...prev, [selectedAssistantId]: [...(prev[selectedAssistantId] || []), userMessage] };
      localStorage.setItem('fp_chat_history', JSON.stringify(updated));
      return updated;
    });
    
    if (!textOverride) setInput('');
    setIsLoading(true);

    try {
      // Obtener contexto del inventario
      const inventoryContext = await getInventoryContext();

      // Armar el prompt del sistema
      const systemPrompt = `Eres ${currentAssistant.name}, un asistente experto en refacciones agrícolas.
Tono: ${currentAssistant.behavior.tone}.
Tienes acceso al inventario real de la tienda. Usa esta información para responder:
${inventoryContext}
Si te preguntan por algo que no está en la lista, di que no lo tienes registrado actualmente.`;

      // Llamar a la IA
      const response = await generateContentWithFallback(
        [{ text: messageText }],
        { systemInstruction: systemPrompt }
      );

      const assistantMessage: AssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || 'Lo siento, no pude procesar tu solicitud.',
        timestamp: new Date().toISOString()
      };

      // Agregar respuesta de la IA a la UI
      setConversations(prev => {
        const updated = { ...prev, [selectedAssistantId]: [...(prev[selectedAssistantId] || []), assistantMessage] };
        localStorage.setItem('fp_chat_history', JSON.stringify(updated));
        return updated;
      });

    } catch (error: any) {
      console.error("AI Error:", error);
      toast.error("Error de conexión con la IA", { description: error.message });
      
      // Agregar mensaje de error en el chat
      const errorMessage: AssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Hubo un error al procesar tu mensaje. Verifica tu conexión o las llaves de API.',
        timestamp: new Date().toISOString()
      };
      setConversations(prev => {
        const updated = { ...prev, [selectedAssistantId]: [...(prev[selectedAssistantId] || []), errorMessage] };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <motion.div drag dragMomentum={false} className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-[300]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 relative group overflow-hidden border-2 border-white/20",
            isOpen ? "bg-red-500" : "bg-primary"
          )}
        >
          {isOpen ? (
            <X size={28} className="text-white" />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              {currentAssistant ? (
                <AssistantAvatar avatar={currentAssistant.avatar} color={currentAssistant.color} size="md" className="scale-125" />
              ) : (
                <Bot size={28} className="text-white" />
              )}
            </div>
          )}
        </button>
      </motion.div>

      {/* Ventana del Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag={typeof window !== 'undefined' && window.innerWidth > 640}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, height: isMinimized ? '64px' : 'min(600px, 80vh)', width: typeof window !== 'undefined' && window.innerWidth < 480 ? 'calc(100vw - 32px)' : '400px' }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-20 lg:bottom-24 right-4 sm:right-8 z-[290] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col cursor-default max-h-[85vh] max-w-[calc(100vw-32px)]"
          >
            {/* Header */}
            <div onPointerDown={(e) => dragControls.start(e)} className="p-4 bg-white border-b border-gray-50 flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-3">
                <GripVertical size={14} className="text-gray-300" />
                <AssistantSelector assistants={assistants} selectedId={selectedAssistantId} onSelect={setSelectedAssistantId} />
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
                  {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                  <X size={18} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Área de Mensajes */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                  {currentMessages.length === 0 && (
                    <div className="text-center text-gray-400 mt-10">
                      <Bot size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="text-sm font-medium">Inicia una conversación con tu asistente.</p>
                    </div>
                  )}
                  {currentMessages.map((msg, i) => (
                    <div key={msg.id || i} className={cn("flex gap-3 max-w-[90%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}>
                      <div className="shrink-0 mt-1">
                        {msg.role === 'assistant' ? (
                          <AssistantAvatar avatar={currentAssistant?.avatar || 'bot'} color={currentAssistant?.color || '#3b82f6'} size="sm" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white border shadow-sm flex items-center justify-center">
                            <User size={16} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className={cn("p-4 rounded-2xl text-sm shadow-sm relative group", msg.role === 'assistant' ? "bg-white text-gray-700 rounded-tl-none border border-gray-100" : "bg-primary text-white rounded-tr-none")}>
                        {msg.content}
                        <p className={cn("text-[9px] mt-2 opacity-50 font-bold uppercase tracking-wider", msg.role === 'user' ? "text-right" : "text-left")}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 mr-auto max-w-[90%]">
                      <AssistantAvatar avatar={currentAssistant?.avatar || 'bot'} color={currentAssistant?.color || '#3b82f6'} size="sm" className="mt-1" />
                      <div className="bg-white p-4 rounded-2xl rounded-tl-none text-sm shadow-sm text-gray-400 flex items-center gap-3 border border-gray-100">
                        <Loader2 size={16} className="animate-spin text-primary" />
                        <span className="font-medium">Pensando...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Comandos Rápidos e Input */}
                <div className="p-4 bg-white border-t border-gray-50 space-y-4">
                  {currentAssistant?.behavior.quickCommands && currentAssistant.behavior.quickCommands.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {currentAssistant.behavior.quickCommands.map((cmd, i) => (
                        <QuickCommandButton key={i} label={cmd} onClick={() => handleSend(cmd)} />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 focus-within:border-primary/30 transition-colors">
                    <Command size={18} className="text-gray-400" />
                    <input 
                      type="text" 
                      placeholder={`Pregunta a ${currentAssistant?.name || 'Asistente'}...`}
                      className="flex-1 bg-transparent border-none outline-none text-sm py-1 font-medium"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                    />
                    <button 
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isLoading}
                      className="p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Powered by Groq IA
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Sistema Activo
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};