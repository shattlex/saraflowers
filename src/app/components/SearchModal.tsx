import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search } from 'lucide-react';
import { Link } from 'react-router';
import { getProducts } from '../data/products';
import { useCmsContent } from '../cms/useCmsContent';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const cmsContent = useCmsContent();
  const products = getProducts(cmsContent);
  const [query, setQuery] = useState('');

  const filteredProducts = query.length > 0
    ? products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Найти букет..."
                    className="flex-1 text-lg outline-none"
                    autoFocus
                    style={{ fontFamily: 'var(--font-sans)' }}
                  />
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Закрыть поиск">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {query.length > 0 && (
                <div className="max-h-96 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    <div className="p-4 space-y-2">
                      {filteredProducts.slice(0, 6).map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.id}`}
                          onClick={onClose}
                          className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate" style={{ fontFamily: 'var(--font-sans)' }}>
                              {product.name}
                            </h4>
                            <p className="text-sm text-gray-500">{product.category}</p>
                          </div>
                          <span className="font-medium" style={{ fontFamily: 'var(--font-sans)' }}>
                            {product.price.toLocaleString('ru-RU')} ₽
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500" style={{ fontFamily: 'var(--font-sans)' }}>
                      Ничего не найдено
                    </div>
                  )}
                </div>
              )}

              {query.length === 0 && (
                <div className="p-8">
                  <h4 className="font-medium mb-4" style={{ fontFamily: 'var(--font-sans)' }}>
                    Популярные запросы
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['Розы', 'Пионы', '101 роза', 'Сборные букеты', 'Тюльпаны'].map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                        style={{ fontFamily: 'var(--font-sans)' }}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
