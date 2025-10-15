# MapleCart Advanced Integration – Durable Functions + API Management

This guide documents how the **MapleCart backend** evolved from simple Azure Functions into an advanced, orchestrated, and secure cloud-native architecture using **Durable Functions** and **Azure API Management (APIM)**.

---

## 🧩 Section 1: Durable Functions – Automated Daily Sales Reports

### Objective

To automate the generation and distribution of daily sales reports by chaining multiple Azure Functions in a single orchestrated workflow.

### Architecture Overview

Durable Functions allow you to define workflows (orchestrators) that coordinate other functions (activities). In MapleCart:

* **Orchestrator:** Controls the workflow for fetching, summarizing, and sending reports.
* **Activities:** Each performs a discrete task — fetch data, summarize, save to Blob, send email.

#### Orchestration Flow

1. **FetchOrders** – Retrieves order data from Azure SQL using Managed Identity.
2. **SummarizeSales** – Aggregates total revenue, order count, and top items.
3. **SaveReport** – Writes CSV summary to Blob Storage.
4. **SendReport** – Sends the report URL and summary via Azure Communication Service (Email).

#### Project Folder Structure

```
Backend/
 ├── host.json
 ├── local.settings.json
 ├── package.json
 └── src/functions/
     ├── Activity_FetchOrders.js
     ├── Activity_SummarizeSales.js
     ├── Activity_SaveReport.js
     ├── Activity_SendReport.js
     ├── index.js                <-- Unified Durable Function entry point
     └── function.json           <-- Timer trigger schedule (e.g. every 5 minutes)
```

### Function Trigger

* Timer Trigger runs every 5 minutes (`0 */5 * * * *`).
* Orchestrator starts automatically via `client.startNew("OrchestrateDailyReport")`.

### Example Output

* `✅ Daily report orchestration started. Instance ID: <GUID>`
* Blob created: `https://maplecartstorage.blob.core.windows.net/reports/sales-2025-10-14.csv`
* Email sent: “Daily Sales: 125 orders • $12,340.55”

<!-- ### Screenshot Examples

📸 *Screenshot 1 – Azure Portal showing Durable Function instances running*
📸 *Screenshot 2 – Logs displaying FetchOrders → SummarizeSales → SendReport sequence*
📸 *Screenshot 3 – Email notification with attached report link*

--- -->

## 🚀 Section 2: Azure API Management Integration

### Objective

To secure all public endpoints behind **Azure API Management (APIM)** for rate limiting, access control, and centralized monitoring.

### Key Benefits

* Single secure gateway for all API traffic.
* CORS management for frontend communication.
* Rate limiting and subscription key enforcement.
* Backend Function Apps hidden from public access.

### Steps Implemented

#### Step 1 – Import Function APIs into APIM

```bash
az apim api import \
  --resource-group maplecart-rg \
  --service-name maplecart-apim \
  --path maplecart \
  --display-name "MapleCart API" \
  --api-type http \
  --specification-format OpenApiJson \
  --specification-url "https://<STORAGE_URL>/openapi-maplecart.json"
```

📸 [*Screenshot – APIM portal showing imported MapleCart API*](../docs/images/phase8/apim.png)

#### Step 2 – Add API Policy

```xml
<policies>
  <inbound>
    <base />
    <rate-limit-by-key calls="60" renewal-period="60"
      counter-key="@(context.Subscription?.Key ?? "anonymous")" />
    <set-backend-service base-url="https://maplecart-funcapp.azurewebsites.net/api" />
    <set-header name="x-functions-key" exists-action="override">
      <value>{{FUNCTION_DEFAULT_KEY}}</value>
    </set-header>
  </inbound>
  <backend><base /></backend>
  <outbound><base /></outbound>
  <on-error><base /></on-error>
</policies>
```

📸 [*Screenshot – Policy editor showing inbound rate-limit and function key setup*](../docs/images/phase8/apim%20policies.png)

#### Step 3 – Enable CORS Policy

```xml
<inbound>
  <base />
  <cors allow-credentials="true">
    <allowed-origins>
      <origin>http://localhost:8081</origin>
      <origin>https://yellow-glacier-01a9da70f.2.azurestaticapps.net</origin>
    </allowed-origins>
    <allowed-methods>
      <method>GET</method>
      <method>POST</method>
      <method>OPTIONS</method>
    </allowed-methods>
    <allowed-headers>
      <header>*</header>
    </allowed-headers>
    <expose-headers>
      <header>*</header>
    </expose-headers>
  </cors>
</inbound>
```

📸 [*Screenshot – CORS policy applied to MapleCart API*](../docs/images/phase8/apim%20policies.png)

#### Step 4 – Lock Down the Function App

1. Retrieve APIM outbound IPs:

   ```bash
   az apim show --resource-group maplecart-rg --name maplecart-apim --query "publicIpAddresses"
   ```
2. Add access restriction rules:

   ```bash
   az functionapp config access-restriction add \
     --resource-group maplecart-rg \
     --name maplecart-funcapp \
     --rule-name "AllowAPIM" \
     --action Allow \
     --ip-address 20.123.45.67/32 \
     --priority 100

   az functionapp config access-restriction add \
     --resource-group maplecart-rg \
     --name maplecart-funcapp \
     --rule-name "DenyAll" \
     --action Deny \
     --priority 200
   ```

📸 [*Screenshot – Function App Access Restrictions with APIM IP allowed only*](../docs/images/phase8/Function%20App%20Access%20Restrictions.png)

#### Step 5 – Test Endpoints via cURL

```bash
curl -X POST "https://maplecart-apim.azure-api.net/maplecart/CreateOrder" \
  -H "Ocp-Apim-Subscription-Key: <SUBSCRIPTION_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "item": "Laptop",
    "quantity": 1,
    "price": 1200,
    "total": 1200,
    "customer": {
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "address": "123 Main Street",
      "city": "New York",
      "zipCode": "10001"
    },
    "orderDate": "2025-10-14T20:00:00.000Z"
  }'
```

✅ Expected Response:

```json
{
  "success": true,
  "message": "Order created successfully"
}
```

📸 [*Screenshot – Terminal showing successful APIM to Function call*](../docs/images/phase8/successful%20APIM%20to%20Function%20call.png)

---

## 🧠 Summary

| Layer     | Service                      | Purpose                        |
| --------- | ---------------------------- | ------------------------------ |
| Data      | Azure SQL                    | Stores order records           |
| Compute   | Durable Functions            | Orchestrates daily reports     |
| Storage   | Blob Storage                 | Stores CSV reports             |
| Messaging | Azure Communication Services | Sends report emails            |
| Gateway   | API Management               | Security, monitoring, and CORS |

---

## 🏁 Outcome

With this setup, MapleCart achieved:

* Automated daily reporting with minimal maintenance.
* Secure API exposure using APIM.
* Observable, rate-limited, and auditable backend traffic.
* Easier integration with frontend clients through managed endpoints.

---

**Author:** Ololade Modinat Akinrinsola
**Project:** MapleCart – Cloud-Native E-commerce Platform
**Date:** October 2025
