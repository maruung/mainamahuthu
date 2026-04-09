import { memo } from "react";
import { Link } from "react-router-dom";
import { MapPin, Star, Users, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import type { Shop } from "@/hooks/useShops";

interface ShopCardProps {
  shop: Shop;
  compact?: boolean;
}

export const ShopCard = memo(function ShopCard({ shop, compact = false }: ShopCardProps) {
  return (
    <Link to={`/shop/${shop.slug}`} className="group block">
      <article className="listing-card flex flex-col h-full overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-24 sm:h-28 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
          {shop.cover_image_url ? (
            <OptimizedImage
              src={shop.cover_image_url}
              alt={shop.name}
              className="w-full h-full transition-transform duration-500 group-hover:scale-110"
              width={300}
              priority={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30" />
          )}
          {shop.is_verified && (
            <Badge className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
              ✓ Verified
            </Badge>
          )}
        </div>

        {/* Logo overlay */}
        <div className="relative px-2 sm:px-3 -mt-6">
          <div className="w-12 h-12 rounded-lg border-2 border-card bg-card overflow-hidden shadow-md">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-base">
                {shop.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-2 sm:p-3 pt-1">
          <h3 className="font-semibold text-xs sm:text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {shop.name}
          </h3>
          {!compact && shop.description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mt-0.5">{shop.description}</p>
          )}
          {shop.location && (
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground mt-1">
              <MapPin className="h-2.5 w-2.5" />
              <span className="truncate">{shop.location}</span>
            </div>
          )}
          <div className="mt-auto pt-2 flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground border-t border-border/50 mt-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                <Users className="h-2.5 w-2.5" />
                {shop.followers_count}
              </span>
              <span className="flex items-center gap-0.5">
                <Eye className="h-2.5 w-2.5" />
                {shop.views_count}
              </span>
            </div>
            {shop.rating > 0 && (
              <div className="flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-gold text-gold" />
                <span className="font-medium">{Number(shop.rating).toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
});
