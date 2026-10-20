import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Check, 
  X, 
  AlertTriangle, 
  FileText, 
  ArrowRight, 
  Loader2, 
  Save, 
  RefreshCw, 
  Plus, 
  Tag, 
  DollarSign, 
  Building2, 
  CheckCircle2,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { Product, InvoiceArticle, InventoryMovement } from '../../types';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export interface EditableImportItem {
  id: string;
  selected: boolean;
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  precioVenta: number;
  marca: string;
  categoria: string;
  isExisting: boolean;
  existingProductId?: string;
  existingCurrentStock?: number;
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

const BRANDS = ["MF", "JD", "NH", "Ford", "Case", "Perkins", "Universal"];
const CATEGORIES = ["Motor", "Transmisión", "Hidráulica", "Eléctrico", "Filtros", "Rodamientos", "Otros"];

export const ImportInvoiceToStockModal: React.FC<ImportInvoiceToStockModalProps> = ({
  isOpen,
  onClose,
  rawInvoiceNumber,
  vendorName,
  articles,
  invoiceHistoryId,
  onSuccess,
  onNavigateToInventory
}) => {
  const [assignedInvoiceNumber, setAssignedInvoiceNumber] = useState('');
  const [vendor, setVendor] = useState('');
  const [items, setItems] = useState<EditableImportItem[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<{
    newProductsCount: number;
    updatedProductsCount: number;
    totalUnits: number;
    invoiceRef: string;
  } | null>(null);

  // Helper to detect brand from description
  const detectBrand = (desc: string): string => {
    const d = desc.toLowerCase();
    if (d.includes('john deere') || d.includes('jd')) return 'JD';
    if (d.includes('massey ferguson') || d.includes('mf') || d.includes('massey')) return 'MF';
    if (d.includes('new holland') || d.includes('nh')) return 'NH';
    if (d.includes('case') || d.includes('ih')) return 'Case';
    if (d.includes('ford')) return 'Ford';
    if (d.includes('perkins')) return 'Perkins';
    return 'MF';
  };

  // Helper to detect category from description
  const detectCategory = (desc: string): string => {
    const d = desc.toLowerCase();
    if (d.includes('filtro') || d.includes('filter')) return 'Filtros';
    if (d.includes('bomba') || d.includes('motor') || d.includes('pistón') || d.includes('piston') || 
        d.includes('anillo') || d.includes('biela') || d.includes('cigüeñal') || d.includes('valvula') || 
        d.includes('válvula') || d.includes('inyector') || d.includes('termostato')) return 'Motor';
    if (d.includes('hidráulic') || d.includes('hidraulic') || d.includes('manguera') || 
        d.includes('cilindro') || d.includes('retén') || d.includes('reten') || d.includes('sello') || 
        d.includes('dirección') || d.includes('direccion') || d.includes('jic')) return 'Hidráulica';
    if (d.includes('transmisión') || d.includes('transmision') || d.includes('engrane') || 
        d.includes('clutch') || d.includes('embrague') || d.includes('corona') || d.includes('flecha')) return 'Transmisión';
    if (d.includes('balero') || d.includes('rodamiento') || d.includes('cojinete')) return 'Rodamientos';
    if (d.includes('eléctric') || d.includes('electric') || d.includes('alternador') || 
        d.includes('marcha') || d.includes('sensor') || d.includes('batería') || d.includes('bateria') || 
        d.includes('relevador') || d.includes('foco')) return 'Eléctrico';
    return 'Otros';
  };

  // Initialize data when modal opens
  useEffect(() => {
    if (!isOpen) {
      setCompletedSummary(null);
      return;
    }

    const initInvoiceNumber = rawInvoiceNumber && rawInvoiceNumber !== 'null' 
      ? rawInvoiceNumber.trim() 
      : '';
    setAssignedInvoiceNumber(initInvoiceNumber);
    setVendor(vendorName && vendorName !== 'null' ? vendorName.trim() : 'Proveedor General');

    // Parse articles
    const preparedItems: EditableImportItem[] = articles.map((art, idx) => {
      const cleanDesc = art.descripcion && art.descripcion !== 'null' ? art.descripcion : `Artículo ${idx + 1}`;
      const detectedCode = art.codigo && art.codigo !== 'null' 
        ? art.codigo.trim() 
        : `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const qty = typeof art.cantidad === 'number' && art.cantidad > 0 ? art.cantidad : 1;
      
      let unitCost = typeof art.precio_unitario === 'number' && art.precio_unitario > 0 
        ? art.precio_unitario 
        : 0;
      
      if (unitCost === 0 && typeof art.importe === 'number' && art.importe > 0) {
        unitCost = Math.round((art.importe / qty) * 100) / 100;
      }

      const salePrice = unitCost > 0 ? Math.round(unitCost * 1.35 * 100) / 100 : 150;

      return {
        id: `item-${idx}`,
        selected: true,
        codigo: detectedCode,
        descripcion: cleanDesc,
        cantidad: qty,
        precioUnitario: unitCost,
        precioVenta: salePrice,
        marca: detectBrand(cleanDesc),
        categoria: detectCategory(cleanDesc),
        isExisting: false
      };
    });

    setItems(preparedItems);

    // Check against existing catalog in Firestore to see if pieces already exist
    const checkExistingCatalog = async () => {
      setLoadingExisting(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const catalogProducts: { id: string; pieceNumber: string; stock: number; }[] = [];
        querySnapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.pieceNumber) {
            catalogProducts.push({
              id: docSnap.id,
              pieceNumber: String(data.pieceNumber).trim().toUpperCase(),
              stock: Number(data.stock) || 0
            });
          }
        });

        setItems(prevItems => prevItems.map(item => {
          const upperCode = item.codigo.trim().toUpperCase();
          const match = catalogProducts.find(p => p.pieceNumber === upperCode);
          if (match) {
            return {
              ...item,
              isExisting: true,
              existingProductId: match.id,
              existingCurrentStock: match.stock
            };
          }
          return item;
        }));
      } catch (err) {
        console.error('Error checking catalog products:', err);
      } finally {
        setLoadingExisting(false);
      }
    };

    checkExistingCatalog();
  }, [isOpen, rawInvoiceNumber, vendorName, articles]);

  const handleItemChange = (index: number, field: keyof EditableImportItem, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value
      };
      // If precioUnitario changes, auto-suggest precioVenta (+35%)
      if (field === 'precioUnitario') {
        const cost = parseFloat(value) || 0;
        copy[index].precioVenta = Math.round(cost * 1.35 * 100) / 100;
      }
      return copy;
    });
  };

  const handleToggleSelectAll = () => {
    const allSelected = items.every(i => i.selected);
    setItems(prev => prev.map(i => ({ ...i, selected: !allSelected })));
  };

  const handleExecuteImport = async () => {
    const finalInvoiceRef = assignedInvoiceNumber.trim();
    if (!finalInvoiceRef) {
      toast.error('Número de Factura Obligatorio', {
        description: 'Por favor asigna o confirma el número de factura para que el stock quede debidamente referenciado.'
      });
      return;
    }

    const selectedItems = items.filter(i => i.selected);
    if (selectedItems.length === 0) {
      toast.warning('Selecciona al menos un artículo para importar al inventario');
      return;
    }

    setIsImporting(true);
    try {
      let newCount = 0;
      let updatedCount = 0;
      let totalUnitsSum = 0;
      const currentUserId = auth.currentUser?.uid || 'usuario-facturacion';

      for (const item of selectedItems) {
        const qty = item.cantidad > 0 ? item.cantidad : 1;
        totalUnitsSum += qty;
        const costPrice = item.precioUnitario >= 0 ? item.precioUnitario : 0;
        const salePrice = item.precioVenta > 0 ? item.precioVenta : Math.round(costPrice * 1.35 * 100) / 100;

        if (item.isExisting && item.existingProductId) {
          // UPDATE EXISTING PRODUCT
          const newTotalStock = (item.existingCurrentStock || 0) + qty;
          await updateDoc(doc(db, 'products', item.existingProductId), {
            stock: newTotalStock,
            purchasePrice: costPrice > 0 ? costPrice : undefined,
            salePrice: salePrice > 0 ? salePrice : undefined,
            invoiceReference: finalInvoiceRef,
            vendorId: vendor || 'Proveedor General'
          });

          // Record Inventory Movement
          await addDoc(collection(db, 'inventoryMovements'), {
            productId: item.existingProductId,
            type: 'IN',
            quantity: qty,
            reason: `Entrada por Factura ${finalInvoiceRef} (${qty} uds.)`,
            timestamp: new Date().toISOString(),
            userId: currentUserId,
            invoiceReference: finalInvoiceRef
          });

          updatedCount++;
        } else {
          // CREATE NEW PRODUCT
          const newDocRef = await addDoc(collection(db, 'products'), {
            pieceNumber: item.codigo.trim(),
            description: item.descripcion.trim(),
            brand: item.marca || 'MF',
            model: 'Universal',
            category: item.categoria || 'Otros',
            purchasePrice: costPrice,
            salePrice: salePrice,
            stock: qty,
            minStock: 2,
            maxStock: 50,
            location: 'Almacén / Recepción',
            imageUrl: '',
            barcode: item.codigo.trim(),
            vendorId: vendor || 'Proveedor General',
            leadTime: 7,
            invoiceReference: finalInvoiceRef
          });

          // Record Inventory Movement
          await addDoc(collection(db, 'inventoryMovements'), {
            productId: newDocRef.id,
            type: 'IN',
            quantity: qty,
            reason: `Alta de Stock según Factura ${finalInvoiceRef}`,
            timestamp: new Date().toISOString(),
            userId: currentUserId,
            invoiceReference: finalInvoiceRef
          });

          newCount++;
        }
      }

      // If tied to an invoice history document, update its record
      if (invoiceHistoryId) {
        try {
          await updateDoc(doc(db, 'invoices_history', invoiceHistoryId), {
            status: 'IMPORTADA_A_INVENTARIO',
            importedToInventory: true,
            importedAt: new Date().toISOString(),
            numero_factura: finalInvoiceRef
          });
        } catch (err) {
          console.warn('Could not update invoice history status:', err);
        }
      }

      setCompletedSummary({
        newProductsCount: newCount,
        updatedProductsCount: updatedCount,
        totalUnits: totalUnitsSum,
        invoiceRef: finalInvoiceRef
      });

      toast.success('¡Inventario Actualizado!', {
        description: `Se integraron ${selectedItems.length} artículos referidos a la Factura "${finalInvoiceRef}".`
      });

      if (onSuccess) {
        onSuccess(selectedItems.length, finalInvoiceRef);
      }
    } catch (err: any) {
      console.error('Error executing inventory import:', err);
      handleFirestoreError(err, OperationType.CREATE, 'products');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white flex items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 shrink-0">
              <Package size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-bold leading-tight">Importar Artículos al Stock</h2>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider bg-white/10 px-2 py-0.5 rounded-full text-emerald-400 border border-emerald-400/20">
                  Trazabilidad Fiscal
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-300 mt-0.5 line-clamp-1">
                Integra automáticamente las refacciones al catálogo con su número de factura asignado.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 sm:p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors shrink-0"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* COMPLETED SUCCESS STATE */}
        {completedSummary ? (
          <div className="p-8 space-y-6 text-center max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Artículos Integrados al Stock</h3>
              <p className="text-xs text-gray-500">
                Todos los artículos han sido guardados en el inventario vinculados formalmente a la factura:
              </p>
              <div className="inline-block px-3 py-1.5 bg-primary/10 text-primary font-mono font-bold text-sm rounded-xl border border-primary/20">
                {completedSummary.invoiceRef}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Nuevas Refacciones</p>
                <p className="text-lg font-black text-gray-900">{completedSummary.newProductsCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Stock Actualizado</p>
                <p className="text-lg font-black text-emerald-600">+{completedSummary.updatedProductsCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Total Unidades</p>
                <p className="text-lg font-black text-primary">{completedSummary.totalUnits}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                type="button"
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cerrar
              </button>
              {onNavigateToInventory && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToInventory();
                  }}
                  type="button"
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs shadow-md shadow-primary/25 transition-all"
                >
                  <Package size={15} />
                  Ver en Inventario
                </button>
              )}
            </div>
          </div>
        ) : (
          /* FORM & REVIEW STATE */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Invoice Reference Confirmation Box (CRITICAL REQUIREMENT) */}
            <div className={cn(
              "p-4 rounded-2xl border transition-all",
              !assignedInvoiceNumber.trim() 
                ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-200" 
                : "bg-emerald-50/50 border-emerald-200"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className={!assignedInvoiceNumber.trim() ? "text-amber-600" : "text-emerald-600"} />
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-800">
                      Número de Factura de Referencia *
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {!assignedInvoiceNumber.trim() 
                      ? '⚠️ La factura no tenía folio claro. Por favor asigna el número de factura para que el stock quede formalmente referenciado.' 
                      : 'Este folio quedará grabado en cada refacción (columna de stock) y en el registro de movimientos del almacén.'}
                  </p>
                </div>

                <div className="w-full sm:w-72 space-y-1">
                  <input
                    type="text"
                    required
                    placeholder="Ej. FAC-2024-00892"
                    value={assignedInvoiceNumber}
                    onChange={(e) => setAssignedInvoiceNumber(e.target.value)}
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold outline-none transition-all",
                      !assignedInvoiceNumber.trim()
                        ? "bg-white border-2 border-amber-400 text-amber-900 focus:ring-2 ring-amber-300"
                        : "bg-white border border-emerald-300 text-gray-900 focus:ring-2 ring-emerald-300"
                    )}
                  />
                  {!assignedInvoiceNumber.trim() && (
                    <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                      <AlertTriangle size={11} /> Campo requerido para importar
                    </span>
                  )}
                </div>
              </div>

              {/* Vendor metadata input */}
              <div className="mt-3 pt-3 border-t border-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-gray-600 font-medium flex items-center gap-1.5">
                  <Building2 size={13} className="text-gray-400" />
                  Proveedor de Origen:
                </span>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="Nombre del proveedor"
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 font-medium sm:w-72 outline-none focus:ring-1 ring-primary"
                />
              </div>
            </div>

            {/* Articles Table Review */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers size={14} className="text-primary" />
                    Artículos a Integrar al Catálogo ({items.filter(i => i.selected).length} de {items.length} seleccionados)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Verifica o modifica los códigos de parte, cantidades y costos antes de confirmar el ingreso a stock.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {items.every(i => i.selected) ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2.5 text-center w-10">Sel.</th>
                        <th className="px-3 py-2.5">Código / Parte</th>
                        <th className="px-3 py-2.5">Descripción de la Refacción</th>
                        <th className="px-3 py-2.5 text-center w-20">Cant. Stock</th>
                        <th className="px-3 py-2.5 text-right w-24">Costo Unit.</th>
                        <th className="px-3 py-2.5 text-right w-24">P. Venta</th>
                        <th className="px-3 py-2.5 w-24">Marca</th>
                        <th className="px-3 py-2.5 w-28">Categoría</th>
                        <th className="px-3 py-2.5 text-center w-28">Estado en Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item, idx) => (
                        <tr 
                          key={item.id} 
                          className={cn(
                            "transition-colors",
                            item.selected ? "hover:bg-primary/[0.02]" : "opacity-50 bg-gray-50/50"
                          )}
                        >
                          {/* Checkbox */}
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={(e) => handleItemChange(idx, 'selected', e.target.checked)}
                              className="rounded text-primary focus:ring-primary/20 cursor-pointer"
                            />
                          </td>

                          {/* Code */}
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.codigo}
                              onChange={(e) => handleItemChange(idx, 'codigo', e.target.value)}
                              placeholder="Código OEM"
                              className="w-28 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg font-mono text-[11px] font-bold focus:bg-white outline-none focus:ring-1 ring-primary"
                            />
                          </td>

                          {/* Description */}
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.descripcion}
                              onChange={(e) => handleItemChange(idx, 'descripcion', e.target.value)}
                              placeholder="Descripción"
                              className="w-full min-w-[200px] px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white outline-none focus:ring-1 ring-primary"
                            />
                          </td>

                          {/* Quantity */}
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => handleItemChange(idx, 'cantidad', parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold text-xs focus:bg-white outline-none focus:ring-1 ring-primary"
                            />
                          </td>

                          {/* Cost */}
                          <td className="px-3 py-2 text-right">
                            <div className="relative">
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.precioUnitario}
                                onChange={(e) => handleItemChange(idx, 'precioUnitario', parseFloat(e.target.value) || 0)}
                                className="w-20 pl-4 pr-1.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-right font-mono text-xs focus:bg-white outline-none focus:ring-1 ring-primary"
                              />
                            </div>
                          </td>

                          {/* Sale Price */}
                          <td className="px-3 py-2 text-right">
                            <div className="relative">
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.precioVenta}
                                onChange={(e) => handleItemChange(idx, 'precioVenta', parseFloat(e.target.value) || 0)}
                                className="w-20 pl-4 pr-1.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-right font-mono font-bold text-xs text-primary focus:bg-white outline-none focus:ring-1 ring-primary"
                              />
                            </div>
                          </td>

                          {/* Brand */}
                          <td className="px-3 py-2">
                            <select
                              value={item.marca}
                              onChange={(e) => handleItemChange(idx, 'marca', e.target.value)}
                              className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:bg-white outline-none"
                            >
                              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </td>

                          {/* Category */}
                          <td className="px-3 py-2">
                            <select
                              value={item.categoria}
                              onChange={(e) => handleItemChange(idx, 'categoria', e.target.value)}
                              className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white outline-none"
                            >
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>

                          {/* Existing Status Badge */}
                          <td className="px-3 py-2 text-center">
                            {item.isExisting ? (
                              <span 
                                className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-semibold text-[10px]"
                                title={`Existe en catálogo con ${item.existingCurrentStock || 0} uds. Se sumará al stock.`}
                              >
                                Sumar (+{item.cantidad})
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-semibold text-[10px]">
                                Nuevo Item
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Info summary */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-gray-600">
                <span>Artículos seleccionados: <strong className="text-gray-900">{items.filter(i => i.selected).length}</strong></span>
                <span className="mx-2">•</span>
                <span>Unidades totales: <strong className="text-gray-900">{items.filter(i => i.selected).reduce((s, i) => s + (i.cantidad || 0), 0)}</strong></span>
                <span className="mx-2">•</span>
                <span>Costo total inversión: <strong className="text-gray-900">${items.filter(i => i.selected).reduce((s, i) => s + ((i.cantidad || 0) * (i.precioUnitario || 0)), 0).toFixed(2)}</strong></span>
              </div>

              <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-lg">
                Referencia: {assignedInvoiceNumber.trim() || 'Pendiente de asignar'}
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        {!completedSummary && (
          <div className="p-3.5 sm:p-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 shrink-0">
            <button
              onClick={onClose}
              type="button"
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 transition-colors text-center"
            >
              Cancelar
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={isImporting || !assignedInvoiceNumber.trim() || items.filter(i => i.selected).length === 0}
              type="button"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span className="truncate">Integrar {items.filter(i => i.selected).length} Artículos al Inventario</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
