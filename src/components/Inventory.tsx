import React, { useState, useEffect, useRef } from 'react';
import {
  Package, Plus, Search, Filter, MoreVertical, AlertTriangle,
  ArrowUpRight, ArrowDownLeft, History, Edit2, Trash2,
  ChevronRight, ChevronLeft, ChevronDown, X, Save, Image as ImageIcon,
  Camera, Loader2, CheckCircle2, Barcode, QrCode, FileText,
  LayoutGrid, List
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { generateContentWithFallback, parseJsonFromMarkdown } from '../lib/gemini';
import {
  getProducts as getProductsApi,
  createProduct as createProductApi,
  updateProduct as updateProductApi,
  deleteProduct as deleteProductApi,
  getMovements as getMovementsApi,
  createMovement as createMovementApi,
} from '../lib/sheetsApi';
import { Product, InventoryMovement, Vendor } from '../types';
import { cn, formatCurrency, formatDate, compressImage } from '../lib/utils';
import { toast } from 'sonner';
import { LocationPicker } from './LocationPicker';
import { CompatibilityTagInput } from './CompatibilityTagInput';
import { motion, AnimatePresence } from 'motion/react';
import { InventoryHistory } from './InventoryHistory';
import { PartQRLabelModal } from './PartQRLabelModal';

const BRANDS = ["MF", "JD", "NH", "Ford", "Case", "Perkins"];
const CATEGORIES = ["Motor", "Transmisión", "Hidráulica", "Eléctrico", "Filtros", "Rodamientos", "Otros"];

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedProductForQR, setSelectedProductForQR] = useState<Product | null>(null);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterBrand, setFilterBrand] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showStats, setShowStats] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [references, setReferences] = useState<any[]>([]);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState<Partial<Product>>({
    pieceNumber: '',
    description: '',
    brand: 'MF',
    model: '',
    category: 'Motor',
    purchasePrice: 0,
    salePrice: 0,
    stock: 0,
    minStock: 2,
    maxStock: 50,
    location: 'PB-01-A',
    imageUrl: '',
    barcode: '',
    vendorId: '',
    leadTime: 7,
    invoiceReference: ''
  });

  const loadData = async () => {
    try {
      const url = import.meta.env.VITE_APPS_SCRIPT_URL;
      if (!url) return;
      const prodRes = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'getProducts', data: {} })
      });
      const prodData = await prodRes.json();
      if (prodData.success) setProducts(prodData.data || []);

      const movRes = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'getMovements', data: {} })
      });
      const movData = await movRes.json();
      if (movData.success) setMovements(movData.data || []);
    } catch (error) {
      console.error("Error loading data from Sheets:", error);
    }
  };

  const fetchVendors = async () => {
    try {
      const url = import.meta.env.VITE_APPS_SCRIPT_URL;
      if (!url) return;
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'getVendors', data: {} })
      });
      const data = await res.json();
      if (data.success) setVendors(data.data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

    useEffect(() => {
    loadData();
    fetchVendors();
  }, []);

  // Auto-cerrar notificaciones después de 4 segundos
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const filteredProducts = products.filter(p => {
    const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
    const matchesSearch = searchTerms.length === 0 || searchTerms.every(term =>
      p.pieceNumber.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.model.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.toLowerCase().includes(term)) ||
      (p.invoiceReference && p.invoiceReference.toLowerCase().includes(term))
    );
    const matchesLowStock = filterLowStock ? p.stock <= p.minStock : true;
    const matchesBrand = filterBrand === 'All' || p.brand === filterBrand;
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesLowStock && matchesBrand && matchesCategory;
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
      reader.onerror = error => reject(error);
    });
  };

  const uploadToCloudinary = async (base64Image: string): Promise<string> => {
    const cloudName = 'dabe5peol';
    const uploadPreset = 'REFACCIONARIA_PANUCO';
    const formData = new FormData();
    formData.append('file', base64Image);
    formData.append('upload_preset', uploadPreset);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || 'Error al subir imagen a Cloudinary');
  };

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const base64Data = await fileToBase64(file);
      const originalDataUri = `data:` + (file.type || 'image/jpeg') + `;base64,` + base64Data;
      const compressed = await compressImage(originalDataUri, 800, 0.75);
      const cloudinaryUrl = await uploadToCloudinary(compressed);
      setAdditionalImages(prev => [...prev, cloudinaryUrl]);
      toast.success('Imagen agregada a la galería');
    } catch (error) {
      toast.error('Error al subir imagen');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleScan = async (file: File) => {
    setIsScanning(true);
    setScanProgress(0);
    try {
      const base64Data = await fileToBase64(file);
      const progressInterval = setInterval(() => {
        setScanProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const prompt = `Analiza esta imagen de una refacción agrícola. Extrae el número de parte, marca, descripción, precios sugeridos y categoría. MUY IMPORTANTE: En el campo "compatibleModels", incluye TODOS los números de modelo, tractores compatibles o códigos cruzados que veas escritos en el empaque o descripción. Sepáralos como un arreglo de textos (ej. ["4265", "4275", "ACW2860960"]).
Devuelve OBLIGATORIAMENTE un JSON con este formato exacto:
{
  "pieceNumber": "número de parte principal",
  "description": "descripción técnica en español",
  "brand": "marca",
  "suggestedSalePrice": 0,
  "suggestedPurchasePrice": 0,
  "category": "Motor, Transmisión, Hidráulica, Eléctrico, Filtros, Rodamientos u Otros",
  "compatibleModels": ["modelo1", "modelo2", "numero_cruzado"]
}`;

      const originalDataUri = `data:${file.type || 'image/jpeg'};base64,${base64Data}`;
      const compressed = await compressImage(originalDataUri, 800, 0.75);
      const base64ForAI = compressed.split(',')[1];
      const cloudinaryUrl = await uploadToCloudinary(compressed);

      const response = await generateContentWithFallback(
        [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: base64ForAI } }
        ],
        { responseMimeType: 'application/json' }
      );

      clearInterval(progressInterval);
      setScanProgress(100);
      const result = parseJsonFromMarkdown(response.text || '{}');

      setFormData(prev => ({
        ...prev,
        pieceNumber: result.pieceNumber || prev.pieceNumber,
        description: result.description || prev.description,
        brand: BRANDS.includes(result.brand) ? result.brand : prev.brand,
        salePrice: result.suggestedSalePrice || prev.salePrice,
        purchasePrice: result.suggestedPurchasePrice || prev.purchasePrice,
        category: result.category || prev.category,
        model: Array.isArray(result.compatibleModels)
          ? result.compatibleModels.join(', ')
          : (result.model || prev.model),
        imageUrl: cloudinaryUrl
      }));

      setNotification({ message: 'Refacción analizada exitosamente', type: 'success' });
    } catch (error) {
      console.error('Scan error:', error);
      setNotification({ message: error instanceof Error ? error.message : 'Error al analizar la imagen.', type: 'error' });
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    const errors: string[] = [];
    const pieceNumberStr = String(formData.pieceNumber || '').trim();
    const descriptionStr = String(formData.description || '').trim();
    
    if (!pieceNumberStr) errors.push("• El Número de Pieza es obligatorio.");
    if (!descriptionStr) errors.push("• La Descripción es obligatoria.");
    if (formData.salePrice === undefined || Number(formData.salePrice) <= 0) errors.push("• El Precio de Venta debe ser mayor a 0.");

    if (errors.length > 0) {
      toast.error("Faltan datos", { description: <div className="space-y-1">{errors.map((err, i) => <div key={i}>{err}</div>)}</div> });
      setIsSaving(false);
      return;
    }

    try {
      const sanitizedInvoiceRef = String(formData.invoiceReference || '').trim();
      const payload = { 
        ...formData, 
        pieceNumber: pieceNumberStr,
        description: descriptionStr,
        barcode: String(formData.barcode || '').trim(),
        invoiceReference: sanitizedInvoiceRef, 
        references: JSON.stringify(references) 
      };

      if (editingProduct) {
        const oldStock = editingProduct.stock;
        const newStock = formData.stock;
        const updateRes = await updateProductApi(editingProduct.id, payload);
        if (!updateRes.success) throw new Error(updateRes.error || 'No se pudo actualizar el producto');

        if (oldStock !== newStock) {
          const diff = (newStock ?? 0) - oldStock;
          await createMovementApi({
            productId: editingProduct.id,
            type: diff > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(diff),
            reason: sanitizedInvoiceRef ? `Ajuste según Factura ${sanitizedInvoiceRef}` : 'Ajuste manual de inventario',
            timestamp: new Date().toISOString(),
            userId: 'admin',
            invoiceReference: sanitizedInvoiceRef
          });
        }
        setNotification({ message: 'Producto actualizado correctamente', type: 'success' });
      } else {
        const createRes = await createProductApi(payload);
        if (!createRes.success || !createRes.data) throw new Error(createRes.error || 'No se pudo crear el producto');
        const newId = createRes.data.id;

        if ((formData.stock ?? 0) > 0) {
          await createMovementApi({
            productId: newId,
            type: 'IN',
            quantity: formData.stock,
            reason: sanitizedInvoiceRef ? `Inventario inicial según Factura ${sanitizedInvoiceRef}` : 'Inventario inicial',
            timestamp: new Date().toISOString(),
            userId: 'admin',
            invoiceReference: sanitizedInvoiceRef
          });
        }
        setNotification({ message: 'Producto creado correctamente', type: 'success' });
      }

      const [productsRes, movementsRes] = await Promise.all([getProductsApi(), getMovementsApi()]);
      if (productsRes.success && productsRes.data) setProducts(productsRes.data as unknown as Product[]);
      if (movementsRes.success && movementsRes.data) setMovements(movementsRes.data as unknown as InventoryMovement[]);

      setIsModalOpen(false);
      setEditingProduct(null);
      setReferences([]);
      setAdditionalImages([]);
      setFormData({
        pieceNumber: '', description: '', brand: 'MF', model: '', category: 'Motor',
        purchasePrice: 0, salePrice: 0, stock: 0, minStock: 2, maxStock: 50,
        location: 'PB-01-A', imageUrl: '', barcode: '', vendorId: '', leadTime: 7, invoiceReference: ''
      });
    } catch (error) {
      console.error('Error saving product:', error);
      setNotification({ message: 'Error al guardar el producto.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteProductApi(id);
      if (!res.success) throw new Error(res.error || 'No se pudo eliminar el producto');
      setProducts(prev => prev.filter(p => p.id !== id));
      setDeleteConfirm(null);
      setNotification({ message: 'Producto eliminado correctamente', type: 'success' });
    } catch (error) {
      console.error('Error deleting product:', error);
      setNotification({ message: 'Error al eliminar el producto.', type: 'error' });
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product, invoiceReference: product.invoiceReference || '' });
    try {
      if (product.references && typeof product.references === 'string') setReferences(JSON.parse(product.references));
      else if (Array.isArray(product.references)) setReferences(product.references);
      else setReferences([]);
    } catch (e) { setReferences([]); }
    
    try {
      if (product.images && typeof product.images === 'string') setAdditionalImages(JSON.parse(product.images));
      else if (Array.isArray(product.images)) setAdditionalImages(product.images);
      else setAdditionalImages([]);
    } catch (e) { setAdditionalImages([]); }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {(() => {
          const validProducts = products.filter(p => p && (p.pieceNumber || p.description));
          const lowStockCount = validProducts.filter(p => Number(p.stock) <= Number(p.minStock)).length;
          const totalValue = validProducts.reduce((sum, p) => sum + (Number(p.purchasePrice) * Number(p.stock)), 0);
          const today = new Date().toLocaleDateString('es-MX');
          const movementsToday = movements.filter(m => {
            if (!m.timestamp) return false;
            const d = new Date(m.timestamp);
            return !isNaN(d.getTime()) && d.toLocaleDateString('es-MX') === today;
          }).length;
          return [
            { label: 'Total Productos', value: validProducts.length, icon: Package, color: 'bg-blue-500' },
            { label: 'Stock Bajo', value: lowStockCount, icon: AlertTriangle, color: 'bg-amber-500' },
            { label: 'Valor Inventario', value: formatCurrency(totalValue), icon: ArrowUpRight, color: 'bg-green-500' },
            { label: 'Movimientos Hoy', value: movementsToday, icon: History, color: 'bg-purple-500' },
          ];
        })().map((stat, i) => (
          <div key={i} className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className={cn("w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0", stat.color)}>
              <stat.icon size={16} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">{stat.label}</p>
              <p className="text-sm sm:text-xl font-black text-gray-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        <div className="relative w-full lg:w-96">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número, descripción, marca..."
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100 outline-none focus:border-primary transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full lg:w-auto">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn("flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold border transition-all text-xs sm:text-sm", showAdvancedFilters ? "bg-primary/10 text-primary border-primary/20 shadow-sm" : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50")}
          >
            <Filter size={16} />
            <span>Filtros</span>
          </button>
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={cn("flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold border transition-all text-xs sm:text-sm", filterLowStock ? "bg-red-50 text-red-600 border-red-100 shadow-sm" : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50")}
          >
            <AlertTriangle size={16} />
            <span className="hidden sm:inline">Stock Bajo</span>
            <span className="sm:hidden">Bajo</span>
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 sm:py-3 bg-white text-gray-600 rounded-xl font-semibold border border-gray-100 hover:bg-gray-50 transition-all text-xs sm:text-sm"
          >
            <History size={16} />
            <span>Historial</span>
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 sm:py-3 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-all text-xs sm:text-sm"
            title="Cambiar Vista"
          >
            {viewMode === 'table' ? <LayoutGrid size={16} /> : <List size={16} />}
            <span className="hidden sm:inline">{viewMode === 'table' ? 'Cuadrícula' : 'Tabla'}</span>
            <span className="sm:hidden">{viewMode === 'table' ? 'Grid' : 'Lista'}</span>
          </button>
          <button
            onClick={() => { setSelectedProductForQR(null); setIsQRModalOpen(true); }}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 sm:py-3 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-all text-xs sm:text-sm shadow-sm"
            title="Etiquetas QR"
          >
            <QrCode size={16} className="text-primary" />
            <span className="hidden sm:inline">Etiquetas QR</span>
            <span className="sm:hidden">QR</span>
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setReferences([]); setAdditionalImages([]); setFormData({ pieceNumber: '', description: '', brand: 'MF', model: '', category: 'Motor', purchasePrice: 0, salePrice: 0, stock: 0, minStock: 2, maxStock: 50, location: 'PB-01-A', imageUrl: '', barcode: '', vendorId: '', leadTime: 7, invoiceReference: '' });
              setIsModalOpen(true);
            }}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3.5 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all text-xs sm:text-sm"
          >
            <Plus size={16} />
            <span>Nuevo</span>
          </button>
        </div>
      </div>

            <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Marca</label>
                <select className="w-full px-4 py-2 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
                  <option value="All">Todas las Marcas</option>
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Categoría</label>
                <select className="w-full px-4 py-2 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option value="All">Todas las Categorías</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={() => { setFilterBrand('All'); setFilterCategory('All'); setFilterLowStock(false); setSearchQuery(''); }} className="w-full px-4 py-2 text-primary font-bold hover:bg-primary/5 rounded-xl transition-all">Limpiar Filtros</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
            >
              <div className="p-4 sm:p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 shrink-0">
                <h3 className="text-xl font-bold text-gray-900">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-white rounded-xl transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={handleSave} className="p-4 sm:p-8 space-y-6 flex-1 overflow-y-auto overscroll-contain">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleScan(file); }}
                  className={cn("border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center gap-4 relative overflow-hidden", isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-gray-200 bg-gray-50/30", isScanning && "pointer-events-none")}
                >
                  <input id="scanner-input-file" type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleScan(file); }} />
                  <input id="scanner-input-camera" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleScan(file); }} />

                  {isScanning ? (
                    <div className="flex flex-col items-center gap-4 text-center py-4">
                      <div className="relative">
                        <Loader2 size={48} className="text-primary animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">{Math.round(scanProgress)}%</div>
                      </div>
                      <div><p className="font-bold text-gray-900">Analizando con IA...</p><p className="text-xs text-gray-500">Identificando pieza y extrayendo datos</p></div>
                    </div>
                  ) : formData.imageUrl ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden group/preview">
                      <img src={formData.imageUrl} alt="Vista previa" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button type="button" onClick={() => document.getElementById('scanner-input-camera')?.click()} className="p-3 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform" title="Cambiar foto"><Camera size={20} /></button>
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))} className="p-3 bg-white rounded-full text-red-600 hover:scale-110 transition-transform" title="Eliminar foto"><Trash2 size={20} /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><Camera size={24} /></div>
                      <div className="text-center">
                        <p className="font-bold text-gray-900">Escaneo Inteligente</p>
                        <p className="text-xs text-gray-500 mb-4">Arrastra una imagen o selecciona una opción:</p>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => document.getElementById('scanner-input-camera')?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"><Camera size={16} />Tomar Foto</button>
                          <button type="button" onClick={() => document.getElementById('scanner-input-file')?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"><ImageIcon size={16} />Subir Imagen</button>
                        </div>
                      </div>
                    </>
                  )}
                  {isScanning && (<div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-300" style={{ width: `${scanProgress}%` }} />)}
                </div>

                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                        Galería de Imágenes del Producto
                        <span className="text-[10px] text-gray-500 normal-case bg-white px-2 py-0.5 rounded-full border border-gray-200">Opcional</span>
                      </label>
                      <p className="text-[10px] text-gray-400 mt-1">Agrega fotos reales del producto (ángulos, detalles) para la tienda online.</p>
                    </div>
                    <label className="cursor-pointer bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 hover:opacity-90 transition-all">
                      {isUploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      {isUploadingImage ? 'Subiendo...' : 'Agregar Foto'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAdditionalImageUpload} disabled={isUploadingImage} />
                    </label>
                  </div>

                  {additionalImages.length === 0 ? (
                    <div className="text-center p-4 bg-white rounded-lg border border-dashed border-gray-200">
                      <ImageIcon size={24} className="mx-auto text-gray-300 mb-1" />
                      <p className="text-[10px] text-gray-400">Aún no hay imágenes adicionales en la galería.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {additionalImages.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white">
                          <img src={img} alt={`Galería ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setAdditionalImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            title="Eliminar imagen"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Número de Pieza</label>
                    <input required type="text" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium" value={formData.pieceNumber} onChange={e => setFormData({...formData, pieceNumber: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Marca</label>
                    <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                      {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Descripción</label>
                    <textarea required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium h-24 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Modelos Compatibles / Números Cruzados</span>
                      <span className="text-[10px] text-primary font-bold">(Presiona Enter para agregar)</span>
                    </label>
                    <CompatibilityTagInput value={formData.model || ''} onChange={(val) => setFormData({...formData, model: val})} />
                  </div>
                  <div className="md:col-span-2 space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                        Referencias Cruzadas / Equivalencias
                        <span className="text-[10px] text-gray-500 normal-case bg-white px-2 py-0.5 rounded-full border border-gray-200">Opcional</span>
                      </label>
                      <button type="button" onClick={() => setReferences([...references, { fabricante: '', numero_parte: '', tipo_maquina: '', medidas: '', descripcion: '' }])} className="text-xs font-bold text-primary flex items-center gap-1 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors border border-primary/20">
                        <Plus size={14} /> Agregar Referencia
                      </button>
                    </div>
                    {references.length === 0 ? (
                      <div className="text-center p-4"><p className="text-xs text-gray-400">No hay referencias cruzadas. Haz clic en "Agregar Referencia" para vincular partes de otras marcas.</p></div>
                    ) : (
                      <div className="space-y-3">
                        {references.map((ref, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group animate-in fade-in slide-in-from-top-2 duration-200">
                            <button type="button" onClick={() => setReferences(references.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 transition-colors shadow-sm z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100" title="Eliminar referencia"><Trash2 size={14} /></button>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Fabricante</label><input type="text" placeholder="Ej. Toyota, Caterpillar..." className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 ring-primary/20 text-sm font-medium" value={ref.fabricante || ''} onChange={e => { const newRefs = [...references]; newRefs[idx] = { ...newRefs[idx], fabricante: e.target.value }; setReferences(newRefs); }} /></div>
                              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Número de Parte</label><input type="text" placeholder="Ej. 12345-67890" className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 ring-primary/20 text-sm font-medium font-mono" value={ref.numero_parte || ''} onChange={e => { const newRefs = [...references]; newRefs[idx] = { ...newRefs[idx], numero_parte: e.target.value }; setReferences(newRefs); }} /></div>
                              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Tipo de Máquina</label><input type="text" placeholder="Ej. Retroexcavadora, Motor Perkins..." className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 ring-primary/20 text-sm font-medium" value={ref.tipo_maquina || ''} onChange={e => { const newRefs = [...references]; newRefs[idx] = { ...newRefs[idx], tipo_maquina: e.target.value }; setReferences(newRefs); }} /></div>
                              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Medidas</label><input type="text" placeholder="Ej. 10x20x5 cm, 3/4 pulgada..." className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 ring-primary/20 text-sm font-medium" value={ref.medidas || ''} onChange={e => { const newRefs = [...references]; newRefs[idx] = { ...newRefs[idx], medidas: e.target.value }; setReferences(newRefs); }} /></div>
                              <div className="space-y-1 sm:col-span-2"><label className="text-[10px] font-bold text-gray-500 uppercase">Descripción / Título de la Referencia</label><input type="text" placeholder="Ej. Filtro de aceite compatible" className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 ring-primary/20 text-sm font-medium" value={ref.descripcion || ''} onChange={e => { const newRefs = [...references]; newRefs[idx] = { ...newRefs[idx], descripcion: e.target.value }; setReferences(newRefs); }} /></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Precio Compra</label>
                    <input required type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Precio Venta</label>
                    <input required type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stock Inicial</label>
                    <input required type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      Stock Mínimo (Alerta)
                      <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded normal-case">Manual</span>
                    </label>
                    <input required type="number" min="0" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium" value={formData.minStock} onChange={e => setFormData({...formData, minStock: Number(e.target.value)})} placeholder="Ej. 2" />
                    <p className="text-[10px] text-gray-400">Cantidad mínima antes de mostrar la alerta de "Stock Bajo".</p>
                  </div>
                  <LocationPicker value={formData.location || 'PB-01-A'} onChange={(val) => setFormData({...formData, location: val})} />
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Proveedor</label>
                    <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium" value={formData.vendorId} onChange={e => setFormData({...formData, vendorId: e.target.value})}>
                      <option value="">Seleccionar Proveedor (Opcional)</option>
                      <option value="STOCK_INICIAL" className="font-bold text-primary">✨ Stock Inicial / Inventario de Arranque</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lead Time (Días)</label>
                    <input type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium" value={formData.leadTime} onChange={e => setFormData({...formData, leadTime: Number(e.target.value)})} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="product-invoice-reference-input" className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5"><FileText size={14} className="text-primary" /> Número de Referencia de Factura</label>
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">Trazabilidad Fiscal</span>
                    </div>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input id="product-invoice-reference-input" type="text" placeholder="Ej: FAC-2024-0048, Folio Fiscal SAT o UUID" className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium text-gray-800 placeholder:text-gray-400" value={formData.invoiceReference || ''} onChange={e => setFormData({...formData, invoiceReference: e.target.value.toUpperCase()})} />
                    </div>
                    <p className="text-[11px] text-gray-500">Vincula esta pieza específica con el comprobante o documento fiscal correspondiente.</p>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Código de Barras</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input type="text" placeholder="Escanea o ingresa el código" className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-medium" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value.toUpperCase()})} />
                      </div>
                      <button type="button" onClick={() => setIsBarcodeScannerOpen(true)} className="px-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2"><Camera size={20} />Escanear</button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isSaving ? (<><Loader2 size={20} className="animate-spin" />Guardando...</>) : (<><Save size={20} />{editingProduct ? 'Guardar Cambios' : 'Crear Producto'}</>)}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isBarcodeScannerOpen && (
        <BarcodeScanner onScan={(code) => setFormData(prev => ({ ...prev, barcode: code }))} onClose={() => setIsBarcodeScannerOpen(false)} />
      )}

      <PartQRLabelModal isOpen={isQRModalOpen} onClose={() => { setIsQRModalOpen(false); setSelectedProductForQR(null); }} products={filteredProducts} selectedProduct={selectedProductForQR} />

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProductDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto overscroll-contain" onClick={() => setSelectedProductDetail(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 bg-gray-50 p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden group shrink-0">
                {selectedProductDetail.imageUrl ? (
                  <img src={selectedProductDetail.imageUrl} alt={selectedProductDetail.description} className="w-full h-64 md:h-80 object-contain transition-transform duration-500 group-hover:scale-150 cursor-zoom-in" />
                ) : (<Package size={80} className="text-gray-300" />)}
                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-600 border border-gray-200">{selectedProductDetail.brand}</span>
              </div>
              <div className="w-full md:w-1/2 p-6 flex flex-col justify-between md:overflow-visible">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-black text-gray-900">{selectedProductDetail.pieceNumber}</h2>
                      <p className="text-sm text-gray-500 font-medium mt-1">{selectedProductDetail.description}</p>
                    </div>
                    <button onClick={() => setSelectedProductDetail(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
                    <div className="flex justify-between items-center"><span className="text-xs font-bold text-gray-400 uppercase">Precio Venta</span><span className="text-2xl font-black text-primary">{formatCurrency(selectedProductDetail.salePrice)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-xs font-bold text-gray-400 uppercase">Costo Compra</span><span className="font-bold text-gray-600">{formatCurrency(selectedProductDetail.purchasePrice)}</span></div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase">Stock Actual</span>
                      <span className={cn("px-2 py-0.5 rounded-md text-xs font-bold", selectedProductDetail.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>{selectedProductDetail.stock} piezas</span>
                    </div>
                    <div className="flex justify-between items-center"><span className="text-xs font-bold text-gray-400 uppercase">Ubicación</span><span className="font-mono text-sm text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">{selectedProductDetail.location || 'N/A'}</span></div>
                    {selectedProductDetail.invoiceReference && (<div className="flex justify-between items-center"><span className="text-xs font-bold text-gray-400 uppercase">Factura</span><span className="font-mono text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{selectedProductDetail.invoiceReference}</span></div>)}
                  </div>
                  {selectedProductDetail.model && (
                    <div><span className="text-xs font-bold text-gray-400 uppercase">Compatibilidad</span><p className="text-xs text-gray-600 mt-1 line-clamp-3">{selectedProductDetail.model}</p></div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setSelectedProductDetail(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all">Cerrar</button>
                  <button onClick={() => { openEdit(selectedProductDetail); setSelectedProductDetail(null); }} className="flex-[2] py-3 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"><Edit2 size={20} />Editar Producto</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BarcodeScanner: React.FC<{ onScan: (code: string) => void, onClose: () => void }> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  useEffect(() => {
    let isMounted = true;
    const startScanner = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (!isMounted) return;
      const elementId = "reader";
      const element = document.getElementById(elementId);
      if (!element) return;
      try {
        const html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;
        const config = { fps: 20, qrbox: (w: number, h: number) => { const m = Math.min(w, h); return { width: Math.floor(m * 0.8), height: Math.floor(m * 0.8) }; }, aspectRatio: 1.0 };
        const onScanSuccess = (decodedText: string) => { onScan(decodedText); html5QrCode.stop().then(() => { if (isMounted) onClose(); }).catch(() => { if (isMounted) onClose(); }); };
        try { await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, undefined); }
        catch { try { await html5QrCode.start({ facingMode: "user" }, config, onScanSuccess, undefined); } catch { const devices = await Html5Qrcode.getCameras(); if (devices && devices.length > 0) await html5QrCode.start(devices[0].id, config, onScanSuccess, undefined); else throw new Error("No cameras"); } }
      } catch (err) {
        if (!isMounted) return;
        const em = err instanceof Error ? err.message : String(err);
        if (em.includes("NotReadableError")) setError("La cámara está siendo usada por otra aplicación.");
        else if (em.includes("NotAllowedError")) setError("Permiso de cámara denegado.");
        else setError("No se pudo acceder a la cámara.");
      }
    };
    startScanner();
    return () => {
      isMounted = false;
      if (scannerRef.current) {
        const s = scannerRef.current;
        if (s.isScanning) s.stop().then(() => s.clear()).catch(() => {});
        else s.clear();
      }
    };
  }, [onScan, onClose]);
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl overflow-hidden w-full max-w-sm relative shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900">Escaneando...</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-all"><X size={20} /></button>
        </div>
        {error ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto"><AlertTriangle size={32} /></div>
            <p className="text-sm text-gray-600 font-medium">{error}</p>
            <button onClick={onClose} className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all">Cerrar</button>
          </div>
        ) : (
          <>
            <div id="reader" className="w-full aspect-square bg-black"></div>
            <div className="p-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-2"><Barcode size={14} />Lector Activo</div>
              <p className="text-sm text-gray-500">Apunta la cámara al código de barras</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};