import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/untyped-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  listing_id: string;
  user_id: string;
  created_at: string;
  listing?: {
    id: string;
    title: string;
    price: number | null;
    images: string[];
    location: string;
    listing_type: string;
  };
}

export function useCart() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartIds, setCartIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setCartIds(new Set());
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("cart_items")
      .select("*, listing:listings(id, title, price, images, location, listing_type)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCartItems(data as CartItem[]);
      setCartIds(new Set(data.map((item: any) => item.listing_id)));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (listingId: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to add items to cart.", variant: "destructive" });
      return false;
    }

    if (cartIds.has(listingId)) {
      toast({ title: "Already in cart", description: "This item is already in your cart." });
      return false;
    }

    // Optimistic
    setCartIds(prev => new Set(prev).add(listingId));

    const { error } = await supabase.from("cart_items").insert({ user_id: user.id, listing_id: listingId });

    if (error) {
      setCartIds(prev => { const n = new Set(prev); n.delete(listingId); return n; });
      toast({ title: "Could not add to cart", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Added to cart 🛒" });
    await fetchCart();
    return true;
  };

  const removeFromCart = async (listingId: string) => {
    if (!user) return false;

    setCartIds(prev => { const n = new Set(prev); n.delete(listingId); return n; });

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);

    if (error) {
      setCartIds(prev => new Set(prev).add(listingId));
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Removed from cart" });
    await fetchCart();
    return true;
  };

  const isInCart = (listingId: string) => cartIds.has(listingId);

  return { cartItems, cartIds, isLoading, addToCart, removeFromCart, isInCart, refreshCart: fetchCart, cartCount: cartIds.size };
}
