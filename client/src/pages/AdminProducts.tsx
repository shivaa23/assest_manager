// src/pages/AdminProducts.tsx
import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Product } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash, Edit, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";

/* -------------------- TYPES -------------------- */
type ProductForm = {
  name: string;
  slug: string;
  category: string;
  price: string;
  originalPrice: string;
  description: string;
  images: string[];
  stock: number;
  isCodAvailable: boolean;
};

/* -------------------- COMPONENT -------------------- */
export default function AdminProducts() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const emptyForm: ProductForm = {
    name: "",
    slug: "",
    category: "",
    price: "",
    originalPrice: "",
    description: "",
    images: [],
    stock: 0,
    isCodAvailable: true,
  };

  const [formData, setFormData] = useState<ProductForm>(emptyForm);

  /* -------------------- AUTH -------------------- */
  if (!user) return null;
  if (!user.isAdmin) {
    return (
      <p className="text-center mt-20 text-red-500">
        Access Denied. Admins only.
      </p>
    );
  }

  /* -------------------- FETCH PRODUCTS -------------------- */
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json() as Promise<Product[]>;
    },
  });

  /* -------------------- ADD / UPDATE -------------------- */
  const saveProductMutation = useMutation({
    mutationFn: async (product: Partial<Product>) => {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : `/api/products`;

      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product saved successfully" });
      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData(emptyForm);
    },

    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  /* -------------------- DELETE -------------------- */
const deleteProductMutation = useMutation({
  mutationFn: async (id: number) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      credentials: "include", // VERY IMPORTANT
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to delete product");
    }

    return res.json(); // { success: true }
  },

  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    toast({ title: "Product deleted successfully" });
  },

  onError: (err: any) => {
    toast({
      title: "Error",
      description: err.message,
      variant: "destructive",
    });
  },
});

  /* -------------------- AUTO SLUG -------------------- */
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      slug: prev.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-"),
    }));
  }, [formData.name]);

  /* -------------------- HANDLERS -------------------- */
  const openAddDialog = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      category: product.category,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || "",
      description: product.description || "",
      images: product.images || [],
      stock: product.stock || 0,
      isCodAvailable: product.isCodAvailable ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    saveProductMutation.mutate({
      name: formData.name,
      slug: formData.slug,
      category: formData.category,
      price: Number(formData.price),
      originalPrice: formData.originalPrice
        ? Number(formData.originalPrice)
        : undefined,
      description: formData.description,
      images: formData.images,
      stock: formData.stock,
      isCodAvailable: formData.isCodAvailable,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    ).then((imgs) =>
      setFormData((prev) => ({ ...prev, images: imgs }))
    );
  };

  /* -------------------- UI -------------------- */
  return (
    <>
     <div className="min-h-screen flex flex-col">
       <Navbar />
    <div className="p-8">
            
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Products</h1>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5}>Loading...</TableCell>
            </TableRow>
          ) : (
            products?.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.id}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEditDialog(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {/* <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteProductMutation.mutate(product.id)}
                    >
                    <Trash className="h-4 w-4 text-red-500" />
                    </Button> */}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* -------------------- DIALOG -------------------- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Category</Label>
              <Input
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Price</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                className="w-full border rounded p-2"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Images</Label>
              <Input type="file" multiple onChange={handleImageUpload} />
            </div>

            <DialogFooter>
              <Button type="submit">
                {editingProduct ? "Update" : "Add"} Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
    
    </>
    
  );
}
