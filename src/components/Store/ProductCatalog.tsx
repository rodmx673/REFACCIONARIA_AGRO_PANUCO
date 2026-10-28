import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  SlidersHorizontal, 
  ArrowUpDown, 
  ShoppingCart, 
  Heart, 
  Eye, 
  Check, 
  Copy, 
  Sparkles, 
  Tractor, 
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star
} from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import { useStore } from './StoreContext';
import { toast } from 'sonner';

interface ProductCatalogProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  searchQuery: string;
  onSelectProduct: (product: Product) => void;
}

const TRACTOR_BRANDS = [
  { name: 'John Deere', tag: 'JD', iconColor: 'bg-emerald-600' },
  { name: 'Massey Ferguson', tag: 'MF', iconColor: 'bg-red-600' },
  { name: 'New Holland', tag: 'NH', iconColor: 'bg-blue-600' },
  { name: 'Perkins', tag: 'Perkins', iconColor: 'bg-amber-600' },
  { name: 'Case IH', tag: 'Case', iconColor: 'bg-rose-700' },
  { name: 'Ford', tag: 'Ford', iconColor: 'bg-indigo-600' }
];

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  selectedBrand,
  onSelectBrand,
  searchQuery,
  onSelectProduct
}) => {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(25000);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category match
      if (selectedCategory !== 'TODAS' && p.category !== selectedCategory) {
        return false;
      }
      // Brand match
      if (selectedBrand !== 'TODAS' && p.brand !== selectedBrand) {
        return false;
      }
      // In stock
      if (inStockOnly && p.stock <= 0) {
        return false;
      }
      // Max price
      if (p.salePrice > maxPrice) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = String(p.description || '').toLowerCase().includes(q);
        const matchPart = String(p.pieceNumber || '').toLowerCase().includes(q);
        const matchBrand = String(p.brand || '').toLowerCase().includes(q);
        const matchCat = String(p.category || '').toLowerCase().includes(q);
        const matchModel = String(p.model || '').toLowerCase().includes(q);
        if (!matchDesc && !matchPart && !matchBrand && !matchCat && !matchModel) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.salePrice - b.salePrice;
      if (sortBy === 'price-desc') return b.salePrice - a.salePrice;
      if (sortBy === 'name') return a.description.localeCompare(b.description);
      return 0; // default featured
    });
  }, [products, selectedCategory, selectedBrand, inStockOnly, maxPrice, searchQuery, sortBy]);

  const handleCopyPart = (part: any, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(part);
    setCopiedId(String(part || ""));
    toast.success(`Copiado: ${part}`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleResetFilters = () => {
    onSelectCategory('TODAS');
    onSelectBrand('TODAS');
    setInStockOnly(false);
    setMaxPrice(25000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner with Tractor Imagery and Trust Badges */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          <div className="lg:col-span-8 space-y-3 sm:space-y-4 text-center sm:text-left min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] sm:text-xs font-semibold backdrop-blur-xs border border-emerald-500/30">
              <Sparkles size={14} className="text-amber-400 shrink-0" />
              <span className="truncate">Tienda Oficial Farmer Parts • Catálogo Agrícola</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Refacciones para Tractores con <br className="hidden sm:inline" />
              <span className="text-amber-400">Garantía de Campo y Envío Inmediato</span>
            </h1>

            <p className="text-xs sm:text-base text-emerald-100/90 max-w-2xl leading-relaxed">
              Bombas de agua, embragues, discos de freno, filtros y componentes hidráulicos para John Deere, Massey Ferguson, New Holland y Perkins.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-4 text-xs font-semibold text-emerald-200">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-amber-400 shrink-0" />
                <span>Compatibilidad Garantizada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck size={16} className="text-amber-400 shrink-0" />
                <span>Despacho Inmediato</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex justify-center w-full">
            <div className="w-full max-w-[280px] sm:w-64 sm:h-64 rounded-3xl bg-emerald-800/40 p-4 border border-emerald-700/50 backdrop-blur-sm shadow-2xl flex flex-col justify-between gap-3">
              <div className="space-y-1 text-center">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest">Atención a Productores</span>
                <p className="text-base font-extrabold text-white">¿Dudas con tu número de parte?</p>
                <p className="text-xs text-emerald-200">Nuestros técnicos mecánicos te asisten sin costo.</p>
              </div>

              <div className="bg-emerald-950/80 p-3 rounded-2xl border border-emerald-800/60 text-center space-y-1">
                <span className="text-[11px] text-gray-400">Línea directa WhatsApp:</span>
                <p className="text-sm font-mono font-bold text-emerald-300">(668) 812-3456</p>
                <span className="inline-block text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full">
                  Asistencia en Tiempo Real
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Selectors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Tractor size={17} className="text-emerald-700" />
            <span>Selecciona la Marca de tu Tractor</span>
          </h3>
          {selectedBrand !== 'TODAS' && (
            <button
              onClick={() => onSelectBrand('TODAS')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Ver todas las marcas
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TRACTOR_BRANDS.map(b => {
            const active = selectedBrand === b.name;
            return (
              <button
                key={b.name}
                onClick={() => onSelectBrand(active ? 'TODAS' : b.name)}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 group ${
                  active
                    ? 'border-emerald-700 bg-emerald-50/80 shadow-md ring-2 ring-emerald-700/20'
                    : 'border-gray-200 bg-white hover:border-emerald-500 hover:shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${b.iconColor} text-white font-extrabold text-sm flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                  {b.tag}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-tight">{b.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Refacciones</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Catalog Layout: Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Filter Sidebar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-6 shadow-xs sticky top-28 hidden lg:block">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Filter size={16} className="text-emerald-700" />
              <span>Filtros de Búsqueda</span>
            </div>
            {(selectedCategory !== 'TODAS' || selectedBrand !== 'TODAS' || inStockOnly || maxPrice < 25000) && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:underline font-semibold flex items-center gap-1"
              >
                <RotateCcw size={12} />
                <span>Restablecer</span>
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Categoría
            </label>
            <div className="space-y-1">
              {['TODAS', 'Motor', 'Hidráulico', 'Transmisión', 'Frenos', 'Eléctrico', 'Dirección'].map(cat => {
                const count = cat === 'TODAS' 
                  ? products.length 
                  : products.filter(p => p.category === cat).length;
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => onSelectCategory(cat)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      active
                        ? 'bg-emerald-800 text-white font-bold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{cat === 'TODAS' ? 'Todas las Categorías' : cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-emerald-950 text-emerald-200' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-800 uppercase tracking-wider">Precio Máximo</span>
              <span className="font-mono font-extrabold text-emerald-800">${maxPrice.toLocaleString()} MXN</span>
            </div>
            <input
              type="range"
              min={200}
              max={25000}
              step={200}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>$200</span>
              <span>$25,000+</span>
            </div>
          </div>

          {/* Stock Availability Toggle */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
              Disponibilidad
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 border-gray-300"
              />
              <span className="font-medium">Solo piezas con existencia inmediata</span>
            </label>
          </div>
        </div>

        {/* Right Product Grid Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header Controls: Results Count & Sort Dropdown */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">
                {filteredProducts.length} refacciones encontradas
              </span>
              {(selectedCategory !== 'TODAS' || selectedBrand !== 'TODAS' || searchQuery) && (
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                  Filtrado activo
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 font-medium"
              >
                <option value="featured">Relevancia / Destacados</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="name">Nombre / Alfabético</option>
              </select>
            </div>
          </div>

          {/* Grid of Cards */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <Filter size={32} />
              </div>
              <h3 className="text-base font-bold text-gray-900">No se encontraron refacciones</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No hay productos que coincidan con tus criterios de búsqueda o filtros seleccionados.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                Restablecer todos los filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map(product => {
                const inStock = product.stock > 0;
                const isWish = isWishlisted(product.id);

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-600/60 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer"
                    onClick={() => onSelectProduct(product)}
                  >
                    <div>
                      {/* Image Thumbnail Header */}
                      <div className="relative aspect-4/3 bg-gray-50 overflow-hidden border-b border-gray-100">
                        <img
                          src={product.imageUrl || 'https://picsum.photos/seed/part/400/300'}
                          alt={product.description}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                          <span className="bg-emerald-950/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                            {product.brand}
                          </span>
                        </div>

                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product.id);
                          }}
                          className={`absolute top-2.5 right-2.5 p-2 rounded-xl backdrop-blur-xs transition-all shadow-xs ${
                            isWish
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-white/80 text-gray-500 hover:bg-white hover:text-rose-600'
                          }`}
                        >
                          <Heart size={16} className={isWish ? 'fill-rose-500' : ''} />
                        </button>

                        {/* Stock indicator bottom-right */}
                        <div className="absolute bottom-2 right-2">
                          {inStock ? (
                            <span className="bg-white/90 backdrop-blur-xs text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs border border-emerald-100">
                              En Stock ({product.stock})
                            </span>
                          ) : (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Bajo Pedido
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 space-y-2">
                        {/* Part Number Pill */}
                        <div className="flex items-center justify-between gap-1">
                          <div
                            onClick={(e) => handleCopyPart(String(product.pieceNumber || ""), e)}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-mono text-[11px] font-bold transition-colors"
                            title="Copiar número de parte"
                          >
                            <span>{String(product.pieceNumber || "S/N")}</span>
                            {copiedId === String(product.pieceNumber || "") ? <Check size={11} className="text-emerald-700" /> : <Copy size={11} className="text-gray-400" />}
                          </div>

                          <span className="text-[11px] text-gray-400 font-medium">
                            {product.category || 'Refacción'}
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                          {product.description}
                        </h4>

                        <p className="text-[11px] text-gray-500 line-clamp-1">
                          Compatible: {product.model || 'Varios modelos'}
                        </p>
                      </div>
                    </div>

                    {/* Footer Price & Add To Cart Button */}
                    <div className="p-4 pt-0">
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-base sm:text-lg font-black text-gray-900">
                            ${product.salePrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold ml-1">MXN</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product, 1);
                          }}
                          disabled={!inStock}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                        >
                          <ShoppingCart size={14} />
                          <span>Agregar</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
