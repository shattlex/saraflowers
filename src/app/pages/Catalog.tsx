import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { getProducts } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { findCmsPage } from '../cms/content';
import { useCmsContent } from '../cms/useCmsContent';

export function Catalog() {
  const cmsContent = useCmsContent();
  const cmsCatalog = findCmsPage(cmsContent, 'catalog');
  const products = getProducts(cmsContent);
  const cmsCatalogTitleBlock = cmsCatalog?.blocks.find((block) => block.type === 'sectionTitle');
  const pageTitle =
    typeof cmsCatalogTitleBlock?.text === 'string' && cmsCatalogTitleBlock.text.trim()
      ? cmsCatalogTitleBlock.text
      : 'Каталог букетов';

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 15000]);
  const [showFilters, setShowFilters] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['category', 'color', 'price']));

  const flowerCategories = [
    'Розы', 'Пионы', 'Тюльпаны', 'Гортензии', 'Орхидеи', 'Подсолнухи', 'Сборный букет',
    'Эустома', 'Лилии', 'Гвоздики', 'Ирисы', 'Хризантемы', 'Альстромерии', 'Ромашки', 'Герберы',
    'Лаванда', 'Ранункулюсы', 'Сезонные', 'Монобукеты', 'Композиции в коробке', 'Премиум'
  ];

  const colors = [
    { value: 'red', label: 'Красные', hex: '#ef4444', ruName: 'Красный' },
    { value: 'pink', label: 'Розовые', hex: '#ec4899', ruName: 'Розовый' },
    { value: 'white', label: 'Белые', hex: '#ffffff', ruName: 'Белый' },
    { value: 'yellow', label: 'Желтые', hex: '#fbbf24', ruName: 'Желтый' },
    { value: 'blue', label: 'Голубые', hex: '#60a5fa', ruName: 'Голубой' },
    { value: 'purple', label: 'Фиолетовые', hex: '#a855f7', ruName: 'Фиолетовый' },
    { value: 'orange', label: 'Оранжевые', hex: '#fb923c', ruName: 'Оранжевый' },
    { value: 'green', label: 'Зеленые', hex: '#4ade80', ruName: 'Зеленый' }
  ];

  const priceRanges = [
    { label: 'До 2000 ₽', range: [0, 2000] as [number, number] },
    { label: '2000-4000 ₽', range: [2000, 4000] as [number, number] },
    { label: '4000-6000 ₽', range: [4000, 6000] as [number, number] },
    { label: '6000-9000 ₽', range: [6000, 9000] as [number, number] },
    { label: 'От 9000 ₽', range: [9000, 15000] as [number, number] }
  ];

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) newExpanded.delete(section);
    else newExpanded.add(section);
    setExpandedSections(newExpanded);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];

      let colorMatch = true;
      if (selectedColors.length > 0) {
        const colorRuNames = selectedColors
          .map((colorValue) => colors.find((c) => c.value === colorValue)?.ruName)
          .filter(Boolean);

        colorMatch = product.color?.some((productColor) => colorRuNames.includes(productColor)) || false;
      }

      return categoryMatch && priceMatch && colorMatch;
    });
  }, [products, selectedCategories, selectedColors, priceRange]);

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setPriceRange([0, 15000]);
  };

  const activeFiltersCount =
    selectedCategories.length +
    selectedColors.length +
    (priceRange[0] !== 0 || priceRange[1] !== 15000 ? 1 : 0);

  return (
    <div className="min-h-screen pt-60 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-5xl sm:text-6xl font-light italic mb-4" style={{ fontFamily: 'var(--font-script)' }}>
            {pageTitle}
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600" style={{ fontFamily: 'var(--font-sans)' }}>
              Найдено {filteredProducts.length} товаров
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Сбросить все фильтры ({activeFiltersCount})
              </button>
            )}
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            <Filter className="w-5 h-5" />
            Фильтры
            {activeFiltersCount > 0 && (
              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{activeFiltersCount}</span>
            )}
          </button>

          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`lg:block ${showFilters ? 'block' : 'hidden'} w-full lg:w-80 flex-shrink-0`}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-200 sticky top-32 max-h-[calc(100vh-10rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-light italic" style={{ fontFamily: 'var(--font-script)' }}>
                  Фильтры
                </h3>
                <button onClick={() => setShowFilters(false)} className="lg:hidden p-2 hover:bg-gray-100 rounded-full" aria-label="Закрыть фильтры">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-200">
                <button onClick={() => toggleSection('category')} className="flex items-center justify-between w-full mb-4">
                  <h4 className="font-medium text-gray-700" style={{ fontFamily: 'var(--font-sans)' }}>Категории</h4>
                  <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.has('category') ? 'rotate-180' : ''}`} />
                </button>

                {expandedSections.has('category') && (
                  <div className="grid grid-cols-2 gap-2">
                    {flowerCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`px-3 py-2 rounded-full text-sm transition-all ${
                          selectedCategories.includes(category)
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        style={{ fontFamily: 'var(--font-sans)' }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-6 pb-6 border-b border-gray-200">
                <button onClick={() => toggleSection('color')} className="flex items-center justify-between w-full mb-4">
                  <h4 className="font-medium text-gray-700" style={{ fontFamily: 'var(--font-sans)' }}>Цвета</h4>
                  <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.has('color') ? 'rotate-180' : ''}`} />
                </button>

                {expandedSections.has('color') && (
                  <div className="space-y-2">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => toggleColor(color.value)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                          selectedColors.includes(color.value)
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300" style={{ backgroundColor: color.hex, boxShadow: color.hex === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none' }} />
                        <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-sans)' }}>{color.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <button onClick={() => toggleSection('price')} className="flex items-center justify-between w-full mb-4">
                  <h4 className="font-medium text-gray-700" style={{ fontFamily: 'var(--font-sans)' }}>Цена</h4>
                  <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.has('price') ? 'rotate-180' : ''}`} />
                </button>

                {expandedSections.has('price') && (
                  <div className="space-y-2">
                    {priceRanges.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => setPriceRange(option.range)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl transition-all ${
                          priceRange[0] === option.range[0] && priceRange[1] === option.range[1]
                            ? 'bg-primary text-white'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                        style={{ fontFamily: 'var(--font-sans)' }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {activeFiltersCount > 0 && (
                <button onClick={resetFilters} className="w-full px-4 py-3 border-2 border-primary text-primary rounded-xl hover:bg-primary hover:text-white transition-colors font-medium" style={{ fontFamily: 'var(--font-sans)' }}>
                  Сбросить фильтры
                </button>
              )}
            </div>
          </motion.aside>

          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 border border-gray-200">
                  <p className="text-xl text-gray-500 mb-4" style={{ fontFamily: 'var(--font-sans)' }}>
                    По выбранным параметрам товары не найдены
                  </p>
                  <button onClick={resetFilters} className="text-primary hover:text-primary/80 transition-colors font-medium" style={{ fontFamily: 'var(--font-sans)' }}>
                    Сбросить фильтры
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



