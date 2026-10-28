import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from './Auth';
import { BarChart3, Bell, BookOpen, ChevronLeft, ChevronRight, Clock, DollarSign, FileText, History, LogOut, Menu, Package, Receipt, ScanText, Search, Settings, Shield, ShieldCheck, ShoppingBag, ShoppingCart, Truck, UserCheck, Users, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { MultiAssistantChat } from './Assistant/MultiAssistantChat';
import { Toaster, toast } from 'sonner';
import { getProducts as getProductsApi } from '../lib/sheetsApi';
import { Product } from '../types';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left group relative",
      active 
        ? "bg-primary text-white shadow-lg shadow-primary/20" 
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
    )}
  >
    <Icon size={22} className={cn("shrink-0 transition-transform group-hover:scale-110", active && "text-white")} />
    {!collapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
    {collapsed && (
      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
        {label}
      </div>
    )}
  </button>
);

export const Layout: React.FC<{ 
  children: React.ReactNode; 
  activeTab: string; 
  setActiveTab: (tab: string) => void;
  onSwitchToStore?: () => void;
}> = ({ children, activeTab, setActiveTab, onSwitchToStore }) => {
  const { user, signOut, permissions } = useContext(AuthContext) as any;
  const [collapsed, setCollapsed] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const prevLowStockIds = useRef<Set<string>>(new Set());

  const contentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const loadLowStock = async () => {
      try {
        const res = await getProductsApi();
        if (!mounted || !res.success || !res.data) return;
        const allProducts = res.data as unknown as Product[];
        const lowStock = allProducts.filter(p => p.stock <= p.minStock);

        lowStock.forEach(p => {
          if (!prevLowStockIds.current.has(p.id)) {
            toast.warning(`Stock Bajo: ${p.description}`, {
              description: `Quedan ${p.stock} unidades (Mínimo: ${p.minStock})`,
              action: {
                label: 'Ver Inventario',
                onClick: () => setActiveTab('inventory')
              }
            });
          }
        });

        prevLowStockIds.current = new Set(lowStock.map(p => p.id));

        setLowStockProducts(lowStock);
        setLowStockCount(lowStock.length);
      } catch (error) {
        console.error('Error loading low stock from Sheets:', error);
      }
    };

    loadLowStock();
    const interval = setInterval(loadLowStock, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user, setActiveTab]);

  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  }, [activeTab]);

  const navItems = [
    { id: 'pos', label: 'Punto de Venta', icon: ShoppingCart, roles: ['ADMIN', 'GERENTE', 'CLERK', 'VENTAS', 'CAJERO', 'VENDEDOR'], perm: 'canAccessPOS' },
    { id: 'inventory', label: 'Inventario y Stock', icon: Package, roles: ['ADMIN', 'GERENTE', 'BODEGA', 'ALMACENISTA', 'VENTAS', 'VENDEDOR', 'CLERK', 'CAJERO'], perm: 'canAccessInventory' },
    { id: 'reference-catalog', label: 'Catálogo de Partes', icon: BookOpen, roles: ['ADMIN', 'GERENTE', 'BODEGA', 'ALMACENISTA', 'VENTAS', 'VENDEDOR', 'CLERK', 'CAJERO'], perm: 'canAccessInventory' },
    { id: 'online-orders', label: 'Pedidos E-Commerce', icon: ShoppingBag, roles: ['ADMIN', 'GERENTE', 'VENTAS', 'VENDEDOR', 'BODEGA', 'ALMACENISTA'], perm: 'canAccessInventory' },
    { id: 'ocr-reader', label: 'Extractor de Facturas', icon: ScanText, roles: ['ADMIN', 'GERENTE', 'BODEGA', 'ALMACENISTA', 'CLERK', 'VENTAS', 'CAJERO', 'VENDEDOR'], perm: 'canAccessOCR' },
    { id: 'invoice-history', label: 'Historial de Facturas', icon: History, roles: ['ADMIN', 'GERENTE', 'BODEGA', 'ALMACENISTA', 'CLERK', 'VENTAS', 'CAJERO', 'VENDEDOR'], perm: 'canAccessInvoicing' },
    { id: 'customers', label: 'Clientes', icon: Users, roles: ['ADMIN', 'GERENTE', 'VENTAS', 'VENDEDOR', 'CLERK', 'CAJERO'], perm: 'canAccessCustomers' },
    { id: 'vendors', label: 'Proveedores', icon: Truck, roles: ['ADMIN', 'GERENTE', 'BODEGA', 'ALMACENISTA'], perm: 'canAccessVendors' },
    { id: 'reports', label: 'Reportes', icon: BarChart3, roles: ['ADMIN', 'GERENTE'], perm: 'canAccessReports' },
    { id: 'employees', label: 'Recursos Humanos', icon: UserCheck, roles: ['ADMIN', 'GERENTE'], perm: 'canAccessHR' },
    { id: 'commissions', label: 'Comisiones', icon: DollarSign, roles: ['ADMIN', 'GERENTE'], perm: 'canAccessHR' },
    { id: 'attendance', label: 'Asistencia', icon: Clock, roles: ['ADMIN', 'GERENTE'], perm: 'canAccessHR' },
    { id: 'payroll', label: 'Nómina', icon: DollarSign, roles: ['ADMIN', 'GERENTE'], perm: 'canAccessHR' },
    { id: 'invoicing', label: 'Facturación', icon: FileText, roles: ['ADMIN', 'GERENTE', 'CLERK', 'VENTAS', 'CAJERO', 'VENDEDOR'], perm: 'canAccessInvoicing' },
    { id: 'sat-config', label: 'Configuración SAT', icon: ShieldCheck, roles: ['ADMIN'], perm: 'canAccessSettings' },
    { id: 'admin-panel', label: 'Panel de Administración', icon: Shield, roles: ['ADMIN'], perm: 'canManagePermissions' },
    { id: 'settings', label: 'Configuración del Sistema', icon: Settings, roles: ['ADMIN'], perm: 'canAccessSettings' },
  ];

  // Cargar módulos activos desde localStorage
  const [enabledModules, setEnabledModules] = React.useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('fp_modules');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // Escuchar cambios en localStorage (para actualizar cuando se guarde en Settings)
  React.useEffect(() => {
    const handler = () => {
      try {
        const saved = localStorage.getItem('fp_modules');
        setEnabledModules(saved ? JSON.parse(saved) : {});
      } catch {}
    };
    window.addEventListener('storage', handler);
    // Polling cada 500ms como respaldo (por si el evento storage no dispara)
    const interval = setInterval(handler, 500);
    return () => { window.removeEventListener('storage', handler); clearInterval(interval); };
  }, []);

  const isRoleAllowed = (itemRoles: string[], userRole?: string) => {
    if (!userRole) return false;
    const r = userRole.toUpperCase();
    if (r === 'ADMIN') return true;
    if (itemRoles.includes(r)) return true;
    if ((r === 'CLERK' || r === 'CAJERO') && (itemRoles.includes('CLERK') || itemRoles.includes('CAJERO'))) return true;
    if ((r === 'VENTAS' || r === 'VENDEDOR') && (itemRoles.includes('VENTAS') || itemRoles.includes('VENDEDOR'))) return true;
    if ((r === 'BODEGA' || r === 'ALMACENISTA') && (itemRoles.includes('BODEGA') || itemRoles.includes('ALMACENISTA'))) return true;
    return false;
  };

  const filteredNavItems = navItems.filter(item => {
    // 1. 'settings' SIEMPRE visible (para no quedar encerrado sin poder reactivar)
    if (item.id === 'settings') return true;

    // 2. Validar que el módulo esté activo en fp_modules
    //    (si no existe la clave, se considera activo por defecto)
    if (enabledModules[item.id] === false) return false;

    // 3. Validar rol del usuario
    if (!isRoleAllowed(item.roles, user?.role)) return false;

    // 4. Validar permisos finos (si están cargados)
    if (permissions && item.perm && (permissions as any)[item.perm] !== true) {
      return false;
    }

    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <motion.aside
        animate={{ width: collapsed ? 80 : 280 }}
        className="hidden lg:flex flex-col bg-white border-r border-gray-100 shadow-sm relative z-30"
      >
        <div 
          onClick={() => setActiveTab('pos')} 
          className="p-6 flex items-center gap-3 border-b border-gray-50 mb-6 cursor-pointer hover:bg-gray-50 transition-colors group"
          title="Ir al Punto de Venta (Home)"
        >
          <img src="/logo-agroparts.jpeg" alt="AgroParts Logo" className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-lg group-hover:scale-105 transition-transform" />
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden"
            >
              <h1 className="font-bold text-xl text-gray-900 whitespace-nowrap">AgroParts</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Punto de Venta y Stock</p>
            </motion.div>
          )}
        </div>

        {onSwitchToStore && (
          <div className="px-4 mb-3">
            <button
              onClick={onSwitchToStore}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all group relative",
                collapsed ? "justify-center px-2" : "justify-between"
              )}
              title="Abrir la Tienda Virtual E-Commerce"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={18} className="shrink-0 transition-transform group-hover:scale-110" />
                {!collapsed && <span>Tienda Virtual</span>}
              </div>
              {!collapsed && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                  Ver
                </span>
              )}
            </button>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50 space-y-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-xl w-full transition-all"
          >
            {collapsed ? <Menu size={22} /> : <X size={22} />}
            {!collapsed && <span className="font-medium">Colapsar</span>}
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full transition-all"
          >
            <LogOut size={22} />
            {!collapsed && <span className="font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: mobileMenuOpen ? 0 : -300 }}
        className="fixed top-0 bottom-0 left-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-50">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => { setActiveTab('pos'); setMobileMenuOpen(false); }}
          >
            <img src="/logo-agroparts.jpeg" alt="AgroParts Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg" />
            <h1 className="font-bold text-xl text-gray-900">AgroParts</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-500">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
            />
          ))}
        </nav>
        <div className="p-4 border-t border-gray-50">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full"
          >
            <LogOut size={22} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 px-3 sm:px-4 lg:px-6 flex items-center justify-between shrink-0 z-20 min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg shrink-0"
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 capitalize truncate">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 w-60">
              <Search size={18} className="text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="Buscar global..." 
                className="bg-transparent border-none outline-none text-sm w-full"
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative"
                aria-label="Notificaciones"
              >
                <Bell size={20} />
                {lowStockCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                    {lowStockCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && lowStockCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="fixed sm:absolute top-16 sm:top-full left-3 right-3 sm:left-auto sm:right-0 mt-2 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100]"
                  >
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-bold text-sm text-gray-900">Alertas de Stock</h3>
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full uppercase">
                        {lowStockCount} Críticos
                      </span>
                    </div>
                    <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                      {lowStockProducts.map(product => (
                        <button
                          key={product.id}
                          onClick={() => { setActiveTab('inventory'); setShowNotifications(false); }}
                          className="w-full p-4 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-50 last:border-0 text-left transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} className="text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{product.description}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Stock: <span className="font-bold text-red-500">{product.stock}</span> / Mín: {product.minStock}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-none">{user?.name}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        <div ref={contentScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6 relative max-w-full min-w-0">
          {children}
        </div>
        <MultiAssistantChat />
        <Toaster position="top-right" richColors closeButton />
      </main>
    </div>
  );
};