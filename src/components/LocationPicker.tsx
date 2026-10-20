import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Settings, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const DEFAULT_PLANTS = ['PB', 'PM', 'PA'];
const DEFAULT_TOOLCASES = Array.from({ length: 15 }, (_, i) => String(i + 1).padStart(2, '0'));
const DEFAULT_LOCKERS = 'ABCDEFGHIJKLM'.split('');

export const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange }) => {
  // Estados para los valores actuales
  const [plant, setPlant] = useState('PB');
  const [toolCase, setToolCase] = useState('01');
  const [locker, setLocker] = useState('A');
  const [isManageOpen, setIsManageOpen] = useState(false);

  // Estados para las listas (cargadas desde localStorage o por defecto)
  const [plants, setPlants] = useState<string[]>(DEFAULT_PLANTS);
  const [toolCases, setToolCases] = useState<string[]>(DEFAULT_TOOLCASES);
  const [lockers, setLockers] = useState<string[]>(DEFAULT_LOCKERS);

  // Nuevos valores para agregar
  const [newPlant, setNewPlant] = useState('');
  const [newToolCase, setNewToolCase] = useState('');
  const [newLocker, setNewLocker] = useState('');

  // Cargar configuraciones guardadas y parsear el valor inicial
  useEffect(() => {
    const saved = localStorage.getItem('farmer_parts_locations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.plants) setPlants(parsed.plants);
        if (parsed.toolCases) setToolCases(parsed.toolCases);
        if (parsed.lockers) setLockers(parsed.lockers);
      } catch (e) {}
    }

    if (value && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setPlant(parts[0]);
        setToolCase(parts[1]);
        setLocker(parts[2]);
      }
    } else {
      // Si no hay valor inicial, forzamos el valor por defecto hacia el formulario
      onChange('PB-01-A');
    }
  }, []); // eslint-disable-line

  // Guardar listas cuando cambien
  const saveConfig = (p: string[], t: string[], l: string[]) => {
    localStorage.setItem('farmer_parts_locations', JSON.stringify({ plants: p, toolCases: t, lockers: l }));
  };

  // Actualizar el string combinado cuando cambia un dropdown
  const updateLocation = (p: string, t: string, l: string) => {
    setPlant(p);
    setToolCase(t);
    setLocker(l);
    onChange(`${p}-${t}-${l}`);
  };

  const handleAdd = (type: 'plant' | 'toolCase' | 'locker') => {
    if (type === 'plant' && newPlant && !plants.includes(newPlant)) {
      const updated = [...plants, newPlant.toUpperCase()];
      setPlants(updated); saveConfig(updated, toolCases, lockers); setNewPlant('');
    }
    if (type === 'toolCase' && newToolCase && !toolCases.includes(newToolCase)) {
      const updated = [...toolCases, newToolCase.padStart(2, '0')].sort();
      setToolCases(updated); saveConfig(plants, updated, lockers); setNewToolCase('');
    }
    if (type === 'locker' && newLocker && !lockers.includes(newLocker.toUpperCase())) {
      const updated = [...lockers, newLocker.toUpperCase()].sort();
      setLockers(updated); saveConfig(plants, toolCases, updated); setNewLocker('');
    }
  };

  const handleDelete = (type: 'plant' | 'toolCase' | 'locker', val: string) => {
    if (type === 'plant') { const u = plants.filter(p => p !== val); setPlants(u); saveConfig(u, toolCases, lockers); }
    if (type === 'toolCase') { const u = toolCases.filter(t => t !== val); setToolCases(u); saveConfig(plants, u, lockers); }
    if (type === 'locker') { const u = lockers.filter(l => l !== val); setLockers(u); saveConfig(plants, toolCases, u); }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
          <MapPin size={14} className="text-primary" /> Ubicación Almacén
        </label>
        <button 
          type="button" 
          onClick={() => setIsManageOpen(true)}
          className="text-[10px] font-bold text-primary hover:bg-primary/5 px-2 py-1 rounded transition-colors flex items-center gap-1"
        >
          <Settings size={12} /> Configurar Mapa
        </button>
      </div>

      <div className="flex gap-2">
        <select value={plant} onChange={(e) => updateLocation(e.target.value, toolCase, locker)} className="flex-1 px-3 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 font-medium text-sm">
          {plants.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={toolCase} onChange={(e) => updateLocation(plant, e.target.value, locker)} className="flex-1 px-3 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 font-medium text-sm">
          {toolCases.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={locker} onChange={(e) => updateLocation(plant, toolCase, e.target.value)} className="flex-1 px-3 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 font-medium text-sm">
          {lockers.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <p className="text-[10px] text-gray-400 font-mono">Resultado: <span className="font-bold text-gray-700">{plant}-{toolCase}-{locker}</span></p>

      {/* MODAL DE CONFIGURACIÓN */}
      <AnimatePresence>
        {isManageOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-900">Configurar Mapa de Almacén</h3>
                <button type="button" onClick={() => setIsManageOpen(false)} className="p-1 hover:bg-gray-200 rounded-lg"><X size={20} /></button>
              </div>
              <div className="p-4 overflow-y-auto space-y-6">
                {/* PLANTAS */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600">Plantas (Niveles)</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {plants.map(p => (
                      <span key={p} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold flex items-center gap-1">
                        {p} <button type="button" onClick={() => handleDelete('plant', p)} className="hover:text-red-500"><Trash2 size={10} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Ej: EXTERIOR" value={newPlant} onChange={e => setNewPlant(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-xs" />
                    <button type="button" onClick={() => handleAdd('plant')} className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold"><Plus size={14} /></button>
                  </div>
                </div>
                {/* TOOL CASES */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600">Tool Cases</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {toolCases.map(t => (
                      <span key={t} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold flex items-center gap-1">
                        {t} <button type="button" onClick={() => handleDelete('toolCase', t)} className="hover:text-red-500"><Trash2 size={10} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Ej: 16" value={newToolCase} onChange={e => setNewToolCase(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-xs" />
                    <button type="button" onClick={() => handleAdd('toolCase')} className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold"><Plus size={14} /></button>
                  </div>
                </div>
                {/* CASILLEROS */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600">Casilleros</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {lockers.map(l => (
                      <span key={l} className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-bold flex items-center gap-1">
                        {l} <button type="button" onClick={() => handleDelete('locker', l)} className="hover:text-red-500"><Trash2 size={10} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Ej: N" maxLength={1} value={newLocker} onChange={e => setNewLocker(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-xs" />
                    <button type="button" onClick={() => handleAdd('locker')} className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold"><Plus size={14} /></button>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t bg-gray-50">
                <button type="button" onClick={() => setIsManageOpen(false)} className="w-full py-2 bg-primary text-white rounded-xl font-bold text-sm">Listo</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};