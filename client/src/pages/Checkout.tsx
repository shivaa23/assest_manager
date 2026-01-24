import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, ShieldCheck, CreditCard, Wallet } from "lucide-react";
import { api } from "@shared/routes";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const addressSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(6, "Valid pincode required"),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export default function Checkout() {
  const { data: cartItems } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [paymentMode, setPaymentMode] = useState<"cod" | "razorpay">("cod");
  const [isPending, setIsPending] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
  });

  const totalAmount = cartItems?.reduce((acc, item) => {
    return acc + (parseFloat(item.product.price as unknown as string) * item.quantity);
  }, 0) || 0;

  const verifyPayment = async (orderId: number, razorpayPaymentId: string, razorpaySignature: string) => {
    const res = await fetch(`/api/orders/${orderId}/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razorpayPaymentId, razorpaySignature }),
    });
    if (!res.ok) throw new Error("Payment verification failed");
    return res.json();
  };

  const onSubmit = async (data: AddressFormValues) => {
    setIsPending(true);
    
    try {
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: totalAmount,
          paymentMode: paymentMode,
          address: data,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create order");
      }
      
      const order = await res.json();

      if (paymentMode === "razorpay" && order.razorpayOrderId) {
        const options = {
          key: "rzp_test_S6wZXGrAyfrnZA",
          amount: Math.round(totalAmount * 100),
          currency: "INR",
          name: "Parni Jewels",
          description: "Order Payment",
          order_id: order.razorpayOrderId,
          handler: async function (response: any) {
            try {
              await verifyPayment(
                order.id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );
              queryClient.invalidateQueries({ queryKey: [api.cart.get.path] });
              queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
              toast({ title: "Payment Successful!", description: "Thank you for your purchase." });
              setLocation(`/orders`);
            } catch (error) {
              toast({ 
                title: "Payment Verification Failed", 
                description: "Please contact support.", 
                variant: "destructive" 
              });
            }
          },
          prefill: {
            name: data.fullName,
            contact: data.phone,
          },
          theme: {
            color: "#D4A853",
          },
          modal: {
            ondismiss: function() {
              setIsPending(false);
              toast({ 
                title: "Payment Cancelled", 
                description: "Your order has been saved. You can complete payment later.", 
                variant: "destructive" 
              });
            }
          }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        queryClient.invalidateQueries({ queryKey: [api.cart.get.path] });
        queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
        toast({ title: "Order Placed!", description: "Thank you for your purchase." });
        setLocation(`/orders`);
      }
    } catch (error: any) {
      toast({ 
        title: "Order Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      if (paymentMode !== "razorpay") {
        setIsPending(false);
      }
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="font-serif text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button onClick={() => setLocation("/products")}>Continue Shopping</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-serif text-3xl font-bold mb-8 text-center">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
              <h2 className="font-serif text-xl font-bold mb-6">Shipping Address</h2>
              <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" {...register("fullName")} placeholder="John Doe" />
                    {errors.fullName && <p className="text-destructive text-sm">{errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" {...register("phone")} placeholder="9876543210" />
                    {errors.phone && <p className="text-destructive text-sm">{errors.phone.message}</p>}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input id="street" {...register("street")} placeholder="Flat, House no., Building, Company, Apartment" />
                  {errors.street && <p className="text-destructive text-sm">{errors.street.message}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register("city")} placeholder="Mumbai" />
                    {errors.city && <p className="text-destructive text-sm">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" {...register("state")} placeholder="Maharashtra" />
                    {errors.state && <p className="text-destructive text-sm">{errors.state.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input id="pincode" {...register("pincode")} placeholder="400001" />
                    {errors.pincode && <p className="text-destructive text-sm">{errors.pincode.message}</p>}
                  </div>
                </div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
              <h2 className="font-serif text-xl font-bold mb-6">Payment Method</h2>
              <RadioGroup value={paymentMode} onValueChange={(val) => setPaymentMode(val as "cod" | "razorpay")}>
                <div className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-all ${paymentMode === "razorpay" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                  <RadioGroupItem value="razorpay" id="razorpay" />
                  <CreditCard className="h-5 w-5 text-primary" />
                  <Label htmlFor="razorpay" className="font-medium cursor-pointer flex-1">
                    Pay Online (Cards, UPI, Netbanking)
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-all mt-3 ${paymentMode === "cod" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                  <RadioGroupItem value="cod" id="cod" />
                  <Wallet className="h-5 w-5 text-primary" />
                  <Label htmlFor="cod" className="font-medium cursor-pointer flex-1">Cash on Delivery (COD)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div>
             <div className="bg-white p-6 rounded-2xl border border-border shadow-sm sticky top-24">
              <h2 className="font-serif text-xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-4 text-sm">
                    <div className="h-16 w-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                       <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium line-clamp-1">{item.product.name}</p>
                      <p className="text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">₹{(parseFloat(item.product.price as unknown as string) * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-border pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
              </div>

              <div className="flex justify-between mb-8 pt-4 border-t border-border">
                <span className="font-bold text-lg">Total Amount</span>
                <span className="font-bold text-xl text-primary">₹{totalAmount.toLocaleString()}</span>
              </div>

              <Button 
                type="submit" 
                form="checkout-form"
                size="lg" 
                className="w-full bg-primary text-black hover:bg-primary/90 h-12 text-lg"
                disabled={isPending}
              >
                {isPending ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                {isPending ? "Processing..." : paymentMode === "razorpay" ? "Pay Now" : "Place Order"}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-4">
                By placing this order, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
