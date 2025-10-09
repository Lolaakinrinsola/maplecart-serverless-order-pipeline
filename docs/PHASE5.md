# Phase 5 – Event-Driven Analytics with Azure Event Grid and Cosmos DB

In this phase, MapleCart evolves into a **real-time event-driven analytics pipeline**. Orders created in Blob Storage automatically trigger a Function that summarizes order metadata and persists it into **Azure Cosmos DB**, enabling live query and insight generation.

---

## 🌐 Architecture Overview

**Flow:**

1. **Blob Upload:** When an order JSON file is uploaded to Azure Blob Storage.
2. **Event Grid Trigger:** Azure Event Grid detects the *BlobCreated* event.
3. **Function Execution:** Event Grid invokes the `OnOrderCreated` Azure Function.
4. **Cosmos DB Write:** The Function extracts key metadata and writes a summary record into the `OrdersSummary` container in Cosmos DB.
5. **Monitoring:** Application Insights tracks each Function invocation and any failed deliveries.

**Benefits:**

* **Real-time analytics** on order activity.
* **Automatic scaling** through event-driven processing.
* **Resilient design:** failures in Cosmos or Blob don’t block ingestion.

---

## ⚙️ Setup Steps

### 1. Create Cosmos DB

```bash
RG=maplecart-rg
LOC=canadacentral
COSMOS=maplecart-cosmos

az cosmosdb create -n $COSMOS -g $RG --locations regionName=$LOC failoverPriority=0 isZoneRedundant=False
az cosmosdb sql database create -a $COSMOS -n OrdersDB -g $RG
az cosmosdb sql container create -a $COSMOS -d OrdersDB -n OrdersSummary -g $RG --partition-key-path "/id"
```

### 2. Secure Cosmos Connection

```bash
COSMOS_CONN=$(az cosmosdb keys list -n $COSMOS -g $RG --type connection-strings --query "connectionStrings[0].connectionString" -o tsv)
az keyvault secret set --vault-name maplecart-kv --name "Cosmos-ConnectionString" --value "$COSMOS_CONN"
```

In **Function App → Configuration**, add:

```
@Microsoft.KeyVault(SecretUri=https://maplecart-kv.vault.azure.net/secrets/Cosmos-ConnectionString/)
```

---

### 3. Update the Function Code

```javascript
const { app } = require("@azure/functions");
const { CosmosClient } = require("@azure/cosmos");

app.eventGrid("OnOrderCreated", {
  handler: async (event, context) => {
    try {
      const data = event.data;
      const blobUrl = data.url;
      const orderId = blobUrl.split("/").pop().replace(".json", "");

      const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
      const container = client.database("OrdersDB").container("OrdersSummary");

      const summary = {
        id: orderId,
        blobUrl,
        createdAt: new Date().toISOString(),
        source: "BlobCreatedEvent"
      };

      await container.items.upsert(summary);
      context.log(`Order summary added for ${orderId}`);
    } catch (err) {
      context.log("Error in OnOrderCreated:", err);
    }
  }
});
```

Redeploy the Function:

```bash
func azure functionapp publish maplecart-funcapp --force
```

---

### 4. Create Event Grid Subscription

From the **Azure Portal**:

1. Go to **Storage Account → Events → + Event Subscription**
2. Set **Destination Type = Azure Function** → `maplecart-funcapp`
3. Select Function → `OnOrderCreated`
4. Event Type → **Blob Created**
5. Click **Create**

If validation fails, complete handshake manually with:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"validationResponse":"<validation-code>"}' \
  "https://maplecart-funcapp.azurewebsites.net/runtime/webhooks/eventgrid?functionName=OnOrderCreated"
```

---

## 🔎 Verification

### 1. Upload Test Order

Upload `order-test.json` to your container:

```bash
az storage blob upload --account-name maplecartstorage01 \
  --container-name orders \
  --name order-test.json \
  --file ./order-test.json
```

### 2. Check Function Logs

Azure Portal → Function App → Monitor → `OnOrderCreated`

```
✅ Event received from Event Grid: Microsoft.Storage.BlobCreated
✅ Order summary added for order-test.json
```

### 3. Verify Cosmos DB

Open **Azure Cosmos DB → Data Explorer → OrdersSummary**
You should see:

```json
{
  "id": "order-test",
  "blobUrl": "https://maplecartstorage01.blob.core.windows.net/orders/order-test.json",
  "createdAt": "2025-10-09T20:18:00Z",
  "source": "BlobCreatedEvent"
}
```

---

## Screenshots

* [Event Grid Subscription (Active → Azure Function)](../docs/images/phase5/Event%20Grid%20Subscription.png)
* [Cosmos DB Overview with OrdersSummary container](../docs/images/phase5/Cosmos%20DB%20Overview.png)
* [Key Vault Secret reference in Function App Configuration](../docs/images/phase5/Function%20App%20Configuration.png)
<!-- * Function log output showing processed event -->

---

## 🛠️ Architecture Diagram

*(Placeholder for image)* `docs/images/phase5/architecture.png`

**Components:**

* Azure Blob Storage
* Azure Event Grid
* Azure Function (EventGridTrigger)
* Azure Cosmos DB
* Azure Key Vault (secure connection)
* Application Insights (telemetry)

---

## 🔗 Next Phase: Phase 6 – API Integration and Frontend Dashboard

The next phase integrates a frontend/API layer to query Cosmos DB and visualize live order metrics.
