import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Check, 
  Star, 
  Truck, 
  ShieldCheck, 
  Wrench, 
  MapPin, 
  Copy, 
  ThumbsUp, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { Product, Review } from '../../types';
import { useStore } from './StoreContext';
import { SAMPLE_REVIEWS } from './storeSampleData';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onOpenCheckoutDirect?: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onOpenCheckoutDirect
}) => {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [copiedPartNumber, setCopiedPartNumber] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>(SAMPLE_REVIEWS[product.pieceNumber] || []);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Listen to Firestore reviews for this product
  useEffect(() => {
    const q = query(collection(db, 'reviews'), where('productId', '==', product.pieceNumber));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        // Merge with samples
        const merged = [...(SAMPLE_REVIEWS[product.pieceNumber] || [])];
        firestoreReviews.forEach(fr => {
          if (!merged.some(m => m.id === fr.id)) {
            merged.unshift(fr);
          }
        });
        setReviews(merged);
      }
    }, (err) => {
      console.warn('Reviews snapshot error:', err);
    });
    return () => unsub();
  }, [product.pieceNumber]);

  const handleCopyPartNumber = () => {
    navigator.clipboard.writeText(product.pieceNumber);
    setCopiedPartNumber(true);
    toast.success('Número de parte copiado al portapapeles');
    setTimeout(() => setCopiedPartNumber(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${product.pieceNumber} - ${product.description}`,
        text: `Consulta esta refacción en Farmer Parts: ${product.description}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace de producto copiado');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) {
      toast.error('Completa tu nombre y comentario');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const newReview: Review = {
        productId: product.pieceNumber,
        customerName: reviewName.trim(),
        customerEmail: reviewEmail.trim() || 'cliente@farmerparts.mx',
        rating: reviewRating,
        comment: reviewComment.trim(),
        status: 'APPROVED',
        helpfulVotes: 1,
        verifiedPurchase: true,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'reviews'), newReview);
      setReviews(prev => [newReview, ...prev]);
      setShowReviewForm(false);
      setReviewComment('');
      setReviewName('');
      toast.success('¡Gracias por tu opinión!', {
        description: 'Tu reseña fue publicada con éxito.'
      });
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error('No se pudo guardar la reseña');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const inStock = product.stock > 0;
  const isWish = isWishlisted(product.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Bar */}
        <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              SKU: {product.pieceNumber}
            </span>
            <span className="text-xs text-gray-500 font-semibold">• {product.brand}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              title="Compartir"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 sm:p-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Image Preview Column */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-200/80 group">
                <img
                  src={product.imageUrl || 'https://picsum.photos/seed/part/600/600'}
                  alt={product.description}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className="bg-emerald-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs shadow-sm">
                    {product.brand}
                  </span>
                  {product.category && (
                    <span className="bg-white/90 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm border border-gray-100">
                      {product.category}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-xs transition-all shadow-md ${
                    isWish 
                      ? 'bg-rose-50 text-rose-600' 
                      : 'bg-white/80 text-gray-600 hover:bg-white hover:text-rose-600'
                  }`}
                >
                  <Heart size={20} className={isWish ? 'fill-rose-500' : ''} />
                </button>
              </div>

              {/* Value propositions */}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <Truck size={16} className="text-emerald-700 shrink-0" />
                  <span className="text-[11px] font-medium leading-tight">Envío seguro por FedEx / Estafeta</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
                  <span className="text-[11px] font-medium leading-tight">Garantía de compatibilidad OEM</span>
                </div>
              </div>
            </div>

            {/* Product Details & Actions Column */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                {/* Rating header */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} className="fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-800">{avgRating}</span>
                  <span className="text-xs text-gray-400">({reviews.length} opiniones de agricultores)</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-snug">
                  {product.description}
                </h1>

                {/* Part number copy pill */}
                <div className="flex items-center gap-2 mt-3">
                  <div 
                    onClick={handleCopyPartNumber}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg cursor-pointer transition-colors text-xs font-mono font-bold"
                  >
                    <span>No. Parte: {product.pieceNumber}</span>
                    {copiedPartNumber ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} className="text-gray-400" />}
                  </div>
                  {product.barcode && (
                    <span className="text-xs text-gray-400 font-mono">Cód: {product.barcode}</span>
                  )}
                </div>

                {/* Price Display */}
                <div className="mt-4 p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-950">
                      ${product.salePrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-emerald-800 font-bold ml-1.5">MXN</span>
                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">IVA incluido • Facturamos tu compra</p>
                  </div>

                  {/* Stock status badge */}
                  <div className="text-right">
                    {inStock ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        {product.stock} pzas en stock
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        Agotado
                      </span>
                    )}
                    {product.location && (
                      <p className="text-[10px] text-gray-500 flex items-center justify-end gap-1 mt-1">
                        <MapPin size={11} />
                        Ubicación: {product.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Compatibility Specs */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs space-y-1.5 border border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Modelos compatibles:</span>
                    <span className="font-bold text-gray-900">{product.model || 'Universal'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Categoría del tractor:</span>
                    <span className="font-bold text-gray-900">{product.category || 'General'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Tiempo de despacho:</span>
                    <span className="font-bold text-emerald-800">{product.leadTime ? `${product.leadTime} días hábiles` : 'Inmediato (Mismo día)'}</span>
                  </div>
                </div>
              </div>

              {/* Purchase Controls */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl bg-gray-50 p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-white shadow-xs text-gray-700 font-bold hover:bg-gray-100 transition-colors flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-extrabold text-gray-900 text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="w-8 h-8 rounded-lg bg-white shadow-xs text-gray-700 font-bold hover:bg-gray-100 transition-colors flex items-center justify-center disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(product, quantity);
                      onClose();
                    }}
                    disabled={!inStock}
                    className="flex-1 py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <ShoppingCart size={18} />
                    <span>Agregar al Carrito</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs: Details vs Reviews */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'details'
                    ? 'border-emerald-700 text-emerald-800'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                <Wrench size={14} />
                <span>Especificaciones Técnicas</span>
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'reviews'
                    ? 'border-emerald-700 text-emerald-800'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                <MessageSquare size={14} />
                <span>Opiniones y Calificaciones ({reviews.length})</span>
              </button>
            </div>

            <div className="py-4">
              {activeTab === 'details' ? (
                <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
                  <p>
                    Refacción agrícola de grado profesional fabricada bajo estrictos estándares de calidad ISO/TS 16949 para maquinaria pesada en campo. Diseñada para soportar jornadas extenuantes de labranza, rastreo, siembra y cosecha en condiciones climáticas adversas.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div>
                      <span className="font-semibold text-gray-900 block">Número de Parte Original (OEM):</span>
                      <span className="font-mono text-emerald-800">{product.pieceNumber}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 block">Marca de Tractor:</span>
                      <span>{product.brand}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 block">Compatibilidad de Motor/Chasis:</span>
                      <span>{product.model || 'Universal / Multi-aplicación'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 block">Garantía de Fábrica:</span>
                      <span>12 meses contra defectos de manufactura</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Review Form Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">¿Compraste esta pieza para tu tractor?</h4>
                      <p className="text-[11px] text-gray-500">Comparte tu experiencia para ayudar a otros productores agrícolas.</p>
                    </div>
                    <button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      {showReviewForm ? 'Cancelar' : 'Calificar Refacción'}
                    </button>
                  </div>

                  {/* Form */}
                  {showReviewForm && (
                    <form onSubmit={handleSubmitReview} className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">Nombre o Rancho *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Taller Los Pinos / Don Juan"
                            value={reviewName}
                            onChange={(e) => setReviewName(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">Correo electrónico</label>
                          <input
                            type="email"
                            placeholder="contacto@rancho.com"
                            value={reviewEmail}
                            onChange={(e) => setReviewEmail(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Calificación</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setReviewRating(star)}
                              className="p-1 text-amber-400 hover:scale-110 transition-transform"
                            >
                              <Star size={20} className={star <= reviewRating ? 'fill-amber-400' : 'text-gray-300'} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Comentario sobre el funcionamiento *</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Menciona cómo funcionó la instalación, rendimiento en campo, etc."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                        >
                          {isSubmittingReview ? 'Enviando...' : 'Publicar Reseña'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Reviews List */}
                  <div className="space-y-3">
                    {reviews.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">Aún no hay reseñas para esta pieza. ¡Sé el primero en calificarla!</p>
                    ) : (
                      reviews.map((rev, idx) => (
                        <div key={idx} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-gray-900">{rev.customerName}</span>
                              {rev.verifiedPurchase && (
                                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                                  Compra Verificada
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={12}
                                className={s <= rev.rating ? 'fill-amber-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>

                          <p className="text-xs text-gray-700 leading-snug">{rev.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
