import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, X, Save, Globe, Building2 
} from 'lucide-react';
import { Vendor } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<Partial<Vendor>>({
    name: '',
    type: 'NACIONAL',
    rfc: '',
    address: '',
    email: '',
    phone: '',
    contact: '',
    leadTime: 7,
    rating: 5
  });

  const loadVendors = async () => {
    try {
      const url = import.meta.env.VITE_APPS_SCRIPT_URL;
      if (!url) return;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getVendors', data: {} })
      });
      const data = await res.json();
      if (data.success) setVendors(data.data || []);
    } catch (error) {
      console.error("Error loading vendors:", error);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = import.meta.env.VITE_APPS_SCRIPT_URL;
      if (!url) return;

      const action = editingVendor ? 'updateVendor' : 'createVendor';
      const payload = editingVendor ? { ...formData, id: editingVendor.id } : formData;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, data: payload })
      });
      const data = await res.json();
      
      if (!data.success) throw new Error(data.error || 'Error guardando proveedor');
      
      toast.success(editingVendor ? 'Proveedor actualizado' : 'Proveedor creado');
      loadVendors();
      setIsModalOpen(false);
      setEditingVendor(null);
      setFormData({
        name: '', type: 'NACIONAL', rfc: '', address: '', email: '',
        phone: '', contact: '', leadTime: 7, rating: 5
      });
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast.error('Error al guardar el proveedor');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
      try {
        const url = import.meta.env.VITE_APPS_SCRIPT_URL;
        if (!url) return;
        
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'deleteVendor', data: { id } })
        });
        const data = await res.json();
        
        if (!data.success) throw new Error(data.error);
        
        toast.success('Proveedor eliminado');
        loadVendors();
      } catch (error) {
        console.error('Error deleting vendor:', error);
        toast.error('Error al eliminar proveedor');
      }
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData(vendor);
    setIsModalOpen(true);
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.rfc && v.rfc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar proveedores..." 
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100 outline-none focus:border-primary transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            setEditingVendor(null);
            setFormData({ name: '', type: 'NACIONAL', rfc: '', address: '', email: '', phone: '', contact: '', leadTime: 7, rating: 5 });
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
        >
          <Plus size={20} />
          Nuevo Proveedor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map(vendor => (
          <motion.div layout key={vendor.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all group relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                  {vendor.type === 'NACIONAL' ? <Building2 size={24} /> : <Globe size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{vendor.name}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{vendor.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(vendor)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(vendor.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-500"><Mail size={16} className="shrink-0" /><span className="truncate">{vendor.email}</span></div>
              <div className="flex items-center gap-3 text-sm text-gray-500"><Phone size={16} className="shrink-0" /><span>{vendor.phone}</span></div>
              <div className="flex items-center gap-3 text-sm text-gray-500"><MapPin size={16} className="shrink-0" /><span className="truncate">{vendor.address}</span></div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contacto</p>
                <p className="text-sm font-bold text-gray-700">{vendor.contact}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lead Time</p>
                <p className="text-sm font-bold text-gray-700">{vendor.leadTime} días</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">{editingVendor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-white rounded-xl transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre de la Empresa</label>
                    <input required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo</label>
                    <select className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-medium" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                      <option value="NACIONAL">Nacional</option>
                      <option value="INTERNACIONAL">Internacional</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">RFC / Tax ID</label>
                    <input required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-medium" value={formData.rfc} onChange={e => setFormData({...formData, rfc: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contacto Principal</label>
                    <input required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-medium" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                    <input required type="email" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Teléfono</label>
                    <input required type="tel" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-medium" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dirección</label>
                    <input required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-medium" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lead Time (Días)</label>
                    <input required type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-medium" value={formData.leadTime} onChange={e => setFormData({...formData, leadTime: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Calificación (1-5)</label>
                    <input required type="number" min="1" max="5" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-all font-medium" value={formData.rating} onChange={e => setFormData({...formData, rating: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all">Cancelar</button>
                  <button type="submit" className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    <Save size={20} />
                    {editingVendor ? 'Guardar Cambios' : 'Crear Proveedor'}
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