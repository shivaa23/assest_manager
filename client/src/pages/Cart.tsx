import { useCart, useRemoveFromCart, useUpdateCartItem } from "@/hooks/use-cart";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function Cart() {
  const { data: cartItems, isLoading } = useCart();
  const { mutate: removeItem } = useRemoveFromCart();
  const { mutate: updateItem } = useUpdateCartItem();

  // Calculate totals
  const subtotal = cartItems?.reduce((acc, item) => {
    return acc + (parseFloat(item.product.price as unknown as string) * item.quantity);
  }, 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <ShoppingBagIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-3xl font-bold mb-4">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            Looks like you haven't added anything to your cart yet. Explore our collection to find something special.
          </p>
          <Link href="/products">
            <Button size="lg" className="bg-primary text-black">Start Shopping</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-serif text-3xl font-bold mb-8">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 sm:gap-6 bg-white p-4 rounded-xl border border-border shadow-sm">
                <div className="h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <img 
                    src={item.product.images[0]} 
                    alt={item.product.name} 
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-serif font-medium text-lg text-foreground line-clamp-1">
                        <Link href={`/product/${item.product.slug}`}>{item.product.name}</Link>
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{item.product.category}</p>
                    </div>
                    <p className="font-bold text-lg">₹{parseFloat(item.product.price as unknown as string).toLocaleString()}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3 border border-border rounded-lg p-1">
                      <button 
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => updateItem({ id: item.id, quantity: Math.max(1, item.quantity - 1) })}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button 
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => updateItem({ id: item.id, quantity: item.quantity + 1 })}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm sticky top-24">
              <h2 className="font-serif text-xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 border-b border-border pb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
              </div>
              
              <div className="flex justify-between mb-8">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-lg text-primary">₹{subtotal.toLocaleString()}</span>
              </div>
              
              <Link href="/checkout">
                <Button size="lg" className="w-full bg-primary text-black hover:bg-primary/90 rounded-xl h-12">
                  Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}
