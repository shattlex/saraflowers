import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router';
import { findCmsPage, parsePriceToNumber, resolveCmsImage, type CmsBlock } from '../cms/content';
import { useCmsContent } from '../cms/useCmsContent';

interface Flower {
  id: string;
  name: string;
  price: number;
  image: string;
  color: string;
}

interface SelectedFlower extends Flower {
  quantity: number;
}

const fallbackFlowers: Flower[] = [
  { id: '1', name: 'Роза красная', price: 350, image: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=700', color: 'red' },
  { id: '2', name: 'Роза белая', price: 320, image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=700', color: 'white' },
  { id: '3', name: 'Роза розовая', price: 330, image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700', color: 'pink' },
  { id: '4', name: 'Пион розовый', price: 450, image: 'https://images.unsplash.com/photo-1773169206110-103f891dda08?w=700', color: 'pink' },
  { id: '5', name: 'Тюльпан красный', price: 180, image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=700', color: 'red' },
  { id: '6', name: 'Тюльпан желтый', price: 180, image: 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=700', color: 'yellow' },
  { id: '7', name: 'Орхидея', price: 800, image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=700', color: 'white' },
  { id: '8', name: 'Подсолнух', price: 280, image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=700', color: 'yellow' },
  { id: '9', name: 'Гортензия голубая', price: 520, image: 'https://images.unsplash.com/photo-1596438459194-f275f413d6ff?w=700', color: 'blue' }
];

const colorOptions = [
  { value: 'all', label: 'Все цвета', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { value: 'red', label: 'Красные', color: '#ef4444' },
  { value: 'pink', label: 'Розовые', color: '#ec4899' },
  { value: 'white', label: 'Белые', color: '#ffffff' },
  { value: 'yellow', label: 'Желтые', color: '#fbbf24' },
  { value: 'blue', label: 'Голубые', color: '#60a5fa' }
];

function getSectionTitle(blocks: CmsBlock[]): string {
  const block = blocks.find((item) => item.type === 'sectionTitle');
  if (typeof block?.text === 'string' && block.text.trim()) return block.text;
  return 'Конструктор букетов';
}

function getSubtitle(blocks: CmsBlock[]): string {
  const block = blocks.find(
    (item) => item.type === 'text' && typeof item.title === 'string' && item.title.trim().toLowerCase() === 'subtitle'
  );
  if (typeof block?.body === 'string' && block.body.trim()) return block.body;
  return 'Создайте уникальный букет из любимых цветов';
}

function getFlowersFromCms(blocks: CmsBlock[], resolveImage: (value: unknown) => string): Flower[] {
  const flowersBlock = blocks.find(
    (item) =>
      item.type === 'products' &&
      typeof item.title === 'string' &&
      item.title.trim().toLowerCase() === 'flowers'
  );

  if (!flowersBlock || !Array.isArray(flowersBlock.items)) return [];

  return flowersBlock.items
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;

      const name = typeof record.name === 'string' ? record.name.trim() : '';
      if (!name) return null;

      const priceSource = typeof record.price === 'number' || typeof record.price === 'string' ? record.price : undefined;
      const price = parsePriceToNumber(priceSource);
      const image = resolveImage(record.image);
      const rawColor = typeof record.meta === 'string' ? record.meta.trim().toLowerCase() : '';
      const color = rawColor || 'all';

      return {
        id: typeof record.id === 'string' && record.id ? record.id : `flower-${index + 1}`,
        name,
        price: price > 0 ? price : 100,
        image: image || fallbackFlowers[0].image,
        color
      } satisfies Flower;
    })
    .filter((item): item is Flower => item !== null);
}

export function BouquetBuilder() {
  const cmsContent = useCmsContent();
  const cmsPage = findCmsPage(cmsContent, 'bouquet-builder');
  const blocks = cmsPage?.blocks ?? [];
  const cmsFlowers = getFlowersFromCms(blocks, (value) => resolveCmsImage(cmsContent, value));

  const flowers = cmsFlowers.length > 0 ? cmsFlowers : fallbackFlowers;
  const pageTitle = getSectionTitle(blocks);
  const pageSubtitle = getSubtitle(blocks);

  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [selectedFlowers, setSelectedFlowers] = useState<SelectedFlower[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [bouquetName, setBouquetName] = useState('');

  const filteredFlowers = selectedColor === 'all' ? flowers : flowers.filter((f) => f.color === selectedColor);

  const addFlower = (flower: Flower) => {
    const existing = selectedFlowers.find((f) => f.id === flower.id);
    if (existing) {
      setSelectedFlowers(selectedFlowers.map((f) => (f.id === flower.id ? { ...f, quantity: f.quantity + 1 } : f)));
      return;
    }
    setSelectedFlowers([...selectedFlowers, { ...flower, quantity: 1 }]);
  };

  const removeFlower = (flowerId: string) => {
    setSelectedFlowers(selectedFlowers.filter((f) => f.id !== flowerId));
  };

  const updateQuantity = (flowerId: string, delta: number) => {
    setSelectedFlowers(selectedFlowers.map((f) => (f.id === flowerId ? { ...f, quantity: Math.max(1, f.quantity + delta) } : f)));
  };

  const getTotalPrice = () => selectedFlowers.reduce((sum, f) => sum + f.price * f.quantity, 0);
  const getTotalFlowers = () => selectedFlowers.reduce((sum, f) => sum + f.quantity, 0);

  const handleAddToCart = () => {
    if (selectedFlowers.length === 0) {
      alert('Выберите цветы для букета');
      return;
    }

    const customBouquet = {
      id: `custom-${Date.now()}`,
      name: bouquetName || `Авторский букет из ${getTotalFlowers()} цветов`,
      price: getTotalPrice(),
      image: selectedFlowers[0]?.image || '',
      category: 'Конструктор',
      rating: 5,
      reviewsCount: 0,
      deliveryTime: '60 минут',
      description: 'Авторский букет, собранный вами в конструкторе.',
      composition: selectedFlowers.map((f) => `${f.name} - ${f.quantity} шт`),
      sizes: [{ value: 'custom', label: 'Индивидуальный', price: getTotalPrice() }]
    };

    addToCart(customBouquet, 'custom');
    alert('Букет добавлен в корзину!');
    navigate('/cart');
  };

  return (
    <div className="min-h-screen pt-60 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-light italic mb-4" style={{ fontFamily: 'var(--font-script)' }}>{pageTitle}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-sans)' }}>
            {pageSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`px-4 py-2 rounded-full transition-all ${
                      selectedColor === color.value
                        ? 'bg-primary text-white shadow-lg scale-105'
                        : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200'
                    }`}
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-gray-300" style={{ background: color.value === 'all' ? color.color : color.color === '#ffffff' ? '#ffffff' : color.color }} />
                      {color.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredFlowers.map((flower) => (
                <motion.div
                  key={flower.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow group cursor-pointer"
                  onClick={() => addFlower(flower)}
                >
                  <div className="aspect-square overflow-hidden">
                    <img src={flower.image} alt={flower.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-sans)' }}>{flower.name}</h3>
                    <p className="text-primary font-medium" style={{ fontFamily: 'var(--font-sans)' }}>{flower.price} ₽</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-200 sticky top-32">
              <h2 className="text-2xl font-light italic mb-6" style={{ fontFamily: 'var(--font-script)' }}>Ваш букет</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'var(--font-sans)' }}>Название букета (опционально)</label>
                <input type="text" value={bouquetName} onChange={(e) => setBouquetName(e.target.value)} placeholder="Мой авторский букет" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary transition-colors" style={{ fontFamily: 'var(--font-sans)' }} />
              </div>

              <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                <AnimatePresence>
                  {selectedFlowers.map((flower) => (
                    <motion.div key={flower.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <img src={flower.image} alt={flower.name} className="w-12 h-12 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ fontFamily: 'var(--font-sans)' }}>{flower.name}</p>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-sans)' }}>{flower.price} ₽</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateQuantity(flower.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-full border border-gray-200 hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm font-medium w-6 text-center" style={{ fontFamily: 'var(--font-sans)' }}>{flower.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(flower.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-full border border-gray-200 hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                        <button type="button" onClick={() => removeFlower(flower.id)} className="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {selectedFlowers.length === 0 && (
                  <div className="text-center py-8 text-gray-500" style={{ fontFamily: 'var(--font-sans)' }}>Выберите цветы для букета</div>
                )}
              </div>

              {selectedFlowers.length > 0 && (
                <div className="border-t border-gray-200 pt-6 space-y-3">
                  <div className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
                    <span className="text-gray-600">Количество цветов:</span>
                    <span className="font-medium">{getTotalFlowers()} шт</span>
                  </div>
                  <div className="flex justify-between text-lg" style={{ fontFamily: 'var(--font-sans)' }}>
                    <span className="font-medium">Итого:</span>
                    <span className="font-medium text-primary">{getTotalPrice()} ₽</span>
                  </div>

                  <button onClick={handleAddToCart} className="w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-4" style={{ fontFamily: 'var(--font-sans)' }}>
                    <ShoppingCart className="w-5 h-5" />
                    Добавить в корзину
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


