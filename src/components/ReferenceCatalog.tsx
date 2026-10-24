import React, { useState, useEffect } from 'react';
import { Search, Package, Plus, FileText, Loader2, X, Save, Brain, Tag } from 'lucide-react';
import { toast } from 'sonner';

const URL = import.meta.env.VITE_APPS_SCRIPT_URL;

interface ReferenceItem {
  _id?: string;
  marca: string;
  oemNumber: string;
  description: string;
  references: string;
  numeroDistribuidor: string;
  price: number | string;
}

interface ReferenceCatalogProps {
  onImportToStock?: (item: ReferenceItem) => void;
}

export const ReferenceCatalog: React.FC<ReferenceCatalogProps> = ({ onImportToStock }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Estados para el Modal
  const [selectedPart, setSelectedPart] = useState<ReferenceItem | null>(null);
  const [crossReferences, setCrossReferences] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(() => {
      ejecutarBusqueda(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const ejecutarBusqueda = async (termino: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(URL, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'searchReferenceCatalog', 
          data: { query: termino.trim(), brand: 'TODAS' } 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setResults(data.data || []);
      } else {
        toast.error(data.error || 'Error al buscar');
        setResults([]);
      }
    } catch (error) {
      toast.error('Error de conexión con el servidor');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      ejecutarBusqueda(query);
    }
  };

  const handleOpenModal = (item: ReferenceItem) => {
    setSelectedPart(item);
    setInputValue('');
    
    try {
      if (item.references && item.references !== '') {
        const parsed = JSON.parse(item.references);
        if (Array.isArray(parsed)) {
          setCrossReferences(parsed.map(r => typeof r === 'object' ? (r.numero || '') : String(r)));
        } else {
          setCrossReferences([]);
        }
      } else {
        setCrossReferences([]);
      }
    } catch (e) {
      setCrossReferences(item.references ? item.references.split(',').map(s => s.trim()).filter(Boolean) : []);
    }
  };

  // Lógica para agregar etiquetas (Forzando MAYÚSCULAS)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      // ✅ FORZAMOS MAYÚSCULAS AL GUARDAR LA ETIQUETA
      const newTag = inputValue.trim().toUpperCase();
      if (newTag && !crossReferences.includes(newTag)) {
        setCrossReferences([...crossReferences, newTag]);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && crossReferences.length > 0) {
      setCrossReferences(crossReferences.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCrossReferences(crossReferences.filter(tag => tag !== tagToRemove));
  };

  const handleSaveReferences = async () => {
    if (!selectedPart) return;
    setIsSaving(true);
    try {
      const referenciasJSON = JSON.stringify(crossReferences);
      
      const res = await fetch(URL, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'guardarReferenciasCruzadas', 
          data: { 
            id: selectedPart._id, 
            oemNumber: selectedPart.oemNumber,
            referencias: referenciasJSON 
          } 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Conocimiento guardado correctamente');
        setResults(prev => prev.map(p => p._id === selectedPart._id ? { ...p, references: referenciasJSON } : p));
        setSelectedPart(null);
      } else {
        toast.error(data.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 relative">
      {/* HEADER Y BUSCADOR */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-primary" /> Catálogo de Referencia OEM
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Busca por número OEM, distribuidor o descripción. Haz clic en una fila para agregar conocimiento.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por número OEM (ej. 83947642), distribuidor o descripción..."
            value={query}
            // ✅ FORZAMOS MAYÚSCULAS EN EL BUSCADOR
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 ring-primary/20 transition-all uppercase"
          />
        </div>
      </form>

      {/* TABLA DE RESULTADOS */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Loader2 size={32} className="animate-spin text-primary mb-2" />
            <p className="text-sm font-medium">Buscando en el catálogo...</p>
          </div>
        ) : !searched ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Search size={48} className="mb-2 opacity-20" />
            <p>Escribe al menos 2 letras para ver resultados automáticos.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Package size={48} className="mb-2 opacity-20" />
            <p>No se encontraron refacciones con esos criterios.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Marca</th>
                  <th className="px-6 py-4">No. OEM (Fabricante)</th>
                  <th className="px-6 py-4">No. Distribuidor</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4">Referencias Cruzadas</th>
                  <th className="px-6 py-4 text-right">Precio</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((item, index) => (
                  <tr 
                    key={item._id || index} 
                    onClick={() => handleOpenModal(item)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded">
                        {item.marca}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-primary text-sm">{item.oemNumber}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">
                      {item.numeroDistribuidor || '-'}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800 max-w-[300px] uppercase" title={item.description}>
                      {item.description}
                    </td>
                    <td className="px-6 py-4">
                      {item.references && item.references !== '[]' && item.references !== '' ? (
                         <div className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded w-fit border border-orange-100">
                           <Tag size={12} /> Con notas
                         </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin notas</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      {item.price ? `$${item.price}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onImportToStock) onImportToStock(item);
                        }}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 mx-auto"
                      >
                        <Plus size={12} /> Importar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE CONOCIMIENTO (TAGS NARANJAS Y MAYÚSCULAS) */}
      {selectedPart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Brain className="text-primary" /> Base de Conocimiento
                </h3>
                <p className="text-sm text-gray-500">Añade números cruzados manuales o notas de compatibilidad.</p>
              </div>
              <button onClick={() => setSelectedPart(null)} className="p-2 text-gray-400 hover:bg-white rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold uppercase text-xs">OEM Original:</span>
                  <span className="font-mono font-bold text-primary">{selectedPart.oemNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold uppercase text-xs">No. Distribuidor:</span>
                  <span className="font-mono text-gray-700">{selectedPart.numeroDistribuidor || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold uppercase text-xs">Descripción:</span>
                  <span className="font-medium text-gray-800 text-right max-w-[70%] uppercase">{selectedPart.description}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  Números Cruzados / Referencias de Experiencia
                </label>
                <p className="text-xs text-gray-500 mb-2">Escribe un número o código y presiona <strong>Enter</strong> (o coma) para agregarlo. <em>(Se guardará en MAYÚSCULAS)</em>.</p>
                
                <div className="w-full min-h-[120px] p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white transition-all content-start">
                  {crossReferences.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-100 text-orange-800 text-sm font-bold h-fit border border-orange-200 shadow-sm uppercase">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:bg-orange-200 rounded-full p-0.5 transition-colors ml-1">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={inputValue}
                    // ✅ FORZAMOS MAYÚSCULAS MIENTRAS SE ESCRIBE
                    onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    placeholder={crossReferences.length === 0 ? "EJ: 81825714, C5NN473A..." : "AGREGAR OTRO..."}
                    className="flex-1 min-w-[150px] bg-transparent outline-none text-sm font-medium uppercase placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedPart(null)}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveReferences}
                disabled={isSaving}
                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSaving ? 'Guardando...' : 'Guardar Referencias'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};