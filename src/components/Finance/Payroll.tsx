import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  User, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  FileText,
  AlertCircle
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  where,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Employee, Commission, PayrollRecord } from '../../types';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Payroll: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const [formData, setFormData] = useState({
    bonuses: 0,
    deductions: 0,
    notes: ''
  });

  useEffect(() => {
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'employees');
    });

    const unsubPayroll = onSnapshot(collection(db, 'payroll'), (snapshot) => {
      setPayrollRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayrollRecord)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'payroll');
      setLoading(false);
    });

    return () => {
      unsubEmployees();
      unsubPayroll();
    };
  }, []);

  const calculatePayroll = async () => {
    if (!selectedEmployee || !period) return;

    const employee = employees.find(e => e.id === selectedEmployee);
    if (!employee) return;

    // Fetch commissions for this employee and period
    const q = query(
      collection(db, 'commissions'), 
      where('employeeId', '==', selectedEmployee),
      where('period', '==', period)
    );
    
    const commSnap = await getDocs(q);
    const comms = commSnap.docs.map(doc => doc.data() as Commission);
    const totalCommissions = comms.reduce((sum, c) => sum + c.calculatedCommission, 0);

    const baseSalary = employee.salary || 0;
    const total = baseSalary + totalCommissions + formData.bonuses - formData.deductions;

    try {
      await addDoc(collection(db, 'payroll'), {
        employeeId: selectedEmployee,
        period,
        baseSalary,
        commissions: totalCommissions,
        bonuses: formData.bonuses,
        deductions: formData.deductions,
        total,
        status: 'PENDING',
        timestamp: serverTimestamp()
      });
      setIsModalOpen(false);
      setFormData({ bonuses: 0, deductions: 0, notes: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'payroll');
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      await updateDoc(doc(db, 'payroll', id), {
        status: 'PAID',
        paymentDate: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payroll/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Nómina (Payroll)</h2>
          <p className="text-gray-500">Gestión de sueldos, comisiones y pagos al personal.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
        >
          <Plus size={20} />
          Generar Nómina
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-200">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pendiente</p>
              <p className="text-2xl font-black text-gray-900">
                {formatCurrency(payrollRecords.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + r.total, 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-200">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pagado este Mes</p>
              <p className="text-2xl font-black text-gray-900">
                {formatCurrency(payrollRecords.filter(r => r.status === 'PAID' && r.period === period).reduce((sum, r) => sum + r.total, 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-200">
              <User size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Empleados Activos</p>
              <p className="text-2xl font-black text-gray-900">{employees.filter(e => e.status === 'ACTIVE').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Empleado</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Periodo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Sueldo Base</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Comisiones</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payrollRecords.sort((a, b) => b.period.localeCompare(a.period)).map(record => {
                const employee = employees.find(e => e.id === record.employeeId);
                return (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                          {employee?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{employee?.name || 'Desconocido'}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{employee?.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={14} />
                        <span className="text-sm font-medium">{record.period}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-600">
                      {formatCurrency(record.baseSalary)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-blue-600">
                      +{formatCurrency(record.commissions)}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">
                      {formatCurrency(record.total)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        record.status === 'PAID' ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {record.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {record.status === 'PENDING' ? (
                        <button 
                          onClick={() => markAsPaid(record.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Marcar como Pagado"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      ) : (
                        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                          <Download size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary text-white">
                <div className="flex items-center gap-3">
                  <DollarSign size={24} />
                  <h3 className="font-bold text-xl">Generar Nómina</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Empleado</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium"
                    value={selectedEmployee}
                    onChange={e => setSelectedEmployee(e.target.value)}
                  >
                    <option value="">Seleccionar Empleado</option>
                    {employees.filter(e => e.status === 'ACTIVE').map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.position})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Periodo</label>
                    <input 
                      type="month"
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium"
                      value={period}
                      onChange={e => setPeriod(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bonos Extra</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium"
                      value={formData.bonuses}
                      onChange={e => setFormData({...formData, bonuses: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Deducciones</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium"
                    value={formData.deductions}
                    onChange={e => setFormData({...formData, deductions: Number(e.target.value)})}
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl flex gap-3 text-blue-700 text-sm">
                  <AlertCircle className="shrink-0" size={20} />
                  <p>Las comisiones se calcularán automáticamente basándose en las ventas registradas para el empleado en el periodo seleccionado.</p>
                </div>

                <button 
                  onClick={calculatePayroll}
                  disabled={!selectedEmployee}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Confirmar y Generar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const X: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
