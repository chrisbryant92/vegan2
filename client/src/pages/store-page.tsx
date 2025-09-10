import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: number;
  printfulId: number;
  name: string;
  description?: string;
  image?: string;
  category?: string;
  isActive: boolean;
  variants?: ProductVariant[];
}

interface ProductVariant {
  id: number;
  productId: number;
  printfulVariantId: number;
  name: string;
  size?: string;
  color?: string;
  colorCode?: string;
  price: number;
  currency: string;
  image?: string;
  isAvailable: boolean;
}

interface CartItem {
  id: number;
  userId: number;
  productId: number;
  variantId: number;
  quantity: number;
  product: Product;
  variant: ProductVariant;
}

export default function StorePage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/store/products"],
  });

  // Fetch cart items
  const { data: cartItems = [], isLoading: cartLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/store/cart"],
    enabled: isAuthenticated,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (data: { productId: number; variantId: number; quantity: number }) => {
      return apiRequest("/api/store/cart", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/cart"] });
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update cart item mutation
  const updateCartMutation = useMutation({
    mutationFn: async (data: { id: number; quantity: number }) => {
      return apiRequest(`/api/store/cart/${data.id}`, "PUT", { quantity: data.quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/cart"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/store/cart/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/cart"] });
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (productId: number, variantId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add items to cart.",
        variant: "destructive",
      });
      return;
    }
    addToCartMutation.mutate({ productId, variantId, quantity: 1 });
  };

  const handleUpdateCart = (id: number, quantity: number) => {
    updateCartMutation.mutate({ id, quantity });
  };

  const handleRemoveFromCart = (id: number) => {
    removeFromCartMutation.mutate(id);
  };

  const cartTotal = cartItems.reduce((sum: number, item: CartItem) => 
    sum + (item.variant.price * item.quantity), 0
  );

  const cartItemCount = cartItems.reduce((sum: number, item: CartItem) => 
    sum + item.quantity, 0
  );

  if (productsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vegan 2.0 Store</h1>
          <p className="text-gray-600">Support animal advocacy with our merchandise</p>
        </div>
        {isAuthenticated && (
          <Button
            variant="outline"
            onClick={() => setActiveTab("cart")}
            className="relative"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Cart
            {cartItemCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs">
                {cartItemCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="cart" disabled={!isAuthenticated}>
            Cart {cartItemCount > 0 && `(${cartItemCount})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products available</h3>
              <p className="text-gray-600">Check back soon for new merchandise!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: Product) => (
                <Card key={product.id} className="overflow-hidden">
                  {product.image && (
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    {product.description && (
                      <CardDescription>{product.description}</CardDescription>
                    )}
                    {product.category && (
                      <Badge variant="secondary" className="w-fit">
                        {product.category}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    {product.variants && product.variants.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Variants:</p>
                        <div className="space-y-2">
                          {product.variants.map((variant) => (
                            <div
                              key={variant.id}
                              className="flex items-center justify-between p-2 border rounded-lg"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">{variant.name}</span>
                                {variant.colorCode && (
                                  <div
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: variant.colorCode }}
                                  />
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">
                                  ${variant.price.toFixed(2)}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => handleAddToCart(product.id, variant.id)}
                                  disabled={addToCartMutation.isPending || !variant.isAvailable}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cart" className="space-y-6">
          {cartLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading cart...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600 mb-4">Add some products to get started!</p>
              <Button onClick={() => setActiveTab("products")}>
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
              
              <div className="space-y-4">
                {cartItems.map((item: CartItem) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {item.variant.image && (
                            <img
                              src={item.variant.image}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold">{item.product.name}</h3>
                            <p className="text-sm text-gray-600">{item.variant.name}</p>
                            <p className="font-semibold">${item.variant.price.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateCart(item.id, item.quantity - 1)}
                            disabled={updateCartMutation.isPending}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateCart(item.id, item.quantity + 1)}
                            disabled={updateCartMutation.isPending}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveFromCart(item.id)}
                            disabled={removeFromCartMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total: ${cartTotal.toFixed(2)}</span>
                    <Button size="lg">
                      Proceed to Checkout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}