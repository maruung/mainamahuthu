import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopCard } from "@/components/shops/ShopCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useShops } from "@/hooks/useShops";

export const FeaturedShops = memo(function FeaturedShops() {
  const { shops, isLoading } = useShops(8);

  if (!isLoading && shops.length === 0) return null;

  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Store className="h-6 w-6 text-primary" />
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                Featured Shops
              </h2>
            </div>
            <p className="text-muted-foreground text-lg">
              Discover trusted sellers with their own branded shops
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/shops">
              View All Shops
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
});
