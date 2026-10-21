import React, { useState } from 'react';
import { Package, Truck, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Order } from '../../types';

export const OnlineOrdersManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Bar / Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Package className="text-emerald-700" size={26} />
            <span>Gestión de Pedidos E-Commerce</span>
          </h1>
          <p className="text-xs text-gray-500">
            Control y despacho de pedidos realizados desde la tienda online.
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por folio (ej. FP-2026), cliente o correo..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Truck size={32} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Módulo en Migración</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          La integración con Google Sheets para los pedidos de la tienda online estará disponible próximamente. 
          Las ventas del Punto de Venta físico siguen funcionando con normalidad.
        </p>
      </div>
    </div>
  );
};