import type { Express } from "express";
import type { Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Razorpay from "razorpay";
import crypto from "crypto";

let razorpay: Razorpay | null = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth setup
  setupAuth(app);

  // Products
  app.get(api.products.list.path, async (req, res) => {
    const category = req.query.category as string | undefined;
    const products = await storage.getProducts(category);
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProductBySlug(req.params.slug);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post(api.products.create.path, async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const product = await storage.createProduct(req.body);
    res.status(201).json(product);
  });

app.put("/api/products/:id", async (req, res) => {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const id = Number(req.params.id);
  const product = await storage.updateProduct(id, req.body);

  res.json(product);
});
app.delete("/api/products/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    await storage.deleteProduct(id);

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE PRODUCT ERROR:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
});
// ================= ADMIN ROUTES =================

// Get all users (ADMIN)
app.get("/api/admin/users", async (req, res) => {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const users = await storage.getAllUsers();
  res.json(users);
});

// Get all orders OR filter by userId (ADMIN)
app.get("/api/admin/orders", async (req, res) => {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.query.userId
    ? Number(req.query.userId)
    : undefined;

  const orders = await storage.getOrdersByUserId(userId);

  // Attach user details
  const ordersWithUser = await Promise.all(
    orders.map(async (order) => {
      const user = await storage.getUser(order.userId);
      return { ...order, user };
    })
  );

  res.json(ordersWithUser);
});




  // Cart
  app.get(api.cart.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const cart = await storage.getCartItems(req.user.id);
    res.json(cart);
  });
  

  app.post(api.cart.add.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const item = await storage.addToCart(req.user.id, req.body);
    res.json(item);
  });

  app.patch(api.cart.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const item = await storage.updateCartItem(parseInt(req.params.id), req.body.quantity);
    res.json(item);
  });

  app.delete(api.cart.remove.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    await storage.removeFromCart(parseInt(req.params.id));
    res.status(204).send();
  });

  // Orders
  app.post(api.orders.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const cartItems = await storage.getCartItems(req.user.id);
    if (cartItems.length === 0) return res.status(400).json({ message: "Cart is empty" });

    const totalAmount = cartItems.reduce((sum, item) => {
      const price = item.product.price ? parseFloat(item.product.price.toString()) : 0;
      return sum + (price * item.quantity);
    }, 0);

    const order = await storage.createOrder({
      ...req.body,
      userId: req.user.id,
      status: "pending",
      createdAt: new Date(),
      totalAmount: totalAmount.toString(),
    });

    for (const item of cartItems) {
      await storage.createOrderItem({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price
      });
    }

    await storage.clearCart(req.user.id);

    if (req.body.paymentMode === "razorpay") {
      if (!razorpay) return res.status(503).json({ message: "Razorpay payment is not configured" });
      try {
        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(totalAmount * 100),
          currency: "INR",
          receipt: `order_rcptid_${order.id}`,
        });
        await storage.updateOrder(order.id, { paymentId: razorpayOrder.id });
        return res.status(201).json({ ...order, razorpayOrderId: razorpayOrder.id });
      } catch (error) {
        console.error("Razorpay Error:", error);
        return res.status(500).json({ message: "Error creating Razorpay order" });
      }
    }

    if (req.body.paymentMode === "cod") {
      await storage.updateOrder(order.id, { status: "cod_confirmed" });
    }

    res.status(201).json(order);
  });

  app.post(api.orders.verifyPayment.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    if (!process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ message: "Razorpay not configured" });

    const { razorpayPaymentId, razorpaySignature } = req.body;
    const orderId = req.params.id;
    const order = await storage.getOrder(parseInt(orderId));

    if (!order || !order.paymentId) return res.status(404).json({ message: "Order not found" });

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(order.paymentId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generated_signature === razorpaySignature) {
      await storage.updateOrder(parseInt(orderId), { status: "paid" });
      res.json({ status: "success" });
    } else {
      res.status(400).json({ message: "Invalid payment signature" });
    }
  });

  app.get(api.orders.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const orders = await storage.getOrders(req.user.id);
    res.json(orders);
  });

  app.get(api.orders.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const order = await storage.getOrder(parseInt(req.params.id));
    if (!order || order.userId !== req.user.id) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });
  

  // Seed data
  await seedDatabase();

  return httpServer;
}

export async function seedDatabase() {
  const existingProducts = await storage.getProducts();
  if (existingProducts.length === 0) {
    console.log("Seeding database...");
    const products = [
      {
        name: "Royal Gold Mangalsutra",
        slug: "royal-gold-mangalsutra",
        description: "Traditional 22k gold mangalsutra with black beads.",
        price: "45000.00",
        originalPrice: "50000.00",
        category: "Mangalsutra",
        images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a"],
        stock: 10,
        isCodAvailable: true
      },
      {
        name: "Diamond Stud Earrings",
        slug: "diamond-stud-earrings",
        description: "Elegant solitaire diamond earrings.",
        price: "15000.00",
        originalPrice: "18000.00",
        category: "Earrings",
        images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908"],
        stock: 15,
        isCodAvailable: true
      },
      {
        name: "Antique Temple Necklace",
        slug: "antique-temple-necklace",
        description: "Handcrafted temple jewellery necklace.",
        price: "75000.00",
        originalPrice: "85000.00",
        category: "Necklaces",
        images: ["https://images.unsplash.com/photo-1601121141461-9d6647bca1ed"],
        stock: 5,
        isCodAvailable: false
      },
      {
        name: "Gold Plated Bangles Set",
        slug: "gold-plated-bangles",
        description: "Set of 4 traditional gold plated bangles.",
        price: "2500.00",
        originalPrice: "3000.00",
        category: "Bangles",
        images: ["https://images.unsplash.com/photo-1596944924616-b0e1215b63aa"],
        stock: 50,
        isCodAvailable: true
      }
    ];

    for (const p of products) {
      await storage.createProduct(p as any);
    }
    console.log("Database seeded!");
  }
}
