import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Order, Coupon } from '../../types';
import { toast } from 'sonner';

interface StoreContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  subtotal: number;
  tax: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  shippingMethod: 'ESTANDAR' | 'EXPRESS' | 'RECOGER_TIENDA';
  setShippingMethod: (method: 'ESTANDAR' | 'EXPRESS' | 'RECOGER_TIENDA') => void;
  postalCode: string;
  setPostalCode: (cp: string) => void;
  clientEmail: string;
  setClientEmail: (email: string) => void;
  clientOrders: Order[];
  refreshClientOrders: (email: string) => Promise<void>;
}

const DEFAULT_COUPONS: Coupon[] = [
  { code: 'FARMER10', discountType: 'PERCENTAGE', discountValue: 10, minPurchase: 1000, isActive: true, description: '10% de descuento en compras mayores a $1,000 MXN' },
  { code: 'COSECHA2026', discountType: 'FIXED', discountValue: 500, minPurchase: 3500, isActive: true, description: '$500 MXN de bonificación en compras mayores a $3,500 MXN' }
];

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { const s = localStorage.getItem('farmer_parts_cart'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try { const s = localStorage.getItem('farmer_parts_wishlist'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try { const s = localStorage.getItem('farmer_parts_coupon'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [shippingMethod, setShippingMethod] = useState<'ESTANDAR' | 'EXPRESS' | 'RECOGER_TIENDA'>('ESTANDAR');
  const [postalCode, setPostalCode] = useState(() => localStorage.getItem('farmer_parts_cp') || '76000');
  const [clientEmail, setClientEmail] = useState(() => localStorage.getItem('farmer_parts_client_email') || '');
  const [clientOrders, setClientOrders] = useState<Order[]>([]);

  useEffect(() => { try { localStorage.setItem('farmer_parts_cart', JSON.stringify(cart)); } catch {} }, [cart]);
  useEffect(() => { try { localStorage.setItem('farmer_parts_wishlist', JSON.stringify(wishlist)); } catch {} }, [wishlist]);
  useEffect(() => { try { appliedCoupon ? localStorage.setItem('farmer_parts_coupon', JSON.stringify(appliedCoupon)) : localStorage.removeItem('farmer_parts_coupon'); } catch {} }, [appliedCoupon]);

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        toast.success(`Actualizado: ${product.description}`);
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) } : item);
      }
      toast.success(`Agregado: ${product.description}`);
      return [...prev, { product, quantity: Math.min(product.stock, Math.max(1, quantity)) }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: Math.min(item.product.stock, quantity) } : item));
  };
  const removeFromCart = (productId: string) => setCart(prev => prev.filter(i => i.product.id !== productId));
  const clearCart = () => { setCart([]); setAppliedCoupon(null); };
  const toggleWishlist = (productId: string) => setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  const isWishlisted = (productId: string) => wishlist.includes(productId);

  const subtotal = cart.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  let discountAmount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.minPurchase) {
    discountAmount = appliedCoupon.discountType === 'PERCENTAGE' ? (subtotal * appliedCoupon.discountValue) / 100 : appliedCoupon.discountValue;
  }
  let shippingCost = shippingMethod === 'RECOGER_TIENDA' ? 0 : shippingMethod === 'EXPRESS' ? 350 : (subtotal > 3500 ? 0 : 180);
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = taxableSubtotal * 0.16;
  const total = taxableSubtotal + tax + shippingCost;

  const applyCoupon = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const coupon = DEFAULT_COUPONS.find(c => c.code === cleanCode);
    if (!coupon) { toast.error('Cupón no válido'); return false; }
    if (subtotal < coupon.minPurchase) { toast.warning(`Requiere compra mínima de $${coupon.minPurchase}`); return false; }
    setAppliedCoupon(coupon);
    toast.success(coupon.description || 'Cupón aplicado');
    return true;
  };

  const removeCoupon = () => { setAppliedCoupon(null); toast.info('Cupón removido'); };
  const refreshClientOrders = async (email: string) => {
    if (!email) return;
    try {
      const { getOnlineOrdersApi } = await import('../../lib/sheetsApi');
      const res = await getOnlineOrdersApi();
      
      if (res.success && res.data) {
        // Filtrar por el correo del cliente (case-insensitive)
        const myOrders = res.data.filter((o: any) => 
          String(o.customerEmail || '').toLowerCase() === email.toLowerCase()
        );
        
        // Mapear al formato Order que espera el frontend
        const mapped = myOrders.map((o: any) => ({
          id: o._id || o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          customerEmail: o.customerEmail,
          customerPhone: o.customerPhone,
          items: Array.isArray(o.items) ? o.items : (typeof o.items === 'string' ? JSON.parse(o.items) : []),
          subtotal: Number(o.subtotal) || 0,
          tax: Number(o.tax) || 0,
          shippingCost: Number(o.shippingCost) || 0,
          discount: Number(o.discount) || 0,
          total: Number(o.total) || 0,
          status: o.status || 'PENDIENTE',
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          shippingAddress: typeof o.shippingAddress === 'string' ? JSON.parse(o.shippingAddress) : (o.shippingAddress || {}),
          shippingMethod: o.shippingMethod,
          trackingNumber: o.trackingNumber || '',
          carrier: o.carrier || '',
          couponCode: o.couponCode || '',
          createdAt: o.createdAt || '',
          updatedAt: o.updatedAt || '',
        }));
        
        setClientOrders(mapped);
      }
    } catch (err) {
      console.error('Error fetching client orders:', err);
    }
  };

  return (
    <StoreContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, isCartOpen, setIsCartOpen, wishlist, toggleWishlist, isWishlisted, appliedCoupon, applyCoupon, removeCoupon, subtotal, tax, discountAmount, shippingCost, total, shippingMethod, setShippingMethod, postalCode, setPostalCode, clientEmail, setClientEmail, clientOrders, refreshClientOrders }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};