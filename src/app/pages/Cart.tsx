import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Minus, Plus, Trash2, ShoppingBag, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function Cart() {
  const { items, removeFromCart, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-60 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-6" />
              <h2 className="text-3xl font-light italic mb-4" style={{ fontFamily: 'var(--font-script)' }}>
                Корзина пуста
              </h2>
              <p className="text-gray-600 mb-8" style={{ fontFamily: 'var(--font-sans)' }}>
                Добавьте товары из каталога, чтобы продолжить оформление заказа.
              </p>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-full hover:bg-opacity-90 transition-all"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Перейти в каталог
                <ChevronRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-60 pb-20" style={{ fontFamily: 'var(--font-sans)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-light italic mb-12"
          style={{ fontFamily: 'var(--font-script)' }}
        >
          Корзина
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={`${item.id}-${item.selectedSize}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-200 flex gap-6"
              >
                <Link to={`/product/${item.id}`} className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </Link>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <Link to={`/product/${item.id}`}>
                      <h3 className="font-medium mb-1 hover:text-primary transition-colors">{item.name}</h3>
                    </Link>
                    <p className="text-sm text-gray-500 mb-3">
                      Размер: {item.sizes.find((s) => s.value === item.selectedSize)?.label}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity - 1)}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        aria-label="Уменьшить количество"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity + 1)}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        aria-label="Увеличить количество"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xl font-medium">
                        {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id, item.selectedSize)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Удалить товар"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 sticky top-32">
              <h3 className="font-medium text-xl mb-6">Итого</h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Товары ({items.reduce((sum, item) => sum + item.quantity, 0)})</span>
                  <span>{total.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Доставка</span>
                  <span className="text-green-600">Бесплатно</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between text-xl font-medium">
                  <span>К оплате</span>
                  <span>{total.toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="w-full px-8 py-4 bg-primary text-white rounded-full hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Оформить заказ
                <ChevronRight className="w-5 h-5" />
              </Link>

              <div className="mt-6 space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Доставка за 60 минут</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Фото перед отправкой</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Гарантия свежести</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


