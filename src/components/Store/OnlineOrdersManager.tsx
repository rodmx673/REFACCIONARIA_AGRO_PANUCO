import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Printer, 
  ExternalLink,
  DollarSign,
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus } from '../../types';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';

export const OnlineOrdersManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newTracking, setNewTracking] = useState('');
  const [newCarrier, setNewCarrier] = useState('FedEx Express');

  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(fetched);
      setLoading(false);
    }, (err) => {
      console.warn('Orders listener error:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    try {
      const updatePayload: any = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      if (newStatus === 'SHIPPED' && newTracking.trim()) {
        updatePayload.trackingNumber = newTracking.trim();
        updatePayload.carrier = newCarrier;
      }

      await updateDoc(doc(db, 'orders', orderId), updatePayload);
      toast.success(`Pedido actualizado a: ${newStatus}`);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, ...updatePayload });
      }
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('No se pudo actualizar el estado del pedido');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchEmail = o.customerEmail.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchEmail) return false;
    }
    return true;
  });

  const totalOnlineRevenue = orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.total : 0), 0);
  const pendingCount = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length;

  return (
    <div className="space-y-6">
      {/* Top Bar / Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Package className="text-emerald-700" size={26} />
            <span>Gestión de Pedidos E-Commerce</span>
          </h1>
          <p className="text-xs text-gray-500">
            Control y despacho de pedidos realizados desde la tienda online por agricultores y talleres.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Ingresos Online</span>
            <span className="text-base font-black text-emerald-950">${totalOnlineRevenue.toLocaleString()} MXN</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Por Despachar</span>
            <span className="text-base font-black text-amber-950">{pendingCount} pedidos</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por folio (ej. FP-2026), cliente o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
          {['ALL', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st === 'ALL' ? 'Todos' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400">Cargando pedidos en tiempo real...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Package size={36} className="text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-900">No hay pedidos con este filtro</h4>
            <p className="text-xs text-gray-400">Los nuevos pedidos de la tienda online aparecerán aquí automáticamente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Folio / Fecha</th>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Artículos</th>
                  <th className="px-5 py-3.5">Total</th>
                  <th className="px-5 py-3.5">Pago</th>
                  <th className="px-5 py-3.5">Estatus</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-gray-900 block">{order.orderNumber}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-bold text-gray-900 block">{order.customerName}</span>
                      <span className="text-[11px] text-gray-500">{order.customerEmail}</span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-gray-900 block">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} piezas
                      </span>
                      <span className="text-[10px] text-gray-400 line-clamp-1">
                        {order.items.map(i => i.description).join(', ')}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-extrabold text-emerald-950 font-mono">
                        ${order.total.toLocaleString()} MXN
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-semibold text-gray-700 block">{order.paymentMethod}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {order.paymentStatus === 'PAID' ? 'Liquidado' : 'Pendiente'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'PROCESSING' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 rounded-xl font-bold text-[11px] transition-colors"
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]"
            >
              {/* Header */}
              <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-emerald-950 text-white">
                <div>
                  <span className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">Detalle del Pedido</span>
                  <h3 className="text-lg font-black">{selectedOrder.orderNumber}</h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
                {/* Status Update Card */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">Actualizar Estado del Pedido:</span>
                    <span className="font-bold text-emerald-800">Actual: {selectedOrder.status}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map((st) => (
                      <button
                        key={st}
                        disabled={isUpdatingStatus || selectedOrder.status === st}
                        onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-colors ${
                          selectedOrder.status === st
                            ? 'bg-emerald-800 text-white'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {selectedOrder.status !== 'SHIPPED' && selectedOrder.status !== 'DELIVERED' && (
                    <div className="pt-2 border-t border-gray-200 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Paquetería</label>
                        <select
                          value={newCarrier}
                          onChange={(e) => setNewCarrier(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg"
                        >
                          <option value="FedEx Express">FedEx Express</option>
                          <option value="Estafeta Terrestre">Estafeta Terrestre</option>
                          <option value="Paquetexpress">Paquetexpress</option>
                          <option value="DHL Express">DHL Express</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Número de Guía</label>
                        <input
                          type="text"
                          placeholder="Ej. 789123456789"
                          value={newTracking}
                          onChange={(e) => setNewTracking(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer and Shipping Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-white rounded-2xl border border-gray-200 space-y-1.5">
                    <span className="font-bold text-gray-900 block">Datos del Cliente</span>
                    <p className="text-gray-700 font-semibold">{selectedOrder.customerName}</p>
                    <p className="text-gray-500">{selectedOrder.customerEmail}</p>
                    <p className="text-gray-500">Tel: {selectedOrder.customerPhone}</p>
                    {selectedOrder.shippingAddress.rfc && (
                      <p className="text-emerald-800 font-mono font-bold">RFC: {selectedOrder.shippingAddress.rfc}</p>
                    )}
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border border-gray-200 space-y-1.5">
                    <span className="font-bold text-gray-900 block">Destino de Entrega</span>
                    <p className="text-gray-700">{selectedOrder.shippingAddress.street} #{selectedOrder.shippingAddress.number}</p>
                    <p className="text-gray-500">{selectedOrder.shippingAddress.colony}, C.P. {selectedOrder.shippingAddress.zipCode}</p>
                    <p className="text-gray-500">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                    {selectedOrder.shippingAddress.references && (
                      <p className="text-gray-400 italic">Ref: {selectedOrder.shippingAddress.references}</p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-2">
                  <span className="font-bold text-gray-900 block">Artículos Solicitados</span>
                  <div className="divide-y divide-gray-100">
                    {selectedOrder.items.map((it, idx) => (
                      <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-emerald-800">{it.pieceNumber}</span>
                          <p className="text-gray-800 font-medium">{it.description}</p>
                          <span className="text-gray-400 text-[11px]">{it.quantity} unidades x ${it.unitPrice.toLocaleString()}</span>
                        </div>
                        <span className="font-extrabold text-gray-900 font-mono">${it.subtotal.toLocaleString()} MXN</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-gray-200 space-y-1 text-right">
                    <p className="text-gray-500">Subtotal: ${selectedOrder.subtotal.toLocaleString()} MXN</p>
                    {selectedOrder.discount > 0 && <p className="text-emerald-700">Descuento: -${selectedOrder.discount.toLocaleString()} MXN</p>}
                    <p className="text-gray-500">IVA 16%: ${selectedOrder.tax.toLocaleString(undefined, { maximumFractionDigits: 2 })} MXN</p>
                    <p className="text-gray-500">Envío: ${selectedOrder.shippingCost.toLocaleString()} MXN</p>
                    <p className="text-sm font-black text-gray-900 pt-1 border-t border-gray-100">
                      Total: ${selectedOrder.total.toLocaleString(undefined, { maximumFractionDigits: 2 })} MXN
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer size={15} />
                  <span>Imprimir Orden de Surtido</span>
                </button>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 bg-emerald-800 text-white rounded-xl font-bold text-xs"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
