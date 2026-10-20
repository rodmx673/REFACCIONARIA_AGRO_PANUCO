import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, X, AlertCircle } from 'lucide-react';
import { Customer } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { NewCustomerModal } from './NewCustomerModal';
import { toast } from 'sonner';

const URL = import.meta.env.VITE_APPS_SCRIPT_URL;

async function callApi(action: string, data: any = {}) {
  const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, data }) });
  return res.json();
}

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);

  const loadCustomers = async () => {
    try {
      const res = await callApi('getCustomers');
      if (res.success) setCustomers(res.data || []);
    } catch (e) {
      // Silencioso: Code.gs aún no tiene getCustomers
      setCustomers([]);
    }
  };

  useEffect(() => { loadCustomers(); }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.rfc && c.rfc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async (customer: Customer) => {
    try {
      await callApi('deleteCustomer', { id: customer.id });
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      setDeleteConfirm(null);
      toast.success('Cliente eliminado');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre o RFC..." className="w-full pl-12 pr-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100 outline-none focus:border-primary" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <button onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg hover:opacity-90">
          <Plus size={20} /> Nuevo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <motion.div layout key={customer.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400"><Users size={24} /></div>
                <div>
                  <h3 className="font-bold text-gray-900">{customer.name}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase">{customer.rfc}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-500"><Mail size={16} /><span className="truncate">{customer.email}</span></div>
              <div className="flex items-center gap-3 text-sm text-gray-500"><Phone size={16} /><span>{customer.phone}</span></div>
              <div className="flex items-center gap-3 text-sm text-gray-500"><MapPin size={16} /><span>{customer.address?.city}</span></div>
            </div>
            <div className="pt-4 border-t border-gray-50 flex justify-between">
              <div><p className="text-[10px] font-bold text-gray-400 uppercase">Saldo</p><p className="text-lg font-black text-primary">{formatCurrency(customer.balance)}</p></div>
              <div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase">Crédito</p><p className="text-sm font-bold">{formatCurrency(customer.creditLimit)}</p></div>
            </div>
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }} className="p-2 bg-white shadow-lg border text-gray-400 hover:text-primary rounded-xl"><Edit2 size={16} /></button>
              <button onClick={() => setDeleteConfirm(customer)} className="p-2 bg-white shadow-lg border text-gray-400 hover:text-red-500 rounded-xl"><Trash2 size={16} /></button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
              <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-bold mb-2">¿Eliminar cliente?</h3>
              <p className="text-xs text-gray-500 mb-6">Se eliminará a {deleteConfirm.name}. No se puede deshacer.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-bold text-xs">Cancelar</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs">Eliminar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <NewCustomerModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCustomer(null); loadCustomers(); }} customerToEdit={editingCustomer} title={editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'} />
    </div>
  );
};