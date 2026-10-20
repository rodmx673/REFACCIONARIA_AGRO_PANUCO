import React, { useState, useEffect } from 'react';
import { Shield, Key, Users, Plus, Copy, CheckCircle2, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles] = useState(['ADMIN', 'GERENTE', 'CLERK', 'VENTAS', 'BODEGA']);
  const [selectedRole, setSelectedRole] = useState('CLERK');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

  const loadUsers = async () => {
    try {
      const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getUsers', data: {} }) });
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
    } catch (e) {
      console.warn("Error cargando usuarios");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'generateCode', 
          data: { role: selectedRole, adminEmail: 'admin@farmerparts.com' } 
        })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedCode(data.data.code);
        toast.success(`Código generado para ${selectedRole}`);
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Código copiado al portapapeles");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Shield className="text-primary" /> Panel de Administración
        </h2>
        <p className="text-gray-500 mt-1">Genera códigos de acceso y administra a tu personal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generador de Códigos */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Key className="text-amber-500" size={20} />
            <h3 className="font-bold text-gray-900">Generar Código de Registro</h3>
          </div>
          <p className="text-xs text-gray-500">Selecciona el rol y genera un código único. El empleado usará este código para registrarse en la app.</p>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Rol a asignar</label>
            <select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold text-gray-700"
            >
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button 
            onClick={handleGenerateCode} 
            disabled={loading}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Generando...' : <><Plus size={18} /> Generar Código</>}
          </button>

          {generatedCode && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <p className="text-xs font-bold text-emerald-700">CÓDIGO GENERADO</p>
              <div className="text-2xl font-black font-mono text-emerald-900 tracking-widest">{generatedCode}</div>
              <button onClick={() => copyToClipboard(generatedCode)} className="text-xs text-emerald-700 flex items-center justify-center gap-1 hover:underline w-full font-bold">
                <Copy size={14} /> Copiar Código
              </button>
            </motion.div>
          )}
        </div>

        {/* Lista de Usuarios */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="text-blue-500" size={20} />
              <h3 className="font-bold text-gray-900">Usuarios Registrados</h3>
            </div>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">{users.length} Usuarios</span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {users.length === 0 ? (
              <p className="text-xs text-center text-gray-400 py-6">No hay usuarios registrados.</p>
            ) : (
              users.map((u, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {u.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-white border border-gray-200 text-[10px] font-black text-gray-600 rounded-md uppercase">
                    {u.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};