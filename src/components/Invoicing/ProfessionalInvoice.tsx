import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Download, 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  Building2, 
  User, 
  Package,
  QrCode,
  X,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { cn, formatCurrency, numberToWords } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useReactToPrint } from 'react-to-print';

interface InvoiceItem {
  id: string;
  quantity: number;
  description: string;
  pieceNumber: string;
  brand: string;
  model: string;
  unitPrice: number;
}

interface InvoiceData {
  company: {
    name: string;
    giro: string;
    rfc: string;
    address: string;
    phones: string;
    city: string;
    state: string;
    zip: string;
  };
  client: {
    name: string;
    rfc: string;
    address: string;
    city: string;
    state: string;
  };
  invoice: {
    serie: string;
    folio: string;
    date: string;
    paymentMethod: string;
    pedidoNo: string;
    viaEmbarque: string;
    talonNo: string;
    horaEntrega: string;
    nip: string;
    serieMotor: string;
  };
  items: InvoiceItem[];
}

export const ProfessionalInvoice: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [activeView, setActiveView] = useState<'editor' | 'preview'>('editor');
  const [data, setData] = useState<InvoiceData>({
    company: {
      name: 'FARMER PARTS',
      giro: 'REFACCIONES PARA MAQUINARIA AGRICOLA E INDUSTRIAL',
      rfc: 'FPA123456ABC',
      address: 'AV. AGRICULTURA 123, COL. CENTRO',
      phones: '555-123-4567 / 555-987-6543',
      city: 'CELAYA',
      state: 'GUANAJUATO',
      zip: '38000'
    },
    client: {
      name: '',
      rfc: '',
      address: '',
      city: '',
      state: ''
    },
    invoice: {
      serie: 'A',
      folio: '1001',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'EFECTIVO',
      pedidoNo: '',
      viaEmbarque: 'TERRESTRE',
      talonNo: '',
      horaEntrega: '',
      nip: '',
      serieMotor: ''
    },
    items: [
      {
        id: '1',
        quantity: 1,
        description: 'FILTRO DE ACEITE',
        pieceNumber: 'JD-12345',
        brand: 'JOHN DEERE',
        model: '6110J',
        unitPrice: 450.00
      }
    ]
  });

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const addItem = () => {
    setData({
      ...data,
      items: [
        ...data.items,
        {
          id: Math.random().toString(36).substr(2, 9),
          quantity: 1,
          description: '',
          pieceNumber: '',
          brand: '',
          model: '',
          unitPrice: 0
        }
      ]
    });
  };

  const removeItem = (id: string) => {
    setData({
      ...data,
      items: data.items.filter(item => item.id !== id)
    });
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setData({
      ...data,
      items: data.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const calculateSubtotal = () => {
    return data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  };

  const subtotal = calculateSubtotal();
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl flex flex-col lg:flex-row h-[90vh] lg:h-[90vh] overflow-hidden"
      >
        {/* Mobile View Toggle */}
        <div className="lg:hidden flex border-b border-gray-100">
          <button 
            onClick={() => setActiveView('editor')}
            className={cn(
              "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all",
              activeView === 'editor' ? "bg-primary text-white" : "bg-white text-gray-400"
            )}
          >
            Editor
          </button>
          <button 
            onClick={() => setActiveView('preview')}
            className={cn(
              "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all",
              activeView === 'preview' ? "bg-primary text-white" : "bg-white text-gray-400"
            )}
          >
            Vista Previa
          </button>
        </div>

        {/* Editor Side */}
        <div className={cn(
          "lg:w-1/2 flex flex-col border-r border-gray-100 bg-gray-50/50",
          activeView !== 'editor' && "hidden lg:flex"
        )}>
          <div className="p-6 border-b border-gray-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">Generador de Facturas</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Estilo Tradicional Mexicano</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Steps Navigation */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => setStep(s)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                    step === s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-gray-400 hover:bg-gray-100"
                  )}
                >
                  Paso {s}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Building2 size={18} />
                      <h3 className="font-bold uppercase text-sm tracking-wider">Datos de la Empresa</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Nombre de la Empresa</label>
                        <input 
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 ring-primary/20 outline-none transition-all"
                          value={data.company.name}
                          onChange={e => setData({...data, company: {...data.company, name: e.target.value}})}
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Giro</label>
                        <input 
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 ring-primary/20 outline-none transition-all"
                          value={data.company.giro}
                          onChange={e => setData({...data, company: {...data.company, giro: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">RFC</label>
                        <input 
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 ring-primary/20 outline-none transition-all"
                          value={data.company.rfc}
                          onChange={e => setData({...data, company: {...data.company, rfc: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Teléfonos</label>
                        <input 
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 ring-primary/20 outline-none transition-all"
                          value={data.company.phones}
                          onChange={e => setData({...data, company: {...data.company, phones: e.target.value}})}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <User size={18} />
                      <h3 className="font-bold uppercase text-sm tracking-wider">Datos del Cliente</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Nombre / Razón Social</label>
                        <input 
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 ring-primary/20 outline-none transition-all"
                          value={data.client.name}
                          onChange={e => setData({...data, client: {...data.client, name: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">RFC Cliente</label>
                        <input 
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 ring-primary/20 outline-none transition-all"
                          value={data.client.rfc}
                          onChange={e => setData({...data, client: {...data.client, rfc: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Ciudad</label>
                        <input 
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 ring-primary/20 outline-none transition-all"
                          value={data.client.city}
                          onChange={e => setData({...data, client: {...data.client, city: e.target.value}})}
                        />
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-primary">
                        <Package size={18} />
                        <h3 className="font-bold uppercase text-sm tracking-wider">Productos / Servicios</h3>
                      </div>
                      <button 
                        onClick={addItem}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {data.items.map((item, index) => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3 relative group">
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-2 space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase">Cant</label>
                              <input 
                                type="number"
                                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                                value={item.quantity}
                                onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
                              />
                            </div>
                            <div className="col-span-10 space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase">Descripción</label>
                              <input 
                                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                                value={item.description}
                                onChange={e => updateItem(item.id, 'description', e.target.value)}
                              />
                            </div>
                            <div className="col-span-4 space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase">No. Parte</label>
                              <input 
                                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                                value={item.pieceNumber}
                                onChange={e => updateItem(item.id, 'pieceNumber', e.target.value)}
                              />
                            </div>
                            <div className="col-span-4 space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase">Marca</label>
                              <input 
                                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                                value={item.brand}
                                onChange={e => updateItem(item.id, 'brand', e.target.value)}
                              />
                            </div>
                            <div className="col-span-4 space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase">P. Unitario</label>
                              <input 
                                type="number"
                                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                                value={item.unitPrice}
                                onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <FileText size={18} />
                      <h3 className="font-bold uppercase text-sm tracking-wider">Detalles Fiscales</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Serie</label>
                        <input 
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 ring-primary/20 outline-none transition-all"
                          value={data.invoice.serie}
                          onChange={e => setData({...data, invoice: {...data.invoice, serie: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Folio</label>
                        <input 
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 ring-primary/20 outline-none transition-all"
                          value={data.invoice.folio}
                          onChange={e => setData({...data, invoice: {...data.invoice, folio: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Forma de Pago</label>
                        <select 
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 ring-primary/20 outline-none transition-all"
                          value={data.invoice.paymentMethod}
                          onChange={e => setData({...data, invoice: {...data.invoice, paymentMethod: e.target.value}})}
                        >
                          <option value="EFECTIVO">EFECTIVO</option>
                          <option value="TARJETA">TARJETA</option>
                          <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                          <option value="CRÉDITO">CRÉDITO</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Fecha</label>
                        <input 
                          type="date"
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 ring-primary/20 outline-none transition-all"
                          value={data.invoice.date}
                          onChange={e => setData({...data, invoice: {...data.invoice, date: e.target.value}})}
                        />
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 bg-white border-t border-gray-100 flex gap-3">
            <button 
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-200"
            >
              <Printer size={20} />
              Imprimir Factura
            </button>
            <button className="p-3 bg-primary/10 text-primary rounded-2xl hover:bg-primary/20 transition-all">
              <Download size={20} />
            </button>
          </div>
        </div>

        {/* Preview Side */}
        <div className={cn(
          "lg:w-1/2 bg-gray-200 p-4 lg:p-8 overflow-auto flex justify-center items-start",
          activeView !== 'preview' && "hidden lg:flex"
        )}>
          <div className="relative w-full flex justify-center">
            <div 
              ref={printRef}
              className="bg-white w-[210mm] min-h-[297mm] p-6 lg:p-10 shadow-xl font-mono text-[10px] leading-tight text-black origin-top scale-[0.4] sm:scale-[0.6] md:scale-[0.8] lg:scale-100"
              style={{ 
                fontFamily: "'Courier New', Courier, monospace",
                boxSizing: 'border-box'
              }}
            >
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-4">
              <h1 className="text-lg font-bold">{data.company.name}, S.A. DE C.V.</h1>
              <p className="text-[8px]">{data.company.giro}</p>
              <div className="mt-2">
                <p>RFC: {data.company.rfc}</p>
                <p>DIRECCIÓN: {data.company.address}</p>
                <p>TELÉFONOS: {data.company.phones}</p>
                <p>C.P. {data.company.zip} {data.company.city}, {data.company.state}</p>
              </div>
              <p className="mt-2 font-bold">LUGAR DE EXPEDICIÓN: {data.company.city}</p>
            </div>

            {/* Invoice Info */}
            <div className="flex justify-between border-b-2 border-black pb-2 mb-4">
              <div className="font-bold">FACTURA No. {data.invoice.serie}-{data.invoice.folio}</div>
              <div className="font-bold">FECHA: {data.invoice.date}</div>
            </div>

            {/* Client Info */}
            <div className="space-y-1 mb-4 border-b-2 border-black pb-4">
              <div className="flex"><span className="w-24 font-bold">NOMBRE:</span> {data.client.name}</div>
              <div className="flex"><span className="w-24 font-bold">DIRECCIÓN:</span> {data.client.address}</div>
              <div className="flex"><span className="w-24 font-bold">CIUDAD:</span> {data.client.city}, {data.client.state}</div>
              <div className="flex"><span className="w-24 font-bold">R.F.C.:</span> {data.client.rfc}</div>
            </div>

            {/* Shipping Info */}
            <div className="grid grid-cols-2 gap-4 border-b-2 border-black pb-2 mb-4">
              <div className="flex"><span className="font-bold mr-2">PEDIDO No.:</span> {data.invoice.pedidoNo}</div>
              <div className="flex"><span className="font-bold mr-2">VIA EMBARQUE:</span> {data.invoice.viaEmbarque}</div>
              <div className="flex"><span className="font-bold mr-2">TALÓN No.:</span> {data.invoice.talonNo}</div>
              <div className="flex"><span className="font-bold mr-2">H DE D:</span> {data.invoice.horaEntrega}</div>
            </div>

            <div className="mb-4">
              <span className="font-bold">CONDICIONES DE PAGO:</span> {data.invoice.paymentMethod}
            </div>

            {/* Items Table */}
            <div className="border-t-2 border-b-2 border-black mb-4">
              <div className="flex border-b border-black font-bold py-1">
                <div className="w-12 text-center">CANT</div>
                <div className="flex-1 px-2">DESCRIPCIÓN</div>
                <div className="w-24 text-right">P. UNIT</div>
                <div className="w-24 text-right">IMPORTE</div>
              </div>
              <div className="min-h-[300px]">
                {data.items.map((item) => (
                  <div key={item.id} className="py-2 border-b border-gray-100 last:border-0">
                    <div className="flex">
                      <div className="w-12 text-center">{item.quantity}</div>
                      <div className="flex-1 px-2">
                        <div className="font-bold">{item.description}</div>
                        <div className="text-[8px] mt-0.5">
                          - No. Parte: {item.pieceNumber} | Marca: {item.brand}
                        </div>
                        <div className="text-[8px]">
                          - Modelo: {item.model}
                        </div>
                      </div>
                      <div className="w-24 text-right">{formatCurrency(item.unitPrice)}</div>
                      <div className="w-24 text-right">{formatCurrency(item.quantity * item.unitPrice)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals and Footer */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-8">
                  <div className="font-bold mb-1">SON:</div>
                  <div className="text-[9px] uppercase">({numberToWords(total)})</div>
                  <div className="mt-4 text-[8px]">
                    EL IMPORTE DE ESTA FACTURA SERÁ CUBIERTO EN {data.invoice.paymentMethod}
                  </div>
                </div>
                <div className="w-48 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold">SUB-TOTAL:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">16% I.V.A.:</span>
                    <span>{formatCurrency(iva)}</span>
                  </div>
                  <div className="flex justify-between border-t border-black pt-1 font-bold">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t-2 border-black pt-4">
                <div className="col-span-2 space-y-1 text-[7px]">
                  <p className="font-bold">EFECTOS FISCALES AL PAGO</p>
                  <p>Impresión 2026 Vigencia: ENERO A DICIEMBRE Folio: {Math.random().toString(36).toUpperCase().substr(0, 12)}</p>
                  <p>NÚMERO DE APROBACIÓN DE SICOFI: 12345678 DEL 2026-01-01</p>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="font-bold">PROVEEDOR DE FORMAS, S.A. DE C.V. R.F.C. PFO880101XYZ</p>
                    <p>DIRECCIÓN DEL PROVEEDOR: AV. INDUSTRIAL 456, CIUDAD DE MÉXICO</p>
                    <p>TELÉFONOS: 555-000-1111</p>
                    <p>FECHA DE AUTORIZACIÓN EN LA PÁGINA DE INTERNET DEL SAT DEL DÍA 2026-01-01</p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center border-l border-black pl-4">
                  <QrCode size={64} className="mb-2" />
                  <span className="text-[6px] text-center">SELLO DIGITAL DEL SAT</span>
                </div>
              </div>

              <div className="text-[6px] break-all border-t border-black pt-2 opacity-50">
                CADENA ORIGINAL: ||1.1|{Math.random().toString(36).toUpperCase()}|2026-03-27T12:52:45|SAT970701NN3|{Math.random().toString(36)}|{Math.random().toString(36)}||
              </div>
            </div>
          </div>
        </div>
      </div>
      </motion.div>
    </div>
  );
};
