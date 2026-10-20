import React, { useState, useEffect, useRef } from 'react';
import { 
  Tractor, 
  ShoppingCart, 
  Heart, 
  User, 
  Search, 
  X, 
  PhoneCall, 
  ShieldCheck, 
  Truck, 
  BookOpen, 
  HelpCircle,
  LayoutDashboard,
  Menu,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from './StoreContext';
import { Product } from '../../types';

interface StoreHeaderProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenPortal: () => void;
  onOpenBlog: () => void;
  onOpenSupport: () => void;
  onOpenERP: () => void;
  onSelectProduct: (product: Product) => void;
}

const CATEGORIES = [
  { id: 'TODAS', label: 'Todo el Catálogo' },
  { id: 'Motor', label: 'Motor y Cabezas' },
  { id: 'Hidráulico', label: 'Sistema Hidráulico' },
  { id: 'Transmisión', label: 'Transmisión y Clutch' },
  { id: 'Frenos', label: 'Frenos y Cilindros' },
  { id: 'Eléctrico', label: 'Eléctrico y Alternadores' },
  { id: 'Dirección', label: 'Dirección y Terminales' }
];

export const StoreHeader: React.FC<StoreHeaderProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  selectedBrand,
  onSelectBrand,
  searchQuery,
  onSearchChange,
  onOpenPortal,
  onOpenBlog,
  onOpenSupport,
  onOpenERP,
  onSelectProduct
}) => {
  const { cart, wishlist, setIsCartOpen } = useStore();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Suggestions based on search
  const suggestions = searchQuery.trim().length >= 2 
    ? products.filter(p => 
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pieceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Top Banner Announcement */}
      <div className="bg-emerald-950 text-emerald-100 text-xs py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>🚜 Envíos a todo México por FedEx y Estafeta | <strong>Envío Gratis</strong> en compras mayores a $3,500 MXN</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-emerald-300">
            <button 
              onClick={onOpenSupport}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <PhoneCall size={12} />
              <span>Soporte Técnico Especializado</span>
            </button>
            <span className="hidden md:inline">•</span>
            <button 
              onClick={onOpenBlog}
              className="hover:text-white transition-colors hidden md:flex items-center gap-1"
            >
              <BookOpen size={12} />
              <span>Guías de Taller</span>
            </button>
            <span className="hidden md:inline">•</span>
            <button 
              onClick={onOpenERP}
              className="text-amber-300 hover:text-amber-100 font-semibold flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded transition-colors"
            >
              <LayoutDashboard size={12} />
              <span>Acceso Panel ERP / POS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
            <Tractor size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl text-gray-900 tracking-tight">FARMER<span className="text-emerald-700">PARTS</span></span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                Tienda Online
              </span>
            </div>
            <p className="text-[11px] text-gray-500 hidden sm:block">Refacciones Agrícolas Genuinas & Alternativas</p>
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="flex-1 max-w-xl relative hidden md:block" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por número de parte (ej. AL156331), descripción o tractor..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-sm text-gray-900 rounded-xl border border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          <AnimatePresence>
            {isSearchFocused && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 z-50 divide-y divide-gray-100"
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Sugerencias encontradas ({suggestions.length})
                </div>
                {suggestions.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProduct(p);
                      setIsSearchFocused(false);
                    }}
                    className="flex items-center gap-3 p-2.5 hover:bg-emerald-50/70 rounded-xl cursor-pointer transition-colors group"
                  >
                    <img 
                      src={p.imageUrl || 'https://picsum.photos/seed/part/80/80'} 
                      alt={p.description} 
                      className="w-10 h-10 object-cover rounded-lg border border-gray-100 shrink-0 bg-gray-50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                          {p.pieceNumber}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">{p.brand}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-900 truncate mt-0.5 group-hover:text-emerald-900">
                        {p.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-gray-900">${p.salePrice.toLocaleString()} MXN</span>
                      <p className="text-[10px] text-emerald-600 font-medium">Stock: {p.stock} pzas</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Wishlist */}
          <button
            onClick={onOpenPortal}
            className="relative p-2 sm:p-2.5 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shrink-0"
            title="Lista de Deseos"
          >
            <Heart size={18} className={wishlist.length > 0 ? "fill-rose-500 text-rose-500" : ""} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-md shadow-emerald-700/20 font-semibold text-xs sm:text-sm transition-all active:scale-95 shrink-0"
          >
            <ShoppingCart size={17} />
            <span className="hidden sm:inline">Carrito</span>
            {totalCartCount > 0 && (
              <span className="bg-amber-400 text-emerald-950 text-[10px] sm:text-xs font-extrabold px-1.5 py-0.5 rounded-full ml-0.5">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Customer Portal Trigger (Desktop) */}
          <button
            onClick={onOpenPortal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-all text-xs font-semibold border border-gray-200 shrink-0"
          >
            <User size={16} />
            <span className="hidden lg:inline">Mis Pedidos</span>
          </button>

          {/* Back to ERP / POS button */}
          <button
            onClick={onOpenERP}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 bg-gray-900 hover:bg-black text-white rounded-xl transition-all text-xs font-semibold shadow-xs shrink-0"
            title="Volver al Punto de Venta y Gestión de Inventario"
          >
            <LayoutDashboard size={15} className="text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Punto de Venta</span>
          </button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl shrink-0"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-200 px-4 py-3 space-y-2 overflow-hidden"
          >
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenERP();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-900 text-white text-xs font-bold"
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard size={16} className="text-emerald-400" />
                <span>Volver al Punto de Venta / ERP</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Admin</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPortal();
              }}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-semibold"
            >
              <User size={16} />
              <span>Mis Pedidos y Facturas</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSupport();
              }}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-semibold"
            >
              <PhoneCall size={16} />
              <span>Soporte Técnico Especializado</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Search Bar */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
          <input
            type="text"
            placeholder="Buscar refacción o parte..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-gray-50 text-xs text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="bg-gray-50 border-t border-gray-200/80 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-2 scrollbar-none gap-2">
          <div className="flex items-center gap-1.5">
            {CATEGORIES.map(cat => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Quick Tractor Brands Selector */}
          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-gray-200 text-xs text-gray-500">
            <span className="font-semibold text-gray-400 text-[11px] uppercase tracking-wider">Marcas:</span>
            {['John Deere', 'Massey Ferguson', 'New Holland', 'Perkins', 'Case IH'].map(b => (
              <button
                key={b}
                onClick={() => onSelectBrand(selectedBrand === b ? 'TODAS' : b)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  selectedBrand === b
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-gray-600 hover:text-emerald-700'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
