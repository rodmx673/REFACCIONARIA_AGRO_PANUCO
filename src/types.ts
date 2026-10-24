export type Role = 
  | 'ADMIN' 
  | 'GERENTE' 
  | 'CLERK' 
  | 'VENTAS' 
  | 'BODEGA' 
  | 'CAJERO' 
  | 'VENDEDOR' 
  | 'ALMACENISTA' 
  | string;

export interface RolePermissions {
  canAccessPOS: boolean;
  canModifyPrices: boolean;
  canApplyDiscounts: boolean;
  canAccessInventory: boolean;
  canAdjustStock: boolean;
  canAccessOCR: boolean;
  canAccessCustomers: boolean;
  canManageCredits: boolean;
  canAccessVendors: boolean;
  canAccessReports: boolean;
  canAccessHR: boolean;
  canManageEmployees: boolean;
  canManagePermissions: boolean;
  canAccessInvoicing: boolean;
  canCloseCashRegister: boolean;
  canAccessSettings: boolean;
}

export interface PositionRole {
  id: string;
  code: string;
  name: string;
  description: string;
  department: string;
  color: string;
  isSystem?: boolean;
  permissions: RolePermissions;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  positionId?: string;
  branchId?: string;
  customPermissions?: Partial<RolePermissions>;
}

export interface Product {
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
  invoiceReference?: string;
  references?: any; // ✅ AGREGADO: Soluciona el error 2339 en Inventory.tsx
  images?: any;
}

export interface SaleItem {
  productId: string;
  pieceNumber: string;
  description: string;
  quantity: number;
  price: number;
  subtotal: number;
  imageUrl?: string;
}

export interface Sale {
  id: string;
  customerId?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CRÉDITO';
  status: 'COMPLETED' | 'CANCELLED' | 'QUOTATION';
  timestamp: string;
  sellerId: string;
}

export interface Customer {
  id: string;
  name: string;
  type: 'FISICA' | 'MORAL';
  rfc: string;
  curp?: string;
  address: {
    street: string;
    number: string;
    colony: string;
    zip: string;
    city: string;
    state: string;
  };
  email: string;
  phone: string;
  creditLimit: number;
  creditDays: number;
  discount: number;
  priceList: string;
  status: 'ACTIVO' | 'INACTIVO' | 'MOROSO';
  balance: number;
}

export interface Vendor {
  id: string;
  name: string;
  type: 'NACIONAL' | 'INTERNACIONAL';
  rfc: string;
  address: string;
  email: string;
  phone: string;
  contact: string;
  leadTime: number;
  rating: number;
}

export interface BusinessConfig {
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  rfc: string;
  address: string;
  terms: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJ';
  quantity: number;
  reason: string;
  timestamp: string;
  userId: string;
  invoiceReference?: string;
}

export interface Employee {
  id: string;
  uid: string;
  name: string;
  rfc: string;
  curp: string;
  role: Role;
  position: string;
  positionId?: string;
  hireDate: string;
  salary: number;
  commissionRate: number;
  status: 'ACTIVE' | 'INACTIVE';
  bankAccount: string;
  taxRegime: string;
  zipCode: string;
  email: string;
  phone?: string;
  customPermissions?: Partial<RolePermissions>;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'VACATION';
}

export interface Invoice {
  id: string;
  folio: string;
  series: string;
  uuid?: string;
  date: string;
  total: number;
  taxAmount: number;
  status: 'VIGENTE' | 'CANCELADO' | 'PENDIENTE';
  pacResponse?: any;
  xmlUrl?: string;
  pdfUrl?: string;
  customerId: string;
  saleId: string;
  usage: string;
  paymentMethod: string;
  paymentForm: string;
}

export interface SatConfig {
  encryptedCSD: string;
  encryptedKey: string;
  businessRFC: string;
  businessName: string;
  pacApiKeys: string;
  taxRegime: string;
  address: string;
  zipCode: string;
}

export interface Commission {
  id: string;
  employeeId: string;
  period: string; // e.g., "2024-03"
  totalSales: number;
  calculatedCommission: number;
  status: 'PAID' | 'PENDING';
  salesIds: string[];
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  period: string;
  baseSalary: number;
  commissions: number;
  bonuses: number;
  deductions: number;
  total: number;
  status: 'PENDING' | 'PAID';
  paymentDate?: string;
  timestamp: any;
}

export interface InvoiceArticle {
  descripcion: string | null;
  cantidad: number | null;
  precio_unitario: number | null;
  codigo?: string | null;
  importe?: number | null;
}

export interface ExtractedInvoiceJSON {
  numero_factura: string | null;
  fecha: string | null;
  proveedor: string | null;
  articulos: InvoiceArticle[];
  rfc_proveedor?: string | null;
  cliente?: string | null;
  subtotal?: number | null;
  iva?: number | null;
  total?: number | null;
  moneda?: string | null;
}

export interface InvoiceHistoryRecord {
  id?: string;
  numero_factura: string;
  fecha: string;
  proveedor: string;
  importe: number;
  subtotal?: number;
  iva?: number;
  moneda?: string;
  originalImageUrl?: string;
  imageReference?: string;
  documentType?: 'image' | 'pdf' | 'spreadsheet' | 'doc' | 'text' | 'other';
  documentUrl?: string;
  pdfDataUri?: string;
  rfc_proveedor?: string;
  cliente?: string;
  articulos?: InvoiceArticle[];
  status?: 'REGISTRADA' | 'PROCESADA' | 'PAGADA' | 'PENDIENTE' | 'IMPORTADA_A_INVENTARIO';
  importedToInventory?: boolean;
  importedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OCRInvoiceResult {
  proveedor: {
    nombre: string | null;
    rfc: string | null;
    folio: string | null;
    fecha: string | null;
  };
  cliente: {
    nombre: string | null;
    rfc: string | null;
  };
  productos: {
    cantidad: number | null;
    unidad: string | null;
    codigo: string | null;
    descripcion: string | null;
    precio_unitario: number | null;
    importe: number | null;
  }[];
  totales: {
    subtotal: number | null;
    iva: number | null;
    total: number | null;
  };
  moneda: string | null;
  tipoDocumento?: string | null;
}

export interface VirtualAssistant {
  id: string;
  name: string;
  specialty: 'pos' | 'inventory' | 'finance' | 'hr' | 'fiscal' | 'general';
  avatar: string;
  color: string;
  isActive: boolean;
  identity: {
    description: string;
    instructions: string;
  };
  behavior: {
    tone: string;
    language: string;
    quickCommands: string[];
    autonomyLevel: number;
    sessionDuration: number;
    contextMemory: boolean;
  };
  permissions: {
    canAccessInventory: boolean;
    canAccessSales: boolean;
    canAccessCustomers: boolean;
    canAccessReports: boolean;
    canExecuteActions: boolean;
  };
  notifications: {
    enableAlerts: boolean;
    alertTypes: string[];
  };
  createdAt: string;
  updatedAt: string;
  enabledFunctions: string[];
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AssistantConversation {
  id: string;
  assistantId: string;
  userId: string;
  messages: AssistantMessage[];
  context: any;
  startedAt: string;
  lastActivity: string;
  isActive: boolean;
}

export interface AssistantGlobalSettings {
  autoSwitchByContext: boolean;
  defaultAssistantId: string;
  maxConcurrentAssistants: number;
  allowCustomAssistants: boolean;
}

// ==========================================
// E-COMMERCE ONLINE STORE TYPES
// ==========================================

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  interior?: string;
  colony: string;
  city: string;
  state: string;
  zipCode: string;
  references?: string;
  rfc?: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type PaymentMethodOnline = 'TARJETA' | 'OXXO' | 'SPEI' | 'PAYPAL' | 'CREDITO_FARMER';

export interface OrderItem {
  productId: string;
  pieceNumber: string;
  description: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethodOnline;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  shippingAddress: ShippingAddress;
  shippingMethod: 'ESTANDAR' | 'EXPRESS' | 'RECOGER_TIENDA';
  trackingNumber?: string;
  carrier?: string;
  couponCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id?: string;
  productId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  helpfulVotes?: number;
  verifiedPurchase?: boolean;
  createdAt: string;
}

export interface Coupon {
  id?: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minPurchase: number;
  isActive: boolean;
  description?: string;
  expiresAt?: string;
}

export interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  coverImage: string;
  readTime: string;
  tags: string[];
  createdAt: string;
}

export interface SupportTicket {
  id?: string;
  customerName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  tractorModel?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
}