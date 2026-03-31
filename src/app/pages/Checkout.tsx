import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Wallet, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link, useSearchParams } from 'react-router';
import { createPayment } from '../api/client';

export function Checkout() {
  const { items, total, clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: 'card',
    comment: ''
  });

  const isPaymentSuccess = searchParams.get('payment') === 'success';
  const successOrderId = searchParams.get('orderId');

  useEffect(() => {
    if (!isPaymentSuccess) return;
    setOrderPlaced(true);
    clearCart();
  }, [clearCart, isPaymentSuccess]);

  const orderNumber = useMemo(() => {
    if (successOrderId) return successOrderId;
    return `SF${Math.floor(Math.random() * 10000)}`;
  }, [successOrderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (formData.paymentMethod === 'cash') {
      setOrderPlaced(true);
      setTimeout(() => {
        clearCart();
      }, 1200);
      return;
    }

    try {
      setIsSubmitting(true);
      const payment = await createPayment({
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address
        },
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total,
        orderComment: formData.comment
      });

      if (!payment.confirmationUrl) {
        throw new Error('Сервис оплаты не вернул ссылку на подтверждение.');
      }

      window.location.href = payment.confirmationUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось создать платеж.';
      alert(`Ошибка оплаты: ${message}`);
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen pt-60 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-light italic mb-4" style={{ fontFamily: 'var(--font-script)' }}>
            Корзина пуста
          </h2>
          <Link to="/catalog" className="text-primary hover:underline">
            Вернуться в каталог
          </Link>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen pt-60 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white rounded-2xl p-12 border border-gray-200"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-4xl font-light italic mb-4" style={{ fontFamily: 'var(--font-script)' }}>
              Заказ оформлен
            </h2>
            <p className="text-gray-600 mb-2" style={{ fontFamily: 'var(--font-sans)' }}>
              Номер заказа: <span className="font-medium">#{orderNumber}</span>
            </p>
            <p className="text-gray-600 mb-8" style={{ fontFamily: 'var(--font-sans)' }}>
              Менеджер свяжется с вами в ближайшее время для подтверждения деталей.
            </p>
            <Link
              to="/"
              className="inline-block px-8 py-4 bg-primary text-white rounded-full hover:bg-opacity-90 transition-all"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              На главную
            </Link>
          </motion.div>
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
          Оформление заказа
        </motion.h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-gray-200 space-y-4">
              <h3 className="font-medium text-xl mb-2">Контактные данные</h3>

              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                placeholder="Ваше имя"
              />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                placeholder="+7 (999) 123-45-67"
              />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                placeholder="email@example.com"
              />
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                placeholder="Адрес доставки"
              />

              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary resize-none"
                rows={3}
                placeholder="Комментарий к заказу"
              />

              <h3 className="font-medium text-xl mb-2 pt-2">Способ оплаты</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: 'card' })}
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${
                    formData.paymentMethod === 'card'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  Карта онлайн (YooKassa)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${
                    formData.paymentMethod === 'cash'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                  Наличными курьеру
                </button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 sticky top-32">
                <h3 className="font-medium text-xl mb-6">Ваш заказ</h3>
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.selectedSize}`} className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{item.name}</h4>
                        <p className="text-xs text-gray-500">
                          {item.sizes.find((s) => s.value === item.selectedSize)?.label} × {item.quantity}
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3 mb-5">
                  <div className="flex justify-between text-gray-600">
                    <span>Товары</span>
                    <span>{total.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Доставка</span>
                    <span className="text-green-600">Бесплатно</span>
                  </div>
                  <div className="flex justify-between text-xl font-medium pt-3 border-t border-gray-200">
                    <span>К оплате</span>
                    <span>{total.toLocaleString('ru-RU')} ₽</span>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full px-8 py-4 bg-primary text-white rounded-full hover:bg-opacity-90 disabled:opacity-70 disabled:cursor-not-allowed transition-all">
                  {isSubmitting ? 'Переходим к оплате...' : 'Подтвердить заказ'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


