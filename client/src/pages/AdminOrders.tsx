// src/pages/AdminOrders.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  Table, TableHeader, TableBody, TableRow, TableCell 
} from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";

type User = { id: number; username: string; email: string };
type Order = {
  id: number;
  userId: number;
  user?: User;
  totalAmount: string;
  status: "pending" | "paid" | "cod_confirmed" | "shipped" | "delivered" | "cancelled";
  paymentMode: "cod" | "razorpay";
  createdAt: string;
};

export default function AdminOrders() {
  const [selectedUser, setSelectedUser] = useState<number | "all">("all");

  // Fetch all users
  const { data: usersData, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/users");
      // Ensure array
      return Array.isArray(res.data) ? res.data : res.data.users || [];
    },
  });

  const users = usersData || [];

  // Fetch orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["admin-orders", selectedUser],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedUser !== "all") params.append("userId", selectedUser.toString());
      const res = await axios.get(`/api/admin/orders?${params.toString()}`);
      // Ensure we always get an array
      return Array.isArray(res.data) ? res.data : res.data.orders || [];
    },
  });

  const orders = ordersData || [];

  // Format INR currency
  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(Number(amount));

  // Status badge styles
  const getStatusBadge = (status: Order["status"]) => {
    const map: Record<Order["status"], string> = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-blue-100 text-blue-800",
      cod_confirmed: "bg-purple-100 text-purple-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return map[status] || "bg-gray-100 text-gray-800";
  };

  if (usersLoading || ordersLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Summary stats
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.status === "paid").length;
  const codOrders = orders.filter(o => o.status === "cod_confirmed").length;

  return (
    <>   <div className="min-h-screen flex flex-col">
           <Navbar />
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Orders</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{totalOrders}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Paid Orders</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{paidOrders}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>COD Orders</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{codOrders}</CardContent>
        </Card>
      </div>

      {/* User Filter */}
      <div className="flex items-center gap-4">
        <Select
          value={selectedUser}
          onValueChange={v => setSelectedUser(v === "all" ? "all" : Number(v))}
        >
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Filter by user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader><CardTitle>All Orders</CardTitle></CardHeader>
        <CardContent>
          {orders.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment Mode</TableCell>
                  <TableCell>Created At</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.user?.username || `User ${order.userId}`}</TableCell>
                    <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(order.status)}>
                        {order.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.paymentMode === "cod" ? "Cash on Delivery" : "Online Payment"}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">No orders found</div>
          )}
        </CardContent>
      </Card>
    </div>
      </div>
    </>
  );
}
