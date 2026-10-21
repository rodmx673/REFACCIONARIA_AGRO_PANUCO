import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, MapPin, CreditCard, Save, ChevronDown } from 'lucide-react';
import { Customer } from '../types';
import { toast } from 'sonner';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  customerToEdit?: Customer | null;
  onSuccess?: (savedCustomer: Customer) => void;
}

const URL = import.meta.env.VITE_APPS_SCRIPT_URL;

// Lista completa de los 32 estados de México
const MEXICO_STATES = [
  'AGUASCALIENTES', 'BAJA CALIFORNIA', 'BAJA CALIFORNIA SUR', 'CAMPECHE', 'CHIAPAS',
  'CHIHUAHUA', 'CIUDAD DE MÉXICO', 'COAHUILA', 'COLIMA', 'DURANGO', 'GUANAJUATO',
  'GUERRERO', 'HIDALGO', 'JALISCO', 'MÉXICO', 'MICHOACÁN', 'MORELOS', 'NAYARIT',
  'NUEVO LEÓN', 'OAXACA', 'PUEBLA', 'QUERÉTARO', 'QUINTANA ROO', 'SAN LUIS POTOSÍ',
  'SINALOA', 'SONORA', 'TABASCO', 'TAMAULIPAS', 'TLAXCALA', 'VERACRUZ', 'YUCATÁN', 'ZACATECAS'
];

// Base de datos de municipios y colonias/comunidades
const LOCATION_DATA: Record<string, Record<string, string[]>> = {
  'VERACRUZ': {
    'PÁNUCO': ['CENTRO', 'CHIJOL', 'PUEBLO VIEJO', 'LA CEIBA', 'GUAYALEJO', 'MORALILLO', 'SAN CRISTÓBAL', 'TAMOS', 'CHAPACAO', 'SANTA ELENA', 'EL MANTE', 'REVOLUCIÓN', 'ÁLVARO OBREGÓN'],
    'TAMPICO ALTO': ['CENTRO', 'EL BARCO', 'MATA REDONDA'],
    'TEMPOAL': ['CENTRO', 'HORCONCITOS', 'EL HIGO'],
    'PUEBLO VIEJO': ['CENTRO', 'BELLAVISTA', 'PASO REAL', 'BENITO JUÁREZ'],
    'TANTOYUCA': ['CENTRO', 'PLATÓN SÁNCHEZ']
  },
  'TAMAULIPAS': {
    'TAMPICO': ['CENTRO', 'ZONA CENTRO'],
    'ALTAMIRA': ['CENTRO', 'MIRAMAR'],
    'CIUDAD MADERO': ['CENTRO']
  },
  'SINALOA': {
    'AHOME': ['LOS MOCHIS', 'CENTRO', 'JUÁREZ'],
    'CULIACÁN': ['CENTRO', 'TRES RÍOS'],
    'MAZATLÁN': ['CENTRO', 'ZONA DORADA']
  },
  'GUERRERO': {
    'ACAPULCO': ['CENTRO', 'COYUCA'],
    'CHILPANCINGO': ['CENTRO']
  }
};

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({ isOpen, onClose, title, customerToEdit, onSuccess }) => {
  const isEditing = Boolean(customerToEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'FISICA' | 'MORAL'>('FISICA');
  const [rfc, setRfc] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Address State
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [zip, setZip] = useState('93390');
  
  // Cascade State
  const [selectedState, setSelectedState] = useState('VERACRUZ');
  const [selectedCity, setSelectedCity] = useState('PÁNUCO');
  const [selectedColony, setSelectedColony] = useState('CENTRO');
  const [isCustomColony, setIsCustomColony] = useState(false);
  const [customColony, setCustomColony] = useState('');

  // Credit State
  const [creditLimit, setCreditLimit] = useState<number>(20000);
  const [creditDays, setCreditDays] = useState<number>(30);
  const [discount, setDiscount] = useState<number>(0);
  const [status, setStatus] = useState<'ACTIVO' | 'INACTIVO' | 'MOROSO'>('ACTIVO');

  // Formateador de Teléfono (+52 846 110 8789)
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let localDigits = digits;
    if (localDigits.startsWith('52')) localDigits = localDigits.slice(2);
    localDigits = localDigits.slice(0, 10);
    
    let formatted = '+52 ';
    if (localDigits.length > 0) formatted += localDigits.slice(0, 3);
    if (localDigits.length > 3) formatted += ' ' + localDigits.slice(3, 6);
    if (localDigits.length > 6) formatted += ' ' + localDigits.slice(6, 10);
    return formatted.trim();
  };

  // Verificar si el estado actual tiene datos predefinidos
  const hasCityData = LOCATION_DATA[selectedState] !== undefined;
  const availableCities = hasCityData ? Object.keys(LOCATION_DATA[selectedState]) : [];
  const hasColonyData = hasCityData && LOCATION_DATA[selectedState][selectedCity] !== undefined;
  const availableColonies = hasColonyData ? LOCATION_DATA[selectedState][selectedCity] : [];

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name || '');
      setType(customerToEdit.type || 'FISICA');
      setRfc(customerToEdit.rfc || '');
      setEmail(customerToEdit.email || '');
      setPhone(customerToEdit.phone || '');
      setStreet(customerToEdit.address?.street || '');
      setNumber(customerToEdit.address?.number || '');
      setZip(customerToEdit.address?.zip || '93390');
      
      const state = customerToEdit.address?.state || 'VERACRUZ';
      const city = customerToEdit.address?.city || 'PÁNUCO';
      const colony = customerToEdit.address?.colony || 'CENTRO';

      setSelectedState(state);
      setSelectedCity(city);
      
      if (LOCATION_DATA[state]?.[city]?.includes(colony)) {
        setSelectedColony(colony);
        setIsCustomColony(false);
      } else {
        setIsCustomColony(true);
        setCustomColony(colony);
        setSelectedColony('OTRA');
      }

      setCreditLimit(customerToEdit.creditLimit || 0);
      setCreditDays(customerToEdit.creditDays || 0);
      setDiscount(customerToEdit.discount || 0);
      setStatus(customerToEdit.status || 'ACTIVO');
    } else {
      setName(''); setRfc('XAXX010101000'); setEmail(''); setPhone('+52 ');
      setStreet(''); setNumber(''); setZip('93390');
      setSelectedState('VERACRUZ'); setSelectedCity('PÁNUCO'); setSelectedColony('CENTRO');
      setIsCustomColony(false); setCustomColony('');
      setCreditLimit(20000); setCreditDays(30); setDiscount(0); setStatus('ACTIVO');
    }
  }, [customerToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rfc.trim()) { toast.error('Nombre y RFC son obligatorios'); return; }

    const finalColony = isCustomColony ? customColony : selectedColony;
    if (!finalColony.trim()) { toast.error('La colonia o comunidad es obligatoria'); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        id: isEditing ? customerToEdit!.id : undefined,
        name: name.trim().toUpperCase(),
        type,
        rfc: rfc.trim().toUpperCase(),
        email: email.trim().toUpperCase(),
        phone: phone.trim(),
        address: { 
          street: street.trim().toUpperCase(), 
          number: number.trim().toUpperCase(), 
          colony: finalColony.trim().toUpperCase(), 
          zip: zip.trim(), 
          city: selectedCity.trim().toUpperCase(), 
          state: selectedState.trim().toUpperCase() 
        },
        creditLimit: Number(creditLimit),
        creditDays: Number(creditDays),
        discount: Number(discount),
        priceList: 'General',
        status,
        balance: isEditing ? customerToEdit!.balance : 0
      };

      const action = isEditing ? 'updateCustomer' : 'createCustomer';
      const res = await fetch(URL, { method: 'POST', body: JSON.stringify({ action, data: payload }) });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      toast.success(isEditing ? 'Cliente actualizado' : 'Cliente registrado');
      if (onSuccess) onSuccess(payload as Customer);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col my-auto">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold"><UserPlus size={20} /></div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{title || (isEditing ? 'Editar Cliente' : 'Nuevo Cliente')}</h3>
                <p className="text-xs text-gray-500">Datos fiscales y condiciones comerciales</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:bg-white rounded-xl"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Nombre o Razón Social *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold" placeholder="AUTO TRACTORES DEMO" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">RFC (SAT) *</label>
                <input type="text" required maxLength={13} value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono" placeholder="XAXX010101000" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Teléfono / WhatsApp</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono" placeholder="+52 846 110 8789" />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Correo Electrónico</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="CLIENTE@CORREO.COM" />
              </div>
            </div>

            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
              <div className="flex items-center gap-2"><MapPin size={16} className="text-primary" /><h4 className="text-xs font-bold text-gray-700 uppercase">Dirección (Cascada)</h4></div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase">Estado</label>
                  <select 
                    value={selectedState} 
                    onChange={(e) => {
                      const newState = e.target.value;
                      setSelectedState(newState);
                      if (LOCATION_DATA[newState]) {
                        const firstCity = Object.keys(LOCATION_DATA[newState])[0] || '';
                        setSelectedCity(firstCity);
                        const firstColony = LOCATION_DATA[newState]?.[firstCity]?.[0] || '';
                        setSelectedColony(firstColony);
                        setIsCustomColony(false);
                      } else {
                        setSelectedCity('');
                        setSelectedColony('');
                        setIsCustomColony(true);
                      }
                    }} 
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                  >
                    {MEXICO_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase">Municipio</label>
                  {hasCityData ? (
                    <select 
                      value={selectedCity} 
                      onChange={(e) => {
                        const newCity = e.target.value;
                        setSelectedCity(newCity);
                        const firstColony = LOCATION_DATA[selectedState]?.[newCity]?.[0] || '';
                        setSelectedColony(firstColony);
                        setIsCustomColony(false);
                      }} 
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                    >
                      {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value.toUpperCase())} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs" placeholder="ESCRIBE EL MUNICIPIO" />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase">Colonia / Comunidad</label>
                  {hasColonyData ? (
                    <select 
                      value={isCustomColony ? 'OTRA' : selectedColony} 
                      onChange={(e) => {
                        if (e.target.value === 'OTRA') {
                          setIsCustomColony(true);
                        } else {
                          setIsCustomColony(false);
                          setSelectedColony(e.target.value);
                        }
                      }} 
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                    >
                      {availableColonies.map(col => <option key={col} value={col}>{col}</option>)}
                      <option value="OTRA" className="text-primary font-bold">+ OTRA COMUNIDAD...</option>
                    </select>
                  ) : (
                    <input type="text" value={selectedColony} onChange={(e) => setSelectedColony(e.target.value.toUpperCase())} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs" placeholder="ESCRIBE LA COLONIA" />
                  )}
                </div>
              </div>

              {isCustomColony && hasColonyData && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1">
                  <label className="text-[11px] font-bold text-primary uppercase">Escribe la Comunidad</label>
                  <input type="text" value={customColony} onChange={(e) => setCustomColony(e.target.value.toUpperCase())} className="w-full px-3 py-2 bg-white border border-primary/40 rounded-xl text-xs font-bold" placeholder="NOMBRE DE LA COMUNIDAD" />
                </motion.div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase">Calle o Campo</label>
                  <input type="text" value={street} onChange={(e) => setStreet(e.target.value.toUpperCase())} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs" placeholder="AV. SIEMPRE VIVA" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase">Número</label>
                  <input type="text" value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs" placeholder="S/N" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase">Código Postal</label>
                  <input type="text" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono" placeholder="93390" />
                </div>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 space-y-3">
              <div className="flex items-center gap-2"><CreditCard size={16} className="text-primary" /><h4 className="text-xs font-bold text-primary uppercase">Límites de Crédito</h4></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase">Límite ($)</label>
                  <input type="number" value={creditLimit} onChange={(e) => setCreditLimit(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-primary/30 rounded-xl text-xs font-bold" placeholder="20000" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase">Días Crédito</label>
                  <select value={creditDays} onChange={(e) => setCreditDays(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-primary/30 rounded-xl text-xs font-bold">
                    <option value="0">Contado</option>
                    <option value="15">15 días</option>
                    <option value="30">30 días</option>
                    <option value="60">60 días</option>
                    <option value="90">90 días</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 uppercase">Estatus</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-3 py-2 bg-white border border-primary/30 rounded-xl text-xs font-bold">
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                    <option value="MOROSO">Moroso</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-5 py-2 border border-gray-200 rounded-xl font-bold text-xs text-gray-600">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-xs shadow-lg flex items-center gap-2">
                {isSubmitting ? 'Guardando...' : <><Save size={15} /> Guardar Cliente</>}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};