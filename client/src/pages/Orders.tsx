import { useOrders } from "@/hooks/use-orders";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Loader2, Package } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Orders() {
  const { data: orders, isLoading } = useOrders();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-serif text-3xl font-bold mb-8">My Orders</h1>

        {!orders || orders.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-2xl">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here.</p>
            <Link href="/products">
              <Button>Browse Collection</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-border rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 pb-4 border-b border-border">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Order #{order.id}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt!).toLocaleDateString()}</p>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                      ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {order.status}
                    </span>
                    <span className="text-lg font-bold">₹{parseFloat(order.totalAmount as unknown as string).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Shipping to:</p>
                  <p>{(order.address as any).fullName}</p>
                  <p>{(order.address as any).street}, {(order.address as any).city}</p>
                  <p>Payment Mode: <span className="uppercase">{order.paymentMode}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
