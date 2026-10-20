import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Employee, Commission } from '../../types';

const URL = import.meta.env.VITE_APPS_SCRIPT_URL;

export const CommissionCalculator: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [stats, setStats] = useState({ totalSales: 0, totalCommissions: 0, pendingPayments: 0 });

  const loadData = async () => {
    try {
      const [empRes, commRes] = await Promise.all([
        fetch(URL, { method: 'POST', body: JSON.stringify({ action: 'getEmployees', data: {} }) }),
        fetch(URL, { method: 'POST', body: JSON.stringify({ action: 'getCommissions', data: { period: selectedPeriod } }) })
      ]);
      const empData = await empRes.json();
      const commData = await commRes.json();
      if (empData.success) setEmployees(empData.data || []);
      if (commData.success) {
        setCommissions(commData.data || []);
        const totals = (commData.data || []).reduce((acc: any, c: any) => ({
          totalSales: acc.totalSales + (c.totalSales || 0),
          totalCommissions: acc.totalCommissions + (c.calculatedCommission || 0),
          pendingPayments: acc.pendingPayments + (c.status === 'PENDING' ? (c.calculatedCommission || 0) : 0)
        }), { totalSales: 0, totalCommissions: 0, pendingPayments: 0 });
        setStats(totals);
      }
    } catch (e) {
      console.warn('Error cargando comisiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedPeriod]);

  const calculateCommissionsForPeriod = async () => {
    setLoading(true);
    try {
      const res = await fetch(URL, { method: 'POST', body: JSON.stringify({ action: 'calculateCommissions', data: { period: selectedPeriod } }) });
      const data = await res.json();
      if (data.success) {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><DollarSign className="text-primary" /> Calculadora de Comisiones</h2>
          <p className="text-sm text-gray-500">Cálculo automático basado en ventas del POS.</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="month" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg" />
          <button onClick={calculateCommissionsForPeriod} disabled={loading} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50">
            <TrendingUp size={20} /> Calcular Periodo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Ventas Totales</p>
          <p className="text-2xl font-bold text-gray-900">${stats.totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Comisiones Generadas</p>
          <p className="text-2xl font-bold text-gray-900">${stats.totalCommissions.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Pendiente de Pago</p>
          <p className="text-2xl font-bold text-primary">${stats.pendingPayments.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Detalle de Comisiones</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold">Vendedor</th>
                <th className="px-6 py-4 font-semibold">Ventas</th>
                <th className="px-6 py-4 font-semibold">Comisión</th>
                <th className="px-6 py-4 font-semibold">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {commissions.map((comm) => {
                const emp = employees.find(e => e.uid === comm.employeeId);
                return (
                  <tr key={comm.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-900">{emp?.name || 'Desconocido'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">${comm.totalSales.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-primary">${comm.calculatedCommission.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${comm.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {comm.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {commissions.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No hay comisiones calculadas para este periodo.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};