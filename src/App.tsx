/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useContext, useEffect } from 'react';
import { AuthProvider, AuthContext, LoginView } from './components/Auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { POS } from './components/POS';
import { Inventory } from './components/Inventory';
import { Customers } from './components/Customers';
import { Vendors } from './components/Vendors';
import { Reports } from './components/Reports';
import { AdminPanel } from './components/AdminPanel';
import { Settings } from './components/Settings';
import { EmployeeList } from './components/HR/EmployeeList';
import { CommissionCalculator } from './components/HR/CommissionCalculator';
import { AttendanceManager } from './components/HR/AttendanceManager';
import { SatConfigWizard } from './components/Invoicing/SatConfigWizard';
import { TaxReports } from './components/Invoicing/TaxReports';
import { ProfessionalInvoice } from './components/Invoicing/ProfessionalInvoice';
import { Payroll } from './components/Finance/Payroll';
import { OCRInvoiceReader } from './components/OCRInvoiceReader';
import { InvoiceHistory } from './components/InvoiceHistory';
import { ReferenceCatalog } from './components/ReferenceCatalog';
import { OnlineStoreView } from './components/Store/OnlineStoreView';
import { OnlineOrdersManager } from './components/Store/OnlineOrdersManager';
import { ModuleDisabled } from './components/ModuleDisabled';

import { BarChart3, Settings as SettingsIcon, AlertCircle } from 'lucide-react';

function isModuleEnabled(moduleId: string): boolean {
  try {
    const saved = localStorage.getItem('fp_modules');
    if (!saved) return true;
    const modules = JSON.parse(saved);
    return modules[moduleId] !== false;
  } catch { return true; }
}

function AppContent() {
  const { user, loading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('pos');
  const [viewMode, setViewMode] = useState<'store' | 'erp'>('erp');
  
  // ESTADO PARA RECIBIR EL PRODUCTO DEL CATÁLOGO
  const [prefilledProduct, setPrefilledProduct] = useState<any>(null);

  useEffect(() => {
    try {
      localStorage.setItem('farmer_parts_view_mode', viewMode);
    } catch (e) {
      console.warn('Could not save view mode:', e);
    }
  }, [viewMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // If in store mode, render the public E-Commerce Store
  if (viewMode === 'store') {
    return <OnlineStoreView onOpenERP={() => setViewMode('erp')} />;
  }

  // If in ERP mode and not authenticated, render corporate login with option to return to store
  if (!user) {
    return <LoginView onExploreStore={() => setViewMode('store')} />;
  }

    const renderContent = () => {
    switch (activeTab) {
      case 'pos': 
        return isModuleEnabled('pos') ? <POS /> : <ModuleDisabled moduleName="Punto de Venta" />;
      case 'online-orders': 
        return isModuleEnabled('online-orders') ? <OnlineOrdersManager /> : <ModuleDisabled moduleName="Pedidos E-Commerce" />;
      case 'inventory': 
        return isModuleEnabled('inventory') ? <Inventory /> : <ModuleDisabled moduleName="Inventario y Stock" />;
      case 'reference-catalog':
        return isModuleEnabled('reference-catalog') ? <ReferenceCatalog /> : <ModuleDisabled moduleName="Catálogo de Partes" />;
      case 'invoice-extractor':
      case 'ocr-reader': 
        return isModuleEnabled('ocr-reader') 
          ? <OCRInvoiceReader onNavigateToHistory={() => setActiveTab('invoice-history')} onNavigateToInventory={() => setActiveTab('inventory')} />
          : <ModuleDisabled moduleName="Extractor de Facturas" />;
      case 'invoice-history':
        return isModuleEnabled('invoice-history') 
          ? <InvoiceHistory onNavigateToExtractor={() => setActiveTab('ocr-reader')} onNavigateToInventory={() => setActiveTab('inventory')} />
          : <ModuleDisabled moduleName="Historial de Facturas" />;
      case 'customers': 
        return isModuleEnabled('customers') ? <Customers /> : <ModuleDisabled moduleName="Clientes" />;
      case 'vendors': 
        return isModuleEnabled('vendors') ? <Vendors /> : <ModuleDisabled moduleName="Proveedores" />;
      case 'reports': 
        return isModuleEnabled('reports') ? <Reports /> : <ModuleDisabled moduleName="Reportes" />;
      case 'employees': 
        return isModuleEnabled('employees') ? <EmployeeList /> : <ModuleDisabled moduleName="Recursos Humanos" />;
      case 'commissions': 
        return isModuleEnabled('commissions') ? <CommissionCalculator /> : <ModuleDisabled moduleName="Comisiones" />;
      case 'attendance': 
        return isModuleEnabled('attendance') ? <AttendanceManager /> : <ModuleDisabled moduleName="Asistencia" />;
      case 'invoicing': 
        return isModuleEnabled('invoicing') ? <TaxReports /> : <ModuleDisabled moduleName="Facturación" />;
      case 'payroll': 
        return isModuleEnabled('payroll') ? <Payroll /> : <ModuleDisabled moduleName="Nómina" />;
      case 'professional-invoice': 
        return isModuleEnabled('invoicing') 
          ? <ProfessionalInvoice onClose={() => setActiveTab('invoicing')} />
          : <ModuleDisabled moduleName="Facturador Pro" />;
      case 'sat-config': 
        return isModuleEnabled('sat-config') ? <SatConfigWizard /> : <ModuleDisabled moduleName="Configuración SAT" />;
      case 'settings': 
        return <Settings />;
      case 'admin': 
        return isModuleEnabled('admin') ? <AdminPanel /> : <ModuleDisabled moduleName="Panel de Administración" />;
      default: 
        return <POS />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onSwitchToStore={() => setViewMode('store')}
    >
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}