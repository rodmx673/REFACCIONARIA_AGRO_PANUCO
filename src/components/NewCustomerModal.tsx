import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  UserPlus, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Save,
  Tractor,
  Percent,
  FileText
} from 'lucide-react';


import { Customer } from '../types';
import { toast } from 'sonner';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  customerToEdit?: Customer | null;
  onSuccess?: (savedCustomer: Customer) => void;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  title,
  customerToEdit,
  onSuccess
}) => {
  const isEditing = Boolean(customerToEdit);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'FISICA' | 'MORAL'>('FISICA');
  const [rfc, setRfc] = useState('');
  const [curp, setCurp] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Address State
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [colony, setColony] = useState('');
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('Los Mochis');
  const [state, setState] = useState('Sinaloa');

  // Commercial / Credit Terms
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [creditDays, setCreditDays] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [priceList, setPriceList] = useState<string>('General');
  const [status, setStatus] = useState<'ACTIVO' | 'INACTIVO' | 'MOROSO'>('ACTIVO');
  const [balance, setBalance] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Populate form if editing or reset when opening/closing
  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name || '');
      setType(customerToEdit.type || 'FISICA');
      setRfc(customerToEdit.rfc || '');
      setCurp(customerToEdit.curp || '');
      setEmail(customerToEdit.email || '');
      setPhone(customerToEdit.phone || '');
      setStreet(customerToEdit.address?.street || '');
      setNumber(customerToEdit.address?.number || '');
      setColony(customerToEdit.address?.colony || '');
      setZip(customerToEdit.address?.zip || '');
      setCity(customerToEdit.address?.city || 'Los Mochis');
      setState(customerToEdit.address?.state || 'Sinaloa');
      setCreditLimit(customerToEdit.creditLimit || 0);
      setCreditDays(customerToEdit.creditDays || 0);
      setDiscount(customerToEdit.discount || 0);
      setPriceList(customerToEdit.priceList || 'General');
      setStatus(customerToEdit.status || 'ACTIVO');
      setBalance(customerToEdit.balance || 0);
    } else {
      setName('');
      setType('FISICA');
      setRfc('XAXX010101000');
      setCurp('');
      setEmail('');
      setPhone('');
      setStreet('');
      setNumber('');
      setColony('');
      setZip('81200');
      setCity('Los Mochis');
      setState('Sinaloa');
      setCreditLimit(20000);
      setCreditDays(30);
      setDiscount(0);
      setPriceList('General');
      setStatus('ACTIVO');
      setBalance(0);
    }
    setFormError(null);
  }, [customerToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedRfc = rfc.trim().toUpperCase();

    if (!trimmedName) {
      setFormError('El nombre o razón social es obligatorio.');
      return;
    }

    if (!trimmedRfc) {
      setFormError('El RFC es obligatorio.');
      return;
    }

    // Validate RFC length roughly: 12 chars for Moral, 13 chars for Fisica (or generic XAXX010101000)
    if (trimmedRfc !== 'XAXX010101000' && trimmedRfc.length < 12) {
      setFormError('El RFC debe contener al menos 12 caracteres.');
      return;
    }

    setIsSubmitting(true);

    const customerPayload = {
      name: trimmedName,
      type,
      rfc: trimmedRfc,
      curp: curp.trim().toUpperCase(),
      email: email.trim(),
      phone: phone.trim(),
      address: {
        street: street.trim(),
        number: number.trim(),
        colony: colony.trim(),
        zip: zip.trim(),
        city: city.trim(),
        state: state.trim()
      },
      creditLimit: Number(creditLimit) || 0,
      creditDays: Number(creditDays) || 0,
      discount: Number(discount) || 0,
      priceList: priceList || 'General',
      status,
      balance: Number(balance) || 0,
      updatedAt: serverTimestamp()
    };

    try {
      let savedId = '';
      if (isEditing && customerToEdit) {
        savedId = customerToEdit.id;
        const customerRef = doc(db, 'customers', customerToEdit.id);
        await updateDoc(customerRef, customerPayload);
        toast.success(`Cliente ${trimmedName} actualizado exitosamente`);
      } else {
        const docRef = await addDoc(collection(db, 'customers'), {
          ...customerPayload,
          createdAt: serverTimestamp()
        });
        savedId = docRef.id;
        toast.success(`Cliente agrícola ${trimmedName} registrado exitosamente`);
      }

      const savedCustomerObj: Customer = {
        id: savedId,
        name: trimmedName,
        type,
        rfc: trimmedRfc,
        curp: curp.trim().toUpperCase(),
        email: email.trim(),
        phone: phone.trim(),
        address: {
          street: street.trim(),
          number: number.trim(),
          colony: colony.trim(),
          zip: zip.trim(),
          city: city.trim(),
          state: state.trim()
        },
        creditLimit: Number(creditLimit) || 0,
        creditDays: Number(creditDays) || 0,
        discount: Number(discount) || 0,
        priceList: priceList || 'General',
        status,
        balance: Number(balance) || 0
      };

      if (onSuccess) {
        onSuccess(savedCustomerObj);
      }
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      handleFirestoreError(error, OperationType.WRITE, 'customers');
      setFormError('Ocurrió un error al guardar el cliente en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = title || (isEditing ? 'Editar Cliente Agrícola' : 'Nuevo Cliente Agrícola');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="new-customer-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        >
          <motion.div
            id="new-customer-modal-container"
            initial={{ scale: 0.95, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 16, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-100 my-auto"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-inner">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                    {modalTitle}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Registro de productor agrícola, datos fiscales SAT y condiciones de crédito
                  </p>
                </div>
              </div>
              <button
                id="new-customer-close-x-btn"
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl transition-all"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 font-medium animate-shake">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Persona Física vs Moral Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">
                  Régimen / Tipo de Contribuyente
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setType('FISICA');
                      if (rfc === 'XAXX010101000' || rfc.length === 12) setRfc('');
                    }}
                    className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border-2 transition-all font-bold text-xs sm:text-sm ${
                      type === 'FISICA'
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <User size={18} className="shrink-0" />
                    <span>Persona Física (Agricultor / Particular)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('MORAL');
                      if (rfc.length === 13) setRfc('');
                    }}
                    className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border-2 transition-all font-bold text-xs sm:text-sm ${
                      type === 'MORAL'
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Building2 size={18} className="shrink-0" />
                    <span>Persona Moral (Agrícola / Empresa S.A.)</span>
                  </button>
                </div>
              </div>

              {/* Identification Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Tractor size={14} className="text-primary" />
                    Nombre Completo o Razón Social *
                  </label>
                  <input
                    id="new-customer-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={type === 'FISICA' ? 'Ej. Don Ramón Valenzuela Castro' : 'Ej. Agrícola Santa Cecilia S.P.R. de R.L.'}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                    <span>RFC (SAT) *</span>
                    <button
                      type="button"
                      onClick={() => setRfc('XAXX010101000')}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      Público en General
                    </button>
                  </label>
                  <input
                    id="new-customer-rfc-input"
                    type="text"
                    required
                    maxLength={13}
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    placeholder={type === 'FISICA' ? 'VARD750812AA1' : 'ASC120315XY8'}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-bold text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    CURP (Opcional)
                  </label>
                  <input
                    id="new-customer-curp-input"
                    type="text"
                    maxLength={18}
                    value={curp}
                    onChange={(e) => setCurp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    placeholder="18 caracteres alfanuméricos"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={14} className="text-gray-400" />
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    id="new-customer-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. (668) 812-4590"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail size={14} className="text-gray-400" />
                    Correo Electrónico (Para Facturas)
                  </label>
                  <input
                    id="new-customer-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="facturacion@rancho.com"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Agricultural & Fiscal Address */}
              <div className="bg-gray-50/80 p-4 sm:p-5 rounded-2xl border border-gray-200/80 space-y-3.5">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Ubicación y Domicilio Fiscal / Predio Agrícola
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Calle, Campo o Valle</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Ej. Carretera a Topolobampo Km 4.5 / Campo 35"
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">No. Ext / Lote</label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="S/N o Lote 12"
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Colonia o Ejido</label>
                    <input
                      type="text"
                      value={colony}
                      onChange={(e) => setColony(e.target.value)}
                      placeholder="Ej. Ejido Mochis"
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Código Postal</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={zip}
                      onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
                      placeholder="81200"
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Ciudad / Municipio</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Los Mochis / Ahome"
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Commercial Terms & Credit Conditions */}
              <div className="bg-primary/5 p-4 sm:p-5 rounded-2xl border border-primary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-primary" />
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                      Límites de Crédito y Condiciones Comerciales
                    </h4>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                    Control Financiero
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 uppercase flex items-center justify-between">
                      <span>Límite de Crédito ($ MXN)</span>
                    </label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="new-customer-credit-limit-input"
                        type="number"
                        min="0"
                        step="1000"
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-primary/30 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 uppercase flex items-center justify-between">
                      <span>Días de Crédito</span>
                    </label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        id="new-customer-credit-days-select"
                        value={creditDays}
                        onChange={(e) => setCreditDays(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-primary/30 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        <option value="0">0 días (Contado)</option>
                        <option value="15">15 días</option>
                        <option value="30">30 días</option>
                        <option value="45">45 días</option>
                        <option value="60">60 días (Cosecha)</option>
                        <option value="90">90 días (Ciclo Agrícola)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 uppercase">
                      Descuento Fijo (%)
                    </label>
                    <div className="relative">
                      <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-primary/30 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 uppercase">
                      Lista de Precios
                    </label>
                    <select
                      value={priceList}
                      onChange={(e) => setPriceList(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-primary/30 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="General">General / Mostrador</option>
                      <option value="Productor">Productor Agrícola Frecuente</option>
                      <option value="Taller">Taller Mecánico / Especialista</option>
                      <option value="Mayoreo">Mayoreo y Flotillas</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 uppercase">
                      Estatus del Cliente
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-primary/30 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="ACTIVO">Activo (Habilitado)</option>
                      <option value="INACTIVO">Inactivo</option>
                      <option value="MOROSO">Moroso (Bloquear Crédito)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 uppercase">
                      Saldo Deudor Actual ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={balance}
                      onChange={(e) => setBalance(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-primary/30 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-gray-100">
                <button
                  id="new-customer-cancel-btn"
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-bold text-xs transition-all text-center"
                >
                  Cancelar
                </button>
                <button
                  id="new-customer-save-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={15} />
                      <span>{isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
