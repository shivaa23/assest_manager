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

  const cartCount =
    cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const categories = [
    { name: "Earrings", path: "/products/Earrings" },
    { name: "Mangalsutra", path: "/products/Mangalsutra" },
    { name: "Necklaces", path: "/products/Necklaces" },
    { name: "Rings", path: "/products/Rings" },
    { name: "Bangles", path: "/products/Bangles" }
  ];

  const adminLinks = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Products", path: "/admin/products" },
    { name: "Orders", path: "/admin/orders" }
  ];

  const isAdmin = Boolean(user?.isAdmin);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">

        {/* Mobile Menu */}
        <button
          className="lg:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex flex-col items-center">
          <span className="font-serif text-2xl font-bold text-primary">
            PARNI
          </span>
          <span className="text-[0.6rem] tracking-[0.2em] text-muted-foreground">
            Jewels
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {/* USER HEADER */}
          {!isAdmin &&
            categories.map(cat => (
              <Link
                key={cat.path}
                href={cat.path}
                className={`text-sm font-medium hover:text-primary ${
                  location === cat.path ? "text-primary border-b-2" : ""
                }`}
              >
                {cat.name}
              </Link>
            ))}

          {/* ADMIN HEADER */}
          {isAdmin &&
            adminLinks.map(link => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-sm font-semibold hover:text-primary ${
                  location === link.path ? "text-primary border-b-2" : ""
                }`}
              >
                {link.name}
              </Link>
            ))}
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-4">
          {!isAdmin && (
            <Button variant="ghost" size="icon">
              <Search />
            </Button>
          )}

          {!isAdmin && (
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-secondary text-[10px] text-white flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm font-semibold">
                  {user.username}
                </div>
                <DropdownMenuSeparator />

                {!isAdmin && (
                  <Link href="/orders">
                    <DropdownMenuItem>My Orders</DropdownMenuItem>
                  </Link>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-background border-t p-4">
          {!isAdmin &&
            categories.map(cat => (
              <Link
                key={cat.path}
                href={cat.path}
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 text-lg"
              >
                {cat.name}
              </Link>
            ))}

          {isAdmin &&
            adminLinks.map(link => (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 text-lg text-primary"
              >
                {link.name}
              </Link>
            ))}
        </div>
      )}
    </nav>
  );
}
