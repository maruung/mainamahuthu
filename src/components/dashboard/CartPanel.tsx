import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ShoppingCart, Loader2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { parseImages } from "@/lib/utils";

export function CartPanel() {
  const { cartItems, isLoading, removeFromCart } = useCart();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="font-display text-xl font-bold mb-2">Your Cart is Empty</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Browse products, services, and events to add items to your cart for easy access later.
          </p>
          <Button asChild>
            <Link to="/products">Browse Products</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6 border-b">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          My Cart ({cartItems.length} items)
        </h2>
      </div>
      <CardContent className="p-6">
        <div className="space-y-4">
          {cartItems.map((item) => {
            const listing = item.listing;
            if (!listing) return null;
            const image = parseImages(listing.images)?.[0];
            const categoryPath = listing.listing_type === "product" ? "products" : listing.listing_type === "service" ? "services" : "events";

            return (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                  {image ? (
                    <img src={image} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{listing.title}</h3>
                  <p className="text-sm text-muted-foreground">{listing.location}</p>
                  {listing.price && (
                    <p className="text-sm font-semibold text-primary">KES {listing.price.toLocaleString()}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/${categoryPath}/${listing.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeFromCart(item.listing_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
