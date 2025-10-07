# MapleCart – Phase 3: Observability & Monitoring

This phase implements **end-to-end observability** for the MapleCart serverless system, connecting **Azure Function Apps**, **Storage Queues**, **SQL Database**, and **Azure Communication Services (ACS)** into a unified monitoring and alerting setup.

---

## 🎯 Objectives

1. Enable diagnostic logging for all key resources.
2. Centralize metrics and logs in a **Log Analytics Workspace**.
3. Configure real-time alerts for failures and queue backlogs.
4. Visualize system health in an **Azure Dashboard**.

---

## 🧠 Architecture Overview

Each resource in the system emits metrics and logs to a **single Log Analytics Workspace**. Dashboards, alerts, and queries are then built on top of these logs.

📘 **Flow Summary:**

* Function App emits logs → Application Insights → Log Analytics
* Storage Queues emit message count metrics → Alerts
* SQL Database logs errors and timeouts → Log Analytics
* ACS email logs → Observability Dashboard

🖼️ **Screenshot 1:** *Observability architecture diagram showing Azure Function, Storage Queue, SQL Database, and ACS feeding into Log Analytics Workspace.*

---

## ⚙️ Step 1 – Enable Diagnostics

Enable diagnostics for each major resource:

### 1.1 Azure Function App

* Go to: **Function App → Monitoring → Diagnostic settings**
* ✅ Enable logs for **FunctionAppLogs**, **Errors**, **Requests**
* Destination: **Send to Log Analytics Workspace**

🖼️ **Screenshot 2:** [Function App diagnostic settings configured to send logs to Log Analytics.](../docs/images/phase3/Function%20App%20diagnostic.png)
### 1.2 Azure Storage Account

* Go to: **Storage → Diagnostic settings → + Add diagnostic setting**
* Select: **Transaction**, **Capacity**, **Read/Write/Delete** operations
* Destination: **Same Log Analytics Workspace**

🖼️ **Screenshot 3:** [*Storage Account diagnostics showing Transaction metrics being sent to Log Analytics.*](../docs/images/phase3/Storage%20Account%20diagnostics.png)

### 1.3 SQL Database

* Go to: **SQL Database → Diagnostic settings → Add diagnostic setting**
* Metrics: **Errors**, **SQLInsights**, **Timeouts**, **Blocks**
* Destination: **Same Log Analytics Workspace**

🖼️ **Screenshot 4:** [*SQL Database diagnostic settings with Errors and SQLInsights enabled.*](../docs/images/phase3/SQL%20Database%20diagnostic%20settings.png)

### 1.4 Azure Communication Services (ACS)

* Go to: **ACS → Diagnostic settings → Add diagnostic setting**
* Enable: **EmailSendMailOperational** logs
* Destination: **Same Log Analytics Workspace**

🖼️ **Screenshot 5:** [*ACS diagnostic setting showing Email logs connected to Log Analytics.*](../docs/images/phase3/ACS%20diagnostic%20setting.png)

---

## 📊 Step 2 – Configure Alerts

### 2.1 Function Failure Alert

**App Insights → Alerts → Create (Log Alert)**

```kql
requests
| where timestamp > ago(5m)
| where success == false
```

**Trigger:** Count > 5 in 5 minutes
**Action:** Send email via Action Group

🖼️ **Screenshot 6:** [*Alert rule setup for failed requests in Application Insights.*](../docs/images/phase3/Function%20Failure%20Alert.png)

### 2.2 Queue Backlog Alert

**Storage Account → Alerts → Metric Alert**
Metric: **Queue Message Count**
Dimension: `QueueName = order-queue`
Condition: `GreaterThan 100 over 5m`

🖼️ **Screenshot 7:** [*Storage metrics chart showing Queue Message Count over time.*](../docs/images/phase3/Queue%20Backlog%20Alert.png)

### 2.3 Poison Queue Alert (Custom Log)

```kql
StorageQueueLogs
| where OperationName == "PutMessage"
| where ObjectKey endswith "/order-queue-poison"
| summarize Count = count() by bin(TimeGenerated, 5m)
```

**Trigger:** Count > 0
**Action:** Send alert to your email

🖼️ **Screenshot 8:**  [*Alert created for the storage account.*](../docs/images/phase3/Storage%20Backlog%20Alert.png)

---

## 💾 Step 3 – Build Dashboard

### Create: `MapleCart Observability`

1. Go to **Dashboard → + Create → Empty Dashboard**
2. Add tiles:

   * Function App Request Count
   * Queue Message Count (order-queue & poison queue)
   * SQL Error Logs
   * ACS Email Success/Failure Chart

🖼️ **Screenshot 9:** [*Dashboard layout showing Function App requests, queue message counts, SQL errors, and email metrics.*](../docs/images/phase3/dashboard%202.png)[Dashboard layout showing Function App requests, queue message counts, SQL errors, and email metrics.](../docs/images/phase3/dashboard.png)

### ACS Log Query for Emails

```kql
ACSEmailSendMailOperational
| where TimeGenerated > ago(24h)
| summarize 
    TotalEmails = count(),
    UniqueRecipients = sum(ToRecipientsCount + CcRecipientsCount + BccRecipientsCount),
    AvgSizeKB = avg(Size)
    by bin(TimeGenerated, 1h)
| render timechart
```

🖼️ **Screenshot 10:** [*Email send analytics over time rendered in timechart view.*](../docs/images/phase3/email%20logs%20dashboard.png)

---

## 🧪 Step 4 – Testing Alerts

### 4.1 Function Alert Test

1. Temporarily break SQL insert logic in `processOrder.js`.
2. Observe multiple failed invocations → trigger Function failure alert.
3. Check email notification.

### 4.2 Queue Overload Test

```bash
for i in {1..150}; do
  az storage message put \
    --queue-name order-queue \
    --content "Test message $i" \
    --connection-string "<your-storage-connection-string>"
done
```

* Wait for metrics refresh (~5 min)
* Alert triggers when message count > 100

🖼️ **Screenshot 11:** [*Alert email notification showing threshold exceeded for queue backlog.*](../docs/images/phase3/orderqueue%20backlog%20alert.png)
 [*Alert email notification showing threshold exceeded for deadqueue backlog.*](../docs/images/phase3/Queue%20Backlog%20Alert.png)
  [*Alert email notification showing failed function request.*](../docs/images/phase3/failed%20function%20request.png)

---

## 🧹 Step 5 – Cleanup

Clear the poison and regular queues:

```bash
az storage message clear \
  --queue-name order-queue \
  --connection-string "<your-storage-connection-string>"

az storage message clear \
  --queue-name order-queue-poison \
  --connection-string "<your-storage-connection-string>"
```

🖼️ **Screenshot 12:** *Storage Queues view showing empty order and poison queues after cleanup.*

---

## ✅ Deliverables Summary

| Category        | Component                        | Configured | Verified |
| --------------- | -------------------------------- | ---------- | -------- |
| Function App    | App Insights Logs                | ✅          | ✅        |
| Storage Account | Metrics + Queue Logs             | ✅          | ✅        |
| SQL Database    | Errors + SQLInsights             | ✅          | ✅        |
| ACS             | Email Operational Logs           | ✅          | ✅        |
| Alerts          | Function, Queue, Poison Queue    | ✅          | ✅        |
| Dashboard       | Combined Observability Dashboard | ✅          | ✅        |

---

## 📸 Suggested Screenshot Uploads for GitHub

1. Diagnostic Settings for each resource (Functions, Storage, SQL, ACS)
2. App Insights Log Alert setup
3. Storage Queue Metric alert setup
4. Custom Log query for poison queue
5. ACS KQL query + chart output
6. Dashboard overview (final look)
7. Email alert notification example

---

## 🏁 Outcome

By completing Phase 3, MapleCart achieved full operational visibility across all services — proactive alerts, unified metrics, and actionable dashboards. This monitoring foundation ensures reliability and faster troubleshooting in future phases.
