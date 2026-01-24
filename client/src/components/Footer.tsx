import { Link } from "wouter";
import { Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="font-serif text-3xl font-bold text-primary">PARNI</span>
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Jewels</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Crafting timeless elegance since 1995. We bring you the finest collection of traditional and contemporary Indian jewellery.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 text-primary">Shop</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li><Link href="/products/Earrings" className="hover:text-primary transition-colors">Earrings</Link></li>
              <li><Link href="/products/Mangalsutra" className="hover:text-primary transition-colors">Mangalsutra</Link></li>
              <li><Link href="/products/Necklaces" className="hover:text-primary transition-colors">Necklaces</Link></li>
              <li><Link href="/products/Rings" className="hover:text-primary transition-colors">Rings</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 text-primary">Support</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li><Link href="#" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Shipping Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 text-primary">Connect</h4>
            <div className="flex gap-4 mb-6">
              <a href="#" className="h-10 w-10 rounded-full border border-gray-600 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full border border-gray-600 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full border border-gray-600 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
            <p className="text-xs text-gray-500">© 2024 Parni Jewels. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
