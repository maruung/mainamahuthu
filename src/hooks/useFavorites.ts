import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/untyped-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const FAVORITES_SYNC_EVENT = "sokoniarena:favorites-sync";

const getFavoritesStorageKey = (userId: string) => `sokoniarena:favorites:${userId}`;

const readStoredFavorites = (userId: string) => {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = window.localStorage.getItem(getFavoritesStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
};

export function useFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const syncFavoriteIds = useCallback(
    (nextFavoriteIds: Set<string>) => {
      const nextSet = new Set(nextFavoriteIds);
      setFavoriteIds(nextSet);

      if (!user || typeof window === "undefined") return;

      const ids = Array.from(nextSet);
      window.localStorage.setItem(getFavoritesStorageKey(user.id), JSON.stringify(ids));
      window.dispatchEvent(
        new CustomEvent(FAVORITES_SYNC_EVENT, {
          detail: { userId: user.id, ids },
        })
      );
    },
    [user]
  );

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      setIsLoading(false);
      return;
    }

    setFavoriteIds(readStoredFavorites(user.id));
    setIsLoading(true);

    const { data, error } = await supabase
      .from("favorites")
      .select("listing_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Favorites fetch error:", error);
      setIsLoading(false);
      return;
    }

    syncFavoriteIds(new Set((data || []).map((favorite) => favorite.listing_id)));
    setIsLoading(false);
  }, [syncFavoriteIds, user]);

  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    const storageKey = getFavoritesStorageKey(user.id);

    const handleFavoritesSync = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string; ids: string[] }>).detail;
      if (detail?.userId === user.id) {
        setFavoriteIds(new Set(detail.ids));
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        setFavoriteIds(readStoredFavorites(user.id));
      }
    };

    window.addEventListener(FAVORITES_SYNC_EVENT, handleFavoritesSync as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(FAVORITES_SYNC_EVENT, handleFavoritesSync as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, [user]);

  const toggleFavorite = async (listingId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorites.",
        variant: "destructive",
      });
      return;
    }

    const listingIsFavorite = favoriteIds.has(listingId);
    const previousFavorites = new Set(favoriteIds);
    const optimisticFavorites = new Set(favoriteIds);

    if (listingIsFavorite) {
      optimisticFavorites.delete(listingId);
    } else {
      optimisticFavorites.add(listingId);
    }

    syncFavoriteIds(optimisticFavorites);

    if (listingIsFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);

      if (error) {
        syncFavoriteIds(previousFavorites);
        toast({
          title: "Could not update favorites",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Removed from favorites",
        description: "This listing has been removed from your favorites.",
      });
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: user.id,
        listing_id: listingId,
      });

      if (error) {
        syncFavoriteIds(previousFavorites);
        toast({
          title: "Could not update favorites",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Added to favorites",
        description: "This listing has been saved to your favorites.",
      });
    }

    void fetchFavorites();
    return true;
  };

  const isFavorite = (listingId: string) => favoriteIds.has(listingId);

  return {
    favoriteIds,
    isLoading,
    toggleFavorite,
    isFavorite,
    refreshFavorites: fetchFavorites,
  };
}
