import React, { useState, useEffect, useContext } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  DollarSign,
  BadgeCheck,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  ShieldCheck,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  Briefcase,
  Layers,
  ChevronRight,
  Shield
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Employee, Role, PositionRole } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { AuthContext } from '../Auth';
import { PositionsManager } from './PositionsManager';
import { DEFAULT_POSITIONS, getRoleBadgeStyle } from '../../lib/permissions';
import { toast } from 'sonner';

export const EmployeeList: React.FC = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN';

  // Active view: 'employees' | 'permissions'
  const [activeView, setActiveView] = useState<'employees' | 'permissions'>('employees');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<PositionRole[]>(DEFAULT_POSITIONS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form state for add/edit
  const [formRole, setFormRole] = useState<string>('VENTAS');
  const [formPosition, setFormPosition] = useState<string>('Asesor de Ventas de Mostrador');
  const [formName, setFormName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formRfc, setFormRfc] = useState<string>('');
  const [formCurp, setFormCurp] = useState<string>('');
  const [formHireDate, setFormHireDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formSalary, setFormSalary] = useState<number>(12000);
  const [formCommissionRate, setFormCommissionRate] = useState<number>(3.0);
  const [formBankAccount, setFormBankAccount] = useState<string>('');
  const [formTaxRegime, setFormTaxRegime] = useState<string>('605');
  const [formZipCode, setFormZipCode] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Load employees from Firestore
  useEffect(() => {
    const q = query(collection(db, 'employees'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const employeeData = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Employee[];
      setEmployees(employeeData);
      setLoading(false);
    }, (error) => {
      console.warn('Error reading employees:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load positions from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'positions'), (snapshot) => {
      if (!snapshot.empty) {
        const firestorePositions = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as PositionRole[];

        const mergedMap = new Map<string, PositionRole>();
        DEFAULT_POSITIONS.forEach(dp => mergedMap.set(dp.code, dp));
        firestorePositions.forEach(fp => mergedMap.set(fp.code, fp));
        setPositions(Array.from(mergedMap.values()));
      }
    });

    return () => unsub();
  }, []);

  // When role changes in the form, automatically suggest position title
  const handleRoleChange = (newRole: string) => {
    setFormRole(newRole);
    const matched = positions.find(p => p.code === newRole);
    if (matched) {
      setFormPosition(matched.name);
    } else {
      switch (newRole) {
        case 'ADMIN': setFormPosition('Administrador General'); break;
        case 'GERENTE': setFormPosition('Gerente de Sucursal'); break;
        case 'CLERK': setFormPosition('Clerk / Cajero Mostrador'); break;
        case 'VENTAS': setFormPosition('Asesor de Ventas de Mostrador'); break;
        case 'BODEGA': setFormPosition('Encargado de Bodega y Almacén'); break;
        default: setFormPosition(newRole); break;
      }
    }
  };

  const openAddModal = () => {
    setFormRole('VENTAS');
    setFormPosition('Asesor de Ventas de Mostrador');
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRfc('');
    setFormCurp('');
    setFormHireDate(new Date().toISOString().split('T')[0]);
    setFormSalary(12000);
    setFormCommissionRate(3.0);
    setFormBankAccount('');
    setFormTaxRegime('605');
    setFormZipCode('');
    setFormStatus('ACTIVE');
    setShowAddModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormRole(emp.role);
    setFormPosition(emp.position);
    setFormName(emp.name);
    setFormEmail(emp.email || '');
    setFormPhone(emp.phone || '');
    setFormRfc(emp.rfc || '');
    setFormCurp(emp.curp || '');
    setFormHireDate(emp.hireDate || new Date().toISOString().split('T')[0]);
    setFormSalary(emp.salary || 0);
    setFormCommissionRate(emp.commissionRate || 0);
    setFormBankAccount(emp.bankAccount || '');
    setFormTaxRegime(emp.taxRegime || '605');
    setFormZipCode(emp.zipCode || '');
    setFormStatus(emp.status || 'ACTIVE');
    setShowEditModal(true);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRfc.trim()) {
      toast.error('Nombre y RFC son obligatorios.');
      return;
    }

    const newEmployee = {
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      rfc: formRfc.trim().toUpperCase(),
      curp: formCurp.trim().toUpperCase(),
      position: formPosition.trim(),
      role: formRole as Role,
      hireDate: formHireDate,
      salary: Number(formSalary),
      commissionRate: Number(formCommissionRate),
      bankAccount: formBankAccount.trim(),
      taxRegime: formTaxRegime,
      zipCode: formZipCode.trim(),
      status: formStatus,
      uid: '',
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, 'employees'), newEmployee);
      
      // Also register or link user entry if email provided
      if (formEmail.trim()) {
        const userId = docRef.id;
        await setDoc(doc(db, 'users', userId), {
          name: formName.trim(),
          email: formEmail.trim(),
          role: formRole,
          createdAt: serverTimestamp()
        }, { merge: true });
      }

      setShowAddModal(false);
      toast.success(`Empleado ${formName} registrado exitosamente con rol ${formRole}`);
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Error al registrar empleado en la base de datos.');
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      const empRef = doc(db, 'employees', selectedEmployee.id);
      await updateDoc(empRef, {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        rfc: formRfc.trim().toUpperCase(),
        curp: formCurp.trim().toUpperCase(),
        position: formPosition.trim(),
        role: formRole as Role,
        hireDate: formHireDate,
        salary: Number(formSalary),
        commissionRate: Number(formCommissionRate),
        bankAccount: formBankAccount.trim(),
        taxRegime: formTaxRegime,
        zipCode: formZipCode.trim(),
        status: formStatus,
        updatedAt: serverTimestamp(),
      });

      setShowEditModal(false);
      toast.success(`Datos de ${formName} actualizados correctamente.`);
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Error al actualizar empleado.');
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.rfc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedRoleFilter === 'ALL') return true;
    if (selectedRoleFilter === 'ADMIN') return emp.role === 'ADMIN';
    if (selectedRoleFilter === 'GERENTE') return emp.role === 'GERENTE';
    if (selectedRoleFilter === 'CLERK') return emp.role === 'CLERK' || emp.role === 'CAJERO';
    if (selectedRoleFilter === 'VENTAS') return emp.role === 'VENTAS' || emp.role === 'VENDEDOR';
    if (selectedRoleFilter === 'BODEGA') return emp.role === 'BODEGA' || emp.role === 'ALMACENISTA';
    if (selectedRoleFilter === 'CUSTOM') {
      return !['ADMIN', 'GERENTE', 'CLERK', 'CAJERO', 'VENTAS', 'VENDEDOR', 'BODEGA', 'ALMACENISTA'].includes(emp.role);
    }
    return emp.role === selectedRoleFilter;
  });

  const activeCount = employees.filter(e => e.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Top Header & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Recursos Humanos y Usuarios
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Gestión de empleados, puestos de trabajo y niveles de permisos del sistema
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented View Switcher */}
          <div className="bg-gray-100 p-1 rounded-2xl flex items-center gap-1 border border-gray-200/60 shadow-inner">
            <button
              id="hr-tab-employees"
              onClick={() => setActiveView('employees')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === 'employees'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Users size={15} />
              <span>Empleados (Usuarios)</span>
              <span className="px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded-full text-[10px]">
                {employees.length}
              </span>
            </button>

            <button
              id="hr-tab-permissions"
              onClick={() => setActiveView('permissions')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === 'permissions'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <ShieldCheck size={15} />
              <span>Puestos y Permisos</span>
              <span className="px-1.5 py-0.2 bg-primary/10 text-primary rounded-full text-[10px]">
                {positions.length}
              </span>
            </button>
          </div>

          {/* Quick Action Button */}
          {activeView === 'employees' ? (
            <button 
              id="hr-add-employee-btn"
              onClick={openAddModal}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20 font-bold text-xs"
            >
              <UserPlus size={16} />
              <span>Nuevo Empleado</span>
            </button>
          ) : (
            <button 
              onClick={() => setActiveView('employees')}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 active:scale-95 transition-all shadow-md font-bold text-xs"
            >
              <Users size={16} />
              <span>Ver Empleados</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: POSITIONS & PERMISSIONS MANAGER */}
      {activeView === 'permissions' ? (
        <PositionsManager
          employees={employees}
          isAdmin={isAdmin}
          onSelectRoleFilter={(roleCode) => {
            setSelectedRoleFilter(roleCode);
            setActiveView('employees');
          }}
        />
      ) : (
        /* VIEW 2: EMPLOYEES DIRECTORY */
        <div className="space-y-4">
          {/* Quick Metrics & 5 Base Roles Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { code: 'ALL', label: 'Todos', count: employees.length, color: 'border-gray-200 bg-white' },
              { code: 'ADMIN', label: 'Admin', count: employees.filter(e => e.role === 'ADMIN').length, color: 'border-emerald-200 bg-emerald-50/50' },
              { code: 'GERENTE', label: 'Gerente', count: employees.filter(e => e.role === 'GERENTE').length, color: 'border-blue-200 bg-blue-50/50' },
              { code: 'CLERK', label: 'Clerk', count: employees.filter(e => e.role === 'CLERK' || e.role === 'CAJERO').length, color: 'border-amber-200 bg-amber-50/50' },
              { code: 'VENTAS', label: 'Ventas', count: employees.filter(e => e.role === 'VENTAS' || e.role === 'VENDEDOR').length, color: 'border-indigo-200 bg-indigo-50/50' },
              { code: 'BODEGA', label: 'Bodega', count: employees.filter(e => e.role === 'BODEGA' || e.role === 'ALMACENISTA').length, color: 'border-orange-200 bg-orange-50/50' },
            ].map(pill => (
              <button
                key={pill.code}
                onClick={() => setSelectedRoleFilter(pill.code)}
                className={`p-3 rounded-2xl border text-left transition-all ${pill.color} ${
                  selectedRoleFilter === pill.code 
                    ? 'ring-2 ring-primary ring-offset-1 shadow-sm font-bold' 
                    : 'hover:opacity-90'
                }`}
              >
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {pill.label}
                </p>
                <div className="flex items-baseline justify-between mt-1">
                  <p className="text-xl font-bold text-gray-900">
                    {pill.count}
                  </p>
                  <span className="text-[10px] text-gray-400 font-semibold">
                    usuarios
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Search and Filters Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, RFC, puesto o correo..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-xs font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <button 
                  onClick={() => setActiveView('permissions')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                >
                  <ShieldCheck size={14} className="text-primary" />
                  <span>Configurar Permisos de Puestos</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/70 text-gray-400 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Empleado (Usuario)</th>
                    <th className="px-6 py-3.5">Rol de Permisos</th>
                    <th className="px-6 py-3.5">Puesto Asignado</th>
                    <th className="px-6 py-3.5">Datos Fiscales & Nómina</th>
                    <th className="px-6 py-3.5">Estatus</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-xs">
                        No se encontraron empleados con el filtro seleccionado.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const badgeStyle = getRoleBadgeStyle(emp.role);
                      return (
                        <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                {emp.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate">{emp.name}</p>
                                <p className="text-xs text-gray-400 truncate">{emp.email || 'Sin correo asignado'}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                              <Shield size={12} />
                              {badgeStyle.label}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-800 text-xs sm:text-sm">{emp.position}</p>
                              <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                                <Calendar size={12} />
                                <span>Ingreso: {emp.hireDate || 'N/A'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="space-y-0.5">
                              <p className="text-xs font-mono text-gray-700 font-semibold">RFC: {emp.rfc}</p>
                              <p className="text-[11px] text-gray-500">
                                Sueldo: ${Number(emp.salary || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                {emp.commissionRate > 0 && ` + ${emp.commissionRate}% Com.`}
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              emp.status === 'ACTIVE' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {emp.status === 'ACTIVE' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                              {emp.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openEditModal(emp)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:text-primary hover:bg-primary/5 transition-all border border-gray-200 hover:border-primary/30"
                              title="Editar puesto o permisos"
                            >
                              <Edit2 size={13} />
                              <span>Editar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR / EDITAR EMPLEADO */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      {showAddModal ? 'Registrar Nuevo Empleado (Usuario)' : `Editar Empleado: ${formName}`}
                    </h3>
                    <p className="text-xs text-gray-400">
                      Asigna el tipo de usuario y nivel de permisos correspondiente
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={showAddModal ? handleAddEmployee : handleUpdateEmployee} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Role / User Type Selector - MANDATORY 5 TYPES + CUSTOM */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={16} />
                      Nivel de Permisos / Rol de Sistema *
                    </label>
                    <span className="text-[11px] text-primary font-semibold">
                      Decidido por el Administrador
                    </span>
                  </div>

                  <select 
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    required 
                    className="w-full px-4 py-2.5 bg-white border border-primary/30 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <optgroup label="5 Tipos Base del Sistema">
                      <option value="ADMIN">Administrador General (Acceso Total y Permisos)</option>
                      <option value="GERENTE">Gerente de Sucursal (Operaciones y Supervisión)</option>
                      <option value="CLERK">Clerk / Cajero Mostrador (Terminal POS y Cobros)</option>
                      <option value="VENTAS">Asesor de Ventas de Mostrador (Ventas y Catálogo)</option>
                      <option value="BODEGA">Encargado de Bodega y Almacén (Inventario y OCR)</option>
                    </optgroup>

                    {positions.filter(p => !['ADMIN', 'GERENTE', 'CLERK', 'VENTAS', 'BODEGA'].includes(p.code)).length > 0 && (
                      <optgroup label="Posiciones Personalizadas Creadas">
                        {positions
                          .filter(p => !['ADMIN', 'GERENTE', 'CLERK', 'VENTAS', 'BODEGA'].includes(p.code))
                          .map(customPos => (
                            <option key={customPos.code} value={customPos.code}>
                              {customPos.name} ({customPos.department})
                            </option>
                          ))
                        }
                      </optgroup>
                    )}
                  </select>

                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Este nivel determinará a qué botones, reportes y funciones podrá acceder este empleado al iniciar sesión.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre Completo *</label>
                    <input 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required 
                      type="text" 
                      placeholder="Ej. Juan Pérez Estrada"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Puesto de Trabajo Asignado *</label>
                    <input 
                      value={formPosition}
                      onChange={(e) => setFormPosition(e.target.value)}
                      required 
                      type="text" 
                      placeholder="Ej. Asesor de Ventas Diésel"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Correo Electrónico (Login)</label>
                    <input 
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      type="email" 
                      placeholder="correo@empresa.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono de Contacto</label>
                    <input 
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      type="tel" 
                      placeholder="(668) 123-4567"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">RFC *</label>
                    <input 
                      value={formRfc}
                      onChange={(e) => setFormRfc(e.target.value.toUpperCase())}
                      required 
                      type="text" 
                      placeholder="XAXX010101000"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">CURP</label>
                    <input 
                      value={formCurp}
                      onChange={(e) => setFormCurp(e.target.value.toUpperCase())}
                      type="text" 
                      placeholder="18 caracteres"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha de Ingreso</label>
                    <input 
                      value={formHireDate}
                      onChange={(e) => setFormHireDate(e.target.value)}
                      required 
                      type="date" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sueldo Base Mensual ($ MXN)</label>
                    <input 
                      value={formSalary}
                      onChange={(e) => setFormSalary(Number(e.target.value))}
                      required 
                      type="number" 
                      step="100" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">% Comisión por Venta</label>
                    <input 
                      value={formCommissionRate}
                      onChange={(e) => setFormCommissionRate(Number(e.target.value))}
                      type="number" 
                      step="0.5" 
                      placeholder="Ej. 3.0"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estatus del Empleado</label>
                    <select 
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo / Baja</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cuenta Bancaria (CLABE Nómina)</label>
                    <input 
                      value={formBankAccount}
                      onChange={(e) => setFormBankAccount(e.target.value)}
                      type="text" 
                      placeholder="18 dígitos para dispersión de nómina"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                    }}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                  >
                    {showAddModal ? 'Guardar Empleado' : 'Actualizar Cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
