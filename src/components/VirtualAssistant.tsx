import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Maximize2, 
  Minimize2,
  Sparkles,
  GripVertical
} from 'lucide-react';
import { generateContentWithFallback } from '../lib/gemini';
import { db } from '../firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const VirtualAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de Farmer Parts. ¿En qué puedo ayudarte hoy? Puedo darte información sobre productos, clientes, proveedores o cómo usar la app.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getAppContext = async () => {
    try {
      const productsSnap = await getDocs(query(collection(db, 'products'), limit(5)));
      const customersSnap = await getDocs(query(collection(db, 'customers'), limit(5)));
      const vendorsSnap = await getDocs(query(collection(db, 'vendors'), limit(5)));

      const products = productsSnap.docs.map(doc => doc.data());
      const customers = customersSnap.docs.map(doc => doc.data());
      const vendors = vendorsSnap.docs.map(doc => doc.data());

      return JSON.stringify({
        recentProducts: products,
        recentCustomers: customers,
        recentVendors: vendors,
        appInfo: "Farmer Parts es un sistema de gestión de refacciones para tractores. Incluye POS, Inventario, Clientes, Proveedores y Reportes."
      });
    } catch (error) {
      console.error("Error fetching context:", error);
      return "No se pudo obtener el contexto actual de la base de datos.";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = await getAppContext();
      
      const response = await generateContentWithFallback(
        [
          {
            role: 'user',
            parts: [{ text: `Contexto de la App: ${context}\n\nPregunta del Usuario: ${input}` }]
          }
        ],
        {
          systemInstruction: "Eres un asistente virtual experto para la aplicación 'Farmer Parts'. Tu objetivo es ayudar al usuario con dudas sobre el inventario, ventas, clientes y proveedores. Sé amable, profesional y conciso. Si te preguntan por datos específicos, usa el contexto proporcionado. Si no sabes algo, admítelo."
        }
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.text || 'Lo siento, no pude procesar tu solicitud.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Hubo un error al conectar con mi cerebro artificial. Por favor, intenta de nuevo.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Draggable Icon */}
      <motion.div
        drag
        dragMomentum={false}
        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
        className="fixed bottom-8 right-8 z-[300] cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 relative group",
            isOpen ? "bg-red-500 text-white" : "bg-primary text-white"
          )}
        >
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-white/20 rounded-full p-1">
            <GripVertical size={14} />
          </div>
          {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '60px' : '500px',
              width: '350px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-8 z-[290] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col cursor-default"
          >
            {/* Header - Drag Handle */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="p-4 bg-primary text-white flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="opacity-50" />
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm leading-none">Asistente Farmer</p>
                  <p className="text-[10px] opacity-70 font-medium">En línea ahora</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
                >
                  {messages.map((msg, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "flex gap-2 max-w-[85%]",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                        msg.role === 'assistant' ? "bg-primary text-white" : "bg-white text-gray-400"
                      )}>
                        {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                      </div>
                      <div className={cn(
                        "p-3 rounded-2xl text-sm shadow-sm",
                        msg.role === 'assistant' 
                          ? "bg-white text-gray-700 rounded-tl-none" 
                          : "bg-primary text-white rounded-tr-none"
                      )}>
                        {msg.content}
                        <p className={cn(
                          "text-[9px] mt-1 opacity-50",
                          msg.role === 'user' ? "text-right" : "text-left"
                        )}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2 mr-auto max-w-[85%]">
                      <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Loader2 size={16} className="animate-spin" />
                      </div>
                      <div className="bg-white p-3 rounded-2xl rounded-tl-none text-sm shadow-sm text-gray-400 flex items-center gap-2">
                        <Sparkles size={14} className="animate-pulse" />
                        Pensando...
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2">
                    <input 
                      type="text" 
                      placeholder="Escribe tu duda aquí..."
                      className="flex-1 bg-transparent border-none outline-none text-sm py-1"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                      <Send size={18} />
                    </button>
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
