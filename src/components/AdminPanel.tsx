import React, { useState, useEffect, useContext } from 'react';
import { Shield, Key, Users, Plus, Copy, Trash2, RefreshCw, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthContext } from './Auth';
import { toast } from 'sonner';
import { getRoleBadgeStyle, PERMISSION_DEFINITIONS, DEFAULT_POSITIONS } from '../lib/permissions';
import { RolePermissions } from '../types';

const ROLES = ['ADMIN', 'GERENTE', 'CLERK', 'VENTAS', 'BODEGA'];
const URL = import.meta.env.VITE_APPS_SCRIPT_URL;

async function callApi(action: string, data: any = {}) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, data })
  });
  return res.json();
}

export const AdminPanel: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState<'users' | 'codes'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  
  const [codeRole, setCodeRole] = useState('VENTAS');
  const [codeHours, setCodeHours] = useState(72);
  const [selectedPermissions, setSelectedPermissions] = useState<RolePermissions | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  // Cargar los permisos por defecto al cambiar el rol (o abrir modal)
  useEffect(() => {
    const defaultPerms = DEFAULT_POSITIONS.find(p => p.code === codeRole)?.permissions;
    if (defaultPerms) setSelectedPermissions({ ...defaultPerms });
  }, [codeRole, showCodeModal]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [u, c] = await Promise.all([callApi('getUsers'), callApi('getCodes')]);
      if (u.success) setUsers(u.data || []);
      if (c.success) setCodes(c.data || []);
    } catch (e) { toast.error('Error al cargar datos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const handleGenerateCode = async () => {
    try {
      const res = await callApi('generateCode', {
        role: codeRole,
        adminEmail: user?.email || 'admin',
        expiresInHours: codeHours,
        customPermissions: selectedPermissions
      });
      if (res.success) {
        setGeneratedCode(res.data.code);
        toast.success(`Código generado para ${codeRole}`);
        loadAll();
      } else throw new Error(res.error);
    } catch (e: any) { toast.error(e.message || 'Error al generar código'); }
  };

  const togglePermission = (key: keyof RolePermissions) => {
    if (!selectedPermissions) return;
    setSelectedPermissions({ ...selectedPermissions, [key]: !selectedPermissions[key] });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Código copiado: ${code}`);
  };

  const handleChangeRole = async (email: string, newRole: string) => {
    try {
      const res = await callApi('updateUser', { userId: email, role: newRole });
      if (res.success) { toast.success('Rol actualizado'); loadAll(); }
    } catch (e) { toast.error('Error al actualizar'); }
  };

  const handleDeactivate = async (email: string) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    try {
      const res = await callApi('deleteUser', { userId: email });
      if (res.success) { toast.success('Usuario desactivado'); loadAll(); }
    } catch (e) { toast.error('Error'); }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center">
        <XCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Acceso Restringido</h2>
        <p className="text-gray-500">Solo administradores pueden ver esta sección.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-primary" size={28} /> Gestión de Usuarios
          </h1>
          <p className="text-sm text-gray-500">Administra roles, permisos y genera códigos de acceso</p>
        </div>
        <button onClick={loadAll} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl" title="Recargar">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('users')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'users' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>
          <Users size={16} className="inline mr-2" /> Usuarios
        </button>
        <button onClick={() => setTab('codes')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'codes' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>
          <Key size={16} className="inline mr-2" /> Códigos de Registro
        </button>
      </div>

      {tab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol Base</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => {
                const badge = getRoleBadgeStyle(u.role);
                return (
                  <tr key={u._id || u.email} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900">{u.name || u.email}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select value={u.role} onChange={(e) => handleChangeRole(u.email, e.target.value)} className={`px-2 py-1 rounded-lg text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isActive === 'TRUE' || u.isActive === true ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.isActive === 'TRUE' || u.isActive === true ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeactivate(u.email)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Desactivar">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && !loading && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Sin usuarios aún</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'codes' && (
        <div className="space-y-4">
          <button onClick={() => { setShowCodeModal(true); setGeneratedCode(null); setCodeRole('VENTAS'); }} className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:opacity-90">
            <Plus size={18} /> Generar Nuevo Código
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Usado por</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {codes.map(c => (
                  <tr key={c._id}>
                    <td className="px-4 py-3 font-mono font-bold text-primary">{c.code}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-bold">{c.role}</span></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.status === 'ACTIVE' ? 'Activo' : 'Usado'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.usedBy || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => copyCode(c.code)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg" title="Copiar"><Copy size={16} /></button>
                    </td>
                  </tr>
                ))}
                {codes.length === 0 && !loading && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Sin códigos generados</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCodeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
              <h3 className="text-lg font-bold mb-4">Generar Código de Registro</h3>
              
              {!generatedCode ? (
                <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Rol del nuevo usuario</label>
                      <select value={codeRole} onChange={(e) => setCodeRole(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-50 border rounded-xl font-bold">
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Vigencia</label>
                      <select value={codeHours} onChange={(e) => setCodeHours(Number(e.target.value))} className="w-full mt-1 px-3 py-2 bg-gray-50 border rounded-xl">
                        <option value={24}>24 horas</option>
                        <option value={72}>3 días</option>
                        <option value={168}>7 días</option>
                        <option value={720}>30 días</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-1">
                      <Lock size={14} /> Permisos y Privilegios (Personalizables)
                    </label>
                    <p className="text-xs text-gray-400 mb-3">Estos son los permisos que tendrá el empleado al registrarse.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PERMISSION_DEFINITIONS.map(perm => {
                        const isChecked = selectedPermissions ? selectedPermissions[perm.key] : false;
                        return (
                          <label key={perm.key} className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-primary/5 border-primary/30' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                            <input type="checkbox" checked={isChecked} onChange={() => togglePermission(perm.key)} className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-gray-800">{perm.label}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100 mt-4">
                    <button onClick={() => setShowCodeModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm">Cancelar</button>
                    <button onClick={handleGenerateCode} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm">Generar Código</button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 py-4">
                  <CheckCircle2 size={48} className="mx-auto text-green-500" />
                  <p className="text-sm text-gray-600">Código generado para <strong>{codeRole}</strong> con permisos personalizados:</p>
                  <div className="text-2xl font-mono font-bold text-primary bg-primary/10 rounded-xl p-3">{generatedCode}</div>
                  <button onClick={() => copyCode(generatedCode)} className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                    <Copy size={16} /> Copiar Código
                  </button>
                  <button onClick={() => setShowCodeModal(false)} className="w-full py-2 text-gray-500 text-sm font-bold">Cerrar</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};