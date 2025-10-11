# Phase 6: Frontend Integration & Deployment

## Objective

Integrate the frontend React dashboard with your own Azure Function backend and deploy it as a production-ready static web app using **Azure Static Web Apps**. This phase focuses on:

* Connecting frontend to backend via environment variables
* Handling CORS configuration
* Setting up SPA routing
* Deploying through Azure Static Web Apps CI/CD pipeline

---

## ⚙️ Step-by-Step Implementation

### 1. Create the **GetOrders** Function

Create a new file: `src/functions/GetOrders/index.js`

```js
const { app } = require('@azure/functions');
const sql = require('mssql');
const { CosmosClient } = require('@azure/cosmos');
const { DefaultAzureCredential } = require('@azure/identity');

app.http('GetOrders', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (req, ctx) => {
    try {
      const source = req.query.get('source') || 'sql'; // 'sql' or 'cosmos'

      if (source === 'sql') {
        const credential = new DefaultAzureCredential();
        const token = await credential.getToken('https://database.windows.net/');
        await sql.connect({
          server: process.env.SQL_SERVER,
          database: process.env.SQL_DATABASE,
          options: { encrypt: true },
          authentication: {
            type: 'azure-active-directory-access-token',
            options: { token: token.token },
          },
        });

        const result = await sql.query`
          SELECT TOP 20 OrderId, Item, Total, City, OrderDate
          FROM Orders ORDER BY OrderDate DESC
        `;
        return { status: 200, jsonBody: result.recordset };
      }

      // Cosmos DB path
      const client = new CosmosClient(process.env.COSMOS_CONN);
      const container = client.database('OrdersDB').container('OrdersSummary');
      const { resources } = await container.items
        .query('SELECT * FROM c ORDER BY c.createdAt DESC OFFSET 0 LIMIT 20')
        .fetchAll();

      return { status: 200, jsonBody: resources };
    } catch (err) {
      ctx.log(`Error fetching orders: ${err.message}`);
      return { status: 500, jsonBody: { message: err.message } };
    }
  },
});
```

**Deploy your function:**

```bash
cd backend
func azure functionapp publish <your-function-app-name>
```

**Test the API:**

```bash
curl https://<your-function-app-name>.azurewebsites.net/api/GetOrders?source=sql
curl https://<your-function-app-name>.azurewebsites.net/api/GetOrders?source=cosmos
```

 You should see a JSON array of recent orders.

---

### 2. Create the Frontend Service

**File:** `src/services/orderService.ts`

```ts
export async function fetchOrders(source = 'sql') {
  const response = await fetch(
    `${import.meta.env.VITE_AZURE_FUNCTION_ENDPOINT}/GetOrders?source=${source}`
  );
  if (!response.ok) throw new Error('Failed to fetch orders');
  return await response.json();
}
```

Use an environment variable (`VITE_AZURE_FUNCTION_ENDPOINT`) instead of hardcoding your Azure Function URL.

---

### 3. Build the Dashboard Page

**File:** `src/pages/Dashboard.tsx`

```tsx
import { useEffect, useState } from 'react';
import { fetchOrders } from '../services/orderService';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders('sql')
      .then((data) => setOrders(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading recent orders...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (orders.length === 0) return <p>No recent orders found.</p>;

  return (
    <div>
      <h2>Recent Orders</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Item</th><th>Total</th><th>City</th><th>Date</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.OrderId}>
              <td>{o.OrderId}</td>
              <td>{o.Item}</td>
              <td>${o.Total}</td>
              <td>{o.City}</td>
              <td>{new Date(o.OrderDate).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### 4. Configure CORS for Your Function App

Allow your static web app’s domain in the Azure Function.

```bash
az functionapp cors add \
  --name <your-function-app-name> \
  --resource-group <your-resource-group> \
  --allowed-origins https://<your-static-app-name>.2.azurestaticapps.net
```

 * [CORS Configured](../docs/images/phase6/function%20app%20cors%20for%20the%20static%20app.png)

---

### 5. Add Environment Variables to Your Static Web App

**Portal Method:**

1. Go to **Azure Portal → Static Web App → Environment variables**
2. Add:

| Name                           | Value                                                    |
| ------------------------------ | -------------------------------------------------------- |
| `VITE_AZURE_FUNCTION_ENDPOINT` | `https://<your-function-app-name>.azurewebsites.net/api` |
| `VITE_ENVIRONMENT`             | `production`                                             |

Click **Save**, then **Confirm Restart**.

**CLI Alternative:**

```bash
az staticwebapp appsettings set \
  --name <your-static-app-name> \
  --resource-group <your-resource-group> \
  --setting-names "VITE_AZURE_FUNCTION_ENDPOINT=https://<your-function-app-name>.azurewebsites.net/api" "VITE_ENVIRONMENT=production"
```

---

### 6. Add SPA Routing Configuration

In your **public** folder, create `staticwebapp.config.json`:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/*.css", "/*.js", "/api/*"]
  }
}
```

This ensures routes like `/dashboard` work even after page refresh.


### 7. Deploy to Azure Static Web App

From your project root:

```bash
az staticwebapp create \
  --name <your-static-app-name> \
  --resource-group <your-resource-group> \
  --source https://github.com/<your-github-username>/<your-repo-name> \
  --branch main \
  --login-with-github \
  --location eastus2 \
  --app-location "Frontend" \
  --output-location "dist"
```

 * [SWA Deployment](../docs/images/phase6/deployed%20site.png)

 GitHub Actions will automatically build and deploy your app.

---

## 💡 Key Takeaways

* Connected React frontend with Azure Functions using environment variables
* Deployed frontend using Azure Static Web Apps with CI/CD
* Added SPA routing and CORS for secure and functional cross-service communication

---

### Screenshots
* [Function App showing allowed origin](../docs/images/phase6/function%20app%20cors%20for%20the%20static%20app.png)
* [Static Web App environment variable settings](../docs/images/phase6/environment%20variables%20in%20the%20static%20web%20app.png)
* [Live dashboard displaying orders](../docs/images/phase6/orders%20dashboard.png)   
* [Static Web App deployment overview](../docs/images/phase6/static%20web%20app.png) 


