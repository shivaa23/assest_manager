import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  Users, Package, ShoppingBag, TrendingUp, TrendingDown,
  Calendar, DollarSign, UserPlus, Loader2, Search,
  Filter, Download, MoreVertical, ChevronRight, Sparkles,
  Gem, Crown, ShieldCheck, Bell
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Types
type User = {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  avatar?: string;
};

type Order = {
  id: number;
  userId: number;
  totalAmount: string;
  status: 'pending' | 'paid' | 'cod_confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMode: 'cod' | 'razorpay';
  createdAt: string;
  user?: {
    username: string;
    email: string;
    avatar?: string;
  };
  items?: OrderItem[];
};

type OrderItem = {
  id: number;
  productName: string;
  quantity: number;
  price: string;
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("today");
  const [activeTab, setActiveTab] = useState("overview");

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
      return Array.isArray(res.data) ? res.data : res.data.users ?? [];
    },
  });
  const users: User[] = Array.isArray(usersData) ? usersData : [];

  // Fetch orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["orders", statusFilter, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (dateRange !== "all") params.append("dateRange", dateRange);
      const res = await axios.get(`/api/admin/orders?${params.toString()}`);
      return Array.isArray(res.data) ? res.data : res.data.orders ?? [];
    },
  });
  const orders: Order[] = Array.isArray(ordersData) ? ordersData : [];

  // Utils
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
      pending: { bg: "bg-amber-500/10", text: "text-amber-600" },
      paid: { bg: "bg-blue-500/10", text: "text-blue-600" },
      cod_confirmed: { bg: "bg-purple-500/10", text: "text-purple-600" },
      shipped: { bg: "bg-indigo-500/10", text: "text-indigo-600" },
      delivered: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
      cancelled: { bg: "bg-rose-500/10", text: "text-rose-600" },
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

  // Calculate growth percentage
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  const newUsersToday = users.filter(u => {
    const userDate = new Date(u.createdAt);
    const today = new Date();
    return userDate.toDateString() === today.toDateString();
  }).length || 0;

  const topUsers = [...users]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

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
          
          <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md">
            <Sparkles className="h-4 w-4 mr-2" />
            Quick Report
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
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</h3>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                  <span className="text-sm font-medium text-emerald-600">
                    +{stats?.growthRate || 12.5}%
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
                <h3 className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</h3>
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 mr-2">
                      {stats?.todayOrders || 0} today
                    </Badge>
                    <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-200">
                      {stats?.pendingOrders || 0} pending
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
                <h3 className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</h3>
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
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.avgOrderValue || 0)}</h3>
                <div className="flex items-center mt-2">
                  <Crown className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-sm font-medium text-purple-600 capitalize">
                    {stats?.popularCategory || "Gold"} trending
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
                  {orders.length > 0 ? orders.map((order) => {
                    const statusStyle = getStatusBadge(order.status);
                    return (
                      <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {order.user?.username?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{order.user?.username || `User ${order.userId}`}</p>
                              <p className="text-xs text-gray-500">{order.user?.email || "No email"}</p>
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
                          <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0 font-medium px-2 py-1`}>
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
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Update Status</DropdownMenuItem>
                              <DropdownMenuItem className="text-rose-600">Cancel Order</DropdownMenuItem>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <div className="border-t px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {orders.length} of {stats?.totalOrders || 0} orders
              </div>
              <Button variant="outline" size="sm">
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
              <CardTitle className="text-lg">Top Customers</CardTitle>
              <CardDescription>Highest spending clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
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
                        <span className="text-xs text-emerald-600">Loyal</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle className="text-lg">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Order Completion</span>
                  <span className="font-semibold">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Customer Satisfaction</span>
                  <span className="font-semibold">94%</span>
                </div>
                <Progress value={94} className="h-2 bg-emerald-500/20" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Revenue Target</span>
                  <span className="font-semibold">72%</span>
                </div>
                <Progress value={72} className="h-2 bg-amber-500/20" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-auto py-3 flex flex-col items-center justify-center gap-2">
                <Bell className="h-5 w-5" />
                <span className="text-xs">Send Alert</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col items-center justify-center gap-2">
                <Download className="h-5 w-5" />
                <span className="text-xs">Export Data</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col items-center justify-center gap-2">
                <Filter className="h-5 w-5" />
                <span className="text-xs">Add Filter</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col items-center justify-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-xs">Add User</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
      </div>
  
  );
}