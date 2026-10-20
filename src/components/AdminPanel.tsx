import React, { useState, useEffect } from 'react';
import { AuthContext } from './Auth';
import {
  generateRegistrationCode,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllRoles,
  updateRolePermissions,
  PERMISSION_LABELS,
  AVAILABLE_ROLES,
  SheetUser,
  RolePermissionsSheet,
} from '../lib/sheetsApi';
import {
  KeyRound, Users, Shield, Copy, Check, RefreshCw, Plus,
  Trash2, ToggleLeft, ToggleRight, Loader2, X, ChevronDown, ChevronRight,
  AlertTriangle, UserCog, Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'codes' | 'users' | 'roles';

export const AdminPanel: React.FC = () => {
  const { user } = React.useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<Tab>('codes');

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center">
        <Shield size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Acceso restringido</h2>
        <p className="text-gray-500 mt-2">Esta sección es solo para administradores.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-500 text-sm">Gestiona usuarios, códigos de registro y permisos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {([
          { id: 'codes' as Tab, label: 'Códigos', icon: KeyRound },
          { id: 'users' as Tab, label: 'Usuarios', icon: Users },
          { id: 'roles' as Tab, label: 'Permisos por Rol', icon: Settings2 },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'codes' && <CodesTab key="codes" />}
        {activeTab === 'users' && <UsersTab key="users" />}
        {activeTab === 'roles' && <RolesTab key="roles" />}
      </AnimatePresence>
    </div>
  );
};


// ═══════════════════════════════════════════════════
//  TAB 1: GENERAR CÓDIGOS
// ═══════════════════════════════════════════════════

const CodesTab: React.FC = () => {
  const { user } = React.useContext(AuthContext);
  const [selectedRole, setSelectedRole] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const handleGenerate = async (role: string) => {
    if (generating) return;
    setGenerating(true);
    setSelectedRole(role);

    const result = await generateRegistrationCode(role, user?.email || 'admin', 168); // 7 days

    if (result.success && result.data) {
      setGeneratedCode(result.data.code);
      setHistory(prev => [result.data, ...prev]);
    } else {
      alert('Error: ' + (result.error || 'No se pudo generar el código'));
    }
    setGenerating(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Generate buttons */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-1">Generar Código de Registro</h3>
        <p className="text-sm text-gray-500 mb-4">
          Selecciona el tipo de usuario para generar un código de acceso único (válido por 7 días).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* ADMIN button */}
          <button
            onClick={() => handleGenerate('ADMIN')}
            disabled={generating}
            className="flex items-center gap-4 p-5 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all disabled:opacity-50 group"
          >
            <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
              <Shield size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold text-red-900">Administrador</p>
              <p className="text-xs text-red-600">Acceso total al sistema</p>
            </div>
            {generating && selectedRole === 'ADMIN' && (
              <Loader2 size={20} className="animate-spin text-red-600 ml-auto" />
            )}
          </button>

          {/* USER button */}
          <button
            onClick={() => handleGenerate('USER')}
            disabled={generating}
            className="flex items-center gap-4 p-5 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold text-blue-900">Usuario</p>
              <p className="text-xs text-blue-600">Rol: CLERK (editar después)</p>
            </div>
            {generating && selectedRole === 'USER' && (
              <Loader2 size={20} className="animate-spin text-blue-600 ml-auto" />
            )}
          </button>
        </div>

        {/* Custom role buttons */}
        <div className="mt-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Generar con rol específico</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_ROLES.filter(r => r.code !== 'ADMIN').map(role => (
              <button
                key={role.code}
                onClick={() => handleGenerate(role.code)}
                disabled={generating}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
                {role.name}
                {generating && selectedRole === role.code && <Loader2 size={14} className="animate-spin" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generated code display */}
      {generatedCode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-center text-white"
        >
          <KeyRound size={32} className="mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-400 mb-2">Código generado para {selectedRole}</p>
          <p className="text-4xl font-mono font-bold tracking-[0.3em] mb-4">{generatedCode}</p>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all"
          >
            {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
            {copied ? '¡Copiado!' : 'Copiar código'}
          </button>
          <p className="text-xs text-gray-500 mt-4">Válido por 7 días · Úsese una sola vez</p>
        </motion.div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Códigos generados en esta sesión</h3>
          <div className="space-y-2">
            {history.map((code, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full" style={{
                    backgroundColor: code.role === 'ADMIN' ? '#DC2626' : '#2563EB'
                  }} />
                  <span className="font-mono font-bold text-gray-900">{code.code}</span>
                  <span className="text-xs text-gray-500">{code.role}</span>
                </div>
                <span className="text-xs text-gray-400">Activo · expira {new Date(code.expiresAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};


// ═══════════════════════════════════════════════════
//  TAB 2: GESTIONAR USUARIOS
// ═══════════════════════════════════════════════════

const UsersTab: React.FC = () => {
  const { user: currentUser } = React.useContext(AuthContext);
  const [users, setUsers] = useState<SheetUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<SheetUser | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    const result = await getAllUsers();
    if (result.success && result.data) {
      setUsers(result.data);
    }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleToggleActive = async (user: SheetUser) => {
    const newActive = user.isActive !== 'TRUE';
    await updateUser(user._id, { isActive: newActive });
    loadUsers();
  };

  const handleRoleChange = async (user: SheetUser, newRole: string) => {
    await updateUser(user._id, { role: newRole });
    setEditingUser(null);
    loadUsers();
  };

  const handleDelete = async (user: SheetUser) => {
    if (!confirm(`¿Eliminar a ${user.name || user.email}?`)) return;
    const result = await deleteUser(user._id);
    if (!result.success) {
      alert(result.error || 'Error al eliminar');
    }
    loadUsers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Usuarios registrados</h3>
          <p className="text-sm text-gray-500">{users.length} usuarios en el sistema</p>
        </div>
        <button onClick={loadUsers} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Rol</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Estado</th>
              <th className="text-right px-6 py-3 text-xs font-bold text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u._id} className={`hover:bg-gray-50 ${u.isActive !== 'TRUE' ? 'opacity-50' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt="" className="w-9 h-9 rounded-full" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm">
                        {(u.name || u.email || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{u.name || '(sin nombre)'}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {editingUser?._id === u._id ? (
                    <select
                      autoFocus
                      value={u.role}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                      onBlur={() => setEditingUser(null)}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                    >
                      {AVAILABLE_ROLES.map(r => (
                        <option key={r.code} value={r.code}>{r.name}</option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingUser(u)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full" style={{
                        backgroundColor: AVAILABLE_ROLES.find(r => r.code === u.role)?.color || '#9CA3AF'
                      }} />
                      {u.role}
                      <ChevronDown size={14} className="text-gray-400" />
                    </button>
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                    u.isActive === 'TRUE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {u.isActive === 'TRUE' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    {u._id !== currentUser?.id && (
                      <>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title={u.isActive === 'TRUE' ? 'Desactivar' : 'Activar'}
                        >
                          {u.isActive === 'TRUE' ? (
                            <ToggleRight size={20} className="text-green-500" />
                          ) : (
                            <ToggleLeft size={20} className="text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} className="text-red-400 hover:text-red-600" />
                        </button>
                      </>
                    )}
                    {u._id === currentUser?.id && (
                      <span className="text-xs text-gray-400 font-medium">(Tú)</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};


// ═══════════════════════════════════════════════════
//  TAB 3: PERMISOS POR ROL
// ═══════════════════════════════════════════════════

const RolesTab: React.FC = () => {
  const [roles, setRoles] = useState<RolePermissionsSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const loadRoles = async () => {
    setLoading(true);
    const result = await getAllRoles();
    if (result.success && result.data) {
      setRoles(result.data);
    }
    setLoading(false);
  };

  useEffect(() => { loadRoles(); }, []);

  const handleTogglePermission = (roleId: string, permKey: string) => {
    setRoles(prev => prev.map(r => {
      if (r._id === roleId) {
        const current = r[permKey as keyof RolePermissionsSheet];
        return { ...r, [permKey]: current === 'TRUE' ? 'FALSE' : 'TRUE' };
      }
      return r;
    }));
  };

  const handleSaveRole = async (roleId: string) => {
    const role = roles.find(r => r._id === roleId);
    if (!role) return;

    setSaving(roleId);
    const permissions: Record<string, boolean> = {};
    Object.keys(PERMISSION_LABELS).forEach(key => {
      permissions[key] = (role as any)[key] === 'TRUE';
    });

    // ADMIN always has everything
    if (role.code === 'ADMIN') {
      Object.keys(permissions).forEach(k => { permissions[k] = true; });
    }

    await updateRolePermissions(roleId, permissions);
    setSaving(null);
    loadRoles();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3"
    >
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-4">
        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-amber-800">
          Los administradores siempre tienen todos los permisos. Los demás roles pueden ser personalizados.
          Haz clic en un rol para expandir y editar sus permisos.
        </p>
      </div>

      {roles.map(role => {
        const isExpanded = expandedRole === role._id;
        const isSystem = role.code === 'ADMIN';
        const permCount = Object.keys(PERMISSION_LABELS).filter(k =>
          (role as any)[k] === 'TRUE' || (role as any)[k] === true
        ).length;

        return (
          <div key={role._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Role header */}
            <button
              onClick={() => setExpandedRole(isExpanded ? null : role._id)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                <div className="text-left">
                  <p className="font-bold text-gray-900">{role.name} <span className="text-gray-400 font-normal text-sm">({role.code})</span></p>
                  <p className="text-xs text-gray-500">{permCount}/{Object.keys(PERMISSION_LABELS).length} permisos activos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSystem && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg uppercase">Sistema</span>
                )}
                {isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
              </div>
            </button>

            {/* Expanded permissions */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                        const isEnabled = (role as any)[key] === 'TRUE' || (role as any)[key] === true;
                        return (
                          <button
                            key={key}
                            onClick={() => !isSystem && handleTogglePermission(role._id, key)}
                            disabled={isSystem}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                              isEnabled
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            } ${isSystem ? 'opacity-75 cursor-default' : 'hover:border-gray-300 cursor-pointer'}`}
                          >
                            <span className={`text-sm font-medium ${isEnabled ? 'text-green-800' : 'text-gray-500'}`}>
                              {label}
                            </span>
                            {isEnabled ? (
                              <Check size={16} className="text-green-600 shrink-0" />
                            ) : (
                              <X size={16} className="text-gray-300 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {!isSystem && (
                      <button
                        onClick={() => handleSaveRole(role._id)}
                        disabled={saving === role._id}
                        className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {saving === role._id ? (
                          <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                        ) : (
                          <>Guardar permisos</>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.div>
  );
};
