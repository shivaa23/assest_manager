import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Gem, Truck } from "lucide-react";
import { Link } from "wouter";
import { api } from "@shared/routes";
import { motion } from "framer-motion";

export default function Home() {
  const { data: products } = useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path);
      return api.products.list.responses[200].parse(await res.json());
    },
  });

  // Take first 6 items for featured section on mobile, first 4 for desktop
  const featuredProducts = products?.slice(0, 6) || [];
  const desktopFeaturedProducts = products?.slice(0, 4) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Cinematic background image of Indian gold jewellery */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop"
            alt="Luxury Jewellery Background" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 tracking-tight drop-shadow-lg">
              Timeless Elegance <br />
              <span className="text-primary italic font-light">Redefined</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto font-light">
              Discover our exquisite collection of handcrafted Indian jewellery, designed to celebrate your most precious moments.
            </p>
            <Link href="/products">
              <Button size="lg" className="bg-primary text-black hover:bg-white transition-all text-lg px-8 py-6 rounded-full">
                Shop Collection <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Banner */}
      <section className="py-12 bg-white border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-lg">Authentic Design</h3>
                <p className="text-sm text-muted-foreground">Handcrafted by master artisans</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Gem className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-lg">Certified Quality</h3>
                <p className="text-sm text-muted-foreground">100% Hallmark Gold & Diamonds</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-lg">Secure Shipping</h3>
                <p className="text-sm text-muted-foreground">Insured delivery across India</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-20 container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">Featured Collection</h2>
            <p className="text-muted-foreground">Our most loved pieces, curated for you.</p>
          </div>
          <Link href="/products">
            <Button variant="outline" className="hidden md:flex">View All</Button>
          </Link>
        </div>

        {/* Mobile View: 2 columns, 6 items */}
        <div className="grid grid-cols-2 gap-4 md:hidden">
          {featuredProducts.length > 0 ? (
            featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            // Skeletons for mobile
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-[3/4] rounded-xl mb-2" />
                <div className="h-3 bg-gray-200 w-3/4 mb-1 rounded" />
                <div className="h-3 bg-gray-200 w-1/2 rounded" />
              </div>
            ))
          )}
        </div>

        {/* Desktop View: 4 columns, 4 items */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {desktopFeaturedProducts.length > 0 ? (
            desktopFeaturedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            // Skeletons for desktop
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-[3/4] rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 w-3/4 mb-2 rounded" />
                <div className="h-4 bg-gray-200 w-1/2 rounded" />
              </div>
            ))
          )}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <Link href="/products">
            <Button variant="outline" className="w-full">View All Products</Button>
          </Link>
        </div>
      </section>

      {/* Category Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-12 text-center">Shop by Category</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Earrings - Unsplash jewellery photo */}
            <Link href="/products/Earrings">
              <div className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer">
                <img 
                  src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1000&auto=format&fit=crop" 
                  alt="Earrings" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-3xl font-serif text-white font-bold tracking-wide">Earrings</h3>
                </div>
              </div>
            </Link>

            {/* Necklaces */}
            <Link href="/products/Necklaces">
              <div className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer lg:col-span-2">
                <img 
                  src="https://pixabay.com/get/g3c9fbe046dd205498f5341d14857ff13f02d7454e1c89c7394e452c76816c946b0839050a1423b4c785fb874e8bfe2aae07521916f212e89906fd3cdfaf16979_1280.jpg" 
                  alt="Necklaces" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-3xl font-serif text-white font-bold tracking-wide">Necklaces</h3>
                </div>
              </div>
            </Link>

            {/* Rings */}
            <Link href="/products/Rings">
              <div className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer">
                <img 
                  src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1000&auto=format&fit=crop" 
                  alt="Rings" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-3xl font-serif text-white font-bold tracking-wide">Rings</h3>
                </div>
              </div>
            </Link>

             {/* Mangalsutra */}
             <Link href="/products/Mangalsutra">
              <div className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer">
                <img 
                  src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1000&auto=format&fit=crop" 
                  alt="Mangalsutra" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-3xl font-serif text-white font-bold tracking-wide">Mangalsutra</h3>
                </div>
              </div>
            </Link>

            {/* Bangles */}
            <Link href="/products/Bangles">
              <div className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer">
                <img 
                  src="https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=1000&auto=format&fit=crop" 
                  alt="Bangles" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-3xl font-serif text-white font-bold tracking-wide">Bangles</h3>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}