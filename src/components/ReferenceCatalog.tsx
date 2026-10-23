import React, { useState } from 'react';
import { Search, Package, Plus, FileText, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/utils';

const URL = import.meta.env.VITE_APPS_SCRIPT_URL;

interface ReferenceItem {
  _id: string;
  partNumber: string;
  description: string;
  references: string;
  code: string;
  letterCode: string;
  subCode: string;
  price: number;
}

interface ReferenceCatalogProps {
  onImportToStock?: (item: ReferenceItem) => void;
}

export const ReferenceCatalog: React.FC<ReferenceCatalogProps> = ({ onImportToStock }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) {
      toast.error('Escribe al menos 2 letras para buscar');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'searchReferenceCatalog', data: { query: query.trim() } })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.data || []);
      } else {
        toast.error(data.error || 'Error al buscar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (item: ReferenceItem) => {
    if (onImportToStock) {
      onImportToStock(item);
    } else {
      toast.info(`Preparando para importar: ${item.partNumber}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-primary" /> Catálogo de Referencia OEM
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Busca por número de fabricante (OEM) o por referencias cruzadas (marcas alternativas).
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por número OEM (ej. 81816723), referencia (25174202) o descripción..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 ring-primary/20 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Buscar'}
        </button>
      </form>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Loader2 size={32} className="animate-spin text-primary mb-2" />
            <p className="text-sm font-medium">Buscando en el catálogo...</p>
          </div>
        ) : !searched ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Search size={48} className="mb-2 opacity-20" />
            <p>Realiza una búsqueda para consultar el catálogo.</p>
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
                  <th className="px-6 py-4">Part Number (OEM)</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4">Referencias Cruzadas</th>
                  <th className="px-6 py-4 text-right">Precio</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-primary text-sm">{item.partNumber}</div>
                      <div className="flex gap-1 mt-1">
                        {item.letterCode && <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{item.letterCode}</span>}
                        {item.code && <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{item.code}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800 max-w-[300px] truncate" title={item.description}>
                      {item.description}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500 font-mono line-clamp-2" title={item.references}>
                        {item.references || 'Sin referencias'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleImport(item)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 mx-auto"
                      >
                        <Plus size={12} /> Importar a Inventario
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};