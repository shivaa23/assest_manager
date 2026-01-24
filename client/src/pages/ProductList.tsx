import { useProducts } from "@/hooks/use-products";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useLocation, useRoute } from "wouter";
import { Loader2 } from "lucide-react";

export default function ProductList() {
  const [, params] = useRoute("/products/:category?");
  const category = params?.category ? decodeURIComponent(params.category) : undefined;
  
  const { data: products, isLoading } = useProducts(category);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            {category || "All Collections"}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our meticulously crafted collection of fine jewellery. 
            Each piece tells a story of tradition, elegance, and beauty.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No products found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
