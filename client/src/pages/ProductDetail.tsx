import { useProduct } from "@/hooks/use-products";
import { useAddToCart } from "@/hooks/use-cart";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useRoute, Link } from "wouter";
import { Loader2, Check, ShoppingBag, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const slug = params?.slug || "";
  const { data: product, isLoading, error } = useProduct(slug);
  const { mutate: addToCart, isPending: isAdding } = useAddToCart();
  const [emblaRef] = useEmblaCarousel();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-serif font-bold text-gray-800 mb-4">Product Not Found</h2>
        <Link href="/products">
          <Button>Back to Collection</Button>
        </Link>
      </div>
    );
  }

  const price = parseFloat(product.price as unknown as string);
  const originalPrice = product.originalPrice ? parseFloat(product.originalPrice as unknown as string) : null;
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Gallery */}
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-sm bg-white" ref={emblaRef}>
              <div className="flex">
                {product.images.map((img, idx) => (
                  <div className="flex-[0_0_100%] min-w-0" key={idx}>
                    <img 
                      src={img} 
                      alt={`${product.name} view ${idx + 1}`} 
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Thumbnails could go here */}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <div className="mb-2">
              <span className="text-sm font-semibold text-primary uppercase tracking-widest">{product.category}</span>
            </div>
            <h1 className="font-serif text-4xl font-bold text-foreground mb-4 leading-tight">{product.name}</h1>
            
            <div className="flex items-end gap-4 mb-8 border-b border-border pb-8">
              <span className="text-3xl font-semibold">₹{price.toLocaleString()}</span>
              {originalPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through mb-1">₹{originalPrice.toLocaleString()}</span>
                  <span className="text-sm font-bold text-secondary mb-2 bg-secondary/10 px-2 py-1 rounded">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed mb-8">
              {product.description}
            </p>

            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Check className="h-5 w-5 text-green-600" /> In Stock & Ready to Ship
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <ShieldCheck className="h-5 w-5 text-primary" /> 100% Certified Authentic
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Truck className="h-5 w-5 text-primary" /> Free Shipping Across India
              </div>
            </div>

            <div className="mt-auto">
              <Button 
                size="lg" 
                className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl shadow-lg shadow-primary/20"
                onClick={() => addToCart({ productId: product.id, quantity: 1 })}
                disabled={isAdding || product.stock === 0}
              >
                {isAdding ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> 
                ) : (
                  <ShoppingBag className="h-5 w-5 mr-2" />
                )}
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
