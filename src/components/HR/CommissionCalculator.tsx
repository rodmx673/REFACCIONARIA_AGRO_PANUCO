import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Employee, Sale, Commission } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

export const CommissionCalculator: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCommissions: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'employees'), where('status', '==', 'ACTIVE'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const employeeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      setEmployees(employeeData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'employees');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'commissions'), where('period', '==', selectedPeriod));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commissionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commission[];
      setCommissions(commissionData);
      
      const totals = commissionData.reduce((acc, comm) => ({
        totalSales: acc.totalSales + comm.totalSales,
        totalCommissions: acc.totalCommissions + comm.calculatedCommission,
        pendingPayments: acc.pendingPayments + (comm.status === 'PENDING' ? comm.calculatedCommission : 0)
      }), { totalSales: 0, totalCommissions: 0, pendingPayments: 0 });
      
      setStats(totals);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'commissions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedPeriod]);

  const calculateCommissionsForPeriod = async () => {
    setLoading(true);
    try {
      // 1. Get all sales for the period
      const startOfMonth = new Date(`${selectedPeriod}-01T00:00:00Z`);
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);
      
      const salesQuery = query(
        collection(db, 'sales'),
        where('timestamp', '>=', startOfMonth.toISOString()),
        where('timestamp', '<=', endOfMonth.toISOString()),
        where('status', '==', 'COMPLETED')
      );
      
      const salesSnapshot = await getDocs(salesQuery);
      const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[];

      // 2. Group sales by seller
      const salesBySeller: Record<string, Sale[]> = {};
      sales.forEach(sale => {
        if (!salesBySeller[sale.sellerId]) salesBySeller[sale.sellerId] = [];
        salesBySeller[sale.sellerId].push(sale);
      });

      // 3. Calculate and save commissions
      for (const emp of employees) {
        const empSales = salesBySeller[emp.uid] || [];
        const totalSalesAmount = empSales.reduce((sum, s) => sum + s.total, 0);
        const calculatedCommission = totalSalesAmount * (emp.commissionRate / 100);

        // Check if commission already exists for this period
        const existingComm = commissions.find(c => c.employeeId === emp.uid);
        
        if (!existingComm && calculatedCommission > 0) {
          await addDoc(collection(db, 'commissions'), {
            employeeId: emp.uid,
            period: selectedPeriod,
            totalSales: totalSalesAmount,
            calculatedCommission,
            status: 'PENDING',
            salesIds: empSales.map(s => s.id),
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error("Error calculating commissions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="text-primary" />
            Calculadora de Comisiones
          </h2>
          <p className="text-sm text-gray-500">Cálculo automático basado en ventas del POS y políticas de RRHH.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="month" 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button 
            onClick={calculateCommissionsForPeriod}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <TrendingUp size={20} />
            Calcular Periodo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">Ventas Totales</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">${stats.totalSales.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600 font-medium">
            <ArrowUpRight size={14} />
            <span>+12.5% vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">Comisiones Generadas</p>
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">${stats.totalCommissions.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
            <Clock size={14} />
            <span>Periodo: {selectedPeriod}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">Pendiente de Pago</p>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <AlertCircle size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">${stats.pendingPayments.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-orange-600 font-medium">
            <span>Requiere aprobación de Admin</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Detalle de Comisiones por Empleado</h3>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-primary rounded-lg">
              <Filter size={18} />
            </button>
            <button className="p-2 text-gray-400 hover:text-primary rounded-lg">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Vendedor</th>
                <th className="px-6 py-4 font-semibold">Ventas Totales</th>
                <th className="px-6 py-4 font-semibold">% Comis.</th>
                <th className="px-6 py-4 font-semibold">Monto Comis.</th>
                <th className="px-6 py-4 font-semibold">Estatus</th>
                <th className="px-6 py-4 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {commissions.map((comm) => {
                const emp = employees.find(e => e.uid === comm.employeeId);
                return (
                  <tr key={comm.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {emp?.name.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{emp?.name || 'Desconocido'}</p>
                          <p className="text-[10px] text-gray-500">{emp?.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">${comm.totalSales.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400">{comm.salesIds.length} ventas realizadas</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-gray-600">{emp?.commissionRate}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-primary">${comm.calculatedCommission.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        comm.status === 'PAID' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {comm.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-primary hover:text-primary/80 text-xs font-bold flex items-center gap-1">
                        Ver Detalles
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {commissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <AlertCircle size={48} strokeWidth={1} />
                      <p>No hay comisiones calculadas para este periodo.</p>
                      <button 
                        onClick={calculateCommissionsForPeriod}
                        className="text-primary font-bold text-sm hover:underline"
                      >
                        Calcular ahora
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
