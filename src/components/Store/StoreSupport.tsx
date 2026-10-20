import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  PhoneCall, 
  Mail, 
  MessageSquare, 
  ChevronDown, 
  Send, 
  CheckCircle2, 
  Tractor,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';

interface StoreSupportProps {
  onClose: () => void;
}

const FAQS = [
  {
    q: '¿Cómo sé si una refacción es compatible con mi modelo de tractor?',
    a: 'Puedes verificar el número de parte OEM grabado en tu pieza averiada o buscar por el modelo exacto de tu tractor (ej. John Deere 6403 o MF 285). Si tienes dudas, contáctanos por WhatsApp con una fotografía de tu pieza y placa del motor.'
  },
  {
    q: '¿Cuáles son los tiempos de entrega y qué paqueterías utilizan?',
    a: 'Enviamos a todo México a través de FedEx, Estafeta y Paquetexpress. El servicio estándar tarda de 3 a 5 días hábiles, y el servicio Express tarda de 24 a 48 horas. En compras superiores a $3,500 MXN el envío estándar es completamente gratuito.'
  },
  {
    q: '¿Cómo solicito mi factura fiscal CFDI 4.0?',
    a: 'Durante el proceso de checkout solo debes marcar la casilla "Requiero Factura Fiscal" e ingresar tu RFC. El sistema timbra y envía automáticamente los archivos XML y PDF a tu correo electrónico al confirmarse el pago.'
  },
  {
    q: '¿Qué garantía tienen las bombas hidráulicas y embragues?',
    a: 'Todas nuestras refacciones cuentan con 12 meses de garantía directa contra defectos de fabricación o ensamble. En caso de garantía, enviamos una pieza de reemplazo sin costo de flete.'
  },
  {
    q: '¿Puedo pagar en efectivo o solicitar crédito para mi ejido o rancho?',
    a: 'Sí, aceptamos pagos en efectivo en cualquier tienda OXXO del país mediante código de barras virtual. Además, contamos con convenios de crédito agrícola a 15, 30 y 60 días para productores registrados.'
  }
];

export const StoreSupport: React.FC<StoreSupportProps> = ({ onClose }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tractorModel, setTractorModel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        customerName: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        subject: subject.trim() || 'Consulta Técnica de Refacciones',
        message: message.trim(),
        tractorModel: tractorModel.trim(),
        status: 'OPEN',
        createdAt: new Date().toISOString()
      });

      setSentSuccess(true);
      toast.success('Ticket de asistencia registrado con éxito');
    } catch (err) {
      console.error('Error sending ticket:', err);
      toast.error('No se pudo enviar el mensaje');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-emerald-300 flex items-center justify-center font-bold">
              <HelpCircle size={17} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight">Centro de Ayuda y Asesoría Técnica</h2>
              <p className="text-[11px] text-emerald-300">Respaldo directo de mecánicos e ingenieros agrícolas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-8">
          {/* Quick Contact Banner */}
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest bg-emerald-200/60 px-2 py-0.5 rounded">
                Atención Rápida en Campo
              </span>
              <h4 className="text-base font-black text-gray-900">¿Tienes la máquina desarmada en el rancho?</h4>
              <p className="text-xs text-gray-600">Escríbenos por WhatsApp con una foto de la pieza que necesitas y te enviamos cotización inmediata.</p>
            </div>

            <a
              href="https://wa.me/526688123456?text=Hola,%20necesito%20cotizar%20una%20refacci%C3%B3n%20para%20mi%20tractor"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95 shrink-0"
            >
              <PhoneCall size={15} />
              <span>Chatear por WhatsApp</span>
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: FAQs */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Preguntas Frecuentes</h3>
                <p className="text-xs text-gray-500">Respuestas a las dudas más comunes de nuestros clientes.</p>
              </div>

              <div className="space-y-2.5">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-2xl overflow-hidden transition-all bg-white"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full p-3.5 text-left text-xs font-bold text-gray-800 flex items-center justify-between gap-2 hover:bg-gray-50"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown size={16} className={`transition-transform shrink-0 ${isOpen ? 'rotate-180 text-emerald-700' : 'text-gray-400'}`} />
                      </button>
                      {isOpen && (
                        <div className="p-3.5 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/50">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Ticket Form */}
            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-200 space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Enviar Solicitud o Cotización Especial</h3>
                <p className="text-xs text-gray-500">Te responderemos en menos de 2 horas hábiles.</p>
              </div>

              {sentSuccess ? (
                <div className="p-6 bg-white rounded-2xl border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-gray-900">¡Mensaje Enviado con Éxito!</h4>
                  <p className="text-xs text-gray-500">
                    Un asesor técnico de Farmer Parts se pondrá en contacto al correo o teléfono proporcionado.
                  </p>
                  <button
                    onClick={() => setSentSuccess(false)}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Enviar otra consulta
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Tu nombre o rancho"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        placeholder="correo@rancho.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        placeholder="(668) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Modelo de Tractor y Año</label>
                    <input
                      type="text"
                      placeholder="Ej. John Deere 6403 modelo 2012"
                      value={tractorModel}
                      onChange={(e) => setTractorModel(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">¿Qué refacción estás buscando? *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Describe la pieza, falla del tractor o número de parte que necesitas..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <Send size={14} />
                    <span>{isSubmitting ? 'Enviando...' : 'Enviar Consulta a Taller'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
