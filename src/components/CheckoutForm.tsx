import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitOrder } from "@/services/orderService";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutFormProps {
  orderItem: OrderItem;
  onOrderComplete: () => void;
  onCancel: () => void;
}

export const CheckoutForm = ({ orderItem, onOrderComplete, onCancel }: CheckoutFormProps) => {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    zipCode: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const total = orderItem.price * orderItem.quantity;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const orderData = {
        item: orderItem.name,
        quantity: orderItem.quantity,
        price: orderItem.price,
        total,
        customer: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode,
        },
        orderDate: new Date().toISOString(),
      };

      await submitOrder(orderData);
      
      toast({
        title: "Order Successful!",
        description: "Your order has been submitted successfully.",
        variant: "default",
      });
      
      onOrderComplete();
    } catch (error) {
      console.error("Order submission failed:", error);
      toast({
        title: "Order Failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = Object.values(formData).every(value => value.trim() !== "");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6 bg-gradient-subtle border-border shadow-elegant">
        <div className="flex items-center gap-3 mb-4">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Order Summary</h2>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{orderItem.name}</span>
            <Badge variant="secondary">Qty: {orderItem.quantity}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Unit Price</span>
            <span>${orderItem.price.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total</span>
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-border shadow-elegant">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Customer Information</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="John"
                required
                className="transition-smooth focus:shadow-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Doe"
                required
                className="transition-smooth focus:shadow-primary"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="john.doe@example.com"
              required
              className="transition-smooth focus:shadow-primary"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="123 Main Street"
              required
              className="transition-smooth focus:shadow-primary"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="New York"
                required
                className="transition-smooth focus:shadow-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                placeholder="10001"
                required
                className="transition-smooth focus:shadow-primary"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-12 transition-smooth"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="flex-1 h-12 bg-gradient-primary hover:shadow-primary transition-bounce"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Complete Order
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};