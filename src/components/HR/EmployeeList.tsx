import React, { useState, useEffect, useContext } from 'react';
import { Users, UserPlus, Search, Edit2, XCircle, CheckCircle } from 'lucide-react';
import { Employee } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { AuthContext } from '../Auth';
import { toast } from 'sonner';

const URL = import.meta.env.VITE_APPS_SCRIPT_URL;

async function callApi(action: string, data: any = {}) {
  const res = await fetch(URL, { method: 'POST', body: JSON.stringify({ action, data }) });
  return res.json();
}

export const EmployeeList: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const loadEmployees = async () => {
    try {
      const res = await callApi('getEmployees');
      if (res.success) setEmployees(res.data || []);
    } catch (e) {
      toast.error('Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmployees(); }, []);

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-primary" /> Recursos Humanos
          </h2>
          <p className="text-sm text-gray-500">Gestión de empleados y puestos.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold shadow-lg text-sm">
          <UserPlus size={16} /> Nuevo Empleado
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, correo o puesto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ring-primary/20"
            />
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase">{employees.length} Empleados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Empleado</th>
                <th className="px-4 py-3">Puesto / Rol</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Cargando...</td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">No hay empleados registrados</td></tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900">{emp.name}</p>
                      <p className="text-xs text-gray-500 font-mono">RFC: {emp.rfc || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase">{emp.role}</span>
                      <p className="text-xs text-gray-600 mt-1">{emp.position}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700">{emp.email || 'Sin correo'}</p>
                      <p className="text-xs text-gray-400">{emp.phone || 'Sin teléfono'}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setSelectedEmployee(emp); setShowEditModal(true); }} className="p-2 text-gray-400 hover:text-primary rounded-lg transition-colors"><Edit2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales simplificados por ahora para evitar errores */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md text-center">
              <h3 className="text-lg font-bold mb-2">Módulo en Migración</h3>
              <p className="text-xs text-gray-500 mb-6">El formulario completo de empleados estará disponible muy pronto. Los datos se están leyendo correctamente desde Google Sheets.</p>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-xs">Cerrar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};