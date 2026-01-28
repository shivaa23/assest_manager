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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Trash, Edit, Plus, Eye, Search, X, Package, DollarSign, Hash, Tag } from "lucide-react";
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
  const [isViewImageDialogOpen, setIsViewImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-500">Access Denied</CardTitle>
            <CardDescription>This area is restricted to administrators only.</CardDescription>
          </CardHeader>
        </Card>
      </div>
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

  /* -------------------- CATEGORIES -------------------- */
  const categories = Array.from(new Set(products?.map(p => p.category).filter(Boolean) || []));
  
  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

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
      toast({ 
        title: "Success", 
        description: editingProduct ? "Product updated successfully" : "Product added successfully" 
      });
      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData(emptyForm);
    },

    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to save product",
        variant: "destructive",
      });
    },
  });

  /* -------------------- DELETE -------------------- */
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete product");
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ 
        title: "Success", 
        description: "Product deleted successfully" 
      });
    },

    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to delete product",
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

  const openImageDialog = (image: string) => {
    setSelectedImage(image);
    setIsViewImageDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      category: formData.category.trim(),
      price: Number(formData.price),
      originalPrice: formData.originalPrice
        ? Number(formData.originalPrice)
        : undefined,
      description: formData.description.trim(),
      images: formData.images,
      stock: formData.stock,
      isCodAvailable: formData.isCodAvailable,
    };

    saveProductMutation.mutate(productData);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    if (files.length + (formData.images?.length || 0) > 10) {
      toast({
        title: "Too many images",
        description: "Maximum 10 images allowed per product",
        variant: "destructive",
      });
      return;
    }

    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            // Validate file type
            if (!file.type.startsWith('image/')) {
              reject(new Error('Only image files are allowed'));
              return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
              reject(new Error('Image size should be less than 5MB'));
              return;
            }

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          })
      )
    )
    .then((imgs) => {
      setFormData((prev) => ({ 
        ...prev, 
        images: [...(prev.images || []), ...imgs] 
      }));
    })
    .catch((err) => {
      toast({
        title: "Upload Error",
        description: err.message,
        variant: "destructive",
      });
    });
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const confirmDelete = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-2">Manage your products, inventory, and pricing</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold">{products?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Tag className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">{categories.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Hash className="h-5 w-5 text-purple-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {products?.reduce((sum, p) => sum + (p.stock || 0), 0) || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={openAddDialog} className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Add Product
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search products by name or category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(searchQuery || selectedCategory !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="whitespace-nowrap"
                  >
                    <X className="h-4 w-4 mr-2" /> Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-gray-500">
                            {searchQuery || selectedCategory !== "all" ? "No products match your filters" : "No products found"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono">{product.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.images?.[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-10 w-10 rounded-md object-cover cursor-pointer"
                                  onClick={() => openImageDialog(product.images[0])}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.slug}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">${product.price}</div>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <div className="text-sm text-gray-500 line-through">
                                ${product.originalPrice}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={product.stock > 10 ? "secondary" : product.stock > 0 ? "outline" : "destructive"}
                            >
                              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.isCodAvailable ? "default" : "secondary"}>
                              {product.isCodAvailable ? "COD Available" : "No COD"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              {product.images?.[0] && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openImageDialog(product.images[0])}
                                  title="View Image"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditDialog(product)}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => confirmDelete(product)}
                                title="Delete"
                                disabled={deleteProductMutation.isPending}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Add/Edit Product Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct 
                    ? "Update product details below"
                    : "Fill in the details to add a new product"
                  }
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        placeholder="Enter product name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value })
                        }
                        placeholder="auto-generated-slug"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-generated from name. Use lowercase letters, numbers, and hyphens.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        required
                        placeholder="e.g., Electronics, Clothing"
                        list="categories"
                      />
                      <datalist id="categories">
                        {categories.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Pricing & Stock */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price ($) *</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({ ...formData, price: e.target.value })
                          }
                          required
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label htmlFor="originalPrice">Original Price ($)</Label>
                        <Input
                          id="originalPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.originalPrice}
                          onChange={(e) =>
                            setFormData({ ...formData, originalPrice: e.target.value })
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="stock">Stock Quantity *</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock.toString()}
                        onChange={(e) =>
                          setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                        }
                        required
                        placeholder="0"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="cod">Cash on Delivery</Label>
                        <p className="text-sm text-gray-500">
                          Allow customers to pay with cash on delivery
                        </p>
                      </div>
                      <Switch
                        id="cod"
                        checked={formData.isCodAvailable}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isCodAvailable: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full border rounded-md p-3 min-h-[120px]"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter product description..."
                  />
                </div>

                {/* Images */}
                <div>
                  <Label>Product Images</Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Upload up to 10 images. First image will be the main display image.
                  </p>
                  
                  <Input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mb-4"
                  />

                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="h-24 w-full object-cover rounded-md"
                            onClick={() => openImageDialog(img)}
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {index === 0 && (
                            <Badge className="absolute top-1 left-1 bg-blue-500">Main</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={saveProductMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saveProductMutation.isPending}
                  >
                    {saveProductMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        {editingProduct ? "Update Product" : "Add Product"}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Image View Dialog */}
          <Dialog open={isViewImageDialogOpen} onOpenChange={setIsViewImageDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Product Image</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center">
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt="Product"
                    className="max-h-[70vh] max-w-full object-contain rounded-lg"
                  />
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setIsViewImageDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}