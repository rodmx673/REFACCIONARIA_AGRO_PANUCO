import React from 'react';
import { Calculator, ShieldCheck, FileText } from 'lucide-react';

export const TaxReports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Calculator className="text-primary" /> Reportes Fiscales</h2>
        <p className="text-sm text-gray-500">Resumen de impuestos acumulados y cumplimiento de obligaciones.</p>
      </div>
      <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center space-y-4">
        <ShieldCheck size={48} className="mx-auto text-emerald-500" />
        <h3 className="text-xl font-bold text-gray-900">Módulo en Migración</h3>
        <p className="text-gray-500 max-w-md mx-auto">Estamos conectando los reportes fiscales a Google Sheets. Pronto podrás ver aquí tus cálculos de IVA e ISR.</p>
      </div>
    </div>
  );
};