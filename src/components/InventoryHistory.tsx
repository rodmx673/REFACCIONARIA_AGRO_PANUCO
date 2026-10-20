import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Settings2,
  Calendar,
  X,
  Download,
  Package,
  User,
  FileText
} from 'lucide-react';


import { InventoryMovement, Product, User as UserType } from '../types';
import { cn, formatDate, formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

interface InventoryHistoryProps {
  onClose: () => void;
}

export const InventoryHistory: React.FC<InventoryHistoryProps> = ({ onClose }) => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [users, setUsers] = useState<Record<string, UserType>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT' | 'ADJ'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Fetch products for reference
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productMap: Record<string, Product> = {};
      snapshot.docs.forEach(doc => {
        productMap[doc.id] = { id: doc.id, ...doc.data() } as Product;
      });
      setProducts(productMap);
    });

    // Fetch users for reference
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userMap: Record<string, UserType> = {};
      snapshot.docs.forEach(doc => {
        userMap[doc.id] = { id: doc.id, ...doc.data() } as UserType;
      });
      setUsers(userMap);
    });

    // Fetch movements
    const q = query(collection(db, 'inventoryMovements'), orderBy('timestamp', 'desc'));
    const unsubMovements = onSnapshot(q, (snapshot) => {
      setMovements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryMovement)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'inventoryMovements');
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubUsers();
      unsubMovements();
    };
  }, []);

  const filteredMovements = movements.filter(m => {
    const product = products[m.productId];
    const matchesSearch = !searchTerm || 
      (product?.pieceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product?.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.invoiceReference && m.invoiceReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product?.invoiceReference && product.invoiceReference.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'ALL' || m.type === typeFilter;
    
    const movementDate = new Date(m.timestamp).toISOString().split('T')[0];
    const matchesStartDate = !startDate || movementDate >= startDate;
    const matchesEndDate = !endDate || movementDate <= endDate;

    return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
  });

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'IN': return 'bg-green-100 text-green-700 border-green-200';
      case 'OUT': return 'bg-red-100 text-red-700 border-red-200';
      case 'ADJ': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IN': return <ArrowDownLeft size={14} />;
      case 'OUT': return <ArrowUpRight size={14} />;
      case 'ADJ': return <Settings2 size={14} />;
      default: return null;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'IN': return 'Entrada';
      case 'OUT': return 'Salida';
      case 'ADJ': return 'Ajuste';
      default: return type;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-full max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-12rem)]"
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner shrink-0">
            <History size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-gray-900 truncate">Historial</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Stock</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="p-2 text-gray-400 hover:bg-white rounded-xl transition-all"
            title="Exportar CSV"
          >
            <Download size={20} />
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-white rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 sm:p-6 border-b border-gray-50 bg-white space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative sm:col-span-2">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium text-sm appearance-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
            >
              <option value="ALL">Todos</option>
              <option value="IN">Entradas</option>
              <option value="OUT">Salidas</option>
              <option value="ADJ">Ajustes</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="date" 
                className="w-full pl-9 pr-1 py-2.5 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium text-[10px]"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="relative flex-1">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="date" 
                className="w-full pl-9 pr-1 py-2.5 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium text-[10px]"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-gray-500 font-medium">Cargando historial...</p>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
            <History size={48} strokeWidth={1} />
            <p className="font-medium text-sm">No se encontraron movimientos</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha y Hora</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Cant.</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Motivo</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMovements.map(movement => {
                const product = products[movement.productId];
                const user = users[movement.userId];
                return (
                  <tr key={movement.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-gray-900">{formatDate(movement.timestamp).split(' ')[0]}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{formatDate(movement.timestamp).split(' ')[1]}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border",
                        getTypeStyles(movement.type)
                      )}>
                        {getTypeIcon(movement.type)}
                        {getTypeName(movement.type)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Package size={16} className="text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {product?.pieceNumber || 'N/A'}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate max-w-[150px]">
                            {product?.description || 'Producto eliminado'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "text-sm font-black",
                        movement.type === 'IN' ? "text-green-600" : movement.type === 'OUT' ? "text-red-600" : "text-amber-600"
                      )}>
                        {movement.type === 'OUT' ? '-' : '+'}{movement.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-600 italic line-clamp-1" title={movement.reason}>
                        {movement.reason || 'Sin motivo especificado'}
                      </p>
                      {(movement.invoiceReference || product?.invoiceReference) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 mt-1" title={`Factura vinculada: ${movement.invoiceReference || product?.invoiceReference}`}>
                          <FileText size={10} className="text-emerald-600 shrink-0" />
                          Fac: {movement.invoiceReference || product?.invoiceReference}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {user?.email ? (
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Avatar" />
                          ) : (
                            <User size={12} className="text-gray-400" />
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 truncate max-w-[80px]">
                          {user?.name || 'Sistema'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Summary */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          Mostrando {filteredMovements.length} movimientos
        </p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">Entradas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">Salidas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">Ajustes</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
