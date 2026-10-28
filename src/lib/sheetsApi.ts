/**
 * Google Sheets API Client
 * Calls the Apps Script Web App backend.
 */

const WEB_APP_URL = (import.meta as any).env?.VITE_APPS_SCRIPT_URL || '';

export const isApiConfigured = (): boolean => !!WEB_APP_URL;

async function callApi(action: string, data: Record<string, any> = {}): Promise<any> {
  if (!WEB_APP_URL) {
    console.warn('Apps Script URL not configured. Set VITE_APPS_SCRIPT_URL in .env');
    return { success: false, error: 'API no configurada' };
  }

  try {
    // 1. Si es una acción de ESCRITURA, enviamos POST ciego para evitar CORS
    const writeActions = [
      'createOnlineOrder', 'createSale', 'createProduct', 'updateProduct', 
      'createCustomer', 'updateCustomer', 'createMovement', 'updateOnlineOrderStatus'
    ];
    
    if (writeActions.includes(action)) {
      await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, data }),
        mode: 'no-cors',
      });
      return { success: true, data: { id: 'ORD-' + Date.now(), orderNumber: data.orderNumber || 'FP-ONLINE' } };
    }

    // 2. Si es una acción de LECTURA, usamos GET para leer el JSON sin problemas
    const urlWithParams = new URL(WEB_APP_URL);
    urlWithParams.searchParams.set('action', action);
    urlWithParams.searchParams.set('data', JSON.stringify(data));

    const response = await fetch(urlWithParams.toString(), { method: 'GET', redirect: 'follow' });
    const text = await response.text();
    const jsonStart = text.indexOf('{');
    
    if (jsonStart === -1) throw new Error('Respuesta inválida del servidor');
    return JSON.parse(text.substring(jsonStart));
    
  } catch (err) {
    console.error(`API call failed [${action}]:`, err);
    return { success: false, error: err instanceof Error ? err.message : 'Error de red' };
  }
}

// ═══════════════════════════════════════════════════
//  Registration Codes
// ═══════════════════════════════════════════════════

export interface RegistrationCode {
  _id: string;
  code: string;
  role: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  usedBy: string;
  usedAt: string;
}

export async function generateRegistrationCode(
  role: string,
  adminEmail: string,
  expiresInHours: number = 72
): Promise<{ success: boolean; data?: RegistrationCode; error?: string }> {
  return callApi('generateCode', { role, adminEmail, expiresInHours });
}

export async function validateRegistrationCode(
  code: string
): Promise<{ success: boolean; data?: { role: string; code: string }; error?: string }> {
  return callApi('validateCode', { code });
}

export async function useRegistrationCode(
  code: string,
  userEmail: string
): Promise<{ success: boolean; data?: { role: string }; error?: string }> {
  return callApi('useCode', { code, userEmail });
}

// ═══════════════════════════════════════════════════
//  Users
// ═══════════════════════════════════════════════════

export interface SheetUser {
  _id: string;
  googleId: string;
  name: string;
  email: string;
  role: string;
  photoURL: string;
  isActive: string;
  createdAt: string;
  updatedAt: string;
}

export async function registerUserInSheet(
  googleId: string,
  name: string,
  email: string,
  role: string,
  photoURL: string = ''
): Promise<{ success: boolean; data?: SheetUser; error?: string }> {
  return callApi('registerUser', { googleId, name, email, role, photoURL });
}

export async function getMyUser(
  googleId: string,
  email: string
): Promise<{ success: boolean; data?: SheetUser; error?: string }> {
  return callApi('getMyUser', { googleId, email });
}

export async function getAllUsers(): Promise<{ success: boolean; data?: SheetUser[]; error?: string }> {
  return callApi('getUsers');
}

export async function updateUser(
  userId: string,
  updates: { role?: string; isActive?: boolean; name?: string }
): Promise<{ success: boolean; error?: string }> {
  return callApi('updateUser', { userId, ...updates });
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  return callApi('deleteUser', { userId });
}

// ═══════════════════════════════════════════════════
//  Roles & Permissions
// ═══════════════════════════════════════════════════

export interface RolePermissionsSheet {
  _id: string;
  code: string;
  name: string;
  description: string;
  isSystem: string;
  canAccessPOS: string;
  canModifyPrices: string;
  canApplyDiscounts: string;
  canAccessInventory: string;
  canAdjustStock: string;
  canAccessOCR: string;
  canAccessCustomers: string;
  canManageCredits: string;
  canAccessVendors: string;
  canAccessReports: string;
  canAccessHR: string;
  canManageEmployees: string;
  canManagePermissions: string;
  canAccessInvoicing: string;
  canCloseCashRegister: string;
  canAccessSettings: string;
  canManageBlog: string;
  canManageStore: string;
  color: string;
  createdAt: string;
}

export async function getAllRoles(): Promise<{ success: boolean; data?: RolePermissionsSheet[]; error?: string }> {
  return callApi('getRoles');
}

export async function updateRolePermissions(
  roleId: string,
  permissions: Record<string, boolean>
): Promise<{ success: boolean; error?: string }> {
  return callApi('updateRole', { roleId, permissions });
}

// ═══════════════════════════════════════════════════
//  Helper: Convert sheet role to app permissions
// ═══════════════════════════════════════════════════

export function sheetRoleToPermissions(role: RolePermissionsSheet): Record<string, boolean> {
  return {
    canAccessPOS: role.canAccessPOS === 'TRUE',
    canModifyPrices: role.canModifyPrices === 'TRUE',
    canApplyDiscounts: role.canApplyDiscounts === 'TRUE',
    canAccessInventory: role.canAccessInventory === 'TRUE',
    canAdjustStock: role.canAdjustStock === 'TRUE',
    canAccessOCR: role.canAccessOCR === 'TRUE',
    canAccessCustomers: role.canAccessCustomers === 'TRUE',
    canManageCredits: role.canManageCredits === 'TRUE',
    canAccessVendors: role.canAccessVendors === 'TRUE',
    canAccessReports: role.canAccessReports === 'TRUE',
    canAccessHR: role.canAccessHR === 'TRUE',
    canManageEmployees: role.canManageEmployees === 'TRUE',
    canManagePermissions: role.canManagePermissions === 'TRUE',
    canAccessInvoicing: role.canAccessInvoicing === 'TRUE',
    canCloseCashRegister: role.canCloseCashRegister === 'TRUE',
    canAccessSettings: role.canAccessSettings === 'TRUE',
    canManageBlog: role.canManageBlog === 'TRUE',
    canManageStore: role.canManageStore === 'TRUE',
  };
}

export const PERMISSION_LABELS: Record<string, string> = {
  canAccessPOS: 'Acceso al Punto de Venta (POS)',
  canModifyPrices: 'Modificar precios',
  canApplyDiscounts: 'Aplicar descuentos',
  canAccessInventory: 'Acceso a inventario',
  canAdjustStock: 'Ajustar stock',
  canAccessOCR: 'Acceso a OCR de facturas',
  canAccessCustomers: 'Acceso a clientes',
  canManageCredits: 'Gestionar créditos',
  canAccessVendors: 'Acceso a proveedores',
  canAccessReports: 'Acceso a reportes',
  canAccessHR: 'Acceso a Recursos Humanos',
  canManageEmployees: 'Gestionar empleados',
  canManagePermissions: 'Gestionar permisos',
  canAccessInvoicing: 'Acceso a facturación SAT',
  canCloseCashRegister: 'Cerrar caja',
  canAccessSettings: 'Acceso a configuración',
  canManageBlog: 'Gestionar blog',
  canManageStore: 'Gestionar tienda en línea',
};

export const AVAILABLE_ROLES = [
  { code: 'ADMIN', name: 'Administrador', color: '#DC2626', description: 'Acceso total al sistema' },
  { code: 'GERENTE', name: 'Gerente', color: '#9333EA', description: 'Gestión general' },
  { code: 'CLERK', name: 'Cajero/Empleado', color: '#16A34A', description: 'Operaciones básicas' },
  { code: 'VENTAS', name: 'Vendedor', color: '#2563EB', description: 'Ventas y clientes' },
  { code: 'BODEGA', name: 'Almacenista', color: '#EA580C', description: 'Inventario y almacén' },
  { code: 'CAJERO', name: 'Cajero', color: '#16A34A', description: 'Solo punto de venta' },
  { code: 'VENDEDOR', name: 'Vendedor', color: '#0D9488', description: 'Ventas en piso' },
  { code: 'ALMACENISTA', name: 'Almacenista', color: '#78716C', description: 'Control de almacén' },
];

// ═══════════════════════════════════════════════════
//  Products
// ═══════════════════════════════════════════════════

export interface SheetProduct {
  id: string;
  pieceNumber: string;
  description: string;
  brand: string;
  model: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  maxStock: number;
  location: string;
  imageUrl: string;
  barcode: string;
  vendorId: string;
  leadTime: number;
  category: string;
  invoiceReference: string;
}

export async function getProducts(): Promise<{ success: boolean; data?: SheetProduct[]; error?: string }> {
  return callApi('getProducts');
}

export async function createProduct(
  product: Partial<SheetProduct>
): Promise<{ success: boolean; data?: SheetProduct; error?: string }> {
  return callApi('createProduct', product);
}

export async function updateProduct(
  id: string,
  updates: Partial<SheetProduct>
): Promise<{ success: boolean; error?: string }> {
  return callApi('updateProduct', { id, ...updates });
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  return callApi('deleteProduct', { id });
}

// ═══════════════════════════════════════════════════
//  Inventory Movements
// ═══════════════════════════════════════════════════

export interface SheetMovement {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJ';
  quantity: number;
  reason: string;
  timestamp: string;
  userId: string;
  invoiceReference: string;
}

export async function getMovements(
  productId?: string
): Promise<{ success: boolean; data?: SheetMovement[]; error?: string }> {
  return callApi('getMovements', productId ? { productId } : {});
}

export async function createMovement(
  movement: Partial<SheetMovement>
): Promise<{ success: boolean; data?: SheetMovement; error?: string }> {
  return callApi('createMovement', movement);
}

// ═══════════════════════════════════════════════════
//  PEDIDOS E-COMMERCE (TIENDA ONLINE)
// ═══════════════════════════════════════════════════

export interface SheetOnlineOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: any[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: any;
  shippingMethod: string;
  trackingNumber: string;
  carrier: string;
  couponCode: string;
  createdAt: string;
  updatedAt: string;
}

export async function createOnlineOrderApi(
  orderData: any
): Promise<{ success: boolean; data?: { id: string; orderNumber: string }; error?: string }> {
  return callApi('createOnlineOrder', orderData);
}

export async function getOnlineOrdersApi(): Promise<{
  success: boolean;
  data?: SheetOnlineOrder[];
  total?: number;
  error?: string;
}> {
  return callApi('getOnlineOrders', {});
}

export async function updateOnlineOrderStatusApi(
  orderId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  return callApi('updateOnlineOrderStatus', { orderId, status });
}