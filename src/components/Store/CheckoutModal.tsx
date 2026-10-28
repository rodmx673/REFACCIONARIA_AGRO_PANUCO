import React, { useState } from 'react';
import { 
  X, Check, ShieldCheck, CreditCard, Building2, QrCode, Truck, 
  ArrowRight, ArrowLeft, Lock, Receipt, Printer, Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from './StoreContext';
import { Order, PaymentMethodOnline, ShippingAddress } from '../../types';
import { toast } from 'sonner';

interface CheckoutModalProps {
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose, onOrderSuccess }) => {
  const { 
    cart, subtotal, tax, discountAmount, shippingCost, total, 
    appliedCoupon, clearCart, shippingMethod, setClientEmail
  } = useStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Step 1
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [customerRfc, setCustomerRfc] = useState('');

  // Step 2
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [interior, setInterior] = useState('');
  const [colony, setColony] = useState('');
  const [city, setCity] = useState('Querétaro');
  const [state, setState] = useState('Querétaro');
  const [zipCode, setZipCode] = useState('76000');
  const [references, setReferences] = useState('');
  const [pickupInStore, setPickupInStore] = useState(shippingMethod === 'RECOGER_TIENDA');

  // Step 3
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOnline>('TARJETA');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [creditTerms, setCreditTerms] = useState<'15' | '30' | '60'>('30');

  const [generatedSpeiClabe] = useState('646180123456789012');
  const [generatedOxxoBarcode] = useState('9802026789123456');

  const canProceedStep1 = customerName.trim().length >= 3 && customerEmail.includes('@') && customerPhone.trim().length >= 8;
  const canProceedStep2 = pickupInStore || (street.trim().length >= 3 && number.trim().length >= 1 && colony.trim().length >= 2 && zipCode.trim().length === 5);

  const handleNextStep = () => {
    if (step === 1 && !canProceedStep1) {
      toast.error('Completa los datos de contacto obligatorios');
      return;
    }
    if (step === 2 && !canProceedStep2) {
      toast.error('Completa el domicilio de entrega');
      return;
    }
    if (step < 3) setStep((step + 1) as any);
  };

  const handleProcessOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const orderNumber = `FP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      const shippingAddressData: ShippingAddress = {
        fullName: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim().toLowerCase(),
        street: pickupInStore ? 'Recoger en Bodega Querétaro' : street.trim(),
        number: pickupInStore ? 'S/N' : number.trim(),
        interior: interior.trim(),
        colony: pickupInStore ? 'Industrial Querétaro' : colony.trim(),
        city: pickupInStore ? 'Querétaro' : city.trim(),
        state: pickupInStore ? 'Querétaro' : state.trim(),
        zipCode: pickupInStore ? '76000' : zipCode.trim(),
        references: references.trim(),
        rfc: wantsInvoice ? customerRfc.trim().toUpperCase() : undefined
      };

      const orderData: Order = {
        id: '',
        orderNumber,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone.trim(),
        items: cart.map(item => ({
          productId: item.product.id,
          pieceNumber: item.product.pieceNumber,
          description: item.product.description,
          brand: item.product.brand,
          quantity: item.quantity,
          unitPrice: item.product.salePrice,
          subtotal: item.product.salePrice * item.quantity,
          imageUrl: item.product.imageUrl
        })),
        subtotal,
        tax,
        shippingCost: pickupInStore ? 0 : shippingCost,
        discount: discountAmount,
        total: subtotal - discountAmount + tax + (pickupInStore ? 0 : shippingCost),
        status: 'CONFIRMED',
        paymentMethod,
        paymentStatus: paymentMethod === 'TARJETA' ? 'PAID' : 'PENDING',
        shippingAddress: shippingAddressData,
        shippingMethod: pickupInStore ? 'RECOGER_TIENDA' : shippingMethod,
        trackingNumber: `FEDEX-${Math.floor(100000000 + Math.random() * 900000000)}`,
        carrier: pickupInStore ? 'Entrega en Mostrador' : 'FedEx Express Nacional',
        couponCode: appliedCoupon?.code,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // CONEXIÓN REAL A GOOGLE SHEETS
      const { createOnlineOrderApi } = await import('../../lib/sheetsApi');
      const result = await createOnlineOrderApi(orderData);

      if (!result.success) {
        throw new Error(result.error || 'Error al guardar el pedido en el servidor');
      }

      orderData.id = result.data?.id || 'ORD-' + Date.now();

      setClientEmail(customerEmail.trim().toLowerCase());
      setCompletedOrder(orderData);
      setStep(4);
      clearCart();
      
      toast.success('¡Pedido confirmado exitosamente!', {
        description: `Folio: ${orderNumber}`
      });
      onOrderSuccess(orderData);
    } catch (err: any) {
      console.error('Error creating order:', err);
      toast.error('Ocurrió un error al procesar el pedido', {
        description: err?.message || 'Por favor intenta de nuevo.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Top Header */}
        <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-emerald-300 flex items-center justify-center font-bold">
              <Lock size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight">Checkout Seguro Farmer Parts</h2>
              <p className="text-[11px] text-emerald-300">Conexión cifrada SSL de 256 bits</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 4-Step Progress Indicator */}
        {step < 4 && (
          <div className="bg-gray-50/80 px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between max-w-md mx-auto text-xs font-bold text-gray-500">
              <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-emerald-800' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-600'}`}>1</span>
                <span>Contacto</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-200" />

              <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-emerald-800' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
                <span>Envío</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-200" />

              <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-emerald-800' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-600'}`}>3</span>
                <span>Pago</span>
              </div>
            </div>
          </div>
        )}

                {/* Modal Body */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1">
          {/* STEP 1: Identification */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">1. Datos del Comprador</h3>
                <p className="text-xs text-gray-500">Enviaremos el seguimiento de la paquetería y comprobante de compra a este correo.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo o Razón Social *</label>
                  <input type="text" required placeholder="Ej. Rodrigo Morales" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico *</label>
                  <input type="email" required placeholder="correo@rancho.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono Móvil *</label>
                  <input type="tel" required placeholder="(668) 123-4567" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600" />
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                  <input type="checkbox" checked={wantsInvoice} onChange={(e) => setWantsInvoice(e.target.checked)} className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 border-gray-300" />
                  <span>Requiero Factura Fiscal CFDI 4.0 SAT</span>
                </label>
                {wantsInvoice && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">RFC del Receptor</label>
                    <input type="text" placeholder="XAXX010101000" value={customerRfc} onChange={(e) => setCustomerRfc(e.target.value.toUpperCase())} className="w-full max-w-xs px-3 py-1.5 text-xs font-mono uppercase bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-600" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Shipping */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">2. Domicilio de Envío</h3>
                <p className="text-xs text-gray-500">¿Dónde debemos entregar las refacciones de tu tractor?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setPickupInStore(false)} className={`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${!pickupInStore ? 'border-emerald-700 bg-emerald-50/70 shadow-xs' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <Truck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Envío por Paquetería</span>
                    <span className="text-[11px] text-gray-500">A tu taller o domicilio</span>
                  </div>
                </button>
                <button type="button" onClick={() => setPickupInStore(true)} className={`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${pickupInStore ? 'border-emerald-700 bg-emerald-50/70 shadow-xs' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <Building2 size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Recoger en Sucursal</span>
                    <span className="text-[11px] text-emerald-700 font-bold">Sin costo adicional</span>
                  </div>
                </button>
              </div>

              {pickupInStore ? (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-2">
                  <span className="font-bold text-gray-900 block">Bodega Central Farmer Parts</span>
                  <p className="text-gray-600">Av. 5 de Febrero #1234, Parque Industrial Querétaro, QRO.</p>
                  <p className="text-[11px] text-emerald-800 font-medium">Horario: Lunes a Viernes 8:00 AM - 6:30 PM</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Calle o Carretera *</label>
                    <input type="text" required placeholder="Av. Tecnológico" value={street} onChange={(e) => setStreet(e.target.value)} className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">No. Ext / Int *</label>
                    <input type="text" required placeholder="123 / KM 15" value={number} onChange={(e) => setNumber(e.target.value)} className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Colonia o Ejido *</label>
                    <input type="text" required placeholder="Centro" value={colony} onChange={(e) => setColony(e.target.value)} className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Código Postal *</label>
                    <input type="text" maxLength={5} required placeholder="76000" value={zipCode} onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))} className="w-full px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Ciudad y Estado</label>
                    <input type="text" placeholder="Querétaro, QRO" value={`${city}, ${state}`} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Payment Method */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">3. Método de Pago</h3>
                <p className="text-xs text-gray-500">Selecciona tu forma de liquidación preferida.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button type="button" onClick={() => setPaymentMethod('TARJETA')} className={`p-3 rounded-2xl border text-center transition-all ${paymentMethod === 'TARJETA' ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold shadow-xs' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                  <CreditCard size={18} className="mx-auto mb-1 text-emerald-700" />
                  <span className="text-xs">Tarjeta</span>
                </button>
                <button type="button" onClick={() => setPaymentMethod('SPEI')} className={`p-3 rounded-2xl border text-center transition-all ${paymentMethod === 'SPEI' ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold shadow-xs' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                  <Building2 size={18} className="mx-auto mb-1 text-emerald-700" />
                  <span className="text-xs">SPEI</span>
                </button>
                <button type="button" onClick={() => setPaymentMethod('OXXO')} className={`p-3 rounded-2xl border text-center transition-all ${paymentMethod === 'OXXO' ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold shadow-xs' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                  <QrCode size={18} className="mx-auto mb-1 text-emerald-700" />
                  <span className="text-xs">OXXO</span>
                </button>
                <button type="button" onClick={() => setPaymentMethod('CREDITO_FARMER')} className={`p-3 rounded-2xl border text-center transition-all ${paymentMethod === 'CREDITO_FARMER' ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold shadow-xs' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                  <Receipt size={18} className="mx-auto mb-1 text-emerald-700" />
                  <span className="text-xs">Crédito</span>
                </button>
              </div>

              <div className="bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-200 text-xs">
                {paymentMethod === 'TARJETA' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-gray-700 font-bold">
                      <span>Tarjeta de Crédito o Débito</span>
                      <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold"><Lock size={12} /> PCI</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Número de Tarjeta</label>
                      <input type="text" maxLength={19} placeholder="4500 •••• •••• 9821" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-full px-3 py-2 text-xs font-mono bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Nombre en la Tarjeta</label>
                        <input type="text" placeholder="Como aparece en el plástico" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 uppercase" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Vencimiento / CVV</label>
                        <div className="flex gap-1.5">
                          <input type="text" placeholder="MM/AA" maxLength={5} value={cardExp} onChange={(e) => setCardExp(e.target.value)} className="w-1/2 px-2 py-2 text-xs text-center font-mono bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600" />
                          <input type="password" placeholder="CVV" maxLength={4} value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} className="w-1/2 px-2 py-2 text-xs text-center font-mono bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'SPEI' && (
                  <div className="space-y-3">
                    <span className="font-bold text-gray-900 block">Transferencia SPEI</span>
                    <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1 font-mono text-xs">
                      <div className="flex justify-between"><span className="text-gray-500">Banco:</span><span className="font-bold text-gray-900">STP</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">CLABE Demo:</span><span className="font-bold text-emerald-800">{generatedSpeiClabe}</span></div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'OXXO' && (
                  <div className="space-y-3">
                    <span className="font-bold text-gray-900 block">Pago en OXXO</span>
                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-center space-y-1">
                      <span className="text-[11px] text-gray-400 font-mono">Referencia:</span>
                      <p className="text-sm font-mono font-extrabold text-gray-900 tracking-widest">{generatedOxxoBarcode}</p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'CREDITO_FARMER' && (
                  <div className="space-y-3">
                    <span className="font-bold text-gray-900 block">Línea de Crédito Agrícola</span>
                    <div className="flex items-center gap-3 pt-1">
                      <label className="text-xs font-semibold text-gray-700">Plazo:</label>
                      {(['15', '30', '60'] as const).map(d => (
                        <button key={d} type="button" onClick={() => setCreditTerms(d)} className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${creditTerms === d ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-gray-200 bg-white text-gray-700'}`}>
                          {d} días
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Artículos ({cart.reduce((s, i) => s + i.quantity, 0)} pzas):</span>
                  <span className="font-semibold text-gray-900">${subtotal.toLocaleString()} MXN</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío ({pickupInStore ? 'Sucursal' : shippingMethod}):</span>
                  <span className="font-semibold text-gray-900">{pickupInStore || shippingCost === 0 ? 'GRATIS' : `$${shippingCost.toLocaleString()} MXN`}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-emerald-950 pt-2 border-t border-emerald-200">
                  <span>Total a Liquidar:</span>
                  <span>${(subtotal - discountAmount + tax + (pickupInStore ? 0 : shippingCost)).toLocaleString(undefined, { maximumFractionDigits: 2 })} MXN</span>
                </div>
              </div>
            </div>
          )}

                    {/* STEP 4: Order Confirmation / Success View */}
          {step === 4 && completedOrder && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-md">
                <Check size={36} className="stroke-[2.5]" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  ¡Pedido Confirmado!
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                  Folio: {completedOrder.orderNumber}
                </h2>
              </div>

              <div className="bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-200 text-left text-xs space-y-3 max-w-lg mx-auto">
                <div className="flex justify-between pb-2 border-b border-gray-200 font-medium">
                  <span className="text-gray-500">Estado del Pedido:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <Clock size={13} /> En Preparación
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-gray-500">Destinatario:</span>
                  <span className="font-bold text-gray-900">{completedOrder.customerName}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-gray-500">Total Liquidado:</span>
                  <span className="font-extrabold text-gray-900">${completedOrder.total.toLocaleString()} MXN</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Artículos:</span>
                  <div className="space-y-1">
                    {completedOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-gray-700">
                        <span>{it.quantity}x {it.description}</span>
                        <span className="font-bold font-mono">${it.subtotal.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button onClick={() => window.print()} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors">
                  <Printer size={16} />
                  <span>Imprimir</span>
                </button>
                <button onClick={onClose} className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all">
                  Regresar a la Tienda
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        {step < 4 && (
          <div className="p-4 sm:px-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            {step > 1 ? (
              <button type="button" onClick={() => setStep((step - 1) as any)} className="px-4 py-2 text-gray-600 hover:text-gray-900 text-xs font-bold flex items-center gap-1.5">
                <ArrowLeft size={16} />
                <span>Anterior</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              {step < 3 ? (
                <button type="button" onClick={handleNextStep} className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all">
                  <span>Continuar</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button type="button" disabled={isSubmitting} onClick={handleProcessOrder} className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition-all">
                  <span>{isSubmitting ? 'Procesando Pedido...' : 'Confirmar y Pagar'}</span>
                  <ShieldCheck size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};