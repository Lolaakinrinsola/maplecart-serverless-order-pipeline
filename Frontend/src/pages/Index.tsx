import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { CheckoutForm } from "@/components/CheckoutForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import productImage from "@/assets/product-headphones.jpg";
import Layout from "@/components/Layout";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

const Index = () => {
  const [currentStep, setCurrentStep] = useState<"product" | "checkout" | "success">("product");
  const [orderItem, setOrderItem] = useState<OrderItem | null>(null);

  // Sample product data
  const product = {
    id: "headphones-premium",
    name: "Premium Wireless Headphones",
    price: 299.99,
    description: "Experience crystal-clear audio with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and comfortable over-ear design perfect for music lovers and professionals alike.",
    image: productImage,
    inStock: 15,
  };

  const handleAddToCart = (quantity: number) => {
    // In a real app, this would add to a cart state/context
    console.log(`Added ${quantity} items to cart`);
  };

  const handleBuyNow = (quantity: number) => {
    setOrderItem({
      name: product.name,
      price: product.price,
      quantity,
    });
    setCurrentStep("checkout");
  };

  const handleOrderComplete = () => {
    setCurrentStep("success");
    setOrderItem(null);
  };

  const handleBackToProduct = () => {
    setCurrentStep("product");
    setOrderItem(null);
  };

  const renderContent = () => {
    switch (currentStep) {
      case "product":
        return (
          <div className="max-w-[70vw] mx-auto">
            <ProductCard
              product={product}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          </div>
        );
      
      case "checkout":
        return (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={handleBackToProduct}
              className="transition-smooth hover:shadow-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Product
            </Button>
            {orderItem && (
              <CheckoutForm
                orderItem={orderItem}
                onOrderComplete={handleOrderComplete}
                onCancel={handleBackToProduct}
              />
            )}
          </div>
        );
      
      case "success":
        return (
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-full flex items-center justify-center shadow-primary">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Order Complete!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order has been submitted successfully and will be processed shortly.
            </p>
            <Button
              onClick={handleBackToProduct}
              className="bg-gradient-primary hover:shadow-primary transition-bounce"
            >
              Continue Shopping
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
   
<Layout>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
</Layout>

  );
};

export default Index;