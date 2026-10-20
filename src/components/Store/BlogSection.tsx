import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  Share2, 
  ArrowRight,
  Wrench,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { BlogPost } from '../../types';
import { SAMPLE_BLOG_POSTS } from './storeSampleData';
import { toast } from 'sonner';

interface BlogSectionProps {
  onClose: () => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({ onClose }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const handleShare = (post: BlogPost) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace de la guía técnica copiado');
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
              <BookOpen size={17} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight">Guías Técnicas y Blog Agrícola</h2>
              <p className="text-[11px] text-emerald-300">Consejos de mecánica, calibración y mantenimiento de tractores</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1">
          {selectedPost ? (
            /* Detailed Post View */
            <div className="space-y-6 max-w-2xl mx-auto">
              <button
                onClick={() => setSelectedPost(null)}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                ← Volver a todas las guías
              </button>

              <div className="aspect-16/9 rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={selectedPost.coverImage}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {selectedPost.category}
                </span>

                <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-2 leading-snug">
                  {selectedPost.title}
                </h1>

                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 pb-4 border-b border-gray-100">
                  <span className="flex items-center gap-1 font-medium">
                    <User size={13} /> {selectedPost.author}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> Lectura de {selectedPost.readTime}
                  </span>
                </div>
              </div>

              {/* Formatted Content */}
              <div className="prose prose-sm text-gray-700 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                {selectedPost.content}
              </div>

              {/* Tags and Share */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {selectedPost.tags.map(t => (
                    <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-mono">
                      #{t}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleShare(selectedPost)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Share2 size={13} />
                  <span>Compartir Guía</span>
                </button>
              </div>
            </div>
          ) : (
            /* Post Grid */
            <div className="space-y-6">
              <div className="text-center max-w-lg mx-auto space-y-1">
                <h3 className="text-lg font-black text-gray-900">Aprende a Reparar y Optimizar tu Maquinaria</h3>
                <p className="text-xs text-gray-500">
                  Artículos preparados por ingenieros y mecánicos agrícolas de Farmer Parts México.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {SAMPLE_BLOG_POSTS.map(post => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-600/50 transition-all flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="aspect-16/10 bg-gray-100 overflow-hidden">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="p-4 space-y-2">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">
                          {post.category}
                        </span>

                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-emerald-800 transition-colors">
                          {post.title}
                        </h4>

                        <p className="text-[11px] text-gray-500 line-clamp-3 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                        <span>{post.readTime}</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Leer guía <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
