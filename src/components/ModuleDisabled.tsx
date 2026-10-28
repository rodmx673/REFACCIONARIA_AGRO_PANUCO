import React from 'react';
import { ShieldOff, Settings } from 'lucide-react';

interface ModuleDisabledProps {
  moduleName: string;
}

export const ModuleDisabled: React.FC<ModuleDisabledProps> = ({ moduleName }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-20 h-20 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6 shadow-lg">
        <ShieldOff size={40} />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Módulo Desactivado</h2>
      <p className="text-gray-500 max-w-md mb-6">
        El módulo <strong className="text-gray-800">"{moduleName}"</strong> está desactivado en este momento. 
        Para activarlo, ve a Configuración → Módulos del Sistema.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
      >
        <Settings size={18} />
        Ir a Configuración
      </button>
    </div>
  );
};