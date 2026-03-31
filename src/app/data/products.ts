import { CmsContent, findCmsPage, loadCmsContent, parsePriceToNumber, resolveCmsImage } from '../cms/content';

export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  color?: string[];
  rating: number;
  reviewsCount: number;
  deliveryTime: string;
  description: string;
  composition: string[];
  sizes: { value: string; label: string; price: number }[];
}

const baseProducts: Product[] = [
  {
    id: '1',
    name: 'Букет "Нежность пионов"',
    price: 7500,
    oldPrice: 9000,
    image: 'https://images.unsplash.com/photo-1773169206110-103f891dda08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'Пионы',
    color: ['Розовый'],
    rating: 4.9,
    reviewsCount: 127,
    deliveryTime: '60 минут',
    description: 'Объемный букет из пионов в нежных оттенках с фирменной упаковкой.',
    composition: ['Пионы — 15 шт', 'Эвкалипт', 'Лента'],
    sizes: [
      { value: 'S', label: 'Малый', price: 5500 },
      { value: 'M', label: 'Средний', price: 7500 },
      { value: 'L', label: 'Большой', price: 12000 }
    ]
  },
  {
    id: '2',
    name: 'Букет "Классические розы"',
    price: 4900,
    image: 'https://images.unsplash.com/photo-1758827644723-f0acdb36bd85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'Розы',
    color: ['Красный'],
    rating: 5,
    reviewsCount: 243,
    deliveryTime: '45 минут',
    description: 'Классическая композиция из свежих красных роз.',
    composition: ['Розы — 25 шт', 'Оформление', 'Лента'],
    sizes: [
      { value: 'S', label: '11 роз', price: 2900 },
      { value: 'M', label: '25 роз', price: 4900 },
      { value: 'L', label: '51 роза', price: 8900 }
    ]
  },
  {
    id: '3',
    name: 'Букет "Белоснежный"',
    price: 6200,
    image: 'https://images.unsplash.com/photo-1766734867043-92b9b2f25ffa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'Розы',
    color: ['Белый'],
    rating: 4.8,
    reviewsCount: 156,
    deliveryTime: '60 минут',
    description: 'Элегантный букет белых роз для любого повода.',
    composition: ['Белые розы — 21 шт', 'Эвкалипт', 'Фирменная упаковка'],
    sizes: [
      { value: 'S', label: '11 роз', price: 3500 },
      { value: 'M', label: '21 роза', price: 6200 },
      { value: 'L', label: '35 роз', price: 9800 }
    ]
  },
  {
    id: '4',
    name: 'Букет "Весенние тюльпаны"',
    price: 3900,
    image: 'https://images.unsplash.com/photo-1580403071102-c23c5267d060?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'Тюльпаны',
    color: ['Розовый'],
    rating: 4.7,
    reviewsCount: 98,
    deliveryTime: '45 минут',
    description: 'Яркий весенний букет тюльпанов в минималистичной упаковке.',
    composition: ['Тюльпаны — 35 шт', 'Лента', 'Крафт-бумага'],
    sizes: [
      { value: 'S', label: '15 шт', price: 2200 },
      { value: 'M', label: '35 шт', price: 3900 },
      { value: 'L', label: '51 шт', price: 5900 }
    ]
  },
  {
    id: '5',
    name: 'Букет "Орхидеи премиум"',
    price: 8900,
    oldPrice: 11000,
    image: 'https://images.unsplash.com/photo-1768368052646-a6185df478c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'Орхидеи',
    color: ['Белый'],
    rating: 5,
    reviewsCount: 87,
    deliveryTime: '90 минут',
    description: 'Премиальная композиция из орхидей для торжественных событий.',
    composition: ['Орхидеи — 5 веток', 'Декор', 'Фирменная коробка'],
    sizes: [
      { value: 'S', label: '3 ветки', price: 6500 },
      { value: 'M', label: '5 веток', price: 8900 },
      { value: 'L', label: '7 веток', price: 12900 }
    ]
  },
  {
    id: '6',
    name: 'Букет "Солнечный"',
    price: 4200,
    image: 'https://images.unsplash.com/photo-1752765579971-b9949096c5d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'Подсолнухи',
    color: ['Желтый'],
    rating: 4.9,
    reviewsCount: 134,
    deliveryTime: '45 минут',
    description: 'Теплый и яркий букет подсолнухов для поднятия настроения.',
    composition: ['Подсолнухи — 11 шт', 'Зелень', 'Лента'],
    sizes: [
      { value: 'S', label: '5 шт', price: 2500 },
      { value: 'M', label: '11 шт', price: 4200 },
      { value: 'L', label: '15 шт', price: 6200 }
    ]
  },
  {
    id: '7',
    name: 'Букет "Голубая гортензия"',
    price: 5800,
    image: 'https://images.unsplash.com/photo-1629379555555-79c361b3736b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'Гортензии',
    color: ['Голубой'],
    rating: 4.8,
    reviewsCount: 76,
    deliveryTime: '60 минут',
    description: 'Нежная композиция из голубой гортензии с аккуратной упаковкой.',
    composition: ['Гортензия — 5 шт', 'Зелень', 'Лента'],
    sizes: [
      { value: 'S', label: '3 шт', price: 4200 },
      { value: 'M', label: '5 шт', price: 5800 },
      { value: 'L', label: '7 шт', price: 7900 }
    ]
  },
  {
    id: '8',
    name: 'Букет "Микс радости"',
    price: 5500,
    oldPrice: 6800,
    image: 'https://images.unsplash.com/photo-1708604378427-a06673e5cc0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'Сборный букет',
    color: ['Розовый'],
    rating: 4.9,
    reviewsCount: 189,
    deliveryTime: '45 минут',
    description: 'Сборный букет из сезонных цветов с акцентом на свежесть.',
    composition: ['Розы — 7 шт', 'Тюльпаны — 5 шт', 'Хризантемы — 5 шт', 'Декор'],
    sizes: [
      { value: 'S', label: 'Малый', price: 3900 },
      { value: 'M', label: 'Средний', price: 5500 },
      { value: 'L', label: 'Большой', price: 8200 }
    ]
  }
];

function buildProductsFromCms(content: CmsContent): Product[] {
  const catalogPage = findCmsPage(content, 'catalog');
  if (!catalogPage) return [];

  const productsBlock = catalogPage.blocks.find((block) => block.type === 'products');
  if (!productsBlock || !Array.isArray(productsBlock.items)) return [];

  const baseByName = new Map(baseProducts.map((product) => [product.name.trim().toLowerCase(), product]));
  const colorMap: Record<string, string> = {
    red: 'Красный',
    pink: 'Розовый',
    white: 'Белый',
    yellow: 'Желтый',
    blue: 'Голубой',
    purple: 'Фиолетовый',
    orange: 'Оранжевый',
    green: 'Зеленый'
  };

  return productsBlock.items
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      if (!name) return null;

      const price =
        typeof item.price === 'string' || typeof item.price === 'number'
          ? parsePriceToNumber(item.price)
          : 0;
      const image = resolveCmsImage(content, typeof item.image === 'string' ? item.image : '');
      const baseMatch = baseByName.get(name.toLowerCase());
      const cmsCategory = typeof item.subtitle === 'string' ? item.subtitle.trim() : '';
      const cmsDescription = typeof item.description === 'string' ? item.description.trim() : '';
      const cmsMeta = typeof item.meta === 'string' ? item.meta.trim() : '';
      const mappedColors = cmsMeta
        ? cmsMeta
            .split(',')
            .map((raw) => raw.trim())
            .filter(Boolean)
            .map((value) => colorMap[value.toLowerCase()] ?? value)
        : [];

      return {
        id: typeof item.id === 'string' && item.id ? item.id : `cms-${index + 1}`,
        name,
        price: price || 1000,
        image: image || baseMatch?.image || '',
        category: cmsCategory || baseMatch?.category || 'Сборный букет',
        color: mappedColors.length > 0 ? mappedColors : baseMatch?.color ?? ['Розовый'],
        rating: 4.9,
        reviewsCount: 10 + index * 3,
        deliveryTime: '60 минут',
        description: cmsDescription || baseMatch?.description || `${name} доступен к заказу с быстрой доставкой и фото перед отправкой.`,
        composition: baseMatch?.composition ?? ['Состав уточняется у флориста'],
        sizes: [
          { value: 'S', label: 'Малый', price: Math.max(500, Math.round((price || 1000) * 0.75)) },
          { value: 'M', label: 'Средний', price: price || 1000 },
          { value: 'L', label: 'Большой', price: Math.max(1500, Math.round((price || 1000) * 1.45)) }
        ]
      } satisfies Product;
    })
    .filter((item): item is Product => item !== null);
}

export function getProducts(content?: CmsContent): Product[] {
  const cmsContent = content ?? loadCmsContent();
  const cmsProducts = buildProductsFromCms(cmsContent);
  if (cmsProducts.length === 0) return baseProducts;

  const usedNames = new Set(cmsProducts.map((product) => product.name.trim().toLowerCase()));
  const remainingBase = baseProducts.filter(
    (product) => !usedNames.has(product.name.trim().toLowerCase())
  );

  return [...cmsProducts, ...remainingBase];
}

export const products: Product[] = getProducts();

export const categories = [
  {
    id: 'roses',
    name: 'Розы',
    image: 'https://images.unsplash.com/photo-1758827644723-f0acdb36bd85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'
  },
  {
    id: 'peonies',
    name: 'Пионы',
    image: 'https://images.unsplash.com/photo-1773169206110-103f891dda08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'
  },
  {
    id: 'tulips',
    name: 'Тюльпаны',
    image: 'https://images.unsplash.com/photo-1580403071102-c23c5267d060?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'
  },
  {
    id: 'orchids',
    name: 'Орхидеи',
    image: 'https://images.unsplash.com/photo-1768368052646-a6185df478c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'
  },
  {
    id: 'mixed',
    name: 'Сборные букеты',
    image: 'https://images.unsplash.com/photo-1708604378427-a06673e5cc0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'
  },
  {
    id: 'sunflowers',
    name: 'Подсолнухи',
    image: 'https://images.unsplash.com/photo-1752765579971-b9949096c5d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'
  }
];
