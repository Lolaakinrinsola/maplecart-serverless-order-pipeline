import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart, CreditCard } from "lucide-react";
import productImage from "@/assets/product-headphones.jpg";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  inStock: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (quantity: number) => void;
  onBuyNow: (quantity: number) => void;
}

export const ProductCard = ({ product, onAddToCart, onBuyNow }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.inStock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(quantity);
    toast({
      title: "Added to Cart",
      description: `${quantity} ${product.name}(s) added to your cart`,
    });
  };

  const handleBuyNow = () => {
    onBuyNow(quantity);
  };

  return (
    <Card className="overflow-hidden bg-card border-border shadow-elegant transition-smooth hover:shadow-primary">
      <div className="aspect-square bg-gradient-subtle p-8">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain transition-smooth hover:scale-105"
        />
      </div>
      
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            <Badge variant="secondary" className="text-sm">
              {product.inStock} in stock
            </Badge>
          </div>
          <p className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            ${product.price.toFixed(2)}
          </p>
          <p className="text-muted-foreground leading-relaxed">{product.description}</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Quantity:</label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="h-10 w-10 p-0 transition-smooth hover:shadow-primary"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= product.inStock}
                className="h-10 w-10 p-0 transition-smooth hover:shadow-primary"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleAddToCart}
              className="w-full h-12 transition-smooth hover:shadow-primary"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
            <Button
              onClick={handleBuyNow}
              className="w-full h-12 bg-gradient-primary hover:shadow-primary transition-bounce"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};