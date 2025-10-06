
# MapleCart – Phase 2: Resilient Pipeline with Queue + Email

This phase extends the core pipeline with **decoupling and observability**.  

---

## 🏗️ Architecture

**Flow:**
1. User submits an order.
2. `CreateOrder` Function:
   - Saves JSON → Blob
   - Enqueues message → `order-queue`
3. `ProcessOrder` Function:
   - Consumes queue message
   - Loads blob + validates order
   - Inserts row → SQL (via Managed Identity)
   - Sends confirmation email via **Azure Communication Services**
4. Poison messages → `order-queue-poison` (retry + diagnostics).

![Phase 2 Diagram](../docs/phase2-architecture.png)

---

## ⚙️ Deployment Steps

1. **Deploy Infra with Bicep**
```bash
az deployment group create \
  --resource-group maplecart-rg \
  --template-file ../frontend/IaC/main.bicep \
  --parameters ../frontend/IaC/parameters.json
````

Now provisioned:

* Blob container `orders`
* Queue `order-queue` (+ poison queue)
* SQL Database `OrdersDb`
* Function App (CreateOrder + ProcessOrder)
* App Insights
* Communication Services (ACS)

2. **Configure SQL for Managed Identity**

```sql
CREATE USER [maplecart-funcapp] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [maplecart-funcapp];
ALTER ROLE db_datawriter ADD MEMBER [maplecart-funcapp];
```

3. **Configure Function App Settings**
   | Key                   | Value                                      |
   |------------------------|--------------------------------------------|
   | AzureWebJobsStorage   | `<storage-connection-string>`              |
   | SQL_SERVER            | `maplecart-sqlserver.database.windows.net` |
   | SQL_DATABASE          | `OrdersDb`                                 |
   | ACS_CONNECTION_STRING | `<ACS connection string>`                  |
   | SENDER_EMAIL          | `DoNotReply@xxxx-azurecomm.net`            |
   | FUNCTIONS_WORKER_RUNTIME | `node`                                  |
   | WEBSITE_NODE_DEFAULT_VERSION | `~20`                               |

Restart Function App after changes.

4. **Enable CORS**

```bash
az functionapp cors add \
  --name maplecart-funcapp \
  --resource-group maplecart-rg \
  --allowed-origins http://localhost:8081
```

---

## 🎯 Outcome

Phase 2 makes the system:

* **Resilient** → no lost orders if SQL/email is down.
* **Observable** → logs + poison queue.
* **Customer-friendly** → email confirmation pipeline.

