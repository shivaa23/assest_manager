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
import { useCreateOrder } from "@/hooks/use-orders";
import { Loader2, ShieldCheck } from "lucide-react";

// Schema for address form
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
  const { mutate: createOrder, isPending } = useCreateOrder();
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
  });

  // Calculate total
  const totalAmount = cartItems?.reduce((acc, item) => {
    return acc + (parseFloat(item.product.price as unknown as string) * item.quantity);
  }, 0) || 0;

  const onSubmit = (data: AddressFormValues) => {
    createOrder({
      totalAmount: totalAmount as any, // Drizzle decimal handling
      paymentMode: "cod", // Hardcoded for now, could be state
      address: data,
    });
  };

  if (!cartItems || cartItems.length === 0) {
    return <div>Cart is empty</div>; // Should redirect ideally
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-serif text-3xl font-bold mb-8 text-center">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          
          {/* Form */}
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
              <RadioGroup defaultValue="cod">
                <div className="flex items-center space-x-2 border p-4 rounded-xl border-primary/20 bg-primary/5">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="font-medium">Cash on Delivery (COD)</Label>
                </div>
                <div className="flex items-center space-x-2 border p-4 rounded-xl opacity-50 cursor-not-allowed">
                  <RadioGroupItem value="online" id="online" disabled />
                  <Label htmlFor="online">Online Payment (Coming Soon)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Summary Side */}
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
                {isPending ? "Processing..." : "Place Order"}
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
