import React, { useState, useEffect } from 'react';
import { Product, Order } from '../../types';


import { StoreProvider, useStore } from './StoreContext';
import { StoreHeader } from './StoreHeader';
import { ProductCatalog } from './ProductCatalog';
import { CartDrawer } from './CartDrawer';
import { ProductModal } from './ProductModal';
import { CheckoutModal } from './CheckoutModal';
import { CustomerPortal } from './CustomerPortal';
import { BlogSection } from './BlogSection';
import { StoreSupport } from './StoreSupport';
import { PhoneCall, HelpCircle, MessageSquare, Tractor, ShoppingCart } from 'lucide-react';
import { Toaster, toast } from 'sonner';

interface OnlineStoreViewProps {
  onOpenERP: () => void;
}

const OnlineStoreInner: React.FC<OnlineStoreViewProps> = ({ onOpenERP }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [selectedBrand, setSelectedBrand] = useState('TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [isBlogOpen, setIsBlogOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const { setIsCartOpen, cart } = useStore();

  // Listen to Firestore products in real time
  useEffect(() => {
    // Firebase eliminado
    // Firebase eliminado
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <StoreHeader
        products={products}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedBrand={selectedBrand}
        onSelectBrand={setSelectedBrand}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenPortal={() => setIsPortalOpen(true)}
        onOpenBlog={() => setIsBlogOpen(true)}
        onOpenSupport={() => setIsSupportOpen(true)}
        onOpenERP={onOpenERP}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-gray-500">Cargando inventario de refacciones agrícolas...</p>
          </div>
        ) : (
          <ProductCatalog
            products={products}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
            searchQuery={searchQuery}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        )}
      </main>

      {/* Sliding Cart Drawer */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Detailed Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOpenCheckoutDirect={() => {
            setSelectedProduct(null);
            setIsCheckoutOpen(true);
          }}
        />
      )}

      {/* 4-Step Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          onClose={() => setIsCheckoutOpen(false)}
          onOrderSuccess={(order) => {
            setIsPortalOpen(true);
          }}
        />
      )}

      {/* Customer Portal (My Orders, Wishlist, Credit) */}
      {isPortalOpen && (
        <CustomerPortal
          products={products}
          onClose={() => setIsPortalOpen(false)}
          onSelectProduct={(p) => {
            setIsPortalOpen(false);
            setSelectedProduct(p);
          }}
        />
      )}

      {/* Technical Blog / Repair Guides */}
      {isBlogOpen && (
        <BlogSection
          onClose={() => setIsBlogOpen(false)}
        />
      )}

      {/* Support & Advisor Modal */}
      {isSupportOpen && (
        <StoreSupport
          onClose={() => setIsSupportOpen(false)}
        />
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-5 right-5 z-30 flex flex-col gap-2.5 items-end">
        {/* WhatsApp direct floating trigger */}
        <a
          href="https://wa.me/526688123456?text=Hola,%20quisiera%20asesor%C3%ADa%20sobre%20una%20refacci%C3%B3n"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-xl hover:scale-105 transition-all flex items-center gap-2 group"
          title="Asesoría por WhatsApp"
        >
          <PhoneCall size={20} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 text-xs font-bold whitespace-nowrap">
            Asistencia en Campo
          </span>
        </a>

        {/* Quick Cart Floating Bubble */}
        {cart.length > 0 && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-3 bg-gray-900 hover:bg-black text-white rounded-full shadow-2xl hover:scale-105 transition-all relative flex items-center justify-center"
            title="Ver Carrito"
          >
            <ShoppingCart size={20} />
            <span className="absolute -top-1 -right-1 bg-amber-400 text-gray-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </button>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-emerald-950 text-emerald-100 border-t border-emerald-900 py-12 px-4 sm:px-6 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Tractor size={22} className="text-amber-400" />
              <span className="font-extrabold text-base tracking-tight">FARMER PARTS MÉXICO</span>
            </div>
            <p className="text-emerald-300 leading-relaxed">
              Distribuidor mayorista y minorista de refacciones agrícolas para tractores, implementos y cosechadoras.
            </p>
            <p className="text-emerald-400 font-mono">RFC: FME230101AA1</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Marcas Surtidas</h4>
            <ul className="space-y-1 text-emerald-300">
              <li>• John Deere (Series 5000, 6000, 7000)</li>
              <li>• Massey Ferguson (285, 290, 399)</li>
              <li>• New Holland (TS6000, TS6020)</li>
              <li>• Perkins (Motores 3, 4 y 6 cilindros)</li>
              <li>• Case IH & Ford Agrícola</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Garantía y Envíos</h4>
            <ul className="space-y-1 text-emerald-300">
              <li>• Envíos asegurados por FedEx / Estafeta</li>
              <li>• Envío estándar GRATIS en compras +$3,500 MXN</li>
              <li>• 12 meses de garantía directa de taller</li>
              <li>• Facturación automática CFDI 4.0</li>
              <li>• Convenios de crédito para ejidos y ranchos</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Atención & Matriz</h4>
            <p className="text-emerald-300">Parque Industrial Querétaro, Santa Rosa Jáuregui, QRO.</p>
            <p className="text-emerald-300">Teléfono: (668) 812-3456</p>
            <p className="text-emerald-300">Lunes a Sábado: 8:00 AM a 6:30 PM</p>
            <div className="pt-2">
              <button
                onClick={onOpenERP}
                className="text-amber-300 hover:text-white font-bold text-xs underline"
              >
                Acceso a Sistema Administrativo ERP / POS →
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-emerald-900/80 text-center text-emerald-400 text-[11px]">
          © {new Date().getFullYear()} Farmer Parts México S.A. de C.V. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export const OnlineStoreView: React.FC<OnlineStoreViewProps> = (props) => {
  return (
    <StoreProvider>
      <OnlineStoreInner {...props} />
    </StoreProvider>
  );
};
