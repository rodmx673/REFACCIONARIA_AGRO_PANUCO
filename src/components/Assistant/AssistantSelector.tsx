import React from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { VirtualAssistant } from '../../types';
import { AssistantAvatar } from './AssistantAvatar';
import { cn } from '../../lib/utils';

interface AssistantSelectorProps {
  assistants: VirtualAssistant[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const AssistantSelector: React.FC<AssistantSelectorProps> = ({
  assistants,
  selectedId,
  onSelect,
  className
}) => {
  const selected = assistants.find(a => a.id === selectedId) || assistants[0];

  if (!selected) return null;

  return (
    <div className={cn('relative group', className)}>
      <button className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border rounded-full hover:bg-white transition-all shadow-sm">
        <AssistantAvatar 
          avatar={selected.avatar} 
          color={selected.color} 
          size="sm" 
        />
        <div className="text-left hidden sm:block">
          <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Asistente</p>
          <p className="text-xs font-bold text-gray-700 leading-tight">{selected.name}</p>
        </div>
        <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </button>

      <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="px-4 py-2 border-b border-gray-50 mb-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cambiar Especialista</p>
        </div>
        {assistants.map(assistant => (
          <button
            key={assistant.id}
            onClick={() => onSelect(assistant.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left',
              selectedId === assistant.id && 'bg-blue-50/50'
            )}
          >
            <AssistantAvatar 
              avatar={assistant.avatar} 
              color={assistant.color} 
              size="sm" 
            />
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-bold truncate',
                selectedId === assistant.id ? 'text-blue-600' : 'text-gray-700'
              )}>
                {assistant.name}
              </p>
              <p className="text-[10px] text-gray-400 truncate uppercase">{assistant.specialty}</p>
            </div>
            {selectedId === assistant.id && (
              <Sparkles className="w-3 h-3 text-blue-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
