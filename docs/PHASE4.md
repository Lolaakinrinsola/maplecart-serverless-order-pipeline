# Phase 4 – Secure Configuration with Azure Key Vault & App Configuration

In this phase, MapleCart enhances security and configuration management by externalizing all sensitive credentials from the Function App into **Azure Key Vault** and storing non-sensitive settings in **Azure App Configuration**.

---

## Overview

This phase focuses on eliminating secrets from code and environment variables.

* **Azure Key Vault** securely stores connection strings and API keys (ACS, SQL).
* **Function App** accesses secrets via managed identity.
* **Azure App Configuration** stores non-sensitive app settings (feature flags, themes).
* **All secrets** are now referenced using `@Microsoft.KeyVault(...)` syntax.

---

## ⚙️ Step 1 – Create and Configure Key Vault

```bash
RG=maplecart-rg
LOC=canadacentral
KV=maplecart-kv

az keyvault create -n $KV -g $RG -l $LOC
```

Add secrets (no underscores in name):

```bash
az keyvault secret set \
  --vault-name $KV \
  --name "Acs--ConnectionString" \
  --value "endpoint=https://maplecart-acs.canada.communication.azure.com/;accesskey=<your-access-key>"
```

 *Screenshot:*
[`../docs/images/phase4/keyvault-secrets.png` — Key Vault secrets list showing Acs--ConnectionString, Sql--ConnectionString.](../docs/images/phase4/keyvault.png)

---

## ⚙️ Step 2 – Grant Function App Access

Enable identity and assign the Key Vault Secrets User role:

```bash
FUNC=maplecart-funcapp

az functionapp identity assign -g $RG -n $FUNC
FUNC_ID=$(az webapp identity show -g $RG -n $FUNC --query principalId -o tsv)
KV_ID=$(az keyvault show -n $KV -g $RG --query id -o tsv)

az role assignment create \
  --assignee-object-id $FUNC_ID \
  --role "Key Vault Secrets User" \
  --scope $KV_ID
```

📸 *Screenshot:*

[`../docs/images/phase4/function-identity.png` — Function App Identity tab (System assigned ON).](../docs/images/phase4/function%20identity.png)

---

## ⚙️ Step 3 – Reference Secrets in Function App

Inside **Function App → Configuration**, replace secrets with a Key Vault reference:

```
@Microsoft.KeyVault(SecretUri=https://maplecart-kv.vault.azure.net/secrets/Acs--ConnectionString/<secret-version>)
```

 *Screenshot:*
* [`../docs/images/phase4/function-env.png` — App settings showing Key Vault icon ✅ under **Source**.](../docs/images/phase4/function%20using%20keyvault.png)
* [../docs/images/phase4/function-cors.png — CORS tab showing allowed origins for client applications.](../docs/images/phase4/cors.png)
* [../docs/images/phase4/function-storage-iam.png — IAM role assignment showing Function App access to Storage Account.](../docs/images/phase4/storage%20IAM.png)
* [../docs/images/phase4/function-sql-connection.png — SQL Server firewall and connection string settings referencing Function App.](../docs/images/phase4/ADS%20screenshot.png)
---

## ⚙️ Step 4 – Add App Configuration (Optional)

```bash
APPCONFIG=maplecart-appcfg
az appconfig create -n $APPCONFIG -g $RG -l $LOC --sku Standard
```

Example key-values:

```bash
az appconfig kv set --name $APPCONFIG --key "App:Theme" --value "Light"
az appconfig kv set --name $APPCONFIG --key "Feature:EnableEmail" --value "true"
```


## 📊 Architecture Overview

**User → Function App (Managed Identity) → Azure Key Vault (Secrets)**
 ↳ **Azure App Configuration → Non-sensitive settings**

📄 *Diagram:*
`../docs/images/phase4/phase4-architecture.png`

---

## Outcome

* Secrets are no longer stored in code or environment variables.
* Function App retrieves credentials securely via Key Vault.
* Supports secret rotation without redeployment.
* App Configuration simplifies centralized management.

---

> **Next Phase → Phase 5:** Cost Optimization & Autoscaling Analysis


