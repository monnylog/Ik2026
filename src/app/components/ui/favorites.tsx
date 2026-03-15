import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "ik26_favorite_pages";

export interface FavoritePage {
  page: string;
  pinnedAt: number;
}

function loadFavorites(): FavoritePage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveFavorites(pages: FavoritePage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  } catch {}
}

/**
 * Hook to manage favorite/pinned pages.
 * Persisted to localStorage.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoritePage[]>(() => loadFavorites());

  const isFavorite = useCallback(
    (page: string) => favorites.some((f) => f.page === page),
    [favorites]
  );

  const toggleFavorite = useCallback((page: string) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.page === page);
      let updated: FavoritePage[];
      if (exists) {
        updated = prev.filter((f) => f.page !== page);
      } else {
        updated = [...prev, { page, pinnedAt: Date.now() }];
      }
      saveFavorites(updated);
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((page: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((f) => f.page !== page);
      saveFavorites(updated);
      return updated;
    });
  }, []);

  const reorderFavorites = useCallback((fromIndex: number, toIndex: number) => {
    setFavorites((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      saveFavorites(updated);
      return updated;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite, removeFavorite, reorderFavorites };
}