import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Printer, 
  QrCode, 
  Download, 
  Check, 
  Copy, 
  Sliders, 
  Package, 
  Tag, 
  Layers, 
  Eye, 
  Settings2,
  RefreshCw,
  Tractor,
  MapPin,
  DollarSign
} from 'lucide-react';
import QRCode from 'qrcode';
import { Product } from '../types';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

export type LabelTemplate = 'thermal_50x30' | 'shelf_70x40' | 'compact_40x25' | 'sheet_avery_30';

interface PartQRLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[]; // One or multiple products
  selectedProduct?: Product | null;
}

export const PartQRLabelModal: React.FC<PartQRLabelModalProps> = ({
  isOpen,
  onClose,
  products: allProducts,
  selectedProduct
}) => {
  // Active product to preview
  const [activeProduct, setActiveProduct] = useState<Product | null>(
    selectedProduct || allProducts[0] || null
  );

  // Template & Layout Options
  const [template, setTemplate] = useState<LabelTemplate>('thermal_50x30');
  const [showStoreName, setShowStoreName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showBrandModel, setShowBrandModel] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [qrContentType, setQrContentType] = useState<'pieceNumber' | 'barcode' | 'posCode'>('pieceNumber');
  const [copiesPerProduct, setCopiesPerProduct] = useState<number>(1);
  const [customStoreName, setCustomStoreName] = useState('Farmer Parts');

  // Multi-product printing mode
  const [printAllFiltered, setPrintAllFiltered] = useState(false);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});

  // Generated QR Data URL cache
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrCache, setQrCache] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const previewLabelRef = useRef<HTMLDivElement>(null);

  // When selectedProduct changes, update activeProduct
  useEffect(() => {
    if (selectedProduct) {
      setActiveProduct(selectedProduct);
      setPrintAllFiltered(false);
    } else if (allProducts.length > 0 && !activeProduct) {
      setActiveProduct(allProducts[0]);
    }
  }, [selectedProduct, allProducts]);

  // Compute what text is encoded in the QR code
  const getQrValue = (prod: Product): string => {
    if (qrContentType === 'barcode' && prod.barcode) {
      return String(prod.barcode);
    }
    if (qrContentType === 'posCode') {
      // Direct POS scan payload
      return String(prod.pieceNumber || '');
    }
    // Default: Part Number (best for POS camera scanner and search)
    return String(prod.pieceNumber || '');
  };

  // Generate QR for active product preview
  useEffect(() => {
    if (!activeProduct) return;

    const value = getQrValue(activeProduct);
    const cacheKey = `${activeProduct.id}_${value}`;

    if (qrCache[cacheKey]) {
      setQrDataUrl(qrCache[cacheKey]);
      return;
    }

    setIsGenerating(true);
    if (!value || String(value).trim() === '') {
      console.warn('No se puede generar QR sin texto');
      setIsGenerating(false);
      return;
    }

    QRCode.toDataURL(String(value), {
      width: 280,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        setQrDataUrl(url);
        setQrCache(prev => ({ ...prev, [cacheKey]: url }));
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
      })
      .finally(() => {
        setIsGenerating(false);
      });
  }, [activeProduct, qrContentType]);

  // Pre-generate QR codes for all items when printing batch
  const generateAllQrCodes = async (items: Product[]): Promise<Record<string, string>> => {
    const newCache: Record<string, string> = { ...qrCache };
    for (const item of items) {
      const val = getQrValue(item);
      const key = `${item.id}_${val}`;
      if (!newCache[key]) {
        try {
          const url = await QRCode.toDataURL(val, {
            width: 250,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'M'
          });
          newCache[key] = url;
        } catch (e) {
          console.error(e);
        }
      }
    }
    setQrCache(newCache);
    return newCache;
  };

  // Trigger Print Dialog
  const handlePrint = async () => {
    const itemsToPrint = printAllFiltered ? allProducts : (activeProduct ? [activeProduct] : []);
    if (itemsToPrint.length === 0) return;

    setIsGenerating(true);
    await generateAllQrCodes(itemsToPrint);
    setIsGenerating(false);

    // Call window.print()
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Download Preview Label as PNG
  const handleDownloadLabel = () => {
    if (!qrDataUrl || !activeProduct) return;

    // Create a high resolution canvas to draw label
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 600;
    const height = 360;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Outer border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Store header bar
    if (showStoreName) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText(customStoreName.toUpperCase(), 30, 45);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText('REFACCIONES AGRÍCOLAS', 30, 68);
    }

    // Draw QR Code
    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 30, 90, 180, 180);

      // Part Number
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 32px monospace';
      ctx.fillText(activeProduct.pieceNumber, 230, 130);

      // Description
      if (showDescription) {
        ctx.fillStyle = '#475569';
        ctx.font = '500 18px system-ui, sans-serif';
        const desc = activeProduct.description.length > 35 
          ? activeProduct.description.substring(0, 32) + '...'
          : activeProduct.description;
        ctx.fillText(desc, 230, 165);
      }

      // Brand & Model
      if (showBrandModel) {
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 18px system-ui, sans-serif';
        ctx.fillText(`${activeProduct.brand} • ${activeProduct.model || 'Universal'}`, 230, 205);
      }

      // Price & Location Bar
      if (showPrice) {
        ctx.fillStyle = '#16a34a';
        ctx.font = '900 34px system-ui, sans-serif';
        ctx.fillText(formatCurrency(activeProduct.salePrice), 230, 260);
      }

      if (showLocation && activeProduct.location) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`UBIC: ${activeProduct.location}`, 230, 295);
      }

      // Download
      const link = document.createElement('a');
      link.download = `Etiqueta_QR_${activeProduct.pieceNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Etiqueta descargada en PNG');
    };
    qrImg.src = qrDataUrl;
  };

  const handleCopyCode = () => {
    if (!activeProduct) return;
    const val = getQrValue(activeProduct);
    navigator.clipboard.writeText(val);
    setCopied(true);
    toast.success(`Código copiado: ${val}`);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  // Determine list of items for the print layout
  const itemsToRender = printAllFiltered ? allProducts : (activeProduct ? [activeProduct] : []);

  return (
    <>
      <AnimatePresence>
        <motion.div
          id="qr-label-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm overflow-y-auto no-print"
          onClick={onClose}
        >
          <motion.div
            id="qr-label-modal-dialog"
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-100 my-auto"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-primary/5 shrink-0 gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-inner shrink-0">
                  <QrCode size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 tracking-tight truncate">
                    Generador de Etiquetas QR
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">
                    Etiquetado térmico y hojas adhesivas para Caja / Punto de Venta
                  </p>
                </div>
              </div>
              <button
                id="qr-label-modal-close-btn"
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl transition-all shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body: Left Column (Preview) + Right Column (Settings) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7">
              {/* Left Column: Live Label Preview (5 cols) */}
              <div className="lg:col-span-6 flex flex-col space-y-4 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Eye size={14} className="text-primary" />
                    Vista Previa
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold text-primary bg-primary/10 px-2 sm:px-2.5 py-0.5 rounded-full truncate max-w-[180px]">
                    {template === 'thermal_50x30' && '50x30mm Térmica'}
                    {template === 'shelf_70x40' && '70x40mm Anaquel'}
                    {template === 'compact_40x25' && '40x25mm Caja Chica'}
                    {template === 'sheet_avery_30' && 'Hoja Carta 30x'}
                  </span>
                </div>

                {/* Sticker Render Box */}
                <div className="bg-gray-100/80 p-3 sm:p-6 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center min-h-[220px] sm:min-h-[280px] overflow-hidden">
                  {activeProduct ? (
                    <div 
                      ref={previewLabelRef}
                      className={`bg-white rounded-xl border border-gray-300 shadow-md p-3.5 flex flex-col justify-between transition-all select-none max-w-full overflow-hidden ${
                        template === 'thermal_50x30' ? 'w-[320px] max-w-full h-[190px]' :
                        template === 'shelf_70x40' ? 'w-[360px] max-w-full h-[210px]' :
                        template === 'compact_40x25' ? 'w-[280px] max-w-full h-[160px]' :
                        'w-[300px] max-w-full h-[180px]'
                      }`}
                    >
                      {/* Store Header */}
                      {showStoreName && (
                        <div className="flex items-center justify-between border-b border-gray-100 pb-1 mb-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-gray-800">
                            {customStoreName}
                          </span>
                          <span className="text-[9px] font-bold text-primary tracking-tight">
                            AGRÍCOLA
                          </span>
                        </div>
                      )}

                      {/* Main Center Area: QR Code + Details */}
                      <div className="flex items-center gap-3 my-auto">
                        {/* QR Code */}
                        <div className="shrink-0 bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
                          {qrDataUrl ? (
                            <img 
                              src={qrDataUrl} 
                              alt="QR Code" 
                              className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                            />
                          ) : (
                            <div className="w-24 h-24 flex items-center justify-center text-gray-300">
                              <RefreshCw size={24} className="animate-spin text-primary" />
                            </div>
                          )}
                          <span className="text-[8px] font-mono text-gray-500 font-bold mt-0.5">
                            ESCANEABLE EN POS
                          </span>
                        </div>

                        {/* Part Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Part Number */}
                          <div className="font-mono font-black text-sm sm:text-base text-gray-900 truncate leading-tight tracking-tight">
                            {activeProduct.pieceNumber}
                          </div>

                          {/* Description */}
                          {showDescription && (
                            <p className="text-[11px] text-gray-600 line-clamp-2 font-medium leading-snug">
                              {activeProduct.description}
                            </p>
                          )}

                          {/* Brand & Model */}
                          {showBrandModel && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 text-[9px] font-black rounded">
                                {activeProduct.brand}
                              </span>
                              {activeProduct.model && (
                                <span className="text-[10px] text-gray-500 truncate font-semibold">
                                  {activeProduct.model}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Price & Location */}
                          <div className="pt-1 flex items-baseline justify-between gap-1">
                            {showPrice && (
                              <span className="text-sm sm:text-base font-black text-primary">
                                {formatCurrency(activeProduct.salePrice)}
                              </span>
                            )}
                            {showLocation && activeProduct.location && (
                              <span className="text-[9px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {activeProduct.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer barcode line */}
                      <div className="pt-1 border-t border-dashed border-gray-200 flex items-center justify-between text-[8px] font-mono text-gray-400">
                        <span>Refacción Original</span>
                        <span>{new Date().toLocaleDateString('es-MX')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 text-sm">
                      Selecciona un producto para visualizar la etiqueta
                    </div>
                  )}
                </div>

                {/* Quick Action Buttons for the active label */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadLabel}
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                  >
                    <Download size={14} className="text-primary" />
                    <span>Descargar Imagen PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                  >
                    {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-500" />}
                    <span>{copied ? '¡Copiado!' : 'Copiar Texto QR'}</span>
                  </button>
                </div>

                {/* POS Scanning Hint */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-2.5 text-xs text-blue-800">
                  <Tractor size={18} className="shrink-0 text-blue-600 mt-0.5" />
                  <p className="leading-relaxed">
                    <span className="font-bold">Compatibilidad POS:</span> Al apuntar la cámara o lector 2D desde el Punto de Venta a este código QR, el sistema detectará automáticamente el número <span className="font-mono font-bold">{activeProduct?.pieceNumber}</span> y agregará la refacción al ticket al instante.
                  </p>
                </div>
              </div>

              {/* Right Column: Settings, Format & Batch Selection (6 cols) */}
              <div className="lg:col-span-6 flex flex-col space-y-5">
                {/* Product Selection Mode */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Layers size={14} className="text-primary" />
                      Alcance de Impresión
                    </span>
                    <span className="text-[11px] text-gray-400 font-semibold">
                      {allProducts.length} productos disponibles
                    </span>
                  </label>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPrintAllFiltered(false)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        !printAllFiltered 
                          ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-xs">Solo Esta Refacción</div>
                      <div className="text-[10px] text-gray-500 truncate font-mono mt-0.5">
                        {activeProduct?.pieceNumber || 'Seleccionar'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPrintAllFiltered(true)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        printAllFiltered 
                          ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-xs">Lote Filtrado Completo</div>
                      <div className="text-[10px] text-gray-500 truncate mt-0.5">
                        {allProducts.length} refacciones a la vez
                      </div>
                    </button>
                  </div>
                </div>

                {/* If single product, selector to change active product */}
                {!printAllFiltered && allProducts.length > 1 && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Cambiar Refacción</label>
                    <select
                      value={activeProduct?.id || ''}
                      onChange={(e) => {
                        const found = allProducts.find(p => p.id === e.target.value);
                        if (found) setActiveProduct(found);
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {allProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.pieceNumber} — {p.description.substring(0, 35)} (${p.salePrice})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Label Template Format */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag size={14} className="text-primary" />
                    Formato y Tamaño de Etiqueta
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'thermal_50x30', label: 'Térmica 50x30 mm', desc: 'Rollo Zebra / Xprinter' },
                      { id: 'shelf_70x40', label: 'Anaquel 70x40 mm', desc: 'Etiqueta grande con precio' },
                      { id: 'compact_40x25', label: 'Compacta 40x25 mm', desc: 'Empaques chicos / O-rings' },
                      { id: 'sheet_avery_30', label: 'Hoja Carta (30x)', desc: 'Impresora normal láser/tinta' },
                    ].map(fmt => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setTemplate(fmt.id as LabelTemplate)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          template === fmt.id
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{fmt.label}</div>
                        <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{fmt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Element Toggles */}
                <div className="space-y-2.5 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders size={14} className="text-gray-500" />
                      Elementos Visibles en la Etiqueta
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={showStoreName}
                        onChange={(e) => setShowStoreName(e.target.checked)}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>Nombre de Tienda</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={showPrice}
                        onChange={(e) => setShowPrice(e.target.checked)}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>Precio de Venta</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={showLocation}
                        onChange={(e) => setShowLocation(e.target.checked)}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>Ubicación Almacén</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={showBrandModel}
                        onChange={(e) => setShowBrandModel(e.target.checked)}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>Marca y Modelo</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={showDescription}
                        onChange={(e) => setShowDescription(e.target.checked)}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>Descripción Técnica</span>
                    </label>
                  </div>

                  {showStoreName && (
                    <div className="pt-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Texto de Encabezado</label>
                      <input
                        type="text"
                        value={customStoreName}
                        onChange={(e) => setCustomStoreName(e.target.value)}
                        className="w-full px-3 py-1.5 mt-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Farmer Parts"
                      />
                    </div>
                  )}
                </div>

                {/* Copies configuration */}
                <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-xs font-bold text-gray-700">
                    Copias por cada refacción:
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCopiesPerProduct(Math.max(1, copiesPerProduct - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 font-bold hover:bg-gray-100 flex items-center justify-center text-sm"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-gray-900">
                      {copiesPerProduct}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCopiesPerProduct(copiesPerProduct + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 font-bold hover:bg-gray-100 flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                    {activeProduct && (
                      <button
                        type="button"
                        onClick={() => setCopiesPerProduct(Math.max(1, activeProduct.stock))}
                        className="text-[10px] font-bold text-primary hover:underline ml-2"
                      >
                        Según Stock ({activeProduct.stock})
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-bold text-xs transition-all text-center"
                  >
                    Cerrar
                  </button>
                  <button
                    id="print-qr-labels-btn"
                    type="button"
                    onClick={handlePrint}
                    disabled={isGenerating || itemsToRender.length === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Printer size={16} className="shrink-0" />
                        <span className="truncate">
                          {printAllFiltered
                            ? `Imprimir Lote (${allProducts.length * copiesPerProduct})`
                            : `Imprimir ${copiesPerProduct} ${copiesPerProduct > 1 ? 'Etiquetas' : 'Etiqueta'}`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* HIDDEN PRINT CONTAINER (Rendered only on window.print()) */}
      <div id="printable-qr-labels-container" className="hidden print:block">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-qr-labels-container, #printable-qr-labels-container * {
              visibility: visible;
            }
            #printable-qr-labels-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              background: white;
            }
            .page-break {
              page-break-after: always;
            }
            @page {
              margin: 0;
              size: auto;
            }
          }
        `}} />

        <div className={`p-4 ${
          template === 'sheet_avery_30'
            ? 'grid grid-cols-3 gap-2 w-full max-w-[8.5in] mx-auto'
            : 'flex flex-col items-center gap-2'
        }`}>
          {itemsToRender.flatMap((product) => 
            Array.from({ length: copiesPerProduct }).map((_, copyIndex) => {
              const val = getQrValue(product);
              const cacheKey = `${product.id}_${val}`;
              const qrUrl = qrCache[cacheKey] || qrDataUrl;

              return (
                <div
                  key={`${product.id}-${copyIndex}`}
                  style={{ pageBreakInside: 'avoid' }}
                  className={`bg-white border border-gray-400 p-2 flex flex-col justify-between box-border ${
                    template === 'thermal_50x30' ? 'w-[50mm] h-[30mm]' :
                    template === 'shelf_70x40' ? 'w-[70mm] h-[40mm]' :
                    template === 'compact_40x25' ? 'w-[40mm] h-[25mm]' :
                    'w-[65mm] h-[28mm]'
                  }`}
                >
                  {/* Top Bar */}
                  {showStoreName && (
                    <div className="flex justify-between items-center border-b border-gray-300 pb-0.5 leading-none">
                      <span className="text-[7pt] font-black uppercase tracking-tight text-black">
                        {customStoreName}
                      </span>
                      <span className="text-[6pt] font-bold text-black uppercase">
                        {product.brand}
                      </span>
                    </div>
                  )}

                  {/* Body with QR + Text */}
                  <div className="flex items-center gap-1.5 my-auto overflow-hidden">
                    {qrUrl && (
                      <img 
                        src={qrUrl} 
                        alt="QR" 
                        className="w-[20mm] h-[20mm] object-contain shrink-0" 
                      />
                    )}
                    <div className="flex-1 min-w-0 leading-tight">
                      <div className="font-mono font-black text-[9pt] text-black truncate">
                        {product.pieceNumber}
                      </div>
                      {showDescription && (
                        <div className="text-[6.5pt] text-gray-700 font-medium truncate">
                          {product.description}
                        </div>
                      )}
                      {showBrandModel && (
                        <div className="text-[6pt] text-gray-600 font-bold truncate">
                          {product.brand} • {product.model || 'Universal'}
                        </div>
                      )}
                      <div className="flex items-baseline justify-between mt-0.5">
                        {showPrice && (
                          <div className="text-[8.5pt] font-black text-black">
                            {formatCurrency(product.salePrice)}
                          </div>
                        )}
                        {showLocation && product.location && (
                          <div className="text-[6pt] font-mono font-bold text-gray-800">
                            {product.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
