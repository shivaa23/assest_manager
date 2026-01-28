// src/pages/AdminDashboard.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  Users, Package, ShoppingBag, TrendingUp, TrendingDown,
  Calendar, DollarSign, UserPlus, Loader2, Search,
  Filter, Download, MoreVertical, ChevronRight, Sparkles,
  Gem, Crown, ShieldCheck, Bell, Eye, AlertCircle, Truck, CheckCircle, CreditCard, XCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Navbar } from "@/components/Navbar";
import { useNavigate } from "react-router-dom";
import { useLocation } from "wouter";

// Types
type User = {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
  orders?: Order[];
};

type Address = {
  city: string;
  phone: string;
  state: string;
  street: string;
  pincode: string;
  fullName: string;
};

type Order = {
  id: number;
  userId: number;
  totalAmount: string;
  status: 'pending' | 'paid' | 'cod_confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMode: 'cod' | 'razorpay';
  paymentId: string | null;
  shiprocketOrderId: string | null;
  address: Address;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
};

type DashboardStats = {
  totalUsers: number;
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  popularCategory: string;
  pendingOrders: number;
  growthRate: number;
  avgOrderValue: number;
};

export default function AdminDashboard() {
 const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("today");

  // Calculate today's date for filtering
  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/stats");
      return res.data;
    },
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/users");
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  // Fetch orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["orders", statusFilter, dateRange],
    queryFn: async () => {
      const res = await axios.get("/api/admin/orders");
      let orders = Array.isArray(res.data) ? res.data : [];
      
      // Apply status filter
      if (statusFilter !== "all") {
        orders = orders.filter(order => order.status === statusFilter);
      }
      
      // Apply date range filter
      if (dateRange !== "all") {
        const today = getTodayDate();
        orders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          
          switch (dateRange) {
            case "today":
              return orderDate >= today;
            case "week":
              const weekAgo = new Date(today);
              weekAgo.setDate(today.getDate() - 7);
              return orderDate >= weekAgo;
            case "month":
              const monthAgo = new Date(today);
              monthAgo.setMonth(today.getMonth() - 1);
              return orderDate >= monthAgo;
            default:
              return true;
          }
        });
      }
      
      return orders;
    },
  });

  // Process users with additional data
  const processedUsers = (usersData || []).map(user => {
    // Calculate user stats from orders
    const userOrders = (ordersData || []).filter(order => order.userId === user.id);
    const totalSpent = userOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    
    return {
      ...user,
      ordersCount: userOrders.length,
      totalSpent,
      // Calculate tier based on spending
      tier: totalSpent > 100000 ? "Premium" : 
            totalSpent > 50000 ? "Gold" : 
            totalSpent > 10000 ? "Silver" : "Bronze"
    };
  });

  const users: User[] = processedUsers || [];
  const orders: Order[] = ordersData || [];

  // Calculate dashboard statistics from data
  const calculatedStats: DashboardStats = {
    totalUsers: users.length,
    totalOrders: orders.length,
    todayOrders: orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const today = getTodayDate();
      return orderDate >= today;
    }).length,
    totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0),
    todayRevenue: orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const today = getTodayDate();
      return orderDate >= today;
    }).reduce((sum, order) => sum + parseFloat(order.totalAmount), 0),
    popularCategory: "Gold", // Default, in real app calculate from products
    pendingOrders: orders.filter(order => order.status === 'pending').length,
    growthRate: 12.5, // Default, in real app calculate from previous period
    avgOrderValue: orders.length > 0 ? 
      orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0) / orders.length : 0
  };

  // Utils
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(num);
  };

  const getStatusBadge = (status: Order['status']) => {
    const variants: Record<Order['status'], { bg: string, text: string, icon?: React.ReactNode }> = {
      pending: { 
        bg: "bg-amber-500/10", 
        text: "text-amber-600",
        icon: <AlertCircle className="h-3 w-3 mr-1" />
      },
      paid: { 
        bg: "bg-blue-500/10", 
        text: "text-blue-600",
        icon: <CreditCard className="h-3 w-3 mr-1" />
      },
      cod_confirmed: { 
        bg: "bg-purple-500/10", 
        text: "text-purple-600",
        icon: <Package className="h-3 w-3 mr-1" />
      },
      shipped: { 
        bg: "bg-indigo-500/10", 
        text: "text-indigo-600",
        icon: <Truck className="h-3 w-3 mr-1" />
      },
      delivered: { 
        bg: "bg-emerald-500/10", 
        text: "text-emerald-600",
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      cancelled: { 
        bg: "bg-rose-500/10", 
        text: "text-rose-600",
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
    };
    return variants[status] || { bg: "bg-gray-500/10", text: "text-gray-600" };
  };

  const getStatusText = (status: Order['status']) => {
    const texts: Record<Order['status'], string> = {
      pending: "Pending",
      paid: "Paid",
      cod_confirmed: "COD Confirmed",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    return texts[status] || status;
  };

  // Calculate new users today
  const newUsersToday = users.filter(u => {
    const userDate = new Date(u.createdAt);
    const today = getTodayDate();
    return userDate >= today;
  }).length;

  // Get top users by spending
  const topUsers = [...processedUsers]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  // Filter orders by search
  const filteredOrders = orders.filter(order => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      order.id.toString().includes(query) ||
      (order.user?.username || '').toLowerCase().includes(query) ||
      (order.address?.fullName || '').toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query) ||
      order.totalAmount.includes(query)
    );
  });

  // Quick actions
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'export':
        exportOrdersToCSV();
        break;
      case 'viewAllOrders':
        navigate('/admin/orders');
        break;
      case 'viewOrder':
        if (filteredOrders.length > 0) {
          navigate(`/admin/orders/${filteredOrders[0].id}`);
        }
        break;
      default:
        break;
    }
  };

  const exportOrdersToCSV = () => {
    const headers = ['Order ID', 'Customer', 'Amount', 'Status', 'Payment', 'Date'];
    const csvData = filteredOrders.map(order => [
      order.id,
      order.user?.username || `User ${order.userId}`,
      order.totalAmount,
      order.status,
      order.paymentMode === 'cod' ? 'COD' : 'Online',
      new Date(order.createdAt).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (statsLoading || usersLoading || ordersLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <div className="relative bg-white p-8 rounded-2xl shadow-lg">
            <Gem className="h-12 w-12 text-amber-500 animate-pulse mx-auto mb-4" />
            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
          </div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-2 rounded-lg shadow-md">
                <Gem className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Jeweler Pro Dashboard
                </h1>
                <p className="text-gray-600 text-sm">Manage your jewelry empire with precision</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border">
              <Calendar className="h-4 w-4 text-amber-500" />
              <span className="text-gray-700 font-medium">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </span>
            </div>
            
            <Button 
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md"
              onClick={() => handleQuickAction('export')}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-white to-amber-50 border-amber-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(calculatedStats.totalRevenue)}</h3>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                    <span className="text-sm font-medium text-emerald-600">
                      +{calculatedStats.growthRate}%
                    </span>
                    <span className="text-gray-500 text-sm ml-2">vs last month</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                  <h3 className="text-2xl font-bold text-gray-900">{calculatedStats.totalOrders}</h3>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 mr-2">
                        {calculatedStats.todayOrders} today
                      </Badge>
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-200">
                        {calculatedStats.pendingOrders} pending
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-emerald-50 border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Customers</p>
                  <h3 className="text-2xl font-bold text-gray-900">{calculatedStats.totalUsers}</h3>
                  <div className="flex items-center mt-2">
                    <UserPlus className="h-4 w-4 text-emerald-500 mr-1" />
                    <span className="text-sm font-medium text-emerald-600">
                      +{newUsersToday} new today
                    </span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Avg. Order Value</p>
                  <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(calculatedStats.avgOrderValue)}</h3>
                  <div className="flex items-center mt-2">
                    <Crown className="h-4 w-4 text-purple-500 mr-1" />
                    <span className="text-sm font-medium text-purple-600 capitalize">
                      {calculatedStats.popularCategory} trending
                    </span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders Table */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border">
              <CardHeader className="border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Recent Orders</CardTitle>
                    <CardDescription>Monitor and manage recent transactions</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search orders..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 w-full sm:w-[200px]"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cod_confirmed">COD Confirmed</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Date Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold">Order ID</TableHead>
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length > 0 ? filteredOrders.slice(0, 8).map((order) => {
                      const statusStyle = getStatusBadge(order.status);
                      return (
                        <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {(order.user?.username?.[0] || order.address?.fullName?.[0] || "U").toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{order.user?.username || order.address?.fullName || `User ${order.userId}`}</p>
                                <p className="text-xs text-gray-500">{order.address?.phone || "No phone"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(order.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0 font-medium px-2 py-1 flex items-center w-fit`}>
                              {statusStyle.icon}
                              {getStatusText(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/admin/orders/${order.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/admin/orders/${order.id}/edit`)}>
                                  <Package className="h-4 w-4 mr-2" />
                                  Update Status
                                </DropdownMenuItem>
                                {order.status !== 'cancelled' && (
                                  <DropdownMenuItem className="text-rose-600">
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel Order
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center">
                            <Package className="h-12 w-12 text-gray-300 mb-2" />
                            <p>No orders found</p>
                            {(statusFilter !== "all" || dateRange !== "all" || search) && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2"
                                onClick={() => {
                                  setSearch("");
                                  setStatusFilter("all");
                                  setDateRange("all");
                                }}
                              >
                                Clear filters
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              <div className="border-t px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {Math.min(filteredOrders.length, 8)} of {filteredOrders.length} orders
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/admin/orders')}
                >
                  View All Orders
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Top Customers */}
            <Card className="shadow-sm border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Crown className="h-5 w-5 mr-2 text-amber-500" />
                  Top Customers
                </CardTitle>
                <CardDescription>Highest spending clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topUsers.map((user, index) => (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={
                              index === 0 ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white" :
                              index === 1 ? "bg-gradient-to-br from-gray-500 to-gray-600 text-white" :
                              index === 2 ? "bg-gradient-to-br from-amber-700 to-amber-800 text-white" :
                              "bg-blue-100 text-blue-600"
                            }>
                              {user.username[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.ordersCount} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(user.totalSpent)}</p>
                        <div className="flex items-center justify-end">
                          <ShieldCheck className="h-3 w-3 text-emerald-500 mr-1" />
                          <span className="text-xs text-emerald-600">{user.tier}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {topUsers.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No customer data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-sm border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Order Completion</span>
                    <span className="font-semibold">
                      {orders.length > 0 
                        ? Math.round((orders.filter(o => o.status === 'delivered').length / orders.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={orders.length > 0 
                      ? (orders.filter(o => o.status === 'delivered').length / orders.length) * 100
                      : 0} 
                    className="h-2" 
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Payment Success</span>
                    <span className="font-semibold">
                      {orders.length > 0
                        ? Math.round(((orders.filter(o => o.status === 'paid' || o.status === 'delivered').length) / orders.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={orders.length > 0
                      ? ((orders.filter(o => o.status === 'paid' || o.status === 'delivered').length) / orders.length) * 100
                      : 0} 
                    className="h-2 bg-emerald-500/20" 
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Revenue Target</span>
                    <span className="font-semibold">
                      {calculatedStats.totalRevenue > 1000000 
                        ? "100%"
                        : Math.round((calculatedStats.totalRevenue / 1000000) * 100) + "%"}
                    </span>
                  </div>
                  <Progress 
                    value={calculatedStats.totalRevenue > 1000000 
                      ? 100
                      : (calculatedStats.totalRevenue / 1000000) * 100} 
                    className="h-2 bg-amber-500/20" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex flex-col items-center justify-center gap-2"
                  onClick={() => handleQuickAction('export')}
                >
                  <Download className="h-5 w-5" />
                  <span className="text-xs">Export Data</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex flex-col items-center justify-center gap-2"
                  onClick={() => navigate('/admin/orders')}
                >
                  <Package className="h-5 w-5" />
                  <span className="text-xs">All Orders</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex flex-col items-center justify-center gap-2"
                  onClick={() => navigate('/admin/users')}
                >
                  <Users className="h-5 w-5" />
                  <span className="text-xs">All Users</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex flex-col items-center justify-center gap-2"
                  onClick={() => navigate('/admin/products')}
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span className="text-xs">Products</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}