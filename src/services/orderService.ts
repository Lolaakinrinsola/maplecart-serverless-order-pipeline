// Azure Function integration service for order processing

export interface OrderData {
  item: string;
  quantity: number;
  price: number;
  total: number;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    zipCode: string;
  };
  orderDate: string;
}

export interface OrderResponse {
  success: boolean;
  orderId?: string;
  message?: string;
}

// Azure Function endpoint - replace with your actual endpoint
const AZURE_FUNCTION_ENDPOINT = "https://your-function-app.azurewebsites.net/api/CreateOrder";

export const submitOrder = async (orderData: OrderData): Promise<OrderResponse> => {
  try {
    console.log("Submitting order to Azure Function:", orderData);
    
    const response = await fetch(AZURE_FUNCTION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Order response:", result);
    
    return {
      success: true,
      orderId: result.orderId || `ORDER-${Date.now()}`,
      message: result.message || "Order processed successfully",
    };
    
  } catch (error) {
    console.error("Error submitting order:", error);
    
    // For demo purposes, simulate success after logging the error
    // In production, you'd want to handle this properly
    return {
      success: false,
      message: `Order submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

// Helper function to validate order data before submission
export const validateOrderData = (orderData: OrderData): boolean => {
  const requiredFields = [
    orderData.item,
    orderData.customer.email,
    orderData.customer.firstName,
    orderData.customer.lastName,
  ];
  
  return requiredFields.every(field => field && field.toString().trim() !== "");
};