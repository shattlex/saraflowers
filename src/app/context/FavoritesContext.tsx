import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

interface FavoritesContextType {
  favoriteIds: string[];
  favoritesCount: number;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  clearFavorites: () => void;
}

const FAVORITES_STORAGE_KEY = 'sf_favorite_ids';

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const sanitized = parsed.filter((item): item is string => typeof item === 'string');
        setFavoriteIds(sanitized);
      }
    } catch {
      setFavoriteIds([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const toggleFavorite = (productId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const removeFavorite = (productId: string) => {
    setFavoriteIds((prev) => prev.filter((id) => id !== productId));
  };

  const clearFavorites = () => {
    setFavoriteIds([]);
  };

  const isFavorite = (productId: string) => favoriteIds.includes(productId);

  const favoritesCount = useMemo(() => favoriteIds.length, [favoriteIds]);

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        favoritesCount,
        isFavorite,
        toggleFavorite,
        removeFavorite,
        clearFavorites
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};

