import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Clock, ChevronRight } from 'lucide-react';
import { getProducts, categories } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { findCmsPage, resolveCmsImage } from '../cms/content';
import { useCmsContent } from '../cms/useCmsContent';

export function Home() {
  const cmsContent = useCmsContent();
  const cmsHome = findCmsPage(cmsContent, 'home');
  const cmsHero = cmsHome?.blocks.find((block) => block.type === 'hero');
  const cmsFeatured = cmsHome?.blocks.find((block) => block.type === 'products');

  const featuredProducts = getProducts(cmsContent).slice(0, 4);
  const heroImage =
    resolveCmsImage(cmsContent, cmsHero?.image) ||
    'https://images.unsplash.com/photo-1773169206110-103f891dda08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
  const heroTitle = typeof cmsHero?.title === 'string' && cmsHero.title.trim() ? cmsHero.title : 'Sara Flowers';
  const heroSubtitle =
    typeof cmsHero?.subtitle === 'string' && cmsHero.subtitle.trim()
      ? cmsHero.subtitle
      : 'Роскошные букеты и подарки с доставкой по Москве';
  const heroButtonText =
    typeof cmsHero?.buttonText === 'string' && cmsHero.buttonText.trim()
      ? cmsHero.buttonText
      : 'Посмотреть каталог';
  const featuredTitle =
    typeof cmsFeatured?.title === 'string' && cmsFeatured.title.trim()
      ? cmsFeatured.title
      : 'Избранные коллекции';

  return (
    <div className="min-h-screen">
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Цветы" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-6xl sm:text-7xl lg:text-8xl font-light italic mb-6 text-gray-900" style={{ fontFamily: 'var(--font-script)' }}>
              {heroTitle}
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-2xl sm:text-3xl mb-8 text-gray-700" style={{ fontFamily: 'var(--font-sans)' }}>
              {heroSubtitle}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-col sm:flex-row gap-4">
              <Link to="/catalog" className="px-8 py-4 bg-primary text-white rounded-full hover:bg-opacity-90 transition-all inline-flex items-center justify-center gap-2 group" style={{ fontFamily: 'var(--font-sans)' }}>
                {heroButtonText}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link to="/bouquet-builder" className="px-8 py-4 bg-white/90 backdrop-blur-sm text-gray-900 rounded-full hover:bg-white transition-all border border-gray-200" style={{ fontFamily: 'var(--font-sans)' }}>
                Собрать свой букет
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 flex items-center gap-2 text-sm text-gray-600" style={{ fontFamily: 'var(--font-sans)' }}>
              <Clock className="w-4 h-4" />
              <span>Доставка за 60 минут • Фото перед отправкой</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-light italic mb-4" style={{ fontFamily: 'var(--font-script)' }}>Категории</h2>
            <p className="text-gray-600" style={{ fontFamily: 'var(--font-sans)' }}>Подберите букет по настроению и поводу</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <motion.div key={category.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Link to="/catalog" className="group block">
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  </div>
                  <h3 className="text-center font-medium text-gray-900 group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-sans)' }}>{category.name}</h3>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-light italic mb-4" style={{ fontFamily: 'var(--font-script)' }}>{featuredTitle}</h2>
            <p className="text-gray-600" style={{ fontFamily: 'var(--font-sans)' }}>Наши бестселлеры с доставкой за 60 минут</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>

          <div className="text-center">
            <Link to="/catalog" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-all border border-gray-200" style={{ fontFamily: 'var(--font-sans)' }}>
              Посмотреть весь каталог
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
