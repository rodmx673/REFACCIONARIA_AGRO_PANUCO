import React, { useState, useEffect } from 'react';
import { FileText, Search, ImageIcon, Plus, ArrowLeft, Trash2, Calendar, Link as LinkIcon, Loader2 } from 'lucide-react';
import { InvoiceHistoryRecord } from '../types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const URL = import.meta.env.VITE_APPS_SCRIPT_URL;

export const InvoiceHistory: React.FC<{ onNavigateToExtractor?: () => void; onNavigateToInventory?: () => void; initialSelectedInvoiceId?: string | null; }> = ({ onNavigateToExtractor }) => {
  const [invoices, setInvoices] = useState<InvoiceHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceHistoryRecord | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(URL, { method: 'POST', body: JSON.stringify({ action: 'getInvoiceHistory', data: {} }) });
        const data = await res.json();
        if (data.success) setInvoices(data.data || []);
      } catch (error) {
        console.warn('Error cargando historial de facturas');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filtered = invoices.filter(inv => 
    inv.numero_factura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.proveedor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FileText className="text-primary"/> Historial de Facturas</h1>
          <p className="text-sm text-gray-500 mt-1">Consulta y gestiona facturas de proveedores.</p>
        </div>
        {onNavigateToExtractor && (
          <button onClick={onNavigateToExtractor} className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-md">Escanear Factura</button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por folio o proveedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500"><Loader2 className="animate-spin mx-auto mb-2" /> Cargando...</div>
        ) : filtered.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Folio</th>
                <th className="px-6 py-4">Proveedor</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4 text-right">Importe</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inv) => (
                <tr key={inv.id} onClick={() => setSelectedInvoice(inv)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 font-mono font-bold text-primary">{inv.numero_factura}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{inv.proveedor}</td>
                  <td className="px-6 py-4 text-gray-500">{inv.fecha}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">${Number(inv.importe).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center text-primary font-bold text-xs">Ver detalle</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-gray-400">No hay facturas registradas.</div>
        )}
      </div>

      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{selectedInvoice.numero_factura}</h3>
                  <p className="text-sm text-gray-500">{selectedInvoice.proveedor}</p>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-gray-700">Cerrar</button>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                <p className="text-sm text-gray-700">Fecha: <span className="font-bold">{selectedInvoice.fecha}</span></p>
                <p className="text-sm text-gray-700">Importe: <span className="font-bold text-primary">${Number(selectedInvoice.importe).toLocaleString()}</span></p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};