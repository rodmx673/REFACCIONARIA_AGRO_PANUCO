import React, { useState, useEffect, useRef } from 'react';
import { Package, Check, X, AlertTriangle, FileText, Save, Loader2, Camera, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { InvoiceArticle } from '../../types';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

// -- COMPRESIÓN --
const compressImage = (base64Str: string, maxWidth = 600, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', quality)); }
      else { resolve(base64Str); }
    };
  });
};

// -- CLOUDINARY --
const uploadToCloudinary = async (base64Image: string): Promise<string> => {
  const cloudName = 'dabe5peol';
  const uploadPreset = 'REFACCIONARIA_PANUCO';
  const formData = new FormData();
  formData.append('file', base64Image);
  formData.append('upload_preset', uploadPreset);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
  const data = await response.json();
  if (data.secure_url) return data.secure_url;
  throw new Error('Error al subir imagen');
};

interface EditableImportItem {
  id: string;
  selected: boolean;
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  precioVenta: number;
  marca: string;
  categoria: string;
  photoUrl?: string;
  isUploading?: boolean;
}

interface ImportInvoiceToStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawInvoiceNumber: string | null;
  vendorName: string | null;
  articles: InvoiceArticle[];
  invoiceHistoryId?: string;
  onSuccess?: (importedCount: number, assignedInvoiceNumber: string) => void;
  onNavigateToInventory?: () => void;
}

export const ImportInvoiceToStockModal: React.FC<ImportInvoiceToStockModalProps> = ({
  isOpen, onClose, rawInvoiceNumber, vendorName, articles, invoiceHistoryId, onSuccess, onNavigateToInventory
}) => {
  const [assignedInvoiceNumber, setAssignedInvoiceNumber] = useState('');
  const [vendor, setVendor] = useState('');
  const [items, setItems] = useState<EditableImportItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isUploadingSummary, setIsUploadingSummary] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const [completedSummary, setCompletedSummary] = useState<{
    newProductsCount: number;
    totalUnits: number;
    invoiceRef: string;
    isComplete: boolean;
    missingItems: EditableImportItem[];
    summaryImageUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) { setCompletedSummary(null); return; }
    setAssignedInvoiceNumber(rawInvoiceNumber || '');
    setVendor(vendorName || 'PROVEEDOR GENERAL');
    const prepared: EditableImportItem[] = articles.map((art, idx) => {
      const qty = typeof art.cantidad === 'number' && art.cantidad > 0 ? art.cantidad : 1;
      const cost = typeof art.precio_unitario === 'number' ? art.precio_unitario : 0;
      return {
        id: `item-${idx}`,
        selected: true,
        codigo: art.codigo || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        descripcion: art.descripcion || `Artículo ${idx + 1}`,
        cantidad: qty,
        precioUnitario: cost,
        precioVenta: cost > 0 ? Math.round(cost * 1.35 * 100) / 100 : 150,
        marca: 'GENÉRICA / OEM',
        categoria: 'Otros'
      };
    });
    setItems(prepared);
  }, [isOpen, rawInvoiceNumber, vendorName, articles]);

  const handleItemChange = (index: number, field: keyof EditableImportItem, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'precioUnitario') copy[index].precioVenta = Math.round(Number(value) * 1.35 * 100) / 100;
      return copy;
    });
  };

  const handlePhotoUpload = async (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setItems(prev => { const c = [...prev]; c[index].isUploading = true; return c; });
      try {
        const compressed = await compressImage(base64);
        const url = await uploadToCloudinary(compressed);
        setItems(prev => { const c = [...prev]; c[index].photoUrl = url; c[index].isUploading = false; return c; });
        toast.success('Foto agregada');
      } catch (err) {
        toast.error('Error al subir foto');
        setItems(prev => { const c = [...prev]; c[index].isUploading = false; return c; });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExecuteImport = async () => {
    if (!assignedInvoiceNumber.trim()) { toast.error('Falta número de factura'); return; }
    const received = items.filter(i => i.selected);
    const missing = items.filter(i => !i.selected);
    if (received.length === 0) { toast.warning('No hay artículos recibidos'); return; }

    setIsImporting(true);
    try {
      let newCount = 0;
      let totalUnits = 0;
      const url = import.meta.env.VITE_APPS_SCRIPT_URL;

      for (const item of received) {
        totalUnits += item.cantidad;
        const res = await fetch(url, { method: 'POST', body: JSON.stringify({ action: 'createProduct', data: {
          pieceNumber: item.codigo, description: item.descripcion, brand: item.marca,
          purchasePrice: item.precioUnitario, salePrice: item.precioVenta, stock: item.cantidad,
          minStock: 2, maxStock: 50, location: 'RECEPCIÓN', imageUrl: item.photoUrl || '',
          invoiceReference: assignedInvoiceNumber, vendorId: vendor
        }})});
        const data = await res.json();
        if (data.success) {
          newCount++;
          await fetch(url, { method: 'POST', body: JSON.stringify({ action: 'createMovement', data: {
            productId: data.data.id, type: 'IN', quantity: item.cantidad,
            reason: `Recepción Factura ${assignedInvoiceNumber}`,
            timestamp: new Date().toISOString(), userId: 'admin', invoiceReference: assignedInvoiceNumber
          }})});
        }
      }

      const summaryData = {
        newProductsCount: newCount, totalUnits, invoiceRef: assignedInvoiceNumber,
        isComplete: missing.length === 0, missingItems: missing, summaryImageUrl: ''
      };
      setCompletedSummary(summaryData);

      // Después de mostrar el resumen, capturamos y subimos a Cloudinary
      setIsUploadingSummary(true);
      setTimeout(async () => {
        try {
          if (summaryRef.current) {
            const dataUrl = await toPng(summaryRef.current, { quality: 0.9, pixelRatio: 2 });
            const cloudUrl = await uploadToCloudinary(dataUrl);
            
            // Actualizar resumen con la URL
            setCompletedSummary(prev => prev ? { ...prev, summaryImageUrl: cloudUrl } : null);

            // Guardar en el historial de facturas
            if (invoiceHistoryId) {
              await fetch(url, { method: 'POST', body: JSON.stringify({ action: 'updateInvoiceHistory', data: {
                id: invoiceHistoryId,
                status: missing.length === 0 ? 'COMPLETA' : 'INCOMPLETA',
                summaryImageUrl: cloudUrl,
                summaryStatus: missing.length === 0 ? 'COMPLETA' : 'INCOMPLETA',
                faltantes: missing.map(m => ({ codigo: m.codigo, descripcion: m.descripcion, cantidad: m.cantidad }))
              }})});
            }
            toast.success('Resumen guardado en la nube');
          }
        } catch (err) {
          console.error('Error al capturar resumen:', err);
          toast.error('No se pudo guardar la imagen del resumen');
        } finally {
          setIsUploadingSummary(false);
        }
      }, 500);
      
      if (onSuccess) onSuccess(newCount, assignedInvoiceNumber);
    } catch (err: any) {
      toast.error('Error al procesar la factura');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden">
        
        <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg"><Package size={20} /></div>
            <div>
              <h2 className="text-lg font-bold">Hoja de Recepción Física</h2>
              <p className="text-xs text-gray-300">Confirma los artículos recibidos antes de guardar.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-xl"><X size={20} /></button>
        </div>

        {completedSummary ? (
          <div className="p-8 space-y-6 text-center max-w-md mx-auto my-auto">
            {/* Área que se captura en imagen */}
            <div ref={summaryRef} className="p-6 bg-white space-y-4">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg",
                completedSummary.isComplete ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
              )}>
                {completedSummary.isComplete ? <CheckCircle2 size={40} /> : <AlertTriangle size={40} />}
              </div>
              
              <div className="space-y-2">
                <h3 className={cn("text-xl font-bold", completedSummary.isComplete ? "text-emerald-900" : "text-orange-900")}>
                  {completedSummary.isComplete ? 'Factura 100% Completa' : 'Factura Incompleta'}
                </h3>
                <p className="text-xs text-gray-500">Factura procesada:</p>
                <div className="inline-block px-3 py-1.5 bg-gray-100 font-mono font-bold text-sm rounded-xl border">
                  {completedSummary.invoiceRef}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">{new Date().toLocaleString('es-MX')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Recibidos</p>
                  <p className="text-lg font-black text-gray-900">{completedSummary.newProductsCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Faltantes</p>
                  <p className={cn("text-lg font-black", completedSummary.missingItems.length > 0 ? "text-orange-600" : "text-gray-400")}>
                    {completedSummary.missingItems.length}
                  </p>
                </div>
              </div>

              {completedSummary.missingItems.length > 0 && (
                <div className="text-left bg-orange-50 p-3 rounded-xl border border-orange-200 space-y-1">
                  <p className="text-[10px] font-bold text-orange-700 uppercase">Artículos NO Recibidos:</p>
                  {completedSummary.missingItems.map((m, i) => (
                    <p key={i} className="text-[11px] text-orange-900 font-mono">
                      • {m.codigo}: {m.descripcion} ({m.cantidad} pzas)
                    </p>
                  ))}
                </div>
              )}
            </div>

            {isUploadingSummary && (
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Loader2 size={14} className="animate-spin" /> Guardando resumen en la nube...
              </div>
            )}

            <div className="flex justify-center gap-3 pt-2">
              <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 rounded-xl font-bold text-xs">Cerrar</button>
              {onNavigateToInventory && (
                <button onClick={() => { onClose(); onNavigateToInventory(); }} className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-xs shadow-md">Ir al Inventario</button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Número de Factura *</label>
                <input type="text" value={assignedInvoiceNumber} onChange={(e) => setAssignedInvoiceNumber(e.target.value.toUpperCase())} className="w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm font-mono font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Proveedor</label>
                <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value.toUpperCase())} className="w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm font-medium" />
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b text-[10px] font-bold text-gray-400 uppercase">
                    <tr>
                      <th className="px-3 py-3 text-center w-12 text-emerald-600">Recibido</th>
                      <th className="px-3 py-3">Código / Descripción</th>
                      <th className="px-3 py-3 text-center w-16">Cant.</th>
                      <th className="px-3 py-3 text-center w-20 text-orange-600">Mín. Alerta</th>
                      <th className="px-3 py-3 text-center w-16">Foto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr key={item.id} className={cn("transition-colors", item.selected ? "bg-white" : "bg-gray-50/60 opacity-60")}>
                        <td className="px-3 py-3 text-center">
                          <button type="button" onClick={() => handleItemChange(idx, 'selected', !item.selected)} className={cn("w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all shadow-sm", item.selected ? "bg-emerald-500 text-white" : "bg-red-100 text-red-500")}>
                            {item.selected ? <Check size={16} /> : <X size={16} />}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1">
                            <input type="text" value={item.codigo} onChange={(e) => handleItemChange(idx, 'codigo', e.target.value.toUpperCase())} className="px-2 py-1 bg-gray-50 border rounded-md font-mono text-[11px] font-bold w-32" />
                            <input type="text" value={item.descripcion} onChange={(e) => handleItemChange(idx, 'descripcion', e.target.value.toUpperCase())} className="px-2 py-1 bg-gray-50 border rounded-md text-xs w-full" />
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input type="number" min="1" value={item.cantidad} onChange={(e) => handleItemChange(idx, 'cantidad', parseInt(e.target.value) || 1)} className="w-14 px-2 py-1 bg-gray-50 border rounded-md text-center font-bold text-sm" />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input type="number" min="0" value={item.minStock} onChange={(e) => handleItemChange(idx, 'minStock', parseInt(e.target.value) || 0)} className="w-14 px-2 py-1 bg-orange-50 border border-orange-200 text-orange-800 rounded-md text-center font-bold text-sm" title="Cantidad mínima antes de alertar" />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <label title="Tomar foto o elegir de la galería" className={cn("w-10 h-10 rounded-lg border-2 border-dashed flex items-center justify-center mx-auto cursor-pointer overflow-hidden", item.photoUrl ? "border-emerald-500 bg-emerald-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100")}>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(idx, f); }} />
                            {item.isUploading ? <Loader2 size={16} className="animate-spin text-emerald-500" /> :
                             item.photoUrl ? <img src={item.photoUrl} alt="Foto" className="w-full h-full object-cover" /> :
                             <Camera size={16} className="text-gray-400" />}
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <Info size={12} /> Los artículos con <X size={10} className="inline text-red-500" /> NO se enviarán al inventario, pero quedarán registrados como faltantes en el historial.
            </p>
          </div>
        )}

        {!completedSummary && (
          <div className="p-4 bg-gray-50 border-t flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-500">Cancelar</button>
                        <button
              onClick={handleExecuteImport}
              disabled={isImporting}
              className="w-full sm:w-auto px-6 py-3 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary/95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Procesando artículos...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Confirmar Recepción y Procesar</span>
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};