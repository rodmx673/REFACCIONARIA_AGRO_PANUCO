import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Maximize2, 
  Minimize2,
  Sparkles,
  GripVertical,
  Command,
  History,
  Settings as SettingsIcon,
  Search
} from 'lucide-react';
import { generateContentWithFallback } from '../../lib/gemini';

import { 
  collection, 
  getDocs, 
  limit, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  serverTimestamp, 
  orderBy,
  where,
  doc,
  getDoc
} from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { VirtualAssistant, AssistantMessage, AssistantConversation } from '../../types';
import { AssistantAvatar } from './AssistantAvatar';
import { AssistantSelector } from './AssistantSelector';
import { QuickCommandButton } from './QuickCommandButton';
import { AuthContext } from '../Auth';

export const MultiAssistantChat: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [assistants, setAssistants] = useState<VirtualAssistant[]>([]);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('');
  const [conversations, setConversations] = useState<Record<string, AssistantMessage[]>>({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Load active assistants
  useEffect(() => {
    if (!user) return;

    // Firebase eliminado
    // Firebase eliminado

    
  }, [user]);

  // Load conversation for selected assistant
  useEffect(() => {
    if (!user || !selectedAssistantId) return;

    const q = query(
      collection(db, 'assistant_conversations'),
      where('userId', '==', user.id),
      where('assistantId', '==', selectedAssistantId),
      orderBy('updatedAt', 'desc'),
      limit(1)
    );

    // Firebase eliminado

    
  }, [user, selectedAssistantId, assistants]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations, selectedAssistantId, isLoading]);

  const currentAssistant = assistants.find(a => a.id === selectedAssistantId);
  const currentMessages = conversations[selectedAssistantId] || [];

  const getAppContext = async () => {
    try {
      const productsSnap = await getDocs(query(collection(db, 'products'), limit(5)));
      const customersSnap = await getDocs(query(collection(db, 'customers'), limit(5)));
      
      const products = productsSnap.docs.map(doc => doc.data());
      const customers = customersSnap.docs.map(doc => doc.data());

      return JSON.stringify({
        recentProducts: products,
        recentCustomers: customers,
        appInfo: "Farmer Parts - Spare Parts OS. Sistema de gestión de refacciones agrícolas e hidráulicas.",
        assistantRole: currentAssistant?.specialty,
        assistantPersonality: currentAssistant?.behavior.tone
      });
    } catch (error) {
      console.error("Error fetching context:", error);
      return "Contexto limitado.";
    }
  };

  const handleSend = async (textOverride?: string) => {
    const messageText = textOverride || input;
    if (!messageText.trim() || isLoading || !user || !currentAssistant) return;

    const userMessage: AssistantMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    // Optimistic update
    setConversations(prev => ({
      ...prev,
      [selectedAssistantId]: [...(prev[selectedAssistantId] || []), userMessage]
    }));
    
    if (!textOverride) setInput('');
    setIsLoading(true);

    try {
      const context = await getAppContext();
      
      const response = await generateContentWithFallback(
        [
          {
            role: 'user',
            parts: [{ text: `Contexto: ${context}\n\nInstrucciones del Asistente: ${currentAssistant.identity.instructions}\n\nPregunta: ${messageText}` }]
          }
        ],
        {
          systemInstruction: `Eres ${currentAssistant.name}, un ${currentAssistant.specialty}. Tono: ${currentAssistant.behavior.tone}. ${currentAssistant.identity.description}`
        }
      );

      const assistantMessage: AssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || 'Lo siento, no pude procesar tu solicitud.',
        timestamp: new Date().toISOString()
      };

      // Update Firestore conversation
      const convQuery = query(
        collection(db, 'assistant_conversations'),
        where('userId', '==', user.id),
        where('assistantId', '==', selectedAssistantId),
        limit(1)
      );
      
      const convSnap = await getDocs(convQuery);
      
      const updatedMessages = [...(conversations[selectedAssistantId] || []), userMessage, assistantMessage];

      if (convSnap.empty) {
        await addDoc(collection(db, 'assistant_conversations'), {
          userId: user.id,
          assistantId: selectedAssistantId,
          messages: updatedMessages,
          updatedAt: serverTimestamp(),
          metadata: {
            assistantName: currentAssistant.name,
            specialty: currentAssistant.specialty
          }
        });
      } else {
        const convDoc = convSnap.docs[0];
        await updateDoc(doc(db, 'assistant_conversations', convDoc.id), {
          messages: updatedMessages,
          updatedAt: serverTimestamp()
        });
      }

    } catch (error) {
      console.error("AI Error:", error);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        drag
        dragMomentum={false}
        className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-[300]"
      >
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
                <AssistantAvatar 
                  avatar={currentAssistant.avatar} 
                  color={currentAssistant.color} 
                  size="md" 
                  className="scale-125"
                />
              ) : (
                <Bot size={28} className="text-white" />
              )}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent pointer-events-none" />
            </div>
          )}
          {!isOpen && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse shadow-sm"></span>
          )}
        </button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag={typeof window !== 'undefined' && window.innerWidth > 640}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '64px' : 'min(600px, 80vh)',
              width: typeof window !== 'undefined' && window.innerWidth < 480 ? 'calc(100vw - 32px)' : '400px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-20 lg:bottom-24 right-4 sm:right-8 z-[290] bg-white rounded-3xl sm:rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col cursor-default max-h-[85vh] max-w-[calc(100vw-32px)]"
          >
            {/* Header */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="p-4 bg-white border-b border-gray-50 flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-3">
                <GripVertical size={14} className="text-gray-300" />
                <AssistantSelector 
                  assistants={assistants}
                  selectedId={selectedAssistantId}
                  onSelect={setSelectedAssistantId}
                />
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    showHistory ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:bg-gray-50"
                  )}
                >
                  <History size={18} />
                </button>
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all"
                >
                  {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30"
                >
                  {currentMessages.map((msg, i) => (
                    <div 
                      key={msg.id || i}
                      className={cn(
                        "flex gap-3 max-w-[90%]",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      <div className="shrink-0 mt-1">
                        {msg.role === 'assistant' ? (
                          <AssistantAvatar 
                            avatar={currentAssistant?.avatar || 'bot'} 
                            color={currentAssistant?.color || '#3b82f6'} 
                            size="sm" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white border shadow-sm flex items-center justify-center">
                            <User size={16} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm shadow-sm relative group",
                        msg.role === 'assistant' 
                          ? "bg-white text-gray-700 rounded-tl-none border border-gray-100" 
                          : "bg-primary text-white rounded-tr-none"
                      )}>
                        {msg.content}
                        <p className={cn(
                          "text-[9px] mt-2 opacity-50 font-bold uppercase tracking-wider",
                          msg.role === 'user' ? "text-right" : "text-left"
                        )}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 mr-auto max-w-[90%]">
                      <AssistantAvatar 
                        avatar={currentAssistant?.avatar || 'bot'} 
                        color={currentAssistant?.color || '#3b82f6'} 
                        size="sm" 
                        className="mt-1"
                      />
                      <div className="bg-white p-4 rounded-2xl rounded-tl-none text-sm shadow-sm text-gray-400 flex items-center gap-3 border border-gray-100">
                        <Loader2 size={16} className="animate-spin text-primary" />
                        <span className="font-medium">Procesando consulta...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Commands & Input */}
                <div className="p-4 bg-white border-t border-gray-50 space-y-4">
                  {currentAssistant?.behavior.quickCommands && currentAssistant.behavior.quickCommands.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {currentAssistant.behavior.quickCommands.map((cmd, i) => (
                        <QuickCommandButton 
                          key={i}
                          label={cmd}
                          onClick={() => handleSend(cmd)}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 focus-within:border-primary/30 transition-colors">
                    <Command size={18} className="text-gray-400" />
                    <input 
                      type="text" 
                      placeholder={`Pregunta a ${currentAssistant?.name}...`}
                      className="flex-1 bg-transparent border-none outline-none text-sm py-1 font-medium"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
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
                      Powered by Gemini 3 Flash
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
