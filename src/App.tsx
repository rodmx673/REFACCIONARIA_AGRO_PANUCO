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

import { BarChart3, Settings as SettingsIcon, AlertCircle } from 'lucide-react';

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
      case 'pos': return <POS />;
      case 'online-orders': return <OnlineOrdersManager />;
      case 'inventory': 
        return <Inventory prefilledProduct={prefilledProduct} onClearPrefilled={() => setPrefilledProduct(null)} />;
      case 'invoice-extractor':
      case 'ocr-reader': 
        return (
          <OCRInvoiceReader 
            onNavigateToHistory={() => setActiveTab('invoice-history')} 
            onNavigateToInventory={() => setActiveTab('inventory')}
          />
        );
      case 'reference-catalog': 
        return (
          <ReferenceCatalog 
            onImportToStock={(item) => { 
              setPrefilledProduct(item); 
              setActiveTab('inventory'); 
            }} 
          />
        );
      case 'invoice-history':
        return (
          <InvoiceHistory 
            onNavigateToExtractor={() => setActiveTab('ocr-reader')} 
            onNavigateToInventory={() => setActiveTab('inventory')}
          />
        );
      case 'customers': return <Customers />;
      case 'vendors': return <Vendors />;
      case 'reports': return <Reports />;
      case 'admin': return <AdminPanel />;
      case 'employees': return <EmployeeList />;
      case 'commissions': return <CommissionCalculator />;
      case 'attendance': return <AttendanceManager />;
      case 'invoicing': return <ProfessionalInvoice onClose={() => setActiveTab('pos')} />;
      case 'payroll': return <Payroll />;
      case 'sat-config': return <SatConfigWizard />;
      case 'settings': return <Settings />;
      case 'admin-panel': return <AdminPanel />;
      default: return <POS />;
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