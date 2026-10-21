import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  Heart, 
  CreditCard, 
  MapPin, 
  Truck, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ExternalLink,
  ShoppingCart,
  Trash2,
  Calendar,
  Building2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from './StoreContext';
import { Order, Product } from '../../types';


import { toast } from 'sonner';

interface CustomerPortalProps {
  products: Product[];
  onClose: () => void;
  onSelectProduct: (p: Product) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  products,
  onClose,
  onSelectProduct
}) => {
  const { 
    clientEmail, 
    setClientEmail, 
    wishlist, 
    toggleWishlist, 
    addToCart,
    refreshClientOrders
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'credit' | 'addresses'>('orders');
  const [emailInput, setEmailInput] = useState(clientEmail || 'cliente@farmerparts.mx');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Fetch orders when email changes
  useEffect(() => {
    if (!emailInput.trim()) return;
    setLoadingOrders(true);

    // Firebase eliminado
    // Firebase eliminado

    
  }, [emailInput]);

  const handleSearchEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes('@')) {
      toast.error('Ingresa un correo electrónico válido');
      return;
    }
    setClientEmail(emailInput.trim().toLowerCase());
    refreshClientOrders(emailInput.trim().toLowerCase());
    toast.success(`Consultando pedidos para ${emailInput}`);
  };

  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-emerald-300 flex items-center justify-center font-bold">
              <Package size={17} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight">Portal del Cliente Farmer Parts</h2>
              <p className="text-[11px] text-emerald-300">Seguimiento de pedidos, lista de deseos y crédito</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Email Lookup Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <form onSubmit={handleSearchEmail} className="flex flex-col sm:flex-row items-center gap-2.5 max-w-xl">
            <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Correo de Pedidos:</span>
            <div className="flex-1 w-full relative">
              <input
                type="email"
                required
                placeholder="ejemplo@rancho.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors w-full sm:w-auto"
            >
              Consultar
            </button>
          </form>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-gray-200 flex gap-6 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <Package size={15} />
            <span>Mis Pedidos ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'wishlist'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <Heart size={15} />
            <span>Lista de Deseos ({wishlist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('credit')}
            className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'credit'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <CreditCard size={15} />
            <span>Crédito Agrícola</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'addresses'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <MapPin size={15} />
            <span>Direcciones Registradas</span>
          </button>
        </div>

        {/* Portal Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {loadingOrders ? (
                <div className="py-12 text-center text-xs text-gray-400">Cargando tus pedidos en tiempo real...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                    <Package size={28} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">No se encontraron pedidos</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    No encontramos compras asociadas al correo <strong>{emailInput}</strong>. Realiza un pedido en nuestra tienda online para darle seguimiento aquí.
                  </p>
                </div>
              ) : (
                orders.map((ord) => (
                  <div key={ord.id} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4 shadow-xs">
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-gray-900">{ord.orderNumber}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Fecha: {new Date(ord.createdAt).toLocaleDateString()} a las {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-emerald-950">${ord.total.toLocaleString()} MXN</span>
                        <p className="text-[11px] text-gray-500 font-medium">Pago: {ord.paymentMethod}</p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between text-center text-[10px] sm:text-xs font-bold text-gray-600">
                        <div className="flex flex-col items-center gap-1 text-emerald-800">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          <span>Pedido Recibido</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-emerald-400 mx-2" />

                        <div className="flex flex-col items-center gap-1 text-emerald-800">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          <span>En Preparación</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-gray-200 mx-2" />

                        <div className="flex flex-col items-center gap-1 text-gray-400">
                          <Truck size={16} />
                          <span>En Camino</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-gray-200 mx-2" />

                        <div className="flex flex-col items-center gap-1 text-gray-400">
                          <Package size={16} />
                          <span>Entregado</span>
                        </div>
                      </div>

                      {ord.trackingNumber && (
                        <div className="mt-3 pt-2.5 border-t border-gray-200/70 flex flex-wrap items-center justify-between text-xs text-gray-600">
                          <span>Paquetería: <strong>{ord.carrier || 'FedEx'}</strong></span>
                          <span>Guía de rastreo: <strong className="font-mono text-emerald-800">{ord.trackingNumber}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-gray-700">Artículos incluidos:</span>
                      <div className="divide-y divide-gray-100">
                        {ord.items.map((item, i) => (
                          <div key={i} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {item.pieceNumber}
                              </span>
                              <span className="text-gray-800 font-medium">{item.quantity}x {item.description}</span>
                            </div>
                            <span className="font-bold text-gray-900">${item.subtotal.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              {wishlistedProducts.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                    <Heart size={28} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Tu lista de deseos está vacía</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Haz clic en el icono de corazón en las refacciones que necesites para guardarlas y comprarlas más tarde.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistedProducts.map(p => (
                    <div key={p.id} className="p-4 bg-white rounded-2xl border border-gray-200 flex gap-3.5 items-center justify-between shadow-xs">
                      <img
                        src={p.imageUrl || 'https://picsum.photos/seed/part/80/80'}
                        alt={p.description}
                        className="w-16 h-16 object-cover rounded-xl bg-gray-50 shrink-0 border border-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                          {p.pieceNumber}
                        </span>
                        <h4 className="text-xs font-bold text-gray-900 truncate mt-1">{p.description}</h4>
                        <span className="text-xs font-extrabold text-emerald-950 mt-1 block">
                          ${p.salePrice.toLocaleString()} MXN
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            addToCart(p, 1);
                            toggleWishlist(p.id);
                          }}
                          className="p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors"
                          title="Mover al Carrito"
                        >
                          <ShoppingCart size={15} />
                        </button>
                        <button
                          onClick={() => toggleWishlist(p.id)}
                          className="p-2 text-gray-400 hover:text-rose-600 rounded-xl transition-colors"
                          title="Quitar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CREDIT */}
          {activeTab === 'credit' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-6 rounded-3xl shadow-lg space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest">Línea de Crédito Agrícola Farmer Parts</span>
                    <h3 className="text-xl font-black mt-1">Convenio de Refacciones de Campo</h3>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                    ACTIVO
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-emerald-800/80">
                  <div>
                    <span className="text-[11px] text-emerald-200">Límite Aprobado:</span>
                    <p className="text-lg font-black text-white">$50,000 MXN</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-200">Saldo Ejercido:</span>
                    <p className="text-lg font-black text-amber-300">$12,500 MXN</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-200">Crédito Disponible:</span>
                    <p className="text-lg font-black text-emerald-400">$37,500 MXN</p>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-200/80 leading-snug">
                  Plazo estándar de 30 días para liquidación de facturas con 5% de descuento adicional por pago puntual.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-2">
                <span className="font-bold text-gray-900 block">¿Deseas solicitar incremento de crédito?</span>
                <p className="text-gray-600">
                  Comunícate con nuestro departamento de crédito y cobranza con tu RFC y constancia de situación fiscal para ampliar tu línea hasta $150,000 MXN.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">Rancho Principal (Predeterminada)</span>
                    <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">Principal</span>
                  </div>
                  <p className="text-gray-700">Carretera Querétaro - Celaya KM 15, Ejido San Isidro</p>
                  <p className="text-gray-500">C.P. 76000 • Querétaro, QRO</p>
                  <p className="text-[11px] text-gray-500">Ref: Frente al silo azul / Portón verde</p>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">Taller Mecánico El Bajío</span>
                  </div>
                  <p className="text-gray-700">Av. Tecnológico #450, Col. Industrial</p>
                  <p className="text-gray-500">C.P. 76150 • Querétaro, QRO</p>
                  <p className="text-[11px] text-gray-500">Ref: Nave 4 frente al banco</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
