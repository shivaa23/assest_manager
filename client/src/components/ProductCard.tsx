import { Link } from "wouter";
import { type Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAddToCart } from "@/hooks/use-cart";
import { Loader2 } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const { mutate: addToCart, isPending } = useAddToCart();

  // Parse price safely
  const price = parseFloat(product.price as unknown as string);
  const originalPrice = product.originalPrice ? parseFloat(product.originalPrice as unknown as string) : null;
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden border border-border/40 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1">
      {/* Image Container */}
      <Link href={`/product/${product.slug}`}>
        <div className="aspect-[3/4] overflow-hidden bg-muted relative">
          {discount > 0 && (
            <span className="absolute top-3 left-3 z-10 bg-secondary text-white text-xs font-bold px-2 py-1 rounded-full">
              {discount}% OFF
            </span>
          )}
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          {/* Quick Add Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full transition-transform duration-300 group-hover:translate-y-0 bg-gradient-to-t from-black/50 to-transparent flex justify-center">
            <Button 
              size="sm" 
              className="w-full bg-white text-black hover:bg-primary hover:text-white transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart({ productId: product.id, quantity: 1 });
              }}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Quick Add"}
            </Button>
          </div>
        </div>
      </Link>

      {/* Details */}
      <div className="p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {product.category}
        </div>
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-serif text-lg font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-semibold text-lg">₹{price.toLocaleString()}</span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through decoration-destructive/50">
              ₹{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
