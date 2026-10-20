import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Tag, 
  Truck, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  MapPin,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from './StoreContext';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    subtotal,
    tax,
    discountAmount,
    shippingCost,
    total,
    shippingMethod,
    setShippingMethod,
    postalCode,
    setPostalCode
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showCpInput, setShowCpInput] = useState(false);
  const [tempCp, setTempCp] = useState(postalCode);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    await applyCoupon(couponInput);
    setIsApplyingCoupon(false);
    setCouponInput('');
  };

  const handleSaveCp = () => {
    if (tempCp.length === 5) {
      setPostalCode(tempCp);
      setShowCpInput(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Carrito de Compra</h2>
                    <p className="text-xs text-gray-500">
                      {cart.length === 0 ? 'Sin artículos' : `${cart.reduce((s, i) => s + i.quantity, 0)} piezas seleccionadas`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-gray-400 hover:text-rose-600 transition-colors px-2 py-1"
                    >
                      Vaciar
                    </button>
                  )}
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Free Shipping Progress Indicator */}
              {cart.length > 0 && (
                <div className="bg-emerald-50/80 px-4 py-2.5 border-b border-emerald-100 text-xs">
                  {subtotal >= 3500 ? (
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                      <Sparkles size={14} className="text-amber-500 shrink-0" />
                      <span>¡Felicidades! Tienes <strong>Envío Estándar GRATIS</strong></span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between text-emerald-900 font-medium">
                        <span>Faltan ${(3500 - subtotal).toLocaleString()} MXN para Envío Gratis</span>
                        <span>{Math.round((subtotal / 3500) * 100)}%</span>
                      </div>
                      <div className="w-full bg-emerald-200/60 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (subtotal / 3500) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-gray-100">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <ShoppingBag size={40} className="stroke-[1.5]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Tu carrito está vacío</h3>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs">
                        Explora nuestro catálogo de bombas de agua, filtros, discos de freno y alternadores para maquinaria agrícola.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                    >
                      Ver Catálogo de Refacciones
                    </button>
                  </div>
                ) : (
                  cart.map(({ product, quantity }) => (
                    <div key={product.id} className="py-4 first:pt-0 last:pb-0 flex gap-3.5 group">
                      <img
                        src={product.imageUrl || 'https://picsum.photos/seed/part/100/100'}
                        alt={product.description}
                        className="w-18 h-18 sm:w-20 sm:h-20 object-cover rounded-xl border border-gray-100 shrink-0 bg-gray-50"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                              {product.pieceNumber}
                            </span>
                            <span className="text-[11px] text-gray-400 font-semibold">{product.brand}</span>
                          </div>
                          <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 mt-1 leading-snug">
                            {product.description}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Mod: {product.model || 'Universal'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-50">
                          {/* Quantity control */}
                          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                            <button
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="p-1 hover:bg-white text-gray-600 rounded-l-lg transition-colors"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-7 text-center text-xs font-bold text-gray-900">{quantity}</span>
                            <button
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              disabled={quantity >= product.stock}
                              className="p-1 hover:bg-white text-gray-600 rounded-r-lg transition-colors disabled:opacity-30"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-extrabold text-gray-900">
                              ${(product.salePrice * quantity).toLocaleString()} MXN
                            </span>
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Checkout Summary */}
              {cart.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50/80 space-y-3.5">
                  {/* Coupon Input */}
                  <div>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-2.5 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs">
                        <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                          <Tag size={15} className="text-emerald-700" />
                          <span>Cupón <strong>{appliedCoupon.code}</strong> aplicado</span>
                        </div>
                        <button
                          onClick={removeCoupon}
                          className="text-rose-600 hover:text-rose-800 text-xs font-bold underline"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Código promocional (ej. FARMER10)"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            className="w-full pl-8 pr-3 py-2 bg-white text-xs text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 font-mono uppercase"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isApplyingCoupon || !couponInput.trim()}
                          className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all"
                        >
                          Aplicar
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Shipping Method Options */}
                  <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-gray-700 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Truck size={14} className="text-emerald-700" />
                        <span>Modalidad de Entrega</span>
                      </div>
                      <button
                        onClick={() => setShowCpInput(!showCpInput)}
                        className="text-emerald-700 hover:underline text-[11px] font-medium"
                      >
                        C.P. {postalCode} (cambiar)
                      </button>
                    </div>

                    {showCpInput && (
                      <div className="flex gap-2 pt-1 pb-1">
                        <input
                          type="text"
                          maxLength={5}
                          value={tempCp}
                          onChange={(e) => setTempCp(e.target.value.replace(/\D/g, ''))}
                          placeholder="C.P. (5 dígitos)"
                          className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg w-28 focus:outline-none focus:border-emerald-600 font-mono"
                        />
                        <button
                          onClick={handleSaveCp}
                          className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          Calcular
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setShippingMethod('ESTANDAR')}
                        className={`p-2 rounded-lg text-center border transition-all ${
                          shippingMethod === 'ESTANDAR'
                            ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-bold'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <p className="text-[11px]">Estándar</p>
                        <p className="text-[10px] text-gray-500 font-normal">3-5 días</p>
                        <p className="text-xs font-bold mt-0.5">
                          {subtotal >= 3500 ? 'GRATIS' : '$180'}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShippingMethod('EXPRESS')}
                        className={`p-2 rounded-lg text-center border transition-all ${
                          shippingMethod === 'EXPRESS'
                            ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-bold'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <p className="text-[11px]">Express</p>
                        <p className="text-[10px] text-gray-500 font-normal">24-48 hrs</p>
                        <p className="text-xs font-bold mt-0.5">$350</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShippingMethod('RECOGER_TIENDA')}
                        className={`p-2 rounded-lg text-center border transition-all ${
                          shippingMethod === 'RECOGER_TIENDA'
                            ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-bold'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <p className="text-[11px]">En Sucursal</p>
                        <p className="text-[10px] text-gray-500 font-normal">Bodega QRO</p>
                        <p className="text-xs font-bold mt-0.5 text-emerald-700">GRATIS</p>
                      </button>
                    </div>
                  </div>

                  {/* Totals Breakdown */}
                  <div className="space-y-1.5 text-xs text-gray-600 pt-1">
                    <div className="flex justify-between">
                      <span>Subtotal refacciones:</span>
                      <span className="font-semibold text-gray-900">${subtotal.toLocaleString()} MXN</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Descuento cupón:</span>
                        <span>-${discountAmount.toLocaleString()} MXN</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>IVA Trasladado (16%):</span>
                      <span className="font-semibold text-gray-900">${tax.toLocaleString(undefined, { maximumFractionDigits: 2 })} MXN</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Costo de envío estimado:</span>
                      <span className="font-semibold text-gray-900">
                        {shippingCost === 0 ? <span className="text-emerald-700 font-bold">GRATIS</span> : `$${shippingCost.toLocaleString()} MXN`}
                      </span>
                    </div>

                    <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total a Pagar:</span>
                      <span className="text-emerald-800 text-lg">${total.toLocaleString(undefined, { maximumFractionDigits: 2 })} MXN</span>
                    </div>
                  </div>

                  {/* Checkout CTA */}
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      onProceedToCheckout();
                    }}
                    className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <span>Proceder al Checkout Seguro</span>
                    <ArrowRight size={18} />
                  </button>

                  <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={13} className="text-emerald-600" />
                      Pago SSL Encriptado
                    </span>
                    <span>•</span>
                    <span>Factura SAT Disponible</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
