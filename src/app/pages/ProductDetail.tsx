import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { Star, Clock, Shield, Camera, Heart, ShoppingCart, ChevronLeft, Check } from 'lucide-react';
import { getProducts } from '../data/products';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { useCmsContent } from '../cms/useCmsContent';

export function ProductDetail() {
  const cmsContent = useCmsContent();
  const products = getProducts(cmsContent);
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState(product?.sizes[1]?.value || product?.sizes[0]?.value || 'M');
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen pt-60 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-light italic mb-4" style={{ fontFamily: 'var(--font-script)' }}>
            Товар не найден
          </h1>
          <Link to="/catalog" className="text-primary hover:underline">
            Вернуться в каталог
          </Link>
        </div>
      </div>
    );
  }

  const selectedSizeData = product.sizes.find((s) => s.value === selectedSize);
  const currentPrice = selectedSizeData?.price || product.price;
  const relatedProducts = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/catalog" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Назад в каталог
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="sticky top-32">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                {product.oldPrice && (
                  <div className="absolute top-6 left-6 bg-red-500 text-white px-4 py-2 rounded-full">
                    -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6" style={{ fontFamily: 'var(--font-sans)' }}>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{product.rating}</span>
                <span className="text-gray-500">({product.reviewsCount} отзывов)</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{product.category}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-light italic" style={{ fontFamily: 'var(--font-script)' }}>{product.name}</h1>
            <p className="text-gray-600 text-lg">{product.description}</p>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-medium mb-3">Состав букета:</h3>
              <ul className="space-y-2">
                {product.composition.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-600">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-3">Размер букета:</h3>
              <div className="grid grid-cols-3 gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setSelectedSize(size.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${selectedSize === size.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="font-medium">{size.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{size.price.toLocaleString('ru-RU')} ₽</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-baseline gap-3 pt-4 border-t border-gray-200">
              <span className="text-4xl font-medium">{currentPrice.toLocaleString('ru-RU')} ₽</span>
              {product.oldPrice && selectedSize === 'M' && (
                <span className="text-xl text-gray-400 line-through">{product.oldPrice.toLocaleString('ru-RU')} ₽</span>
              )}
            </div>

            <div className="flex gap-4">
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddToCart} className="flex-1 px-8 py-4 bg-primary text-white rounded-full hover:bg-opacity-90 transition-all flex items-center justify-center gap-2">
                {added ? (
                  <><Check className="w-5 h-5" />Добавлено</>
                ) : (
                  <><ShoppingCart className="w-5 h-5" />В корзину</>
                )}
              </motion.button>
              <button className="p-4 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors" aria-label="Добавить в избранное">
                <Heart className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-primary/5 rounded-xl p-6 space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Доставка за {product.deliveryTime}</div>
                  <div className="text-sm text-gray-600">Быстро и бережно доставим ваш заказ</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Camera className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Фото перед отправкой</div>
                  <div className="text-sm text-gray-600">Покажем готовый букет перед доставкой</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Гарантия свежести</div>
                  <div className="text-sm text-gray-600">Заменим букет, если что-то не так</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-4xl font-light italic mb-8" style={{ fontFamily: 'var(--font-script)' }}>Похожие товары</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((related) => <ProductCard key={related.id} product={related} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}


