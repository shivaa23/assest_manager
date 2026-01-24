import { Link, useLocation } from "wouter";
import { ShoppingBag, User, Search, Menu, X, LogOut } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: cartItems } = useCart();
  const { user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();

  const cartCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const categories = [
    { name: "Earrings", path: "/products/Earrings" },
    { name: "Mangalsutra", path: "/products/Mangalsutra" },
    { name: "Necklaces", path: "/products/Necklaces" },
    { name: "Rings", path: "/products/Rings" },
    { name: "Bangles", path: "/products/Bangles" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        
        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex flex-col items-center">
          <span className="font-serif text-2xl font-bold tracking-tight text-primary">PARNI</span>
          <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Jewels</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {categories.map((cat) => (
            <Link 
              key={cat.path} 
              href={cat.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === cat.path ? "text-primary border-b-2 border-primary" : "text-foreground"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Icons */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Search className="h-5 w-5" />
          </Button>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-secondary text-[10px] font-bold text-white flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-semibold">{user.username}</div>
                <DropdownMenuSeparator />
                <Link href="/orders">
                  <DropdownMenuItem>My Orders</DropdownMenuItem>
                </Link>
                {user.isAdmin && (
                  <Link href="/admin">
                    <DropdownMenuItem>Admin Dashboard</DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs font-semibold uppercase tracking-wider">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-background border-b border-border p-4 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-5">
          {categories.map((cat) => (
            <Link 
              key={cat.path} 
              href={cat.path}
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-medium py-2 border-b border-border/50"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
