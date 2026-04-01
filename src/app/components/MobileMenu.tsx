import { motion, AnimatePresence } from 'motion/react';
import { X, Home, Grid, Package, Phone, Palette } from 'lucide-react';
import { Link } from 'react-router';

interface MobileMenuItem {
  to: string;
  label: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: MobileMenuItem[];
}

function iconFor(path: string) {
  if (path === '/') return <Home className="w-5 h-5" />;
  if (path === '/catalog') return <Grid className="w-5 h-5" />;
  if (path === '/bouquet-builder') return <Palette className="w-5 h-5" />;
  if (path === '/delivery') return <Package className="w-5 h-5" />;
  if (path === '/contacts') return <Phone className="w-5 h-5" />;
  return <Grid className="w-5 h-5" />;
}

export function MobileMenu({ isOpen, onClose, items }: MobileMenuProps) {
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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-80 max-w-full bg-white z-50 shadow-2xl"
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-light italic" style={{ fontFamily: 'var(--font-script)' }}>
                Меню
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Закрыть меню">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="p-6" style={{ fontFamily: 'var(--font-sans)' }}>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onClose}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      {iconFor(item.to)}
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-8 border-t border-gray-200 space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Email</p>
                  <a href="mailto:sales@sara-flowers.ru" className="text-lg font-medium hover:text-primary transition-colors">
                    sales@sara-flowers.ru
                  </a>
                </div>
              </div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
