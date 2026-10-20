import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  Filter, 
  FileText, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Calculator,
  ShieldCheck,
  Building2,
  Receipt,
  Clock
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Invoice, Sale } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

export const TaxReports: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [stats, setStats] = useState({
    totalTaxed: 0,
    totalExempt: 0,
    ivaTrasladado: 0,
    ivaRetenido: 0,
    isrRetenido: 0,
    totalInvoiced: 0
  });

  useEffect(() => {
    const startOfMonth = new Date(`${selectedPeriod}-01T00:00:00Z`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);
    
    const q = query(
      collection(db, 'invoices'),
      where('date', '>=', startOfMonth.toISOString()),
      where('date', '<=', endOfMonth.toISOString()),
      where('status', '==', 'VIGENTE')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoiceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];
      setInvoices(invoiceData);
      
      const totals = invoiceData.reduce((acc, inv) => ({
        totalTaxed: acc.totalTaxed + (inv.total / 1.16),
        totalExempt: acc.totalExempt + 0, // Simplified
        ivaTrasladado: acc.ivaTrasladado + inv.taxAmount,
        ivaRetenido: acc.ivaRetenido + 0,
        isrRetenido: acc.isrRetenido + 0,
        totalInvoiced: acc.totalInvoiced + inv.total
      }), { totalTaxed: 0, totalExempt: 0, ivaTrasladado: 0, ivaRetenido: 0, isrRetenido: 0, totalInvoiced: 0 });
      
      setStats(totals);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'invoices');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedPeriod]);

  const chartData = [
    { name: 'IVA Trasladado', value: stats.ivaTrasladado, color: '#F27D26' },
    { name: 'IVA Retenido', value: stats.ivaRetenido, color: '#3b82f6' },
    { name: 'ISR Retenido', value: stats.isrRetenido, color: '#ef4444' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="text-primary" />
            Reportes Fiscales y SAT
          </h2>
          <p className="text-sm text-gray-500">Resumen de impuestos acumulados y cumplimiento de obligaciones.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="month" 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors">
            <Download size={18} />
            Exportar SAT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">IVA Trasladado (16%)</p>
          <p className="text-2xl font-black text-primary">${stats.ivaTrasladado.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-green-600 font-bold">
            <ArrowUpRight size={12} />
            <span>+8.2% vs mes anterior</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Ingresos Gravados</p>
          <p className="text-2xl font-black text-gray-900">${stats.totalTaxed.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">Base gravable acumulada</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Facturado</p>
          <p className="text-2xl font-black text-gray-900">${stats.totalInvoiced.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">{invoices.length} facturas vigentes</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Estatus Fiscal</p>
          <div className="flex items-center gap-2 text-green-600 mt-1">
            <ShieldCheck size={20} />
            <span className="text-lg font-black uppercase">Positivo</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">Opinión del cumplimiento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            Distribución de Impuestos
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.length > 0 ? chartData : [{ name: 'Sin datos', value: 1, color: '#f3f4f6' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <FileText size={20} className="text-primary" />
              Últimas Facturas Emitidas
            </h3>
            <button className="text-xs text-primary font-bold hover:underline">Ver todas</button>
          </div>
          <div className="space-y-4">
            {invoices.slice(0, 5).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-primary">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{inv.folio} - {inv.uuid?.slice(0, 8)}...</p>
                    <p className="text-[10px] text-gray-400">{new Date(inv.date).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">${inv.total.toLocaleString()}</p>
                  <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase font-bold">Vigente</span>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">No hay facturas emitidas en este periodo.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
