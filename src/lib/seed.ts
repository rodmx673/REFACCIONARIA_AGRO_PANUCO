import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { Product, Customer, Vendor, Sale, VirtualAssistant } from '../types';
import { DEFAULT_POSITIONS } from './permissions';

const MOCK_EMPLOYEES = [
  {
    name: "Rodrigo Morales",
    email: "rod.mx673@gmail.com",
    rfc: "MOAR850415AA1",
    curp: "MOAR850415HDFRRL09",
    position: "Administrador General",
    role: "ADMIN",
    hireDate: "2023-01-15",
    salary: 35000,
    commissionRate: 0,
    status: "ACTIVE",
    bankAccount: "012180001234567890",
    taxRegime: "605",
    zipCode: "81200",
    phone: "(668) 812-3456"
  },
  {
    name: "Carlos Mendoza Ramos",
    email: "gerencia@farmerparts.com",
    rfc: "MERC790820BC2",
    curp: "MERC790820HDFRRL01",
    position: "Gerente de Sucursal",
    role: "GERENTE",
    hireDate: "2023-03-01",
    salary: 26000,
    commissionRate: 1.5,
    status: "ACTIVE",
    bankAccount: "012180009876543210",
    taxRegime: "605",
    zipCode: "81200",
    phone: "(668) 815-9988"
  },
  {
    name: "Brenda Valenzuela",
    email: "caja@farmerparts.com",
    rfc: "VABB921110KL3",
    curp: "VABB921110MDFRRL04",
    position: "Clerk / Cajera Mostrador",
    role: "CLERK",
    hireDate: "2023-06-15",
    salary: 13500,
    commissionRate: 0.5,
    status: "ACTIVE",
    bankAccount: "012180005544332211",
    taxRegime: "605",
    zipCode: "81200",
    phone: "(668) 819-2233"
  },
  {
    name: "Javier Soto Quintero",
    email: "ventas@farmerparts.com",
    rfc: "SOQJ880905GH5",
    curp: "SOQJ880905HDFRRL03",
    position: "Asesor de Ventas Agrícolas",
    role: "VENTAS",
    hireDate: "2023-05-10",
    salary: 14000,
    commissionRate: 4.0,
    status: "ACTIVE",
    bankAccount: "012180004433221100",
    taxRegime: "605",
    zipCode: "81200",
    phone: "(668) 814-7766"
  },
  {
    name: "Martín Elizalde Lugo",
    email: "bodega@farmerparts.com",
    rfc: "EILM840212OP7",
    curp: "EILM840212HDFRRL08",
    position: "Encargado de Bodega y Almacén",
    role: "BODEGA",
    hireDate: "2023-02-20",
    salary: 14500,
    commissionRate: 0,
    status: "ACTIVE",
    bankAccount: "012180003322110099",
    taxRegime: "605",
    zipCode: "81200",
    phone: "(668) 816-3344"
  }
];

const MOCK_ASSISTANTS: Partial<VirtualAssistant>[] = [
  {
    name: "Farmer AI",
    specialty: "general",
    avatar: "bot",
    color: "#3b82f6",
    isActive: true,
    identity: {
      description: "Asistente experto en Farmer Parts, capaz de ayudar con inventario, ventas y navegación general.",
      instructions: "Eres el asistente principal. Ayuda a los usuarios a encontrar productos, entender reportes y navegar por la app. Sé amable y profesional."
    },
    behavior: {
      tone: "Profesional y Amigable",
      language: "Español",
      quickCommands: ["Ver Inventario", "Resumen de Ventas", "Ayuda con Facturación"],
      autonomyLevel: 1,
      sessionDuration: 30,
      contextMemory: true
    },
    permissions: {
      canAccessInventory: true,
      canAccessSales: true,
      canAccessCustomers: true,
      canAccessReports: true,
      canExecuteActions: true
    },
    notifications: {
      enableAlerts: true,
      alertTypes: ["STOCK_LOW", "NEW_SALE"]
    },
    enabledFunctions: ["consult_stock"]
  },
  {
    name: "LogiBot",
    specialty: "inventory",
    avatar: "truck",
    color: "#10b981",
    isActive: true,
    identity: {
      description: "Especialista en logística, entradas de mercancía y gestión de proveedores.",
      instructions: "Te enfocas en la logística. Ayuda con el lector OCR, recepción de pedidos y stock mínimo."
    },
    behavior: {
      tone: "Técnico y Eficiente",
      language: "Español",
      quickCommands: ["Escanear Factura", "Lista de Proveedores", "Stock Crítico"],
      autonomyLevel: 2,
      sessionDuration: 60,
      contextMemory: true
    },
    permissions: {
      canAccessInventory: true,
      canAccessSales: false,
      canAccessCustomers: false,
      canAccessReports: false,
      canExecuteActions: true
    },
    notifications: {
      enableAlerts: true,
      alertTypes: ["STOCK_LOW"]
    },
    enabledFunctions: ["consult_stock", "low_stock_alerts"]
  }
];

const MOCK_PRODUCTS: Partial<Product>[] = [
  {
    pieceNumber: "1660114M91",
    description: "Bomba de Agua Massey Ferguson 285/290",
    brand: "MF",
    model: "285, 290",
    category: "Motor",
    purchasePrice: 850,
    salePrice: 1450,
    stock: 15,
    minStock: 5,
    maxStock: 30,
    location: "P1-E2-C5",
    imageUrl: "https://picsum.photos/seed/waterpump/400/400",
    barcode: "750123456789",
    leadTime: 5
  },
  {
    pieceNumber: "RE504836",
    description: "Filtro de Aceite John Deere 6403/6603",
    brand: "JD",
    model: "6403, 6603",
    category: "Motor",
    purchasePrice: 120,
    salePrice: 245,
    stock: 45,
    minStock: 10,
    maxStock: 100,
    location: "P2-E1-C1",
    imageUrl: "https://picsum.photos/seed/oilfilter/400/400",
    barcode: "750987654321",
    leadTime: 3
  },
  {
    pieceNumber: "87300195",
    description: "Disco de Freno New Holland TS6000",
    brand: "NH",
    model: "TS6000, TS6020",
    category: "Frenos",
    purchasePrice: 1200,
    salePrice: 2100,
    stock: 8,
    minStock: 4,
    maxStock: 20,
    location: "P3-E4-C2",
    imageUrl: "https://picsum.photos/seed/brake/400/400",
    barcode: "750555444333",
    leadTime: 10
  },
  {
    pieceNumber: "C5NE9430B",
    description: "Múltiple de Escape Ford 6600",
    brand: "Ford",
    model: "6600, 6610",
    category: "Motor",
    purchasePrice: 1800,
    salePrice: 3200,
    stock: 4,
    minStock: 2,
    maxStock: 10,
    location: "P1-E5-C8",
    imageUrl: "https://picsum.photos/seed/exhaust/400/400",
    barcode: "750111222333",
    leadTime: 15
  },
  {
    pieceNumber: "AL156331",
    description: "Alternador 12V 90A John Deere",
    brand: "JD",
    model: "6403, 6603, 7515",
    category: "Eléctrico",
    purchasePrice: 2200,
    salePrice: 3850,
    stock: 6,
    minStock: 2,
    maxStock: 12,
    location: "P4-E1-C3",
    imageUrl: "https://picsum.photos/seed/alternator/400/400",
    barcode: "750222333444",
    leadTime: 8
  },
  {
    pieceNumber: "3681P046",
    description: "Empaque de Cabeza Perkins 1104",
    brand: "Perkins",
    model: "1104C-44, 1104D-44",
    category: "Motor",
    purchasePrice: 450,
    salePrice: 890,
    stock: 20,
    minStock: 5,
    maxStock: 40,
    location: "P1-E3-C10",
    imageUrl: "https://picsum.photos/seed/gasket/400/400",
    barcode: "750333444555",
    leadTime: 4
  },
  {
    pieceNumber: "1868282M1",
    description: "Kit de Clutch 12 Pulgadas MF 285",
    brand: "MF",
    model: "285, 290",
    category: "Transmisión",
    purchasePrice: 4500,
    salePrice: 7200,
    stock: 3,
    minStock: 1,
    maxStock: 6,
    location: "P5-E2-C1",
    imageUrl: "https://picsum.photos/seed/clutch/400/400",
    barcode: "750444555666",
    leadTime: 12
  },
  {
    pieceNumber: "RE211158",
    description: "Bomba Hidráulica Principal JD 7515",
    brand: "JD",
    model: "7515, 7420",
    category: "Hidráulico",
    purchasePrice: 12500,
    salePrice: 18900,
    stock: 2,
    minStock: 1,
    maxStock: 4,
    location: "P6-E1-C1",
    imageUrl: "https://picsum.photos/seed/hydpump/400/400",
    barcode: "750555666777",
    leadTime: 20
  },
  {
    pieceNumber: "82006017",
    description: "Terminal de Dirección NH TS6000",
    brand: "NH",
    model: "TS6000, TS6020",
    category: "Dirección",
    purchasePrice: 350,
    salePrice: 680,
    stock: 12,
    minStock: 4,
    maxStock: 24,
    location: "P3-E2-C4",
    imageUrl: "https://picsum.photos/seed/tierod/400/400",
    barcode: "750666777888",
    leadTime: 6
  },
  {
    pieceNumber: "2873B071",
    description: "Motor de Arranque Perkins 1104",
    brand: "Perkins",
    model: "1104C, 1104D",
    category: "Eléctrico",
    purchasePrice: 3200,
    salePrice: 5400,
    stock: 5,
    minStock: 2,
    maxStock: 10,
    location: "P4-E2-C2",
    imageUrl: "https://picsum.photos/seed/starter/400/400",
    barcode: "750777888999",
    leadTime: 10
  },
  {
    pieceNumber: "1664385M91",
    description: "Cilindro Maestro de Frenos MF 285",
    brand: "MF",
    model: "285, 290",
    category: "Frenos",
    purchasePrice: 650,
    salePrice: 1150,
    stock: 10,
    minStock: 3,
    maxStock: 15,
    location: "P3-E1-C3",
    imageUrl: "https://picsum.photos/seed/mastercyl/400/400",
    barcode: "750888999000",
    leadTime: 7
  },
  {
    pieceNumber: "RE171235",
    description: "Válvula de Control Hidráulico JD",
    brand: "JD",
    model: "6403, 6603",
    category: "Hidráulico",
    purchasePrice: 3800,
    salePrice: 6200,
    stock: 4,
    minStock: 2,
    maxStock: 8,
    location: "P6-E2-C3",
    imageUrl: "https://picsum.photos/seed/valve/400/400",
    barcode: "750999000111",
    leadTime: 14
  }
];

const MOCK_CUSTOMERS: Partial<Customer>[] = [
  {
    name: "Rancho El Porvenir",
    type: "MORAL",
    rfc: "RPO123456ABC",
    email: "contacto@elporvenir.com",
    phone: "4421234567",
    address: {
      street: "Carr. a México",
      number: "KM 15",
      colony: "Industrial",
      zip: "76000",
      city: "Querétaro",
      state: "Querétaro"
    },
    creditLimit: 50000,
    creditDays: 30,
    discount: 5,
    priceList: "Mayoreo",
    status: "ACTIVO",
    balance: 12500
  },
  {
    name: "Juan Pérez Agrícola",
    type: "FISICA",
    rfc: "PEAJ800101XYZ",
    email: "juan.perez@gmail.com",
    phone: "4429876543",
    address: {
      street: "Av. Constituyentes",
      number: "123",
      colony: "Centro",
      zip: "76000",
      city: "Querétaro",
      state: "Querétaro"
    },
    creditLimit: 10000,
    creditDays: 15,
    discount: 0,
    priceList: "General",
    status: "ACTIVO",
    balance: 0
  }
];

const MOCK_VENDORS: Partial<Vendor>[] = [
  {
    name: "Refacciones Agrícolas del Bajío",
    type: "NACIONAL",
    rfc: "RAB950101G34",
    address: "Av. Tecnológico 456, Celaya, Guanajuato",
    email: "ventas@rabajio.com.mx",
    phone: "4611234567",
    contact: "Ing. Alberto Ruiz",
    leadTime: 3,
    rating: 5
  },
  {
    name: "Tractopartes Importadas S.A.",
    type: "INTERNACIONAL",
    rfc: "TIM051212H89",
    address: "Calle 10 #123, Laredo, Texas / Bodega Nuevo Laredo",
    email: "import@tractopartes.com",
    phone: "8677112233",
    contact: "Lic. Martha Sánchez",
    leadTime: 15,
    rating: 4
  },
  {
    name: "Motores y Componentes Perkins México",
    type: "NACIONAL",
    rfc: "MCP880808K22",
    address: "Parque Industrial Querétaro, Santa Rosa Jáuregui",
    email: "soporte@perkinsmexico.com",
    phone: "4422291000",
    contact: "Gerardo Méndez",
    leadTime: 5,
    rating: 5
  },
  {
    name: "Hidráulica y Mangueras de Querétaro",
    type: "NACIONAL",
    rfc: "HMQ020304L55",
    address: "Av. 5 de Febrero 1234, Querétaro, Qro.",
    email: "ventas@hidraulicaqro.com",
    phone: "4421112233",
    contact: "Ing. Roberto Guzmán",
    leadTime: 2,
    rating: 4
  },
  {
    name: "Global Tractor Parts",
    type: "INTERNACIONAL",
    rfc: "GTP990101USA",
    address: "123 Industrial Way, Chicago, IL, USA",
    email: "sales@globaltractor.com",
    phone: "+1 312 555 0199",
    contact: "John Smith",
    leadTime: 20,
    rating: 5
  }
];

const MOCK_SALES: Partial<Sale>[] = [
  {
    subtotal: 2900,
    discount: 0,
    tax: 464,
    total: 3364,
    paymentMethod: 'EFECTIVO',
    status: 'COMPLETED',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    items: [
      {
        productId: "1660114M91",
        pieceNumber: "1660114M91",
        description: "Bomba de Agua Massey Ferguson 285/290",
        quantity: 2,
        price: 1450,
        subtotal: 2900
      }
    ]
  },
  {
    subtotal: 3850,
    discount: 192.5,
    tax: 585.2,
    total: 4242.7,
    paymentMethod: 'TARJETA',
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    items: [
      {
        productId: "AL156331",
        pieceNumber: "AL156331",
        description: "Alternador 12V 90A John Deere",
        quantity: 1,
        price: 3850,
        subtotal: 3850
      }
    ]
  }
];

export async function seedDatabase() {
  if (!auth.currentUser) {
    console.log('Skipping seedDatabase: auth.currentUser is not yet available');
    return;
  }

  try {
    console.log('Starting database seeding...');
    
    try {
      console.log('Checking products...');
      const productsSnap = await getDocs(collection(db, 'products'));
      const existingPieceNumbers = new Set(productsSnap.docs.map(doc => doc.data().pieceNumber));
      
      for (const p of MOCK_PRODUCTS) {
        if (!existingPieceNumbers.has(p.pieceNumber)) {
          console.log(`Seeding product: ${p.pieceNumber}`);
          await addDoc(collection(db, 'products'), p);
        }
      }
    } catch (err) {
      console.warn('Could not seed products:', err);
    }

    try {
      console.log('Checking customers...');
      const customersSnap = await getDocs(collection(db, 'customers'));
      const existingCustomerRFCs = new Set(customersSnap.docs.map(doc => doc.data().rfc));
      
      for (const c of MOCK_CUSTOMERS) {
        if (!existingCustomerRFCs.has(c.rfc)) {
          console.log(`Seeding customer: ${c.rfc}`);
          await addDoc(collection(db, 'customers'), c);
        }
      }
    } catch (err) {
      console.warn('Could not seed customers:', err);
    }

    try {
      console.log('Checking vendors...');
      const vendorsSnap = await getDocs(collection(db, 'vendors'));
      const existingVendorRFCs = new Set(vendorsSnap.docs.map(doc => doc.data().rfc));
      
      for (const v of MOCK_VENDORS) {
        if (!existingVendorRFCs.has(v.rfc)) {
          console.log(`Seeding vendor: ${v.rfc}`);
          await addDoc(collection(db, 'vendors'), v);
        }
      }
    } catch (err) {
      console.warn('Could not seed vendors:', err);
    }

    try {
      console.log('Checking sales...');
      const salesSnap = await getDocs(collection(db, 'sales'));
      if (salesSnap.empty) {
        for (const s of MOCK_SALES) {
          console.log(`Seeding sale: ${s.total}`);
          await addDoc(collection(db, 'sales'), s);
        }
      }
    } catch (err) {
      console.warn('Could not seed sales:', err);
    }

    try {
      console.log('Checking assistants...');
      const assistantsSnap = await getDocs(collection(db, 'virtual_assistants'));
      if (assistantsSnap.empty) {
        for (const a of MOCK_ASSISTANTS) {
          console.log(`Seeding assistant: ${a.name}`);
          await addDoc(collection(db, 'virtual_assistants'), {
            ...a,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.warn('Could not seed assistants:', err);
    }

    try {
      console.log('Checking assistant settings...');
      const settingsDoc = await getDoc(doc(db, 'assistant_settings', 'global'));
      if (!settingsDoc.exists()) {
        console.log('Seeding global assistant settings');
        await setDoc(doc(db, 'assistant_settings', 'global'), {
          autoSwitchByContext: true,
          defaultAssistantId: 'farmer-gen',
          maxConcurrentAssistants: 5,
          allowCustomAssistants: true
        });
      }
    } catch (err) {
      console.warn('Could not seed assistant settings:', err);
    }
    
    try {
      console.log('Checking positions...');
      const positionsSnap = await getDocs(collection(db, 'positions'));
      if (positionsSnap.empty) {
        for (const pos of DEFAULT_POSITIONS) {
          console.log(`Seeding position: ${pos.name}`);
          await setDoc(doc(db, 'positions', pos.id), {
            ...pos,
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.warn('Could not seed positions:', err);
    }

    try {
      console.log('Checking employees...');
      const employeesSnap = await getDocs(collection(db, 'employees'));
      const existingEmployeeRFCs = new Set(employeesSnap.docs.map(doc => doc.data().rfc));
      for (const emp of MOCK_EMPLOYEES) {
        if (!existingEmployeeRFCs.has(emp.rfc)) {
          console.log(`Seeding employee: ${emp.name} (${emp.role})`);
          await addDoc(collection(db, 'employees'), {
            ...emp,
            uid: emp.email === 'rod.mx673@gmail.com' ? (auth.currentUser?.uid || 'admin') : `emp_${emp.rfc}`,
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.warn('Could not seed employees:', err);
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
