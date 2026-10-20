import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Sale, Product } from '../types';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

export const Reports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const unsubSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sales');
    });
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });
    return () => {
      unsubSales();
      unsubProducts();
    };
  }, []);

  // Process data for charts
  const salesByDay = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const daySales = sales.filter(s => s.timestamp.startsWith(date));
      return {
        date: date.split('-').slice(1).join('/'),
        total: daySales.reduce((sum, s) => sum + s.total, 0),
        count: daySales.length
      };
    });
  }, [sales]);

  const salesByCategory = React.useMemo(() => {
    const categories: Record<string, number> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const cat = product?.category || 'Otros';
        categories[cat] = (categories[cat] || 0) + item.subtotal;
      });
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [sales, products]);

  const topProducts = React.useMemo(() => {
    const counts: Record<string, { name: string, qty: number }> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!counts[item.productId]) {
          counts[item.productId] = { name: item.description, qty: 0 };
        }
        counts[item.productId].qty += item.quantity;
      });
    });
    return Object.values(counts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales]);

  const stats = {
    totalRevenue: sales.reduce((sum, s) => sum + s.total, 0),
    totalSales: sales.length,
    avgTicket: sales.length > 0 ? sales.reduce((sum, s) => sum + s.total, 0) / sales.length : 0,
    lowStockItems: products.filter(p => p.stock <= p.minStock).length
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Panel de Reportes</h2>
          <p className="text-gray-500">Analítica de ventas e inventario en tiempo real</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          {['7d', '30d', '90d', '1y'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                timeRange === range ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {range}
            </button>
          ))}
          <div className="w-px h-6 bg-gray-100 mx-1" />
          <button className="p-2 text-gray-400 hover:text-primary transition-colors">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ingresos Totales', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Ventas Realizadas', value: stats.totalSales, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Ticket Promedio', value: formatCurrency(stats.avgTicket), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Stock Crítico', value: stats.lowStockItems, icon: Package, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900">Tendencia de Ventas</h3>
            <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
              <TrendingUp size={16} />
              <span>+12.5%</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByDay}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                />
                <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-8">Ventas por Categoría</h3>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {salesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Total']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/3 space-y-3">
              {salesByCategory.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-bold text-gray-600 truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-8">Productos Más Vendidos</h3>
          <div className="space-y-6">
            {topProducts.map((product, i) => (
              <div key={product.name} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-gray-400">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-bold text-gray-700 truncate max-w-[200px]">{product.name}</span>
                    <span className="text-sm font-black text-primary">{product.qty} unidades</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(product.qty / topProducts[0].qty) * 100}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Health */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-8">Salud del Inventario</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Stock Saludable</p>
              <p className="text-3xl font-black text-emerald-700">{products.filter(p => p.stock > p.minStock).length}</p>
              <p className="text-xs text-emerald-600 mt-2">Productos con stock suficiente</p>
            </div>
            <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Reabastecer</p>
              <p className="text-3xl font-black text-red-700">{products.filter(p => p.stock <= p.minStock).length}</p>
              <p className="text-xs text-red-600 mt-2">Productos bajo el mínimo</p>
            </div>
            <div className="col-span-2 p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Valor Total Inventario</p>
                <p className="text-2xl font-black text-gray-900">
                  {formatCurrency(products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0))}
                </p>
              </div>
              <Package size={40} className="text-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
