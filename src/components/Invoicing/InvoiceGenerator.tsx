import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  User, 
  CreditCard, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Send, 
  Printer,
  X,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Hash
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Sale, Customer, Invoice, SatConfig } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface InvoiceGeneratorProps {
  saleId?: string;
  onClose?: () => void;
}

export const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ saleId, onClose }) => {
  const [sale, setSale] = useState<Sale | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [invoiceData, setInvoiceData] = useState({
    usage: 'G03', // Gastos en general
    paymentMethod: 'PUE', // Pago en una sola exhibición
    paymentForm: '01', // Efectivo
    rfc: '',
    name: '',
    zipCode: '',
    regime: ''
  });

  useEffect(() => {
    if (saleId) {
      const fetchSale = async () => {
        try {
          const docRef = doc(db, 'sales', saleId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const saleData = { id: docSnap.id, ...docSnap.data() } as Sale;
            setSale(saleData);
            
            if (saleData.customerId) {
              const custRef = doc(db, 'customers', saleData.customerId);
              const custSnap = await getDoc(custRef);
              if (custSnap.exists()) {
                const custData = { id: custSnap.id, ...custSnap.data() } as Customer;
                setCustomer(custData);
                setInvoiceData(prev => ({
                  ...prev,
                  rfc: custData.rfc,
                  name: custData.name,
                  zipCode: custData.address.zip || '',
                  regime: '601' // Default
                }));
              }
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `sales/${saleId}`);
        }
      };
      fetchSale();
    }
  }, [saleId]);

  const handleGenerateInvoice = async () => {
    setLoading(true);
    try {
      // 1. Simulate PAC API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const uuid = "550e8400-e29b-41d4-a716-446655440000"; // Simulated UUID
      
      // 2. Save invoice to Firestore
      await addDoc(collection(db, 'invoices'), {
        saleId,
        customerId: customer?.id || 'PUBLICO_GENERAL',
        folio: `F-${Math.floor(Math.random() * 10000)}`,
        series: 'A',
        uuid,
        date: new Date().toISOString(),
        total: sale?.total || 0,
        taxAmount: (sale?.total || 0) * 0.16,
        status: 'VIGENTE',
        usage: invoiceData.usage,
        paymentMethod: invoiceData.paymentMethod,
        paymentForm: invoiceData.paymentForm,
        timestamp: serverTimestamp()
      });

      setStep(3);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'invoices');
      alert('Error al timbrar la factura.');
    } finally {
      setLoading(false);
    }
  };

  if (!saleId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Generar Factura CFDI 4.0</h3>
              <p className="text-xs text-white/70">Venta: #{saleId.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <User className="text-primary" size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Receptor</p>
                      <p className="font-bold text-gray-900">{customer?.name || 'Público en General'}</p>
                    </div>
                  </div>
                  <button className="text-primary text-xs font-bold hover:underline">Cambiar Cliente</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase">RFC</label>
                    <input 
                      type="text" 
                      value={invoiceData.rfc}
                      onChange={(e) => setInvoiceData({...invoiceData, rfc: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase">Código Postal</label>
                    <input 
                      type="text" 
                      value={invoiceData.zipCode}
                      onChange={(e) => setInvoiceData({...invoiceData, zipCode: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-gray-700 uppercase">Uso de CFDI</label>
                    <select 
                      value={invoiceData.usage}
                      onChange={(e) => setInvoiceData({...invoiceData, usage: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="G01">G01 - Adquisición de mercancías</option>
                      <option value="G03">G03 - Gastos en general</option>
                      <option value="S01">S01 - Sin efectos fiscales</option>
                      <option value="CP01">CP01 - Pagos</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    Siguiente
                    <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900">Resumen de Factura</h4>
                      <p className="text-xs text-gray-500">Verifica los montos antes de timbrar.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-primary">${sale?.total.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Total con IVA (16%)</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-medium text-gray-900">${sale?.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">IVA (16%)</span>
                      <span className="font-medium text-gray-900">${sale?.tax.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-blue-700 text-sm">
                  <ShieldCheck className="shrink-0" size={20} />
                  <p>Al hacer clic en "Timbrar Factura", se enviará la información al PAC y se generará el sello digital del SAT.</p>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="text-gray-500 font-bold hover:text-gray-700"
                  >
                    Regresar
                  </button>
                  <button 
                    onClick={handleGenerateInvoice}
                    disabled={loading}
                    className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Timbrando...
                      </>
                    ) : (
                      <>
                        <Receipt size={20} />
                        Timbrar Factura
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-8"
              >
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">¡Factura Generada!</h3>
                  <p className="text-gray-500">El CFDI 4.0 ha sido timbrado exitosamente.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
                    <Download className="text-primary" size={24} />
                    <span className="text-xs font-bold text-gray-700 uppercase">Descargar PDF</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
                    <Send className="text-primary" size={24} />
                    <span className="text-xs font-bold text-gray-700 uppercase">Enviar Email</span>
                  </button>
                </div>

                <button 
                  onClick={onClose}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors"
                >
                  Finalizar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
