import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/untyped-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Shop {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  theme: string;
  is_active: boolean;
  is_verified: boolean;
  followers_count: number;
  views_count: number;
  rating: number;
  location: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  is_promoted: boolean;
  promoted_until: string | null;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  tiktok: string | null;
  youtube: string | null;
  linkedin: string | null;
  telegram: string | null;
  created_at: string;
  updated_at: string;
}

export function useShops(limit?: number) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      let query = supabase
        .from("shops")
        .select("*")
        .eq("is_active", true)
        .order("followers_count", { ascending: false });

      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (!error && data) setShops(data as Shop[]);
      setIsLoading(false);
    };
    fetchShops();
  }, [limit]);

  return { shops, isLoading };
}

export function usePromotedShops(limit: number = 10) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      // First try promoted shops, then fill with top shops by followers
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("is_active", true)
        .order("is_promoted", { ascending: false })
        .order("followers_count", { ascending: false })
        .limit(limit);
      if (!error && data) setShops(data as Shop[]);
      setIsLoading(false);
    };
    fetchShops();
  }, [limit]);

  return { shops, isLoading };
}

export function useShopBySlug(slug: string | undefined) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setIsLoading(false); return; }
    const fetchShop = async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (!error && data) setShop(data as Shop);
      setIsLoading(false);
    };
    fetchShop();
  }, [slug]);

  return { shop, isLoading };
}

export function useMyShop() {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchShop = useCallback(async () => {
    if (!user) { setShop(null); setIsLoading(false); return; }
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!error && data) setShop(data as Shop);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchShop(); }, [fetchShop]);

  return { shop, isLoading, refetch: fetchShop };
}

export function useShopFollow(shopId: string | undefined) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !shopId) return;
    supabase
      .from("shop_followers")
      .select("id")
      .eq("shop_id", shopId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setIsFollowing(!!data));
  }, [user, shopId]);

  const toggleFollow = async () => {
    if (!user || !shopId) {
      toast({ title: "Sign in to follow shops", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    if (isFollowing) {
      await supabase.from("shop_followers").delete().eq("shop_id", shopId).eq("user_id", user.id);
      await supabase.from("shops").update({ followers_count: Math.max(0, (await supabase.from("shop_followers").select("id", { count: "exact" }).eq("shop_id", shopId)).count || 0) }).eq("id", shopId);
      setIsFollowing(false);
    } else {
      await supabase.from("shop_followers").insert({ shop_id: shopId, user_id: user.id });
      await supabase.from("shops").update({ followers_count: (await supabase.from("shop_followers").select("id", { count: "exact" }).eq("shop_id", shopId)).count || 0 }).eq("id", shopId);
      setIsFollowing(true);
    }
    setIsLoading(false);
  };

  return { isFollowing, toggleFollow, isLoading };
}
