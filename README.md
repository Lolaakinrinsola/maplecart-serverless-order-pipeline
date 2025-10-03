## 📘 Main README (Repo Root)

# MapleCart – Serverless E-Commerce Demo

This repository contains the **MapleCart demo application** built to showcase how a small e‑commerce team can move from a single VM to a scalable, reliable, and modern serverless pipeline on Azure. It’s based on the [LinkedIn case study post](#https://lnkd.in/p/ezy5PDyX) about preventing \$1,000,000 in potential sales losses.

The project has two parts:

* **Frontend** (React app + IaC)
* **Backend** (Azure Functions API)

---

## 🚦 Phases
- **[Phase 1 – Core Pipeline](./docs/PHASE1.md)**  
- **[Phase 2 – Resilient Pipeline](./docs/PHASE2.md)**  

---

## 📂 Project Structure
````

maplecart/
├── backend/         # Azure Functions (CreateOrder + ProcessOrder)
├── frontend/        # React frontend + IaC (Bicep)
│   ├── src/services/orderService.js
│   ├── IaC/
│       ├── main.bicep
│       └── parameters.json

````

---

## 🛠️ Tech Stack
- **Azure Functions** (Node.js 20)
- **Azure Storage** (Blob + Queue)
- **Azure SQL Database**
- **Azure Communication Services (Email)**
- **Application Insights**
- **React + Bicep**

---

## ✅ Quick Start
```bash
# 1. Clone repo
git clone https://github.com/lolaakinrinsola/maplecart.git
cd maplecart

# 2. Deploy infra
az group create -n maplecart-rg -l canadacentral
az deployment group create --resource-group maplecart-rg --template-file frontend/IaC/main.bicep --parameters frontend/IaC/parameters.json

# 3. Deploy backend
cd backend
npm install
func azure functionapp publish maplecart-funcapp

#4 Configure **local.settings.json**:

   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "<storage-connection-string>",
       "SQL_SERVER": "<sql-server-name>.database.windows.net",
       "SQL_DATABASE": "maplecartdb",
       "SQL_USER": "<username>",
       "SQL_PASSWORD": "<password>",
       "FUNCTIONS_WORKER_RUNTIME": "node"
     }
   }
   
# 4. Run frontend locally
cd frontend
npm install
npm run dev
````

---

## 🎯 Why This Matters

* A tiny dev team can build a **secure, reliable cloud backend**.
* Azure’s **serverless + managed identity** model avoids secrets.
* IaC (Bicep) makes it **repeatable**.
* The architecture is flexible enough for **e-commerce, ticketing, IoT**.


