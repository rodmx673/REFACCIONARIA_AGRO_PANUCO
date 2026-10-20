import React from 'react';
import { Settings, Power, CheckCircle2, MoreVertical, Copy, Trash2 } from 'lucide-react';
import { VirtualAssistant } from '../../types';
import { AssistantAvatar } from './AssistantAvatar';
import { cn } from '../../lib/utils';

interface AssistantCardProps {
  assistant: VirtualAssistant;
  onToggle: (id: string, isActive: boolean) => void;
  onConfigure: (assistant: VirtualAssistant) => void;
  onDuplicate: (assistant: VirtualAssistant) => void;
  onDelete: (id: string) => void;
  isActive?: boolean;
}

export const AssistantCard: React.FC<AssistantCardProps> = ({
  assistant,
  onToggle,
  onConfigure,
  onDuplicate,
  onDelete,
  isActive = false
}) => {
  const specialtyLabels: Record<string, string> = {
    pos: 'Punto de Venta',
    inventory: 'Inventario',
    finance: 'Finanzas',
    hr: 'Recursos Humanos',
    fiscal: 'Fiscal/SAT',
    general: 'General'
  };

  return (
    <div className={cn(
      'bg-white rounded-xl border p-5 transition-all duration-300 hover:shadow-md relative overflow-hidden',
      isActive && 'border-blue-500 ring-1 ring-blue-500'
    )}>
      {isActive && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
          En Uso
        </div>
      )}

      <div className="flex items-start gap-4">
        <AssistantAvatar 
          avatar={assistant.avatar} 
          color={assistant.color} 
          size="md" 
          online={assistant.isActive}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{assistant.name}</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onToggle(assistant.id, !assistant.isActive)}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  assistant.isActive ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'
                )}
                title={assistant.isActive ? 'Desactivar' : 'Activar'}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {specialtyLabels[assistant.specialty]}
            </span>
          </div>
          
          <p className="text-xs text-gray-500 line-clamp-2 mb-4 italic">
            "{assistant.identity.description}"
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
            <div className="flex gap-1">
              <button 
                onClick={() => onConfigure(assistant)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Configurar"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDuplicate(assistant)}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                title="Duplicar"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={() => onDelete(assistant.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
