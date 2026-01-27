import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ProductList from "@/pages/ProductList";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import AuthPage from "@/pages/Auth";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import { useUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";

interface ProtectedRouteProps {
  component: React.ComponentType;
  requireAdmin?: boolean;
}

function ProtectedRoute({ component: Component, requireAdmin }: ProtectedRouteProps) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Not logged in → redirect to login
    window.location.href = "/login";
    return null;
  }

  if (requireAdmin && !user.isAdmin) {
    // Route requires admin, but user is not admin → redirect to home
    window.location.href = "/";
    return null;
  }

  // Optional: if normal protected route, redirect admin to dashboard
  if (!requireAdmin && user.isAdmin) {
    window.location.href = "/admin/dashboard";
    return null;
  }

  // All good → render component
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products/:category?" component={ProductList} />
      <Route path="/product/:slug" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/login">
        {() => <AuthPage mode="login" />}
      </Route>
      <Route path="/register">
        {() => <AuthPage mode="register" />}
      </Route>

      {/* Protected Routes */}
      <Route path="/checkout">
        {() => <ProtectedRoute component={Checkout} />}
      </Route>
      <Route path="/orders">
        {() => <ProtectedRoute component={Orders} />}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} requireAdmin />}
      </Route>
      <Route path="/admin/products">
        {() => <ProtectedRoute component={AdminProducts} requireAdmin />}
      </Route>
      <Route path="/admin/dashboard">
        {() => <ProtectedRoute component={AdminDashboard} requireAdmin />}
      </Route>
      <Route path="/admin/orders">
        {() => <ProtectedRoute component={AdminOrders} requireAdmin />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
