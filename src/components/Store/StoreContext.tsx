import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Order, Coupon, ShippingAddress } from '../../types';


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
  {
    code: 'FARMER10',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minPurchase: 1000,
    isActive: true,
    description: '10% de descuento en compras mayores a $1,000 MXN'
  },
  {
    code: 'COSECHA2026',
    discountType: 'FIXED',
    discountValue: 500,
    minPurchase: 3500,
    isActive: true,
    description: '$500 MXN de bonificación en compras mayores a $3,500 MXN'
  },
  {
    code: 'ENVIOGRATIS',
    discountType: 'FIXED',
    discountValue: 250,
    minPurchase: 2000,
    isActive: true,
    description: 'Envío estándar sin costo en compras mayores a $2,000 MXN'
  }
];

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('farmer_parts_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('farmer_parts_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem('farmer_parts_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [shippingMethod, setShippingMethod] = useState<'ESTANDAR' | 'EXPRESS' | 'RECOGER_TIENDA'>('ESTANDAR');
  const [postalCode, setPostalCode] = useState(() => localStorage.getItem('farmer_parts_cp') || '76000');
  const [clientEmail, setClientEmail] = useState(() => localStorage.getItem('farmer_parts_client_email') || '');
  const [clientOrders, setClientOrders] = useState<Order[]>([]);

  // Sync Cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('farmer_parts_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Could not save cart to localStorage', e);
    }
  }, [cart]);

  // Sync Wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('farmer_parts_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Could not save wishlist to localStorage', e);
    }
  }, [wishlist]);

  // Sync Coupon to localStorage
  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem('farmer_parts_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('farmer_parts_coupon');
      }
    } catch (e) {
      console.warn('Could not save coupon to localStorage', e);
    }
  }, [appliedCoupon]);

  // Sync Client Email
  useEffect(() => {
    if (clientEmail) {
      localStorage.setItem('farmer_parts_client_email', clientEmail);
      refreshClientOrders(clientEmail);
    }
  }, [clientEmail]);

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        toast.success(`Actualizado en carrito: ${product.description}`, {
          description: `${newQty} piezas en total`
        });
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        const initialQty = Math.min(product.stock, Math.max(1, quantity));
        toast.success(`Agregado al carrito: ${product.description}`, {
          description: `${initialQty} pieza(s) agregadas`
        });
        return [...prev, { product, quantity: initialQty }];
      }
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const max = item.product.stock || 1;
          const clamped = Math.min(max, quantity);
          if (quantity > max) {
            toast.warning(`Existencia máxima alcanzada`, {
              description: `Solo hay ${max} unidades disponibles de esta refacción.`
            });
          }
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const item = prev.find(i => i.product.id === productId);
      if (item) {
        toast.info(`Refacción eliminada del carrito: ${item.product.description}`);
      }
      return prev.filter(i => i.product.id !== productId);
    });
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      if (prev.includes(productId)) {
        toast.info('Refacción removida de tu lista de deseos');
        return prev.filter(id => id !== productId);
      } else {
        toast.success('¡Refacción guardada en tu lista de deseos!');
        return [...prev, productId];
      }
    });
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);

  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.minPurchase) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  // Shipping calculation
  let shippingCost = 0;
  if (shippingMethod === 'RECOGER_TIENDA') {
    shippingCost = 0;
  } else if (shippingMethod === 'EXPRESS') {
    shippingCost = 350;
  } else {
    // Estandar
    if (appliedCoupon?.code === 'ENVIOGRATIS' && subtotal >= 2000) {
      shippingCost = 0;
    } else {
      shippingCost = subtotal > 3500 ? 0 : 180; // Free standard shipping over $3,500
    }
  }

  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = taxableSubtotal * 0.16; // 16% IVA
  const total = taxableSubtotal + tax + shippingCost;

  const applyCoupon = async (code: string): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return false;

    // Check pre-defined or Firestore coupons
    let coupon = DEFAULT_COUPONS.find(c => c.code === cleanCode);
    if (!coupon) {
      
    }

    if (!coupon) {
      toast.error('Cupón no válido', {
        description: `El código "${cleanCode}" no existe o ha expirado.`
      });
      return false;
    }

    if (subtotal < coupon.minPurchase) {
      toast.warning('Monto mínimo no alcanzado', {
        description: `Este cupón requiere una compra mínima de $${coupon.minPurchase.toLocaleString()} MXN.`
      });
      return false;
    }

    setAppliedCoupon(coupon);
    toast.success(`¡Cupón aplicado con éxito!`, {
      description: coupon.description
    });
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast.info('Cupón de descuento removido');
  };

  const refreshClientOrders = async (email: string) => {
    if (!email) return;
    try {
      const q = query(collection(db, 'orders'), where('customerEmail', '==', email.trim().toLowerCase()));
      const snap = await getDocs(q);
      const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      // Sort by creation date descending
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setClientOrders(orders);
    } catch (e) {
      console.warn('Could not fetch client orders from Firestore:', e);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        wishlist,
        toggleWishlist,
        isWishlisted,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        subtotal,
        tax,
        discountAmount,
        shippingCost,
        total,
        shippingMethod,
        setShippingMethod,
        postalCode,
        setPostalCode,
        clientEmail,
        setClientEmail,
        clientOrders,
        refreshClientOrders
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
