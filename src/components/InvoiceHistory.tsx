import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  ExternalLink, 
  Image as ImageIcon, 
  Plus, 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Check, 
  Eye, 
  Calendar, 
  Truck, 
  DollarSign, 
  FileCheck, 
  Sparkles, 
  Copy, 
  Download, 
  Package, 
  Loader2, 
  Link as LinkIcon,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';


import { InvoiceHistoryRecord, InvoiceArticle } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { ImportInvoiceToStockModal } from './Invoicing/ImportInvoiceToStockModal';

interface InvoiceHistoryProps {
  onNavigateToExtractor?: () => void;
  onNavigateToInventory?: () => void;
  initialSelectedInvoiceId?: string | null;
}

const SAMPLE_INITIAL_INVOICES: Omit<InvoiceHistoryRecord, 'id'>[] = [
  {
    numero_factura: "FAC-2024-00892",
    fecha: "2024-03-18",
    proveedor: "AgroRefacciones del Norte S.A. de C.V.",
    rfc_proveedor: "ARN980415KZ2",
    cliente: "Tractores y Maquinaria Agrícola San Isidro",
    importe: 9909.88,
    subtotal: 8543.00,
    iva: 1366.88,
    moneda: "MXN",
    originalImageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800",
    imageReference: "comprobante_fiscal_arn_00892.jpg",
    status: "REGISTRADA",
    articulos: [
      {
        codigo: "RE59754",
        descripcion: "Filtro de Aceite para Motor Diésel John Deere RE59754",
        cantidad: 6,
        precio_unitario: 485.50,
        importe: 2913.00
      },
      {
        codigo: "MF-41312574",
        descripcion: "Bomba de Agua Massey Ferguson Serie 200/300 4 Cil.",
        cantidad: 2,
        precio_unitario: 1850.00,
        importe: 3700.00
      },
      {
        codigo: "SH-7023",
        descripcion: "Kit de Sellos Hidráulicos Cilindro de Dirección",
        cantidad: 4,
        precio_unitario: 320.00,
        importe: 1280.00
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
  },
  {
    numero_factura: "INV-78392",
    fecha: "2024-03-15",
    proveedor: "Distribuidora Diésel y Tractopartes del Bajío",
    rfc_proveedor: "DDT120822MN4",
    cliente: "Tractores y Maquinaria Agrícola San Isidro",
    importe: 14750.50,
    subtotal: 12715.95,
    iva: 2034.55,
    moneda: "MXN",
    originalImageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800",
    imageReference: "factura_bajio_78392.png",
    status: "PROCESADA",
    articulos: [
      {
        codigo: "NH-87800083",
        descripcion: "Inyector de Combustible Diésel New Holland TD95",
        cantidad: 4,
        precio_unitario: 2900.00,
        importe: 11600.00
      },
      {
        codigo: "JD-R501234",
        descripcion: "Termostato de Alta Temperatura 82°C",
        cantidad: 3,
        precio_unitario: 371.98,
        importe: 1115.95
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 24 * 6).toISOString()
  },
  {
    numero_factura: "F-10294",
    fecha: "2024-03-10",
    proveedor: "Sistemas Hidráulicos e Industriales de México",
    rfc_proveedor: "SHI050319AB1",
    cliente: "Tractores y Maquinaria Agrícola San Isidro",
    importe: 6420.00,
    subtotal: 5534.48,
    iva: 885.52,
    moneda: "MXN",
    documentType: "pdf",
    originalImageUrl: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf",
    imageReference: "scan_factura_hidraulicos_10294.pdf",
    status: "PAGADA",
    articulos: [
      {
        codigo: "MANG-3/4-2W",
        descripcion: "Manguera Hidráulica 2 Mallas SAE 100R2 3/4 pulg (rollos 10m)",
        cantidad: 2,
        precio_unitario: 1800.00,
        importe: 3600.00
      },
      {
        codigo: "CON-JIC-12",
        descripcion: "Conexión Hembra Giratoria JIC 3/4 x 1-1/16",
        cantidad: 10,
        precio_unitario: 193.45,
        importe: 1934.48
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 24 * 11).toISOString()
  }
];

export const isPdfInvoice = (inv: InvoiceHistoryRecord): boolean => {
  if (inv.documentType === 'pdf') return true;
  if (inv.pdfDataUri) return true;
  const ref = (inv.imageReference || '').toLowerCase();
  const url = (inv.originalImageUrl || inv.documentUrl || '').toLowerCase();
  return ref.endsWith('.pdf') || url.includes('.pdf') || (inv.originalImageUrl?.startsWith('data:application/pdf') ?? false);
};

export const getInvoiceDocumentUrl = (inv: InvoiceHistoryRecord): string | null => {
  return inv.pdfDataUri || inv.documentUrl || inv.originalImageUrl || null;
};

export const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({ 
  onNavigateToExtractor,
  onNavigateToInventory,
  initialSelectedInvoiceId 
}) => {
  const [invoices, setInvoices] = useState<InvoiceHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceHistoryRecord | null>(null);
  const [importingInvoice, setImportingInvoice] = useState<InvoiceHistoryRecord | null>(null);
  
  // Quick inline image reference editor modal or popover
  const [editingImageInvoice, setEditingImageInvoice] = useState<InvoiceHistoryRecord | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageReference, setNewImageReference] = useState('');
  const [isSavingImage, setIsSavingImage] = useState(false);

  // New Invoice modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    numero_factura: '',
    fecha: new Date().toISOString().slice(0, 10),
    proveedor: '',
    rfc_proveedor: '',
    importe: '',
    moneda: 'MXN',
    originalImageUrl: '',
    imageReference: '',
    articulosText: ''
  });
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  // Full image preview lightbox
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);

  // Subscribe to invoices collection
  useEffect(() => {
    const q = query(collection(db, 'invoices_history'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: InvoiceHistoryRecord[] = [];
      snapshot.forEach((d) => {
        docs.push({ id: d.id, ...(d.data() as Omit<InvoiceHistoryRecord, 'id'>) });
      });
      setInvoices(docs);
      setLoading(false);

      // Handle initial selected invoice if passed via props
      if (initialSelectedInvoiceId && !selectedInvoice) {
        const found = docs.find(inv => inv.id === initialSelectedInvoiceId);
        if (found) setSelectedInvoice(found);
      }
    }, (error) => {
      console.warn('Error listening to invoices_history:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [initialSelectedInvoiceId]);

  // Keep selectedInvoice synchronized with updated snapshot
  useEffect(() => {
    if (selectedInvoice && invoices.length > 0) {
      const updated = invoices.find(inv => inv.id === selectedInvoice.id);
      if (updated) {
        setSelectedInvoice(updated);
      }
    }
  }, [invoices]);

  const handleSeedSampleData = async () => {
    try {
      setLoading(true);
      for (const item of SAMPLE_INITIAL_INVOICES) {
        await addDoc(collection(db, 'invoices_history'), item);
      }
      toast.success('Facturas de ejemplo agregadas con éxito');
    } catch (err: any) {
      console.error('Error seeding invoices:', err);
      handleFirestoreError(err, OperationType.CREATE, 'invoices_history');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditImage = (invoice: InvoiceHistoryRecord, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingImageInvoice(invoice);
    setNewImageUrl(invoice.originalImageUrl || '');
    setNewImageReference(invoice.imageReference || '');
  };

  const handleSaveImageReference = async () => {
    if (!editingImageInvoice?.id) return;
    setIsSavingImage(true);
    try {
      await updateDoc(doc(db, 'invoices_history', editingImageInvoice.id), {
        originalImageUrl: newImageUrl.trim(),
        imageReference: newImageReference.trim(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Referencia a la imagen original guardada');
      setEditingImageInvoice(null);
    } catch (err: any) {
      console.error('Error updating image reference:', err);
      handleFirestoreError(err, OperationType.UPDATE, 'invoices_history');
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar este registro de factura?')) return;
    try {
      await deleteDoc(doc(db, 'invoices_history', invoiceId));
      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice(null);
      }
      toast.success('Factura eliminada del historial');
    } catch (err: any) {
      console.error('Error deleting invoice:', err);
      handleFirestoreError(err, OperationType.DELETE, 'invoices_history');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceForm.numero_factura || !newInvoiceForm.fecha || !newInvoiceForm.proveedor || !newInvoiceForm.importe) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const parsedArticles: InvoiceArticle[] = [];
      if (newInvoiceForm.articulosText.trim()) {
        const lines = newInvoiceForm.articulosText.split('\n');
        lines.forEach(l => {
          if (!l.trim()) return;
          parsedArticles.push({
            descripcion: l.trim(),
            cantidad: 1,
            precio_unitario: null,
            codigo: null,
            importe: null
          });
        });
      }

      const totalVal = parseFloat(newInvoiceForm.importe) || 0;
      const subtotalVal = Math.round((totalVal / 1.16) * 100) / 100;
      const ivaVal = Math.round((totalVal - subtotalVal) * 100) / 100;

      const record: Omit<InvoiceHistoryRecord, 'id'> = {
        numero_factura: newInvoiceForm.numero_factura.trim(),
        fecha: newInvoiceForm.fecha,
        proveedor: newInvoiceForm.proveedor.trim(),
        rfc_proveedor: newInvoiceForm.rfc_proveedor.trim() || undefined,
        importe: totalVal,
        subtotal: subtotalVal,
        iva: ivaVal,
        moneda: newInvoiceForm.moneda || 'MXN',
        originalImageUrl: newInvoiceForm.originalImageUrl.trim() || undefined,
        imageReference: newInvoiceForm.imageReference.trim() || undefined,
        articulos: parsedArticles,
        status: 'REGISTRADA',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'invoices_history'), record);
      toast.success('Factura registrada en el historial');
      setIsCreateModalOpen(false);
      setNewInvoiceForm({
        numero_factura: '',
        fecha: new Date().toISOString().slice(0, 10),
        proveedor: '',
        rfc_proveedor: '',
        importe: '',
        moneda: 'MXN',
        originalImageUrl: '',
        imageReference: '',
        articulosText: ''
      });
      // Redirect to newly created invoice detail
      setSelectedInvoice({ id: docRef.id, ...record });
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      handleFirestoreError(err, OperationType.CREATE, 'invoices_history');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const copyInvoiceJson = (inv: InvoiceHistoryRecord) => {
    const payload = {
      numero_factura: inv.numero_factura,
      fecha: inv.fecha,
      proveedor: inv.proveedor,
      rfc_proveedor: inv.rfc_proveedor || null,
      importe: inv.importe,
      subtotal: inv.subtotal || null,
      iva: inv.iva || null,
      moneda: inv.moneda || 'MXN',
      enlace_imagen_original: inv.originalImageUrl || null,
      referencia_imagen: inv.imageReference || null,
      articulos: inv.articulos || []
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success('JSON de la factura copiado al portapapeles');
  };

  const downloadInvoiceJson = (inv: InvoiceHistoryRecord) => {
    const payload = {
      numero_factura: inv.numero_factura,
      fecha: inv.fecha,
      proveedor: inv.proveedor,
      rfc_proveedor: inv.rfc_proveedor || null,
      importe: inv.importe,
      subtotal: inv.subtotal || null,
      iva: inv.iva || null,
      moneda: inv.moneda || 'MXN',
      enlace_imagen_original: inv.originalImageUrl || null,
      referencia_imagen: inv.imageReference || null,
      articulos: inv.articulos || []
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factura_${inv.numero_factura.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Archivo JSON descargado');
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const query = searchTerm.toLowerCase();
    return (
      inv.numero_factura?.toLowerCase().includes(query) ||
      inv.proveedor?.toLowerCase().includes(query) ||
      inv.rfc_proveedor?.toLowerCase().includes(query) ||
      inv.fecha?.includes(query)
    );
  });

  const totalAmount = invoices.reduce((sum, inv) => sum + (Number(inv.importe) || 0), 0);
  const withImagesCount = invoices.filter(inv => inv.originalImageUrl || inv.imageReference).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* ============================================================== */}
      {/* VISTA 1: DETALLE DE LA FACTURA SELECCIONADA                    */}
      {/* ============================================================== */}
      {selectedInvoice ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Back Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedInvoice(null)}
                type="button"
                className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl border border-gray-200/80 transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
              >
                <ArrowLeft size={16} />
                <span>Volver al Historial</span>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                    {selectedInvoice.numero_factura}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {selectedInvoice.status || 'REGISTRADA'}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 mt-1">
                  Detalle de Factura: {selectedInvoice.numero_factura}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setImportingInvoice(selectedInvoice)}
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/25"
              >
                <Package size={14} />
                <span>Importar a Inventario</span>
              </button>
              <button
                onClick={() => handleOpenEditImage(selectedInvoice)}
                type="button"
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors shadow-sm"
              >
                <LinkIcon size={14} className="text-primary" />
                <span>Modificar Enlace a Imagen</span>
              </button>
              <button
                onClick={() => copyInvoiceJson(selectedInvoice)}
                type="button"
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Copy size={14} />
                <span>Copiar JSON</span>
              </button>
              <button
                onClick={() => downloadInvoiceJson(selectedInvoice)}
                type="button"
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Download size={14} />
                <span>Descargar .json</span>
              </button>
              <button
                onClick={(e) => handleDeleteInvoice(selectedInvoice.id!, e)}
                type="button"
                className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} />
                <span>Eliminar</span>
              </button>
            </div>
          </div>

          {/* Top Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <FileText size={13} className="text-primary" /> Folio de Factura
              </span>
              <p className="text-lg font-black text-gray-900 font-mono">
                {selectedInvoice.numero_factura}
              </p>
              <p className="text-xs text-gray-500">Documento comercial fiscal</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Calendar size={13} className="text-blue-500" /> Fecha de Emisión
              </span>
              <p className="text-lg font-bold text-gray-900">
                {selectedInvoice.fecha}
              </p>
              <p className="text-xs text-gray-400">Expedición formal</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Truck size={13} className="text-emerald-500" /> Proveedor Emisor
              </span>
              <p className="text-base font-bold text-gray-900 truncate" title={selectedInvoice.proveedor}>
                {selectedInvoice.proveedor}
              </p>
              <p className="text-xs text-gray-500 font-mono">
                {selectedInvoice.rfc_proveedor ? `RFC: ${selectedInvoice.rfc_proveedor}` : 'RFC no indicado'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-primary/20 bg-primary/[0.02] shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <DollarSign size={13} /> Importe Total
              </span>
              <p className="text-xl font-black text-primary">
                ${Number(selectedInvoice.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })} {selectedInvoice.moneda || 'MXN'}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span>Subtotal: ${Number(selectedInvoice.subtotal || selectedInvoice.importe / 1.16).toFixed(2)}</span>
                <span>•</span>
                <span>IVA: ${Number(selectedInvoice.iva || (selectedInvoice.importe - (selectedInvoice.subtotal || selectedInvoice.importe / 1.16))).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Col: Original Document / Image Reference Card (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <ImageIcon size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Imagen / Documento Original</h3>
                    <p className="text-[11px] text-gray-500">Enlace o archivo físico vinculado</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEditImage(selectedInvoice)}
                  type="button"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Edit3 size={13} />
                  Editar enlace
                </button>
              </div>

              {/* Si es formato PDF (o archivo PDF vinculado) */}
              {isPdfInvoice(selectedInvoice) ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <FileText size={13} className="text-rose-600" /> Con Documento PDF Vinculado
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Check size={12} className="text-emerald-600" /> Con Imagen Vinculada (Formato PDF)
                    </span>
                  </div>

                  {getInvoiceDocumentUrl(selectedInvoice) ? (
                    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-xs flex flex-col">
                      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs">
                        <div className="flex items-center gap-2 truncate max-w-[200px]">
                          <FileText size={14} className="text-rose-600 shrink-0" />
                          <span className="font-semibold text-gray-800 truncate text-[11px]">
                            {selectedInvoice.imageReference || `factura_${selectedInvoice.numero_factura}.pdf`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={getInvoiceDocumentUrl(selectedInvoice)!}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-100 text-primary rounded-lg text-xs font-bold transition-all shadow-2xs"
                            title="Abrir PDF en pestaña completa"
                          >
                            <ExternalLink size={12} />
                            <span>Abrir PDF</span>
                          </a>
                          <a
                            href={getInvoiceDocumentUrl(selectedInvoice)!}
                            download={selectedInvoice.imageReference || `factura_${selectedInvoice.numero_factura}.pdf`}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-all shadow-2xs"
                            title="Descargar archivo"
                          >
                            <Download size={12} />
                          </a>
                          <button
                            type="button"
                            onClick={() => setPreviewImageSrc(getInvoiceDocumentUrl(selectedInvoice))}
                            className="p-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-all shadow-2xs"
                            title="Ver PDF en pantalla completa"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Visor PDF Iframe Embebido */}
                      <div className="w-full h-80 bg-gray-100 relative">
                        <iframe
                          src={`${getInvoiceDocumentUrl(selectedInvoice)}#toolbar=0&navpanes=0`}
                          title={`Visor PDF Factura ${selectedInvoice.numero_factura}`}
                          className="w-full h-full border-0 bg-white"
                        />
                      </div>

                      {/* Link de donde se guardó ese documento para referencia */}
                      <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-gray-600">
                          <span className="font-bold text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1">
                            <LinkIcon size={11} className="text-primary" /> Guardado / Archivo:
                          </span>
                          <span className="font-mono text-gray-800 text-[11px] truncate max-w-[220px]" title={selectedInvoice.imageReference || getInvoiceDocumentUrl(selectedInvoice)!}>
                            {selectedInvoice.imageReference || 'Comprobante PDF guardado'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200/60">
                          <span className="font-semibold text-emerald-700 flex items-center gap-1">
                            <Check size={11} /> Con Imagen Vinculada
                          </span>
                          <a
                            href={getInvoiceDocumentUrl(selectedInvoice)!}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline font-semibold flex items-center gap-1"
                          >
                            <ExternalLink size={11} /> Link para visualizar
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-gradient-to-b from-rose-50/50 to-white rounded-2xl border border-dashed border-rose-200 text-center space-y-3">
                      <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-800">Archivo PDF Referenciado</h4>
                        <p className="text-xs font-mono text-gray-700 mt-1 bg-gray-100 py-1 px-2.5 rounded-lg inline-block">
                          {selectedInvoice.imageReference}
                        </p>
                      </div>
                      <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                        Este comprobante fue leído en formato PDF. Puedes vincular una URL o enlace directo de la nube o servidor para visualizar la vista previa embebida.
                      </p>
                      <button
                        onClick={() => handleOpenEditImage(selectedInvoice)}
                        type="button"
                        className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
                      >
                        + Vincular enlace / URL del PDF
                      </button>
                    </div>
                  )}
                </div>
              ) : selectedInvoice.originalImageUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Check size={13} className="text-emerald-600" /> Con Imagen Vinculada
                    </span>
                  </div>
                  <div 
                    onClick={() => setPreviewImageSrc(selectedInvoice.originalImageUrl || null)}
                    className="relative group rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 max-h-[340px] flex items-center justify-center cursor-pointer shadow-inner"
                  >
                    <img 
                      src={selectedInvoice.originalImageUrl} 
                      alt={`Factura ${selectedInvoice.numero_factura}`} 
                      className="w-full object-contain max-h-[320px] transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                      <Eye size={16} />
                      Ver imagen en grande
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="font-bold text-[11px] uppercase tracking-wider text-gray-400">Referencia:</span>
                      <span className="font-mono text-gray-800 truncate max-w-[200px]">
                        {selectedInvoice.imageReference || 'Comprobante escaneado'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 pt-1 border-t border-gray-200/50">
                      <span className="font-bold text-[11px] uppercase tracking-wider text-gray-400">Enlace directo:</span>
                      <a 
                        href={selectedInvoice.originalImageUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 font-medium truncate max-w-[200px]"
                      >
                        <ExternalLink size={12} /> Abrir en nueva pestaña
                      </a>
                    </div>
                  </div>
                </div>
              ) : selectedInvoice.imageReference ? (
                <div className="p-6 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-dashed border-gray-300 text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Referencia a Archivo Local</h4>
                    <p className="text-xs font-mono text-gray-600 mt-1 bg-gray-100 py-1 px-2 rounded-lg inline-block">
                      {selectedInvoice.imageReference}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Puedes agregar la URL o enlace web directo de la imagen para visualizarla en cualquier momento.
                  </p>
                  <button
                    onClick={() => handleOpenEditImage(selectedInvoice)}
                    type="button"
                    className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
                  >
                    Añadir URL de la imagen
                  </button>
                </div>
              ) : (
                <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center space-y-3">
                  <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
                    <ImageIcon size={24} />
                  </div>
                  <h4 className="text-xs font-bold text-gray-700">Sin imagen o comprobante vinculado</h4>
                  <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                    Añade el enlace a la imagen escaneada o la referencia al documento original para mantener la trazabilidad.
                  </p>
                  <button
                    onClick={() => handleOpenEditImage(selectedInvoice)}
                    type="button"
                    className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 transition-all shadow-sm"
                  >
                    + Vincular imagen original
                  </button>
                </div>
              )}
            </div>

            {/* Right Col: Articles List & Breakdown (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Package size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Artículos y Conceptos Facturados ({selectedInvoice.articulos?.length || 0})
                    </h3>
                    <p className="text-[11px] text-gray-500">Desglose de refacciones y partes incluidas</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
                    {selectedInvoice.moneda || 'MXN'}
                  </span>
                  <button
                    onClick={() => setImportingInvoice(selectedInvoice)}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all shadow-xs"
                  >
                    <Package size={13} />
                    <span>Importar a Stock</span>
                  </button>
                </div>
              </div>

              {selectedInvoice.articulos && selectedInvoice.articulos.length > 0 ? (
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase">
                      <tr>
                        <th className="px-3.5 py-3">Código</th>
                        <th className="px-3.5 py-3">Descripción</th>
                        <th className="px-3.5 py-3 text-center">Cant.</th>
                        <th className="px-3.5 py-3 text-right">P. Unitario</th>
                        <th className="px-3.5 py-3 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedInvoice.articulos.map((art, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-3.5 py-3 font-mono text-gray-500 text-[11px]">
                            {art.codigo || <span className="text-amber-600 font-mono">null</span>}
                          </td>
                          <td className="px-3.5 py-3 font-medium text-gray-800">
                            {art.descripcion || <span className="text-amber-600 font-mono italic">null</span>}
                          </td>
                          <td className="px-3.5 py-3 text-center font-bold text-gray-700">
                            {art.cantidad !== null && art.cantidad !== undefined ? (
                              art.cantidad
                            ) : (
                              <span className="text-amber-600 font-mono text-[11px]">null</span>
                            )}
                          </td>
                          <td className="px-3.5 py-3 text-right font-medium text-gray-700">
                            {art.precio_unitario !== null && art.precio_unitario !== undefined ? (
                              `$${Number(art.precio_unitario).toFixed(2)}`
                            ) : (
                              <span className="text-amber-600 font-mono text-[11px]">null</span>
                            )}
                          </td>
                          <td className="px-3.5 py-3 text-right font-bold text-gray-900 font-mono">
                            {art.importe !== null && art.importe !== undefined ? (
                              `$${Number(art.importe).toFixed(2)}`
                            ) : (
                              art.cantidad && art.precio_unitario ? (
                                `$${(art.cantidad * art.precio_unitario).toFixed(2)}`
                              ) : (
                                <span className="text-amber-600 font-mono text-[11px]">null</span>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl">
                  <p className="text-xs">No hay desglose de artículos registrado para esta factura.</p>
                </div>
              )}

              {/* Total calculations recap */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-2 bg-gray-50/80 p-4 rounded-2xl border border-gray-100 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-800">
                      ${Number(selectedInvoice.subtotal || selectedInvoice.importe / 1.16).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>IVA Trasladado (16%)</span>
                    <span className="font-semibold text-gray-800">
                      ${Number(selectedInvoice.iva || (selectedInvoice.importe - (selectedInvoice.subtotal || selectedInvoice.importe / 1.16))).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-200 pt-2">
                    <span>Total {selectedInvoice.moneda || 'MXN'}</span>
                    <span className="text-primary font-mono">
                      ${Number(selectedInvoice.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* ============================================================== */
        /* VISTA 2: TABLA DE HISTORIAL DE FACTURAS (VISTA PRINCIPAL)       */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-primary/10 text-primary flex items-center gap-1">
                  <FileText size={12} />
                  Módulo de Gestión Fiscal
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {invoices.length} {invoices.length === 1 ? 'Factura Registrada' : 'Facturas Registradas'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Historial de Facturas</h1>
              <p className="text-sm text-gray-500 max-w-2xl">
                Consulta y gestiona facturas de proveedores con detalle de importes, artículos y referencias guardadas a las imágenes originales. Haz clic en cualquier factura para ver su detalle.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {onNavigateToExtractor && (
                <button
                  onClick={onNavigateToExtractor}
                  type="button"
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all shadow-md shadow-emerald-600/20"
                >
                  <Sparkles size={14} />
                  Escanear con Extractor IA
                </button>
              )}

              <button
                onClick={() => setIsCreateModalOpen(true)}
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                <Plus size={14} />
                Registrar Factura
              </button>

              {invoices.length === 0 && !loading && (
                <button
                  onClick={handleSeedSampleData}
                  type="button"
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  <RefreshCw size={14} />
                  Cargar Facturas de Prueba
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Facturas Totales</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{invoices.length}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monto Total Facturado</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">
                  ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ImageIcon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Con Imagen Vinculada</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">
                  {withImagesCount} <span className="text-xs font-normal text-gray-400">de {invoices.length}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar por número de factura, proveedor, fecha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 ring-primary/20 transition-all"
              />
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Mostrando <strong className="text-gray-900">{filteredInvoices.length}</strong> facturas
            </div>
          </div>

          {/* MAIN TABLE */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <Loader2 size={32} className="text-primary animate-spin mb-3" />
                <p className="text-sm font-bold text-gray-700">Cargando historial de facturas...</p>
              </div>
            ) : filteredInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-4">Número de Factura</th>
                      <th className="px-4 py-4">Fecha</th>
                      <th className="px-4 py-4">Proveedor</th>
                      <th className="px-4 py-4 text-right">Importe</th>
                      <th className="px-5 py-4">Imagen Original / Referencia</th>
                      <th className="px-4 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInvoices.map((inv) => (
                      <tr 
                        key={inv.id}
                        onClick={() => setSelectedInvoice(inv)}
                        className="group hover:bg-gray-50/70 cursor-pointer transition-colors"
                      >
                        {/* 1. NÚMERO DE FACTURA */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                              <FileText size={15} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 group-hover:text-primary transition-colors font-mono">
                                {inv.numero_factura}
                              </p>
                              <span className="text-[10px] text-gray-400">
                                {inv.articulos ? `${inv.articulos.length} artículos` : '1 documento'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. FECHA */}
                        <td className="px-4 py-4 text-gray-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-gray-400" />
                            <span>{inv.fecha}</span>
                          </div>
                        </td>

                        {/* 3. PROVEEDOR */}
                        <td className="px-4 py-4">
                          <div className="space-y-0.5 max-w-[240px]">
                            <p className="font-bold text-gray-800 truncate" title={inv.proveedor}>
                              {inv.proveedor}
                            </p>
                            {inv.rfc_proveedor && (
                              <p className="text-[10px] font-mono text-gray-400">
                                {inv.rfc_proveedor}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* 4. IMPORTE */}
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-black text-gray-900 font-mono">
                            ${Number(inv.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                          <p className="text-[10px] text-gray-400 uppercase font-semibold">
                            {inv.moneda || 'MXN'}
                          </p>
                        </td>

                        {/* 5. ENLACE O REFERENCIA A LA IMAGEN O DOCUMENTO ORIGINAL */}
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          {isPdfInvoice(inv) ? (
                            <div className="flex items-center gap-2">
                              {/* PDF icon preview */}
                              <div 
                                onClick={() => {
                                  const url = getInvoiceDocumentUrl(inv);
                                  if (url) setPreviewImageSrc(url);
                                  else setSelectedInvoice(inv);
                                }}
                                className="w-10 h-10 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 cursor-pointer hover:bg-rose-100 hover:ring-2 ring-rose-300 transition-all shadow-2xs"
                                title="Ver vista previa de PDF"
                              >
                                <FileText size={18} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                  <FileText size={10} /> Con PDF Vinculado
                                </span>
                                {getInvoiceDocumentUrl(inv) ? (
                                  <a 
                                    href={getInvoiceDocumentUrl(inv)!} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 truncate max-w-[150px] mt-0.5"
                                    title={inv.imageReference || 'Abrir documento PDF'}
                                  >
                                    <ExternalLink size={10} className="shrink-0" />
                                    <span className="truncate">{inv.imageReference || 'Ver PDF'}</span>
                                  </a>
                                ) : (
                                  <span className="text-[11px] font-mono text-gray-700 truncate block max-w-[150px] mt-0.5" title={inv.imageReference}>
                                    {inv.imageReference}
                                  </span>
                                )}
                                <button
                                  onClick={(e) => handleOpenEditImage(inv, e)}
                                  type="button"
                                  className="text-[10px] text-gray-400 hover:text-gray-700 flex items-center gap-0.5 mt-0.5"
                                >
                                  <Edit3 size={10} /> Editar enlace
                                </button>
                              </div>
                            </div>
                          ) : inv.originalImageUrl ? (
                            <div className="flex items-center gap-2">
                              {/* Thumbnail preview */}
                              <div 
                                onClick={() => setPreviewImageSrc(inv.originalImageUrl || null)}
                                className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0 cursor-pointer hover:ring-2 ring-primary/40 transition-all shadow-2xs"
                                title="Ver imagen original"
                              >
                                <img 
                                  src={inv.originalImageUrl} 
                                  alt="Factura" 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <Check size={10} /> Con Imagen Vinculada
                                </span>
                                <a 
                                  href={inv.originalImageUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 truncate max-w-[150px] mt-0.5"
                                  title={inv.imageReference || inv.originalImageUrl}
                                >
                                  <ExternalLink size={10} className="shrink-0" />
                                  <span className="truncate">{inv.imageReference || 'Ver imagen'}</span>
                                </a>
                                <button
                                  onClick={(e) => handleOpenEditImage(inv, e)}
                                  type="button"
                                  className="text-[10px] text-gray-400 hover:text-gray-700 flex items-center gap-0.5 mt-0.5"
                                >
                                  <Edit3 size={10} /> Editar enlace
                                </button>
                              </div>
                            </div>
                          ) : inv.imageReference ? (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-mono text-[11px] truncate max-w-[130px]" title={inv.imageReference}>
                                {inv.imageReference}
                              </span>
                              <button
                                onClick={(e) => handleOpenEditImage(inv, e)}
                                type="button"
                                className="p-1 text-primary hover:bg-primary/10 rounded-md transition-colors"
                                title="Modificar enlace a imagen"
                              >
                                <Edit3 size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => handleOpenEditImage(inv, e)}
                              type="button"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-primary/10 hover:text-primary text-gray-500 rounded-lg text-[11px] font-semibold transition-all border border-dashed border-gray-200"
                            >
                              <LinkIcon size={12} />
                              <span>+ Guardar enlace</span>
                            </button>
                          )}
                        </td>

                        {/* 6. ACCIONES */}
                        <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setImportingInvoice(inv);
                              }}
                              type="button"
                              className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                              title="Importar artículos a inventario"
                            >
                              <Package size={12} />
                              <span className="hidden sm:inline">Stock</span>
                            </button>
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              type="button"
                              className="px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                              title="Redirigir a detalle"
                            >
                              Ver detalle
                            </button>
                            <button
                              onClick={(e) => handleDeleteInvoice(inv.id!, e)}
                              type="button"
                              className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                              title="Eliminar factura"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 flex flex-col items-center justify-center text-center text-gray-400">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-3 border border-gray-100">
                  <FileText size={32} />
                </div>
                <h3 className="text-base font-bold text-gray-700">No se encontraron facturas</h3>
                <p className="text-xs text-gray-400 max-w-sm mt-1">
                  {searchTerm ? 'No hay facturas que coincidan con la búsqueda.' : 'Aún no hay facturas registradas en el historial.'}
                </p>
                <div className="flex items-center gap-3 mt-4">
                  {invoices.length === 0 && (
                    <button
                      onClick={handleSeedSampleData}
                      type="button"
                      className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
                    >
                      Cargar facturas de ejemplo
                    </button>
                  )}
                  {onNavigateToExtractor && (
                    <button
                      onClick={onNavigateToExtractor}
                      type="button"
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                    >
                      Escanear nueva factura
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: GUARDAR O EDITAR ENLACE A IMAGEN ORIGINAL               */}
      {/* ============================================================== */}
      <AnimatePresence>
        {editingImageInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-gray-100"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Enlace a Imagen Original</h3>
                    <p className="text-xs text-gray-500 font-mono">Factura: {editingImageInvoice.numero_factura}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingImageInvoice(null)}
                  type="button"
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 flex items-center gap-1">
                    <LinkIcon size={13} className="text-primary" />
                    URL / Enlace Web de la Imagen Original:
                  </label>
                  <input 
                    type="url"
                    placeholder="https://ejemplo.com/factura_escaneada.jpg"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:ring-2 ring-primary/20 outline-none transition-all"
                  />
                  <p className="text-[11px] text-gray-400">
                    Puedes pegar un enlace a Google Drive, Dropbox, Cloud Storage o cualquier URL pública.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 flex items-center gap-1">
                    <FileText size={13} className="text-gray-500" />
                    Nombre o Referencia del Archivo Original:
                  </label>
                  <input 
                    type="text"
                    placeholder="factura_proveedor_001.pdf"
                    value={newImageReference}
                    onChange={(e) => setNewImageReference(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:ring-2 ring-primary/20 outline-none transition-all font-mono"
                  />
                  <p className="text-[11px] text-gray-400">
                    Identificador o nombre de archivo escaneado para ubicarlo físicamente o en el servidor.
                  </p>
                </div>

                {/* Live Preview if valid URL */}
                {newImageUrl && (
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vista Previa:</span>
                    <div className="w-full h-36 rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                      <img 
                        src={newImageUrl} 
                        alt="Previsualización" 
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setEditingImageInvoice(null)}
                  type="button"
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={isSavingImage}
                  onClick={handleSaveImageReference}
                  type="button"
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {isSavingImage ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Guardar Referencia
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL: REGISTRAR NUEVA FACTURA MANUAL                          */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-gray-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Registrar Factura</h3>
                    <p className="text-xs text-gray-500">Ingreso manual al historial de facturas</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  type="button"
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Número de Factura *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="FAC-2024-001"
                      value={newInvoiceForm.numero_factura}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, numero_factura: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:bg-white outline-none focus:ring-2 ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Fecha *</label>
                    <input 
                      type="date" 
                      required
                      value={newInvoiceForm.fecha}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, fecha: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white outline-none focus:ring-2 ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Proveedor *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nombre o Razón Social"
                      value={newInvoiceForm.proveedor}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, proveedor: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white outline-none focus:ring-2 ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">RFC del Proveedor</label>
                    <input 
                      type="text" 
                      placeholder="XAXX010101000"
                      value={newInvoiceForm.rfc_proveedor}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, rfc_proveedor: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:bg-white outline-none focus:ring-2 ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Importe Total *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={newInvoiceForm.importe}
                        onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, importe: e.target.value })}
                        className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold font-mono text-xs focus:bg-white outline-none focus:ring-2 ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Moneda</label>
                    <select
                      value={newInvoiceForm.moneda}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, moneda: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white outline-none focus:ring-2 ring-primary/20"
                    >
                      <option value="MXN">MXN - Pesos Mexicanos</option>
                      <option value="USD">USD - Dólares Estadounidenses</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Enlace o URL a la Imagen Original</label>
                  <input 
                    type="url" 
                    placeholder="https://..."
                    value={newInvoiceForm.originalImageUrl}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, originalImageUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white outline-none focus:ring-2 ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Referencia o Nombre de Archivo del Comprobante</label>
                  <input 
                    type="text" 
                    placeholder="comprobante_fiscal_001.jpg"
                    value={newInvoiceForm.imageReference}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, imageReference: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:bg-white outline-none focus:ring-2 ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Artículos / Conceptos (un artículo por línea)</label>
                  <textarea 
                    rows={3}
                    placeholder="Filtro de Aceite John Deere RE59754&#10;Bomba de Agua Massey Ferguson"
                    value={newInvoiceForm.articulosText}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, articulosText: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white outline-none focus:ring-2 ring-primary/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={isCreatingInvoice}
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                  >
                    {isCreatingInvoice ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Guardar Factura
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* LIGHTBOX: PREVISUALIZACIÓN DE DOCUMENTO O IMAGEN COMPLETA       */}
      {/* ============================================================== */}
      <AnimatePresence>
        {previewImageSrc && (
          <div 
            onClick={() => setPreviewImageSrc(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm"
          >
            {previewImageSrc.toLowerCase().includes('.pdf') || previewImageSrc.startsWith('data:application/pdf') ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-[95vw] max-w-5xl h-[88vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-gray-700"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-rose-400" />
                    <span className="text-sm font-bold">Vista Previa del Documento PDF</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Con Imagen Vinculada (PDF)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={previewImageSrc}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
                      title="Abrir en nueva pestaña"
                    >
                      <ExternalLink size={13} /> Abrir
                    </a>
                    <a
                      href={previewImageSrc}
                      download="factura_documento.pdf"
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold transition-colors"
                      title="Descargar documento"
                    >
                      <Download size={13} /> Descargar
                    </a>
                    <button
                      onClick={() => setPreviewImageSrc(null)}
                      type="button"
                      className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors ml-1"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 w-full bg-gray-100">
                  <iframe 
                    src={`${previewImageSrc}#toolbar=1`}
                    title="Visor PDF Factura Completo"
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 cursor-zoom-out"
              >
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                    <Check size={12} className="text-emerald-400" /> Con Imagen Vinculada
                  </span>
                </div>
                <button
                  onClick={() => setPreviewImageSrc(null)}
                  type="button"
                  className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <img 
                  src={previewImageSrc} 
                  alt="Imagen original de factura" 
                  className="max-h-[82vh] w-auto mx-auto object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* MODAL IMPORTAR A INVENTARIO CON FOLIO DE FACTURA */}
      {importingInvoice && (
        <ImportInvoiceToStockModal
          isOpen={true}
          onClose={() => setImportingInvoice(null)}
          rawInvoiceNumber={importingInvoice.numero_factura}
          vendorName={importingInvoice.proveedor}
          articles={importingInvoice.articulos || []}
          invoiceHistoryId={importingInvoice.id}
          onNavigateToInventory={onNavigateToInventory}
          onSuccess={(count, invoiceRef) => {
            setInvoices(prev => prev.map(inv => {
              if (inv.id === importingInvoice.id) {
                return {
                  ...inv,
                  numero_factura: invoiceRef,
                  status: 'IMPORTADA_A_INVENTARIO'
                };
              }
              return inv;
            }));
            if (selectedInvoice && selectedInvoice.id === importingInvoice.id) {
              setSelectedInvoice(prev => prev ? ({
                ...prev,
                numero_factura: invoiceRef,
                status: 'IMPORTADA_A_INVENTARIO'
              }) : null);
            }
          }}
        />
      )}
    </div>
  );
};
