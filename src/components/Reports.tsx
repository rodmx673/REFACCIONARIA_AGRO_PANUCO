import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Package } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Reports: React.FC = () => {
  // Datos de ejemplo (se conectarán a Google Sheets después)
  const [salesByDay] = useState([
    { date: 'Lun', total: 4500, count: 12 },
    { date: 'Mar', total: 5200, count: 15 },
    { date: 'Mie', total: 3800, count: 8 },
    { date: 'Jue', total: 6100, count: 20 },
    { date: 'Vie', total: 7400, count: 25 },
    { date: 'Sab', total: 9200, count: 30 },
    { date: 'Dom', total: 4100, count: 10 },
  ]);

  const [salesByCategory] = useState([
    { name: 'Motor', value: 12000 },
    { name: 'Hidráulica', value: 8500 },
    { name: 'Transmisión', value: 6400 },
    { name: 'Filtros', value: 3200 },
    { name: 'Eléctrico', value: 2100 },
  ]);

  const stats = {
    totalRevenue: 40300,
    totalSales: 120,
    avgTicket: 335.83,
    lowStockItems: 3
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Panel de Reportes</h2>
          <p className="text-gray-500 text-sm">Analítica de ventas e inventario en tiempo real</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
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
            className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4"
          >
            <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
              <stat.icon size={16} className="sm:w-6 sm:h-6" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight">{stat.label}</p>
              <p className="text-sm sm:text-xl font-black text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">Tendencia de Ventas (Semanal)</h3>
          <div className="h-[250px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByDay}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                />
                <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">Ventas por Categoría</h3>
          <div className="h-[250px] w-full min-w-0 flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={salesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {salesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Total']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-2 pl-2">
              {salesByCategory.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-gray-600 truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};