// src/pages/AdminOrders.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableCell,
  TableHead 
} from "@/components/ui/table";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  MoreVertical, 
  Eye, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  User,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { format } from "date-fns";
import { toast } from "sonner";

type User = { 
  id: number; 
  username: string; 
  email: string;
  createdAt: string;
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
  user?: User;
  totalAmount: string;
  status: "pending" | "paid" | "cod_confirmed" | "shipped" | "delivered" | "cancelled";
  paymentMode: "cod" | "razorpay";
  paymentId: string | null;
  shiprocketOrderId: string | null;
  address: Address;
  createdAt: string;
  updatedAt?: string;
};

type OrderStats = {
  totalOrders: number;
  totalRevenue: number;
  paidOrders: number;
  codOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
};

export default function AdminOrders() {
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Order["status"]>("pending");
  const queryClient = useQueryClient();

  // Fetch all users
  const { 
    data: usersData, 
    isLoading: usersLoading,
    isError: usersError,
    error: usersErrorDetail 
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      try {
        const res = await axios.get("/api/admin/users");
        // Handle different response formats
        if (Array.isArray(res.data)) {
          return res.data;
        } else if (res.data && Array.isArray(res.data.users)) {
          return res.data.users;
        } else if (res.data && Array.isArray(res.data.data)) {
          return res.data.data;
        }
        return [];
      } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
    },
    retry: 1,
  });

  const users = usersData || [];

  // Fetch orders
  const { 
    data: ordersData, 
    isLoading: ordersLoading, 
    isError: ordersError,
    error: ordersErrorDetail,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ["admin-orders", selectedUser, statusFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (selectedUser !== "all") params.append("userId", selectedUser);
        if (statusFilter !== "all") params.append("status", statusFilter);
        
        const res = await axios.get(`/api/admin/orders?${params.toString()}`);
        
        // Handle different response formats
        if (Array.isArray(res.data)) {
          return res.data;
        } else if (res.data && Array.isArray(res.data.orders)) {
          return res.data.orders;
        } else if (res.data && Array.isArray(res.data.data)) {
          return res.data.data;
        }
        return [];
      } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }
    },
    retry: 1,
  });

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: Order["status"] }) => {
      const res = await axios.put(`/api/admin/orders/${orderId}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated successfully");
      setIsUpdateDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         "Failed to update order status";
      toast.error(errorMessage);
    },
  });

  // Cancel order mutation
  const cancelOrder = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await axios.put(`/api/admin/orders/${orderId}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order cancelled successfully");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         "Failed to cancel order";
      toast.error(errorMessage);
    },
  });

  const orders = ordersData || [];

  // Calculate statistics
  const stats: OrderStats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
    paidOrders: orders.filter(o => o.status === "paid").length,
    codOrders: orders.filter(o => o.status === "cod_confirmed").length,
    pendingOrders: orders.filter(o => o.status === "pending").length,
    shippedOrders: orders.filter(o => o.status === "shipped").length,
    deliveredOrders: orders.filter(o => o.status === "delivered").length,
    cancelledOrders: orders.filter(o => o.status === "cancelled").length,
  };

  // Filter orders by search query
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toString().includes(query) ||
      (order.user?.username || "").toLowerCase().includes(query) ||
      (order.address?.fullName || "").toLowerCase().includes(query) ||
      (order.address?.phone || "").includes(query) ||
      order.status.toLowerCase().includes(query)
    );
  });

  // Format INR currency
  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(Number(amount || 0));

  // Status badge component
  const StatusBadge = ({ status }: { status: Order["status"] }) => {
    const statusConfig: Record<Order["status"], { label: string; className: string; icon: React.ReactNode }> = {
      pending: {
        label: "Pending",
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
        icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />
      },
      paid: {
        label: "Paid",
        className: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
        icon: <CreditCard className="h-3 w-3 mr-1" />
      },
      cod_confirmed: {
        label: "COD Confirmed",
        className: "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200",
        icon: <Package className="h-3 w-3 mr-1" />
      },
      shipped: {
        label: "Shipped",
        className: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200",
        icon: <Truck className="h-3 w-3 mr-1" />
      },
      delivered: {
        label: "Delivered",
        className: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      cancelled: {
        label: "Cancelled",
        className: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
    };

    const config = statusConfig[status] || { 
      label: status, 
      className: "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200", 
      icon: null 
    };

    return (
      <Badge variant="outline" className={`flex items-center w-fit border ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // Export orders to CSV
  const exportToCSV = () => {
    const headers = ["Order ID", "Customer", "Amount", "Status", "Payment", "Date", "Address"];
    const csvData = filteredOrders.map(order => [
      order.id,
      order.user?.username || `User ${order.userId}`,
      order.totalAmount,
      order.status,
      order.paymentMode === "cod" ? "Cash on Delivery" : "Online Payment",
      new Date(order.createdAt).toLocaleString(),
      `${order.address?.street || ""}, ${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.pincode || ""}`
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Orders exported to CSV");
  };

  // Handle status change for dropdown
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  // Handle user change for dropdown
  const handleUserChange = (value: string) => {
    setSelectedUser(value);
  };

  // Get available status options based on current order status
  const getAvailableStatusOptions = (currentStatus: Order["status"]): Order["status"][] => {
    const transitions: Record<Order["status"], Order["status"][]> = {
      pending: ['paid', 'cod_confirmed', 'cancelled'],
      paid: ['shipped', 'cancelled'],
      cod_confirmed: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: []
    };
    return transitions[currentStatus] || [];
  };

  if (usersLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-lg font-semibold text-gray-900">Loading Orders</p>
              <p className="text-gray-600">Please wait while we fetch your data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (usersError || ordersError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4">
          <div className="text-center space-y-4 max-w-md">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <div>
              <p className="text-lg font-semibold text-gray-900">Error Loading Data</p>
              <p className="text-gray-600">
                {usersErrorDetail?.message || ordersErrorDetail?.message || "Failed to load data. Please try again."}
              </p>
            </div>
            <Button onClick={() => refetch()} className="mt-4">
              <Filter className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all customer orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
              <p className="text-sm text-gray-600 mt-1">All time orders</p>
            </CardContent>
          </Card>

          <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-sm text-gray-600 mt-1">Overall revenue</p>
            </CardContent>
          </Card>

          <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.pendingOrders}</div>
              <p className="text-sm text-gray-600 mt-1">Awaiting processing</p>
            </CardContent>
          </Card>

          <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Delivered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.deliveredOrders}</div>
              <p className="text-sm text-gray-600 mt-1">Successfully delivered</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters & Actions
            </CardTitle>
            <CardDescription>Filter orders by user, status, or search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="search" className="flex items-center">
                  <Search className="h-4 w-4 mr-2" />
                  Search Orders
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by ID, name, phone..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* User Filter */}
              <div className="space-y-2">
                <Label htmlFor="user-filter" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Filter by User
                </Label>
                <Select value={selectedUser} onValueChange={handleUserChange}>
                  <SelectTrigger id="user-filter" className="w-full">
                    <SelectValue placeholder="All Users">
                      {selectedUser === "all" ? "All Users" : 
                       users.find(u => u.id.toString() === selectedUser)?.username || "Select User"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()} className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status-filter" className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Filter by Status
                </Label>
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger id="status-filter" className="w-full">
                    <SelectValue placeholder="All Status">
                      {statusFilter === "all" ? "All Status" : 
                       statusFilter.replace("_", " ").charAt(0).toUpperCase() + 
                       statusFilter.replace("_", " ").slice(1)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center">
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="paid">
                      <div className="flex items-center">
                        <CreditCard className="h-3 w-3 mr-2" />
                        Paid
                      </div>
                    </SelectItem>
                    <SelectItem value="cod_confirmed">
                      <div className="flex items-center">
                        <Package className="h-3 w-3 mr-2" />
                        COD Confirmed
                      </div>
                    </SelectItem>
                    <SelectItem value="shipped">
                      <div className="flex items-center">
                        <Truck className="h-3 w-3 mr-2" />
                        Shipped
                      </div>
                    </SelectItem>
                    <SelectItem value="delivered">
                      <div className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Delivered
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center">
                        <XCircle className="h-3 w-3 mr-2" />
                        Cancelled
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Actions
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={exportToCSV}
                    disabled={filteredOrders.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">Export</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                  >
                    {isRefetching ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Filter className="h-4 w-4 mr-2" />
                    )}
                    <span className="hidden sm:inline">
                      {isRefetching ? "Refreshing..." : "Refresh"}
                    </span>
                    <span className="sm:hidden">
                      {isRefetching ? "..." : "Refresh"}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  All Orders
                </CardTitle>
                <CardDescription>
                  {filteredOrders.length} orders found • 
                  Last updated: {format(new Date(), "hh:mm:ss a")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isRefetching && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Syncing...
                  </Badge>
                )}
                <Badge variant="outline" className="text-sm">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(), "dd MMM yyyy")}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrders.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Order ID</TableHead>
                        <TableHead className="whitespace-nowrap">Customer</TableHead>
                        <TableHead className="whitespace-nowrap">Amount</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Payment</TableHead>
                        <TableHead className="whitespace-nowrap">Date</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map(order => (
                        <TableRow key={order.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Package className="h-4 w-4 mr-2 text-gray-400" />
                              #{order.id}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {order.user?.username || `User ${order.userId}`}
                              </p>
                              <p className="text-sm text-gray-500 flex items-center mt-1">
                                <span className="truncate">{order.address?.phone || "No phone"}</span>
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(order.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              order.paymentMode === "cod" 
                                ? "border-purple-200 text-purple-800 bg-purple-50" 
                                : "border-green-200 text-green-800 bg-green-50"
                            }>
                              {order.paymentMode === "cod" ? (
                                <>
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  COD
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Online
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">{format(new Date(order.createdAt), "dd MMM yyyy")}</p>
                              <p className="text-gray-500">{format(new Date(order.createdAt), "hh:mm a")}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setIsViewDialogOpen(true);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setSelectedStatus(order.status);
                                    setIsUpdateDialogOpen(true);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Package className="h-4 w-4 mr-2" />
                                  Update Status
                                </DropdownMenuItem>
                                {order.status !== "cancelled" && 
                                 order.status !== "delivered" && (
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      if (window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
                                        cancelOrder.mutate(order.id);
                                      }
                                    }}
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel Order
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No orders found</h3>
                <p className="text-gray-600 mt-2 max-w-md mx-auto">
                  {searchQuery || statusFilter !== "all" || selectedUser !== "all" 
                    ? "Try adjusting your search or filters to find what you're looking for." 
                    : "No orders have been placed yet. Orders will appear here once customers start shopping."}
                </p>
                {(searchQuery || statusFilter !== "all" || selectedUser !== "all") && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setSelectedUser("all");
                    }}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Order Details #{selectedOrder.id}
                </DialogTitle>
                <DialogDescription>
                  Order placed on {format(new Date(selectedOrder.createdAt), "PPpp")}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Information */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        Order Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Order ID:</span>
                        <span className="font-medium">#{selectedOrder.id}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status:</span>
                        <StatusBadge status={selectedOrder.status} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Payment Mode:</span>
                        <span className="font-medium">
                          {selectedOrder.paymentMode === "cod" ? "Cash on Delivery" : "Online Payment"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-semibold text-lg">{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                      {selectedOrder.paymentId && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Payment ID:</span>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {selectedOrder.paymentId}
                          </code>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Customer Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Username:</span>
                        <span className="font-medium">{selectedOrder.user?.username || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Full Name:</span>
                        <span className="font-medium">{selectedOrder.address?.fullName || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedOrder.address?.phone || "N/A"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Shipping Address */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Truck className="h-4 w-4 mr-2" />
                        Shipping Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
                        <p className="font-medium">{selectedOrder.address?.fullName || "N/A"}</p>
                        <p className="text-gray-600">{selectedOrder.address?.street || "N/A"}</p>
                        <p className="text-gray-600">
                          {selectedOrder.address?.city || "N/A"}, {selectedOrder.address?.state || "N/A"} - {selectedOrder.address?.pincode || "N/A"}
                        </p>
                        <div className="pt-2 mt-2 border-t">
                          <p className="text-gray-600 flex items-center">
                            <span className="font-medium mr-2">Phone:</span>
                            {selectedOrder.address?.phone || "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Additional Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Shiprocket Order ID:</span>
                        <span className="font-medium">
                          {selectedOrder.shiprocketOrderId || (
                            <span className="text-yellow-600">Not assigned</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Created At:</span>
                        <span className="font-medium">
                          {format(new Date(selectedOrder.createdAt), "PPpp")}
                        </span>
                      </div>
                      {selectedOrder.updatedAt && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Last Updated:</span>
                          <span className="font-medium">
                            {format(new Date(selectedOrder.updatedAt), "PPpp")}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setSelectedOrder(selectedOrder);
                    setSelectedStatus(selectedOrder.status);
                    setIsUpdateDialogOpen(true);
                  }}
                  className="w-full sm:w-auto"
                >
                  Update Status
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Update Order Status
            </DialogTitle>
            <DialogDescription>
              Update status for Order #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="status" className="text-base">Select New Status</Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value: Order["status"]) => setSelectedStatus(value)}
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableStatusOptions(selectedOrder.status).map(status => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center">
                            {status === "pending" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {status === "paid" && <CreditCard className="h-4 w-4 mr-2" />}
                            {status === "cod_confirmed" && <Package className="h-4 w-4 mr-2" />}
                            {status === "shipped" && <Truck className="h-4 w-4 mr-2" />}
                            {status === "delivered" && <CheckCircle className="h-4 w-4 mr-2" />}
                            {status === "cancelled" && <XCircle className="h-4 w-4 mr-2" />}
                            {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStatus === selectedOrder.status && (
                    <p className="text-sm text-yellow-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Status is already set to {selectedStatus}
                    </p>
                  )}
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Current Order Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600">Order ID:</span>
                        <p className="font-medium">#{selectedOrder.id}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Customer:</span>
                        <p className="font-medium truncate">{selectedOrder.address?.fullName || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <p className="font-medium">{formatCurrency(selectedOrder.totalAmount)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Current Status:</span>
                        <div className="mt-1">
                          <StatusBadge status={selectedOrder.status} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsUpdateDialogOpen(false)}
                  disabled={updateOrderStatus.isPending}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    updateOrderStatus.mutate({
                      orderId: selectedOrder.id,
                      status: selectedStatus
                    });
                  }}
                  disabled={updateOrderStatus.isPending || selectedStatus === selectedOrder.status}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  {updateOrderStatus.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Status"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}