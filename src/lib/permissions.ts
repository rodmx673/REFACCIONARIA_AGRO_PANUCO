import { PositionRole, RolePermissions } from '../types';

export const PERMISSION_DEFINITIONS: {
  key: keyof RolePermissions;
  label: string;
  description: string;
  category: 'Ventas y POS' | 'Inventario y Almacén' | 'Clientes y Proveedores' | 'Administración y Finanzas';
}[] = [
  // Ventas y POS
  {
    key: 'canAccessPOS',
    label: 'Acceso a Terminal POS',
    description: 'Permite abrir la terminal de punto de venta y registrar transacciones.',
    category: 'Ventas y POS',
  },
  {
    key: 'canModifyPrices',
    label: 'Modificar Precios al Vender',
    description: 'Permite alterar el precio de catálogo de una refacción durante la venta.',
    category: 'Ventas y POS',
  },
  {
    key: 'canApplyDiscounts',
    label: 'Aplicar Descuentos Especiales',
    description: 'Permite aplicar porcentajes de descuento directo en el ticket de venta.',
    category: 'Ventas y POS',
  },
  {
    key: 'canCloseCashRegister',
    label: 'Corte y Arqueo de Caja',
    description: 'Permite abrir turno, registrar retiros y realizar el corte ciego de caja.',
    category: 'Ventas y POS',
  },

  // Inventario y Almacén
  {
    key: 'canAccessInventory',
    label: 'Consultar Catálogo de Inventario',
    description: 'Permite visualizar existencias, marcas, ubicaciones y precios.',
    category: 'Inventario y Almacén',
  },
  {
    key: 'canAdjustStock',
    label: 'Ajustes de Stock y Kardex',
    description: 'Permite modificar existencias manuales por merma, conteo o daño.',
    category: 'Inventario y Almacén',
  },
  {
    key: 'canAccessOCR',
    label: 'Lector OCR de Facturas',
    description: 'Permite procesar facturas XML/PDF e ingresar refacciones al almacén.',
    category: 'Inventario y Almacén',
  },

  // Clientes y Proveedores
  {
    key: 'canAccessCustomers',
    label: 'Directorio de Clientes',
    description: 'Permite ver y dar de alta clientes agrícolas y talleres mecánicos.',
    category: 'Clientes y Proveedores',
  },
  {
    key: 'canManageCredits',
    label: 'Gestión de Crédito y Cobranza',
    description: 'Permite autorizar límites de crédito y registrar abonos a cartera vencida.',
    category: 'Clientes y Proveedores',
  },
  {
    key: 'canAccessVendors',
    label: 'Gestión de Proveedores',
    description: 'Permite consultar y registrar mayoristas y fabricantes de refacciones.',
    category: 'Clientes y Proveedores',
  },

  // Administración y Finanzas
  {
    key: 'canAccessReports',
    label: 'Reportes y Métricas Financieras',
    description: 'Permite ver gráficas de utilidad, ventas globales y valor del inventario.',
    category: 'Administración y Finanzas',
  },
  {
    key: 'canAccessHR',
    label: 'Recursos Humanos y Nómina',
    description: 'Permite acceder al módulo de personal, asistencia y nómina.',
    category: 'Administración y Finanzas',
  },
  {
    key: 'canManageEmployees',
    label: 'Registrar y Editar Empleados',
    description: 'Permite dar de alta personal, modificar sueldos y cuentas bancarias.',
    category: 'Administración y Finanzas',
  },
  {
    key: 'canManagePermissions',
    label: 'Configurar Puestos y Permisos',
    description: 'Permite crear nuevas posiciones y decidir los niveles de acceso del sistema.',
    category: 'Administración y Finanzas',
  },
  {
    key: 'canAccessInvoicing',
    label: 'Facturación Electrónica SAT',
    description: 'Permite timbrar facturas CFDI 4.0 y consultar reportes fiscales.',
    category: 'Administración y Finanzas',
  },
  {
    key: 'canAccessSettings',
    label: 'Configuración General del Sistema',
    description: 'Permite alterar razón social, logotipos y parámetros globales.',
    category: 'Administración y Finanzas',
  },
];

export const DEFAULT_POSITIONS: PositionRole[] = [
  {
    id: 'pos-admin',
    code: 'ADMIN',
    name: 'Administrador General',
    description: 'Acceso total y control de directivas, configuración y permisos en toda la plataforma.',
    department: 'Dirección General',
    color: 'emerald',
    isSystem: true,
    permissions: {
      canAccessPOS: true,
      canModifyPrices: true,
      canApplyDiscounts: true,
      canAccessInventory: true,
      canAdjustStock: true,
      canAccessOCR: true,
      canAccessCustomers: true,
      canManageCredits: true,
      canAccessVendors: true,
      canAccessReports: true,
      canAccessHR: true,
      canManageEmployees: true,
      canManagePermissions: true,
      canAccessInvoicing: true,
      canCloseCashRegister: true,
      canAccessSettings: true,
    },
  },
  {
    id: 'pos-gerente',
    code: 'GERENTE',
    name: 'Gerente de Sucursal',
    description: 'Supervisión de operaciones comerciales, almacén, personal, clientes y corte de caja.',
    department: 'Gerencia y Operaciones',
    color: 'blue',
    isSystem: true,
    permissions: {
      canAccessPOS: true,
      canModifyPrices: true,
      canApplyDiscounts: true,
      canAccessInventory: true,
      canAdjustStock: true,
      canAccessOCR: true,
      canAccessCustomers: true,
      canManageCredits: true,
      canAccessVendors: true,
      canAccessReports: true,
      canAccessHR: true,
      canManageEmployees: true,
      canManagePermissions: false,
      canAccessInvoicing: true,
      canCloseCashRegister: true,
      canAccessSettings: false,
    },
  },
  {
    id: 'pos-clerk',
    code: 'CLERK',
    name: 'Clerk / Cajero Mostrador',
    description: 'Encargado de cobro en mostrador, emisión de tickets de venta y corte diario de caja.',
    department: 'Cajas y Mostrador',
    color: 'amber',
    isSystem: true,
    permissions: {
      canAccessPOS: true,
      canModifyPrices: false,
      canApplyDiscounts: false,
      canAccessInventory: true,
      canAdjustStock: false,
      canAccessOCR: false,
      canAccessCustomers: true,
      canManageCredits: false,
      canAccessVendors: false,
      canAccessReports: false,
      canAccessHR: false,
      canManageEmployees: false,
      canManagePermissions: false,
      canAccessInvoicing: true,
      canCloseCashRegister: true,
      canAccessSettings: false,
    },
  },
  {
    id: 'pos-ventas',
    code: 'VENTAS',
    name: 'Asesor de Ventas de Mostrador',
    description: 'Atención a productores y talleres, cotizaciones, consulta de refacciones y venta.',
    department: 'Comercial y Ventas',
    color: 'indigo',
    isSystem: true,
    permissions: {
      canAccessPOS: true,
      canModifyPrices: false,
      canApplyDiscounts: true,
      canAccessInventory: true,
      canAdjustStock: false,
      canAccessOCR: false,
      canAccessCustomers: true,
      canManageCredits: false,
      canAccessVendors: false,
      canAccessReports: false,
      canAccessHR: false,
      canManageEmployees: false,
      canManagePermissions: false,
      canAccessInvoicing: true,
      canCloseCashRegister: false,
      canAccessSettings: false,
    },
  },
  {
    id: 'pos-bodega',
    code: 'BODEGA',
    name: 'Encargado de Bodega y Almacén',
    description: 'Recepción física de refacciones, lectura de facturas OCR, kardex y acomodo en anaqueles.',
    department: 'Almacén y Logística',
    color: 'orange',
    isSystem: true,
    permissions: {
      canAccessPOS: false,
      canModifyPrices: false,
      canApplyDiscounts: false,
      canAccessInventory: true,
      canAdjustStock: true,
      canAccessOCR: true,
      canAccessCustomers: false,
      canManageCredits: false,
      canAccessVendors: true,
      canAccessReports: false,
      canAccessHR: false,
      canManageEmployees: false,
      canManagePermissions: false,
      canAccessInvoicing: false,
      canCloseCashRegister: false,
      canAccessSettings: false,
    },
  },
];

export function getRoleBadgeStyle(roleOrCode: string): { bg: string; text: string; border: string; label: string } {
  const normalized = (roleOrCode || '').toUpperCase();
  switch (normalized) {
    case 'ADMIN':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Administrador' };
    case 'GERENTE':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Gerente' };
    case 'CLERK':
    case 'CAJERO':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Clerk / Cajero' };
    case 'VENTAS':
    case 'VENDEDOR':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Ventas' };
    case 'BODEGA':
    case 'ALMACENISTA':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Bodega / Almacén' };
    default:
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: roleOrCode || 'Posición Personalizada' };
  }
}
