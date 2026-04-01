import { Link } from 'react-router';
import { Heart, ShoppingCart, Star, Clock } from 'lucide-react';
import { Product } from '../data/products';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, product.sizes[1]?.value ?? product.sizes[0].value);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleFavorite(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group"
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-[3/4]">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {product.oldPrice && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
              -{Math.round((1 - product.price / product.oldPrice) * 100)}%
            </div>
          )}

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered || favorite ? 1 : 0 }}
            className={`absolute top-4 right-4 p-2 rounded-full shadow-lg transition-colors ${
              favorite ? 'bg-primary text-white' : 'bg-white hover:bg-primary hover:text-white'
            }`}
            onClick={handleToggleFavorite}
            aria-label={favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
          >
            <Heart className={`w-5 h-5 ${favorite ? 'fill-current' : ''}`} />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            onClick={handleAddToCart}
            className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm text-gray-900 py-3 rounded-xl hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            В корзину
          </motion.button>
        </div>

        <div className="mt-4 space-y-2" style={{ fontFamily: 'var(--font-sans)' }}>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{product.rating}</span>
            </div>
            <span>•</span>
            <span>{product.reviewsCount} отзывов</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{product.deliveryTime}</span>
            </div>
          </div>

          <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xl font-medium">{product.price.toLocaleString('ru-RU')} ₽</span>
            {product.oldPrice && (
              <span className="text-sm text-gray-400 line-through">
                {product.oldPrice.toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
