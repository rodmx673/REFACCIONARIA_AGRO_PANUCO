import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard,
  X,
  Save,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Customer } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { NewCustomerModal } from './NewCustomerModal';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'customers'), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'customers');
    });
    return () => unsub();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.rfc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.phone && c.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async (customer: Customer) => {
    try {
      await deleteDoc(doc(db, 'customers', customer.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      handleFirestoreError(error, OperationType.DELETE, 'customers');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, RFC, email..." 
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100 outline-none focus:border-primary transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            setEditingCustomer(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <motion.div
            layout
            key={customer.id}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all group relative"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{customer.name}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{customer.rfc}</p>
                </div>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                customer.status === 'ACTIVO' ? "bg-green-100 text-green-600" : 
                customer.status === 'MOROSO' ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
              )}>
                {customer.status}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Mail size={16} className="shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Phone size={16} className="shrink-0" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <MapPin size={16} className="shrink-0" />
                <span className="truncate">{customer.address.city}, {customer.address.state}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saldo Actual</p>
                <p className="text-lg font-black text-primary">{formatCurrency(customer.balance)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Crédito</p>
                <p className="text-sm font-bold text-gray-700">{formatCurrency(customer.creditLimit)}</p>
              </div>
            </div>

            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => {
                  setEditingCustomer(customer);
                  setIsModalOpen(true);
                }}
                className="p-2 bg-white shadow-lg border border-gray-100 text-gray-400 hover:text-primary rounded-xl transition-all"
                title="Editar cliente"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => setDeleteConfirm(customer)}
                className="p-2 bg-white shadow-lg border border-gray-100 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                title="Eliminar cliente"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center border border-gray-100"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar cliente?</h3>
              <p className="text-xs text-gray-500 mb-6">
                Se eliminará el registro de <span className="font-bold text-gray-800">{deleteConfirm.name}</span>. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-red-600/20 hover:opacity-90 active:scale-95 transition-all"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer Form Modal */}
      <NewCustomerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        customerToEdit={editingCustomer}
        title={editingCustomer ? 'Editar Cliente Agrícola' : 'Nuevo Cliente Agrícola'}
      />
    </div>
  );
};
