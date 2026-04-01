import { Link } from 'react-router';
import { ShoppingCart, Search, Heart, Menu, UserRound } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { SearchModal } from './SearchModal';
import { MobileMenu } from './MobileMenu';
import { useCmsContent } from '../cms/useCmsContent';
import { useFavorites } from '../context/FavoritesContext';

const fallbackNav = [
  { slug: 'home', title: 'О нас' },
  { slug: 'catalog', title: 'Каталог' },
  { slug: 'bouquet-builder', title: 'Конструктор' },
  { slug: 'delivery', title: 'Доставка' },
  { slug: 'contacts', title: 'Контакты' }
];

function pageToPath(slug: string): string {
  return slug === 'home' ? '/' : `/${slug}`;
}

export function Header() {
  const { itemCount } = useCart();
  const { favoritesCount } = useFavorites();
  const cmsContent = useCmsContent();
  const siteName = cmsContent.siteName?.trim() || 'Sara Flowers';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = useMemo(() => {
    const bySlug = new Map(cmsContent.pages.map((page) => [page.slug, page]));
    return fallbackNav
      .map((item) => {
        const page = bySlug.get(item.slug);
        if (page && page.inNav !== false) {
          return { to: pageToPath(page.slug), label: page.title || item.title };
        }
        if (!page) {
          return { to: pageToPath(item.slug), label: item.title };
        }
        return null;
      })
      .filter((item): item is { to: string; label: string } => item !== null);
  }, [cmsContent.pages]);

  return (
    <>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} items={navItems} />
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div />
            <div className="text-sm text-gray-600">
              <span>Доставка за 60 минут</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <Link to="/" className="flex items-center">
              <img
                src="/logo-sara.png"
                alt={siteName}
                className="h-auto w-[170px] sm:w-[210px] md:w-[230px] max-h-16 sm:max-h-20 md:max-h-20 object-contain object-left"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <h1 className="sr-only">{siteName}</h1>
            </Link>

            <nav className="hidden md:flex items-center gap-8" style={{ fontFamily: 'var(--font-sans)' }}>
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} className="text-sm hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Поиск"
              >
                <Search className="w-5 h-5" />
              </button>
              <Link to="/favorites" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative" aria-label="Избранное">
                <Heart className="w-5 h-5" />
                {favoritesCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-primary text-white text-xs min-w-5 h-5 px-1 rounded-full flex items-center justify-center"
                  >
                    {favoritesCount}
                  </motion.span>
                )}
              </Link>
              <Link to="/cart" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative" aria-label="Корзина">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </Link>
              <Link to="/account" className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Личный кабинет">
                <UserRound className="w-5 h-5" />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Меню"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>
    </>
  );
}


