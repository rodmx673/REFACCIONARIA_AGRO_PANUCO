import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Check, 
  X, 
  Info, 
  Trash2, 
  Edit3, 
  Users, 
  Save, 
  RotateCcw, 
  Layers,
  Sparkles,
  Search,
  Lock,
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { PositionRole, RolePermissions, Employee } from '../../types';
import { DEFAULT_POSITIONS, PERMISSION_DEFINITIONS, getRoleBadgeStyle } from '../../lib/permissions';
import { toast } from 'sonner';

interface PositionsManagerProps {
  employees: Employee[];
  isAdmin: boolean;
  onSelectRoleFilter?: (roleCode: string) => void;
}

export const PositionsManager: React.FC<PositionsManagerProps> = ({
  employees,
  isAdmin,
  onSelectRoleFilter
}) => {
  const [positions, setPositions] = useState<PositionRole[]>(DEFAULT_POSITIONS);
  const [selectedPosition, setSelectedPosition] = useState<PositionRole>(DEFAULT_POSITIONS[0]);
  const [isCreatingModalOpen, setIsCreatingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<RolePermissions>(DEFAULT_POSITIONS[0].permissions);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // New position form state
  const [newPosName, setNewPosName] = useState('');
  const [newPosCode, setNewPosCode] = useState('');
  const [newPosDepartment, setNewPosDepartment] = useState('Operaciones');
  const [newPosDescription, setNewPosDescription] = useState('');
  const [newPosColor, setNewPosColor] = useState('indigo');
  const [newPosPermissions, setNewPosPermissions] = useState<RolePermissions>({
    canAccessPOS: true,
    canModifyPrices: false,
    canApplyDiscounts: false,
    canAccessInventory: true,
    canAdjustStock: false,
    canAccessOCR: false,
    canAccessCustomers: true,
    canManageCredits: false,
    canAccessVendors: false,
    canAccessReports: false,
    canAccessHR: false,
    canManageEmployees: false,
    canManagePermissions: false,
    canAccessInvoicing: false,
    canCloseCashRegister: false,
    canAccessSettings: false,
  });

  // Listen to Firestore positions collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'positions'), (snapshot) => {
      if (snapshot.empty) {
        // Initialize with default positions if Firestore has no custom ones
        setPositions(DEFAULT_POSITIONS);
      } else {
        const firestorePositions = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as PositionRole[];

        // Merge defaults with firestore positions
        const mergedMap = new Map<string, PositionRole>();
        DEFAULT_POSITIONS.forEach(dp => mergedMap.set(dp.code, dp));
        firestorePositions.forEach(fp => mergedMap.set(fp.code, fp));

        const mergedList = Array.from(mergedMap.values());
        setPositions(mergedList);

        // Update selected position if it exists
        const currentSelected = mergedList.find(p => p.id === selectedPosition.id || p.code === selectedPosition.code);
        if (currentSelected) {
          setSelectedPosition(currentSelected);
          setEditedPermissions(currentSelected.permissions);
        }
      }
    }, (err) => {
      console.warn('Using local default positions:', err);
      setPositions(DEFAULT_POSITIONS);
    });

    return () => unsub();
  }, []);

  // When selected position changes, reset editing state
  const handleSelectPosition = (pos: PositionRole) => {
    if (hasUnsavedChanges && !window.confirm('Tienes cambios sin guardar en los permisos. ¿Deseas descartarlos?')) {
      return;
    }
    setSelectedPosition(pos);
    setEditedPermissions({ ...pos.permissions });
    setHasUnsavedChanges(false);
  };

  const handleTogglePermission = (key: keyof RolePermissions) => {
    if (!isAdmin) {
      toast.error('Solo los administradores pueden modificar los niveles de permisos.');
      return;
    }
    const updated = {
      ...editedPermissions,
      [key]: !editedPermissions[key]
    };
    setEditedPermissions(updated);
    setHasUnsavedChanges(true);
  };

  const handleSavePermissions = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      const posDocRef = doc(db, 'positions', selectedPosition.id || `pos-${selectedPosition.code.toLowerCase()}`);
      const updatedPos: PositionRole = {
        ...selectedPosition,
        permissions: editedPermissions
      };

      await setDoc(posDocRef, {
        ...updatedPos,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update local state
      setPositions(prev => prev.map(p => (p.code === selectedPosition.code ? updatedPos : p)));
      setSelectedPosition(updatedPos);
      setHasUnsavedChanges(false);
      toast.success(`Nivel de permisos actualizado para "${selectedPosition.name}"`);
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('No se pudieron guardar los permisos en la base de datos.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToOriginal = () => {
    setEditedPermissions({ ...selectedPosition.permissions });
    setHasUnsavedChanges(false);
    toast.info('Cambios restablecidos');
  };

  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPosName.trim() || !newPosCode.trim()) {
      toast.error('Nombre y código de posición requeridos.');
      return;
    }

    const cleanCode = newPosCode.trim().toUpperCase().replace(/\s+/g, '_');
    const newId = `pos-${cleanCode.toLowerCase()}-${Date.now().toString().slice(-4)}`;

    const newPosition: PositionRole = {
      id: newId,
      code: cleanCode,
      name: newPosName.trim(),
      description: newPosDescription.trim() || 'Posición personalizada creada por el Administrador.',
      department: newPosDepartment.trim(),
      color: newPosColor,
      isSystem: false,
      permissions: newPosPermissions,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'positions', newId), newPosition);
      setPositions(prev => [...prev, newPosition]);
      setSelectedPosition(newPosition);
      setEditedPermissions(newPosition.permissions);
      setIsCreatingModalOpen(false);
      toast.success(`Nueva posición "${newPosition.name}" creada exitosamente`);

      // Reset form
      setNewPosName('');
      setNewPosCode('');
      setNewPosDescription('');
    } catch (error) {
      console.error('Error creating position:', error);
      toast.error('Error al guardar la nueva posición.');
    }
  };

  const handleDeleteCustomPosition = async (pos: PositionRole) => {
    if (pos.isSystem) {
      toast.error('Las 5 posiciones base del sistema no pueden ser eliminadas.');
      return;
    }

    const assignedEmployeesCount = employees.filter(e => e.role === pos.code || e.position === pos.name).length;
    if (assignedEmployeesCount > 0) {
      toast.error(`No se puede eliminar. Hay ${assignedEmployeesCount} empleado(s) asignados a esta posición.`);
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar la posición "${pos.name}"?`)) return;

    try {
      await deleteDoc(doc(db, 'positions', pos.id));
      setPositions(prev => prev.filter(p => p.id !== pos.id));
      setSelectedPosition(DEFAULT_POSITIONS[0]);
      setEditedPermissions(DEFAULT_POSITIONS[0].permissions);
      toast.success(`Posición "${pos.name}" eliminada.`);
    } catch (error) {
      console.error('Error deleting position:', error);
      toast.error('Error al eliminar posición.');
    }
  };

  // Group permission definitions by category
  const categories = Array.from(new Set(PERMISSION_DEFINITIONS.map(p => p.category)));

  // Count employees per position
  const getEmployeeCount = (code: string, name: string) => {
    return employees.filter(e => 
      e.role === code || 
      (code === 'CLERK' && e.role === 'CAJERO') ||
      (code === 'VENTAS' && e.role === 'VENDEDOR') ||
      (code === 'BODEGA' && e.role === 'ALMACENISTA') ||
      e.position.toLowerCase() === name.toLowerCase()
    ).length;
  };

  const filteredPositions = positions.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-primary">
              <ShieldCheck size={14} />
              Control de Acceso RBAC y Posiciones
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Puestos y Niveles de Permisos
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Define los privilegios de los 5 perfiles fundamentales (Admin, Gerente, Clerk, Ventas y Bodega) o crea nuevas posiciones con niveles de acceso a la medida decididos por el administrador.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="hr-create-position-btn"
              onClick={() => setIsCreatingModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:opacity-90 active:scale-95 transition-all text-sm"
            >
              <Plus size={18} />
              Crear Nueva Posición
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Left column (Positions List) & Right column (Permissions Decider Matrix) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Positions Sidebar List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <Layers size={18} className="text-primary" />
                  Posiciones Activas
                </h3>
                <p className="text-xs text-gray-400">
                  {positions.length} posiciones configuradas
                </p>
              </div>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                5 Base + {Math.max(0, positions.length - 5)} Nuevas
              </span>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar posición o departamento..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
              />
            </div>

            {/* Position Cards */}
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {filteredPositions.map((pos) => {
                const isSelected = selectedPosition.code === pos.code;
                const empCount = getEmployeeCount(pos.code, pos.name);
                const badgeStyle = getRoleBadgeStyle(pos.code);

                return (
                  <div
                    key={pos.id || pos.code}
                    onClick={() => handleSelectPosition(pos)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border text-left relative group ${
                      isSelected
                        ? 'bg-primary/5 border-primary shadow-sm'
                        : 'bg-white hover:bg-gray-50/80 border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                            {pos.code}
                          </span>
                          {pos.isSystem ? (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                              Sistema
                            </span>
                          ) : (
                            <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-bold">
                              Personalizada
                            </span>
                          )}
                        </div>
                        <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                          {pos.name}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                          {pos.department}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-semibold bg-gray-50 px-2 py-0.5 rounded-lg">
                          <Users size={12} className="text-gray-400" />
                          {empCount}
                        </span>
                        {!pos.isSystem && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomPosition(pos);
                            }}
                            className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Eliminar posición"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Permissions Decider & Editor Matrix */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
            {/* Position details header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg border ${getRoleBadgeStyle(selectedPosition.code).bg} ${getRoleBadgeStyle(selectedPosition.code).text} ${getRoleBadgeStyle(selectedPosition.code).border}`}>
                    Código: {selectedPosition.code}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    Departamento: <strong className="text-gray-700">{selectedPosition.department}</strong>
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {selectedPosition.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
                  {selectedPosition.description}
                </p>
              </div>

              {/* Action Buttons for Admin Decider */}
              {isAdmin && (
                <div className="flex items-center gap-2 shrink-0">
                  {hasUnsavedChanges && (
                    <button
                      onClick={handleResetToOriginal}
                      className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw size={14} />
                      Descartar
                    </button>
                  )}
                  <button
                    onClick={handleSavePermissions}
                    disabled={!hasUnsavedChanges || isSaving}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                      hasUnsavedChanges
                        ? 'bg-primary text-white shadow-primary/25 hover:opacity-95 active:scale-95'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <Save size={14} />
                    {isSaving ? 'Guardando...' : hasUnsavedChanges ? 'Guardar Permisos' : 'Permisos Guardados'}
                  </button>
                </div>
              )}
            </div>

            {/* Matrix of Permission Toggles */}
            <div className="space-y-8">
              {categories.map((cat) => {
                const permsInCat = PERMISSION_DEFINITIONS.filter(p => p.category === cat);
                return (
                  <div key={cat} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {cat}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permsInCat.map((perm) => {
                        const isEnabled = !!editedPermissions[perm.key];
                        return (
                          <div
                            key={perm.key}
                            onClick={() => isAdmin && handleTogglePermission(perm.key)}
                            className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                              isAdmin ? 'cursor-pointer hover:border-gray-300' : 'cursor-default'
                            } ${
                              isEnabled 
                                ? 'bg-emerald-50/40 border-emerald-200' 
                                : 'bg-gray-50/50 border-gray-100 opacity-75'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-bold ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {perm.label}
                                </p>
                              </div>
                              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                {perm.description}
                              </p>
                            </div>

                            {/* Toggle Switch */}
                            <div className="pt-0.5 shrink-0">
                              <div
                                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                                  isEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                                }`}
                              >
                                <motion.div
                                  layout
                                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                  className={`w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center ${
                                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                >
                                  {isEnabled ? (
                                    <Check size={10} className="text-emerald-600 stroke-[3]" />
                                  ) : (
                                    <X size={10} className="text-gray-400 stroke-[3]" />
                                  )}
                                </motion.div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Crear Nueva Posición */}
      <AnimatePresence>
        {isCreatingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      Crear Nueva Posición de Trabajo
                    </h3>
                    <p className="text-xs text-gray-400">
                      Configura el puesto y decide los niveles de permisos asignados.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreatingModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreatePosition} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Nombre del Puesto / Posición *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPosName}
                      onChange={(e) => setNewPosName(e.target.value)}
                      placeholder="Ej. Supervisor de Taller Diésel"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Código Único de Rol *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPosCode}
                      onChange={(e) => setNewPosCode(e.target.value.toUpperCase())}
                      placeholder="Ej. SUPERVISOR_DIESEL"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Departamento
                    </label>
                    <select
                      value={newPosDepartment}
                      onChange={(e) => setNewPosDepartment(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="Operaciones">Operaciones y Campo</option>
                      <option value="Taller Mecánico">Taller Mecánico y Servicio</option>
                      <option value="Comercial y Mostrador">Comercial y Mostrador</option>
                      <option value="Almacén y Logística">Almacén y Logística</option>
                      <option value="Administración y Finanzas">Administración y Finanzas</option>
                      <option value="Auditoría y Calidad">Auditoría y Calidad</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Color de Identificación
                    </label>
                    <select
                      value={newPosColor}
                      onChange={(e) => setNewPosColor(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="indigo">Índigo / Azul Tecnológico</option>
                      <option value="emerald">Esmeralda / Campo</option>
                      <option value="amber">Ámbar / Cajas</option>
                      <option value="orange">Naranja / Almacén</option>
                      <option value="purple">Púrpura / Especializado</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Descripción de Responsabilidades
                    </label>
                    <textarea
                      rows={2}
                      value={newPosDescription}
                      onChange={(e) => setNewPosDescription(e.target.value)}
                      placeholder="Describe las principales funciones y el alcance de este puesto en el negocio..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Permissions selector for new position */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        Permisos Otorgados a Esta Posición
                      </h4>
                      <p className="text-xs text-gray-400">
                        Selecciona los módulos a los que tendrán acceso los usuarios asignados.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allTrue = Object.keys(newPosPermissions).reduce((acc, k) => {
                            acc[k as keyof RolePermissions] = true;
                            return acc;
                          }, {} as RolePermissions);
                          setNewPosPermissions(allTrue);
                        }}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Todos
                      </button>
                      <span className="text-gray-300">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          const allFalse = Object.keys(newPosPermissions).reduce((acc, k) => {
                            acc[k as keyof RolePermissions] = false;
                            return acc;
                          }, {} as RolePermissions);
                          setNewPosPermissions(allFalse);
                        }}
                        className="text-[11px] font-bold text-gray-500 hover:underline"
                      >
                        Ninguno
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {PERMISSION_DEFINITIONS.map((perm) => {
                      const isChecked = !!newPosPermissions[perm.key];
                      return (
                        <label
                          key={perm.key}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-primary/5 border-primary/40'
                              : 'bg-gray-50 border-gray-100 hover:bg-gray-100/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setNewPosPermissions(prev => ({
                                ...prev,
                                [perm.key]: !prev[perm.key]
                              }));
                            }}
                            className="mt-1 w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800">
                              {perm.label}
                            </p>
                            <p className="text-[11px] text-gray-400 line-clamp-1">
                              {perm.category}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsCreatingModalOpen(false)}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Guardar y Activar Posición
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
