import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle2, User, Plus, Calendar } from 'lucide-react';
import { Employee, PayrollRecord } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

const URL = import.meta.env.VITE_APPS_SCRIPT_URL;

export const Payroll: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));

  const loadData = async () => {
    try {
      const [empRes, payRes] = await Promise.all([
        fetch(URL, { method: 'POST', body: JSON.stringify({ action: 'getEmployees', data: {} }) }),
        fetch(URL, { method: 'POST', body: JSON.stringify({ action: 'getPayroll', data: { period } }) })
      ]);
      const empData = await empRes.json();
      const payData = await payRes.json();
      if (empData.success) setEmployees(empData.data || []);
      if (payData.success) setRecords(payData.data || []);
    } catch (e) {
      console.warn('Error cargando nómina');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Nómina (Payroll)</h2>
          <p className="text-gray-500">Gestión de sueldos y pagos al personal.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="px-4 py-2 border rounded-lg" />
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg"><Plus size={20} /> Generar Nómina</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase">Total Pendiente</p>
          <p className="text-2xl font-black text-gray-900">{formatCurrency(records.filter(r => r.status === 'PENDING').reduce((s, r) => s + (r.total || 0), 0))}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase">Pagado este Mes</p>
          <p className="text-2xl font-black text-gray-900">{formatCurrency(records.filter(r => r.status === 'PAID').reduce((s, r) => s + (r.total || 0), 0))}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase">Empleados Activos</p>
          <p className="text-2xl font-black text-gray-900">{employees.filter(e => e.status === 'ACTIVE').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Empleado</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Periodo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map(record => {
                const emp = employees.find(e => e.id === record.employeeId);
                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-900">{emp?.name || 'Desconocido'}</td>
                    <td className="px-6 py-4 font-medium text-gray-600">{record.period}</td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">{formatCurrency(record.total)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${record.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                        {record.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No hay registros de nómina para este periodo.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};