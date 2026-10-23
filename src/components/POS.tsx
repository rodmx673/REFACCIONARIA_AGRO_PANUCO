import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  ArrowRightLeft, 
  Clock, 
  UserPlus, 
  Filter, 
  ChevronDown, 
  Package, 
  Tractor,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Barcode,
  Camera,
  Receipt
} from 'lucide-react';

import { Product, Sale, SaleItem, Customer } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { printTicket } from '../lib/printTicket';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from "html5-qrcode";
import { InvoiceGenerator } from './Invoicing/InvoiceGenerator';
import { NewCustomerModal } from './NewCustomerModal';
import { toast } from 'sonner';

const CATEGORIES = ["Motor", "Transmisión", "Frenos", "Dirección", "Hidráulico", "Eléctrico"];
const BRANDS = ["MF", "JD", "NH", "Ford", "Case", "Perkins"];

export const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('EFECTIVO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [lastSaleData, setLastSaleData] = useState<any>(null); // Datos para reimprimir
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleCustomerClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleCustomerClickOutside);
    return () => document.removeEventListener('mousedown', handleCustomerClickOutside);
  }, []);

  const loadPosData = async () => {
    try {
      const url = import.meta.env.VITE_APPS_SCRIPT_URL;
      if (!url) return;

      const prodRes = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'getProducts', data: {} })
      });
      const prodData = await prodRes.json();
      if (prodData.success) setProducts(prodData.data || []);

      const custRes = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'getCustomers', data: {} })
      });
      const custData = await custRes.json();
      if (custData.success) setCustomers(custData.data || []);
    } catch (err) {
      console.error("Error cargando POS desde Sheets:", err);
    }
  };

  useEffect(() => {
    loadPosData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
      const pieceNumber = String(p.pieceNumber || '').toLowerCase();
      const description = String(p.description || '').toLowerCase();
      const brand = String(p.brand || '').toLowerCase();
      const model = String(p.model || '').toLowerCase();
      const barcode = String(p.barcode || '').toLowerCase();
      
      const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => 
        pieceNumber.includes(term) ||
        description.includes(term) ||
        brand.includes(term) ||
        model.includes(term) ||
        barcode.includes(term)
      );
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      const matchesBrand = !selectedBrand || p.brand === selectedBrand;
      return matchesSearch && matchesCategory && matchesBrand;
    });

    const uniqueMap = new Map();
    filtered.forEach(p => {
      if (!uniqueMap.has(p.pieceNumber)) {
        uniqueMap.set(p.pieceNumber, p);
      }
    });

    return Array.from(uniqueMap.values());
  }, [products, searchQuery, selectedCategory, selectedBrand]);

  const addToCart = (product: Product) => {
    if (Number(product.stock) <= 0) {
      toast.error('No hay stock disponible de este producto.');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity + 1 > Number(product.stock)) {
          toast.error(`Solo hay ${product.stock} piezas disponibles.`);
          return prev;
        }
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        pieceNumber: product.pieceNumber,
        description: product.description,
        quantity: 1,
        price: product.salePrice,
        subtotal: product.salePrice,
        imageUrl: product.imageUrl
      }];
    });
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const prod = products.find(p => p.id === productId);
        const maxStock = prod ? Number(prod.stock) : 0;
        const newQty = Math.max(0, item.quantity + delta);
        
        if (delta > 0 && newQty > maxStock) {
          toast.error(`Solo hay ${maxStock} piezas disponibles de este producto.`);
          return item; // Rechaza el aumento si excede el stock
        }

        return { ...item, quantity: newQty, subtotal: newQty * item.price };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax - discount;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const ticketId = 'TICKET-' + Date.now();
      
      const saleData = {
        customerId: selectedCustomer?.id || '',
        items: cart,
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total: total,
        paymentMethod: paymentMethod,
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
        sellerId: 'vendedor_pos',
        ticketId: ticketId
      };

      const url = import.meta.env.VITE_APPS_SCRIPT_URL;
      if (!url) throw new Error('Falta configurar el backend');

      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'createSale', 
          data: saleData 
        })
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al procesar la venta');
      }

      // Guardamos los datos para el ticket
      const ticketData = {
        ticketId,
        items: [...cart],
        subtotal,
        discount,
        tax,
        total,
        paymentMethod,
        customer: selectedCustomer || null, // <-- Enviamos el cliente completo
        customerName: selectedCustomer?.name || 'Venta al Público',
        date: new Date().toISOString()
      };
      
      setLastSaleData(ticketData);
      setLastSaleId(ticketId);
      
      await loadPosData();

      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setShowSuccess(true);

      // Impresión automática (pequeño delay para que el navegador no la bloquee)
      setTimeout(() => {
        printTicket(ticketData);
      }, 500);

    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error(error instanceof Error ? error.message : 'Hubo un error al guardar la venta.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col gap-4 lg:gap-6 min-w-0 max-w-full pb-16 lg:pb-0">
      {/* Top Bar - Smart Search */}
      <div className="relative z-40" ref={searchRef}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-2xl shadow-sm border border-gray-100 p-1 gap-2 sm:gap-0">
          <div className="flex-1 flex items-center px-3 sm:px-4 min-w-0">
            <Search size={20} className="text-gray-400 mr-2 sm:mr-3 shrink-0" />
            <input 
              type="text" 
              placeholder="Buscar pieza, marca, tractor, modelo o código..." 
              className="w-full py-2.5 sm:py-3 bg-transparent border-none outline-none text-sm sm:text-base font-medium min-w-0"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
            />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl transition-all mr-1 shrink-0"
                aria-label="Limpiar búsqueda"
              >
                <X size={18} />
              </button>
            )}
            <button 
              onClick={() => setIsBarcodeScannerOpen(true)}
              className="p-2 text-primary hover:bg-primary/5 rounded-xl transition-all shrink-0"
              title="Escanear Código de Barras"
              aria-label="Escanear código de barras"
            >
              <Barcode size={22} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showSearchResults && searchQuery.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[60vh] sm:max-h-[500px] overflow-y-auto z-50"
            >
              {filteredProducts.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProductDetail(product)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 transition-colors text-left group",
                        product.stock > 0 ? "hover:bg-gray-50" : "opacity-50 grayscale cursor-not-allowed"
                      )}
                    >
                      <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.pieceNumber} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-900 truncate">{product.pieceNumber}</span>
                          <span className="font-bold text-primary">{formatCurrency(product.salePrice)}</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{product.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {product.barcode && (
                            <div className="flex items-center gap-1 text-[10px] font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                              <Barcode size={10} />
                              {product.barcode}
                            </div>
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                            {product.brand}
                          </span>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                            product.stock > product.minStock ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                          )}>
                            Stock: {product.stock}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">
                            Ubicación: {product.location}
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                          <Plus size={20} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                    <Search size={32} />
                  </div>
                  <p className="text-gray-500 font-medium">No se encontraron productos para "{searchQuery}"</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-visible lg:overflow-hidden">
        {/* Left Section - Product Grid (60%) */}
        <div className="flex-[3] flex flex-col gap-4 lg:gap-6 lg:overflow-hidden">
          {/* Categories & Brands */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",
                  !selectedCategory ? "bg-primary text-white shadow-lg" : "bg-white text-gray-500 hover:bg-gray-100"
                )}
              >
                Todos
              </button>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",
                    selectedCategory === cat ? "bg-primary text-white shadow-lg" : "bg-white text-gray-500 hover:bg-gray-100"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {BRANDS.map(brand => (
                <button 
                  key={brand}
                  onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border-2",
                    selectedBrand === brand ? "border-primary bg-primary/5 text-primary" : "border-transparent bg-white text-gray-400 hover:bg-gray-100"
                  )}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 lg:overflow-y-auto pr-0 sm:pr-2">
            <div className="pos-grid">
              {filteredProducts.map(product => (
                <motion.button
                  layout
                  key={product.id}
                  onClick={() => setSelectedProductDetail(product)}
                  className={cn(
                    "bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-left border border-gray-100 transition-all group relative overflow-hidden active:scale-98",
                    product.stock > 0 ? "hover:border-primary hover:shadow-xl" : "opacity-60 grayscale cursor-not-allowed border-gray-200"
                  )}
                >
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center pointer-events-none rounded-xl">
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-md">
                        Sin Stock
                      </span>
                    </div>
                  )}
                  <div className="aspect-square rounded-lg sm:rounded-xl bg-gray-50 mb-2 sm:mb-3 flex items-center justify-center overflow-hidden border border-gray-50">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.pieceNumber} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <Tractor size={28} className="text-gray-300" />
                    )}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.brand}</p>
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm truncate">{product.pieceNumber}</h3>
                    <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-2 h-7 sm:h-8 leading-tight">{product.description}</p>
                    <div className="flex items-center justify-between pt-1.5">
                      <span className="font-black text-xs sm:text-sm text-primary">{formatCurrency(product.salePrice)}</span>
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        product.stock > product.minStock ? "bg-green-500" : "bg-red-500"
                      )}></div>
                    </div>
                  </div>
                  
                  {/* Quick Add Overlay */}
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors pointer-events-none" />
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section - Ticket (40%) */}
        <div id="pos-ticket-container" className="flex-[2] flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden ticket-shadow min-h-[420px] lg:min-h-0">
          {/* Ticket Header */}
          <div className="p-4 sm:p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Ticket de Venta</h3>
              <p className="text-xs text-gray-400 font-medium">#{new Date().getTime().toString().slice(-6)}</p>
            </div>
            <button 
              onClick={() => setCart([])}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Vaciar ticket"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* Customer Selection */}
          <div className="p-3 sm:p-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
                              <div className="flex-1 relative min-w-0">
                  <button
                    type="button"
                    onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                    className="w-full pl-9 pr-7 py-2 bg-gray-100 rounded-xl text-xs sm:text-sm font-medium border-none outline-none appearance-none truncate text-left flex items-center justify-between"
                  >
                    <span className="truncate">{selectedCustomer ? selectedCustomer.name : 'Cliente Mostrador'}</span>
                    <ChevronDown size={14} className={cn("text-gray-400 shrink-0 ml-1 transition-transform", isCustomerDropdownOpen && "rotate-180")} />
                  </button>
                  <UserPlus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  {isCustomerDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden flex flex-col" ref={customerDropdownRef}>
                      <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                        <input
                          type="text"
                          placeholder="Buscar por nombre o RFC..."
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 ring-primary/20"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => { setSelectedCustomer(null); setIsCustomerDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors font-bold text-gray-700 border-b border-gray-50"
                        >
                          Cliente Mostrador
                        </button>
                        {customers
                          .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.rfc && c.rfc.toLowerCase().includes(customerSearch.toLowerCase())))
                          .map(c => (
                            <button
                              type="button"
                              key={c.id}
                              onClick={() => { setSelectedCustomer(c); setIsCustomerDropdownOpen(false); }}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                            >
                              <p className="font-bold text-gray-900">{c.name}</p>
                              <p className="text-[10px] text-gray-500">{c.rfc || 'Sin RFC'}</p>
                            </button>
                          ))}
                        {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.rfc && c.rfc.toLowerCase().includes(customerSearch.toLowerCase()))).length === 0 && (
                          <div className="p-4 text-center text-xs text-gray-400">
                            No se encontraron clientes
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              <button 
                id="pos-open-new-customer-modal-btn"
                type="button"
                onClick={() => setIsNewCustomerModalOpen(true)}
                title="Nuevo Cliente"
                className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all shrink-0"
              >
                <Plus size={18} />
              </button>
            </div>
            {selectedCustomer && (
              <div className="mt-2 px-3 py-1.5 bg-blue-50 rounded-lg flex items-center justify-between text-xs">
                <span className="font-bold text-blue-700">Crédito: {formatCurrency(selectedCustomer.creditLimit - selectedCustomer.balance)}</span>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Días: {selectedCustomer.creditDays}</span>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {cart.length > 0 ? (
              cart.map(item => (
                <div key={item.productId} className="flex gap-2.5 sm:gap-3 group items-center">
                  <div className="w-11 h-11 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 border border-gray-50">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.pieceNumber} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={18} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs sm:text-sm text-gray-900 truncate">{item.pieceNumber}</span>
                      <span className="font-bold text-xs sm:text-sm text-gray-900 shrink-0 ml-1">{formatCurrency(item.subtotal)}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate mb-1.5">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                        <button 
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-1 text-gray-500 hover:bg-white hover:shadow-sm rounded-md transition-all"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-gray-700">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-1 text-gray-500 hover:bg-white hover:shadow-sm rounded-md transition-all"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-500 sm:text-gray-300 sm:hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded"
                        title="Eliminar refacción"
                        aria-label="Eliminar refacción"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-8">
                <ShoppingCart size={48} className="mb-3" />
                <p className="font-bold text-sm">Carrito Vacío</p>
                <p className="text-xs">Agrega productos para comenzar</p>
              </div>
            )}
          </div>

          {/* Summary & Checkout */}
          <div className="p-4 sm:p-6 bg-gray-50/80 border-t border-gray-100 space-y-3 sm:space-y-4">
            <div className="space-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>IVA (16%)</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Descuento</span>
                <input 
                  type="number" 
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-16 text-right bg-transparent border-b border-gray-200 focus:border-primary outline-none font-medium"
                />
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-base sm:text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl sm:text-2xl font-black text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setIsCheckoutModalOpen(true)}
                disabled={cart.length === 0 || isProcessing}
                className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 bg-primary text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-xl shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                <CheckCircle2 size={20} />
                <span>EJECUTAR VENTA</span>
              </button>
              <button 
                onClick={() => window.print()}
                className="p-3 sm:p-4 bg-white border border-gray-200 text-gray-600 rounded-xl sm:rounded-2xl hover:bg-gray-50 transition-all shrink-0"
                title="Imprimir Pre-Ticket"
              >
                <Printer size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Sticky Bar for Quick Checkout */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30 pointer-events-auto">
          <button
            onClick={() => {
              const ticketEl = document.getElementById('pos-ticket-container');
              if (ticketEl) {
                ticketEl.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-full flex items-center justify-between p-3.5 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/40 border border-white/20 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-xs font-bold">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
              <div className="text-left leading-tight">
                <p className="text-[10px] text-white/70 uppercase font-bold">Ticket Actual</p>
                <p className="text-sm font-black">{formatCurrency(total)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold bg-white text-primary px-3 py-1.5 rounded-xl shadow-xs">
              <span>Ver Ticket</span>
              <CheckCircle2 size={16} />
            </div>
          </button>
        </div>
      )}

      {/* Checkout Modal - Cerrar Venta */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
            >
              <div className="p-4 sm:p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 shrink-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Cerrar Venta</h3>
                <button 
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:bg-white rounded-xl transition-all"
                  aria-label="Cerrar modal"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
                {/* Summary */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">IVA (16%)</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(tax)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-red-500">
                      <span className="font-medium">Descuento</span>
                      <span className="font-bold">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xl font-black text-gray-900 uppercase tracking-tight">Total a Pagar</span>
                    <span className="text-4xl font-black text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Método de Pago</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'EFECTIVO', icon: Banknote, label: 'Efectivo' },
                      { id: 'TARJETA', icon: CreditCard, label: 'Tarjeta' },
                      { id: 'TRANSFERENCIA', icon: ArrowRightLeft, label: 'Transf.' },
                      { id: 'CRÉDITO', icon: Clock, label: 'Crédito' },
                    ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                          paymentMethod === method.id 
                            ? "border-primary bg-primary/5 text-primary shadow-md" 
                            : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          paymentMethod === method.id ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                        )}>
                          <method.icon size={20} />
                        </div>
                        <span className="font-bold text-sm">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</p>
                    <p className="font-bold text-gray-900">{selectedCustomer?.name || 'Venta al Público'}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button 
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                >
                  Regresar
                </button>
                <button 
                  onClick={async () => {
                    await handleCheckout();
                    setIsCheckoutModalOpen(false);
                  }}
                  disabled={isProcessing}
                  className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    'CONFIRMAR PAGO'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          >
            <div className="bg-white rounded-3xl p-12 text-center shadow-2xl max-w-sm w-full">
              <div className="w-24 h-24 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={64} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">¡Venta Exitosa!</h2>
              <p className="text-gray-500 mb-8">El inventario ha sido actualizado y el ticket generado.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    if (lastSaleData) printTicket(lastSaleData);
                  }}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-colors"
                >
                  <Printer size={20} />
                  Reimprimir Ticket
                </button>
                <button 
                  onClick={() => {
                    setShowSuccess(false);
                    setShowInvoiceModal(true);
                  }}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <Receipt size={20} />
                  Facturar Venta (CFDI)
                </button>
                <button 
                  onClick={() => setShowSuccess(false)}
                  className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Nueva Venta
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showInvoiceModal && lastSaleId && (
        <InvoiceGenerator 
          saleId={lastSaleId} 
          onClose={() => setShowInvoiceModal(false)} 
        />
      )}

      <NewCustomerModal 
        isOpen={isNewCustomerModalOpen} 
        onClose={() => setIsNewCustomerModalOpen(false)} 
        onSuccess={(savedCustomer) => {
          setSelectedCustomer(savedCustomer);
          setIsNewCustomerModalOpen(false);
          toast.success(`Cliente ${savedCustomer.name} asignado al ticket`);
        }}
      />

      {/* PRODUCT DETAIL MODAL */}
      <AnimatePresence>
        {selectedProductDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto overscroll-contain"
            onClick={() => setSelectedProductDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col md:flex-row"
            >
              {/* Image Section with Hover Zoom */}
              <div className="w-full md:w-1/2 bg-gray-50 p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden group shrink-0">
                {selectedProductDetail.imageUrl ? (
                  <img 
                    src={selectedProductDetail.imageUrl} 
                    alt={selectedProductDetail.description} 
                    className="w-full h-64 md:h-80 object-contain transition-transform duration-500 group-hover:scale-150 cursor-zoom-in"
                  />
                ) : (
                  <Package size={80} className="text-gray-300" />
                )}
                <span className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-600 border border-gray-200">
                  {selectedProductDetail.brand}
                </span>
              </div>

              {/* Details Section */}
              <div className="w-full md:w-1/2 p-6 flex flex-col justify-between shrink-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-black text-gray-900">{selectedProductDetail.pieceNumber}</h2>
                      <p className="text-sm text-gray-500 font-medium mt-1">{selectedProductDetail.description}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedProductDetail(null)}
                      className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase">Precio</span>
                      <span className="text-2xl font-black text-primary">{formatCurrency(selectedProductDetail.salePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase">Stock</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-xs font-bold",
                        selectedProductDetail.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {selectedProductDetail.stock} piezas
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase">Ubicación</span>
                      <span className="font-mono text-sm text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                        {selectedProductDetail.location || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {selectedProductDetail.model && (
                     <div>
                        <span className="text-xs font-bold text-gray-400 uppercase">Compatibilidad</span>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{selectedProductDetail.model}</p>
                     </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (selectedProductDetail.stock <= 0) {
                      toast.error('Este producto no tiene stock disponible.');
                      return;
                    }
                    addToCart(selectedProductDetail);
                    setSelectedProductDetail(null);
                  }}
                  disabled={selectedProductDetail.stock <= 0}
                  className={cn(
                    "w-full mt-6 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2",
                    selectedProductDetail.stock > 0 
                      ? "bg-primary text-white shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95" 
                      : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  )}
                >
                  <Plus size={20} />
                  {selectedProductDetail.stock > 0 ? 'Agregar al Ticket' : 'Sin Stock Disponible'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isBarcodeScannerOpen && (
        <BarcodeScanner 
          onScan={(code) => {
            const cleanCode = code.trim().toLowerCase();
            const matchedProduct = products.find(p => 
              String(p.pieceNumber || '').toLowerCase() === cleanCode || 
              (p.barcode && String(p.barcode || '').toLowerCase() === cleanCode) ||
              p.id === code.trim()
            );

            if (matchedProduct) {
              addToCart(matchedProduct);
              toast.success(`Refacción agregada: ${matchedProduct.pieceNumber}`);
            } else {
              setSearchQuery(code);
              setShowSearchResults(true);
              toast.info(`Buscando: ${code}`);
            }
          }}
          onClose={() => setIsBarcodeScannerOpen(false)}
        />
      )}
    </div>
  );
};

const BarcodeScanner: React.FC<{ onScan: (code: string) => void, onClose: () => void }> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const startScanner = async () => {
      // Small delay to ensure the container is rendered
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (!isMounted) return;

      const elementId = "pos-reader";
      const element = document.getElementById(elementId);
      
      if (!element) {
        console.error(`Element with id=${elementId} not found`);
        return;
      }

      try {
        const html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 20,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.8);
            return { width: size, height: size };
          },
          aspectRatio: 1.0
        };

        const onScanSuccess = (decodedText: string) => {
          onScan(decodedText);
          html5QrCode.stop().then(() => {
            if (isMounted) onClose();
          }).catch(() => {
            if (isMounted) onClose();
          });
        };

        try {
          // Try with environment camera first
          await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, undefined);
        } catch (envErr) {
          console.warn("Failed to start with environment camera, trying fallback...", envErr);
          if (!isMounted) return;
          
          try {
            // Fallback: Try with any available camera
            await html5QrCode.start({ facingMode: "user" }, config, onScanSuccess, undefined);
          } catch (userErr) {
            console.warn("Failed to start with user camera, trying generic start...", userErr);
            if (!isMounted) return;
            
            // Final fallback: Get all cameras and try the first one
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              await html5QrCode.start(devices[0].id, config, onScanSuccess, undefined);
            } else {
              throw new Error("No se encontraron cámaras disponibles.");
            }
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error starting scanner:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes("NotReadableError") || errorMessage.includes("Could not start video source")) {
          setError("La cámara está siendo usada por otra aplicación o pestaña. Por favor, ciérrala e intenta de nuevo.");
        } else if (errorMessage.includes("NotAllowedError") || errorMessage.includes("Permission denied")) {
          setError("Permiso de cámara denegado. Por favor, habilita el acceso a la cámara en tu navegador.");
        } else {
          setError("No se pudo acceder a la cámara. Por favor, verifica los permisos o intenta recargar la página.");
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        if (scanner.isScanning) {
          scanner.stop().then(() => {
            scanner.clear();
          }).catch(err => console.error("Error stopping scanner:", err));
        } else {
          scanner.clear();
        }
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl overflow-hidden w-full max-w-sm relative shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900">Escaneando Código...</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-all"><X size={20} /></button>
        </div>
        
        {error ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            <p className="text-sm text-gray-600 font-medium">{error}</p>
            <button 
              onClick={onClose}
              className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div id="pos-reader" className="w-full aspect-square bg-black"></div>
            <div className="p-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-2">
                <Barcode size={14} />
                Lector Activo
              </div>
              <p className="text-sm text-gray-500">
                Apunta la cámara al código de barras del producto
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};