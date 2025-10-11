# MapleCart CI/CD Pipeline with Azure Logic App Notifications

## Overview

This phase enhances the MapleCart deployment workflow by building a robust CI/CD pipeline integrated with Azure Logic Apps for real-time notifications. The system automatically builds, tests, deploys, and validates the Azure Static Web App. After each deployment, a Logic App sends an email summarizing the build and deployment results.

## What Was Implemented

* A multi-stage GitHub Actions workflow that automates build, test, and deployment stages.
* Integration of Azure Logic Apps to send real-time deployment notifications.
* A post-deployment smoke test to verify both the API and frontend availability.
* Secure handling of sensitive information through GitHub Secrets.

## CI/CD Workflow Breakdown

### 1. Build, Lint, and Test

The pipeline installs dependencies, runs linting to enforce code quality, and executes tests (if available). It then builds the production-ready static files for deployment.

### 2. Deploy to Azure Static Web App

Once the build passes, the pipeline deploys to Azure Static Web App using the `Azure/static-web-apps-deploy@v1` GitHub Action. This step authenticates via an Azure Static Web Apps API token stored in GitHub Secrets.

### 3. Post-Deployment Smoke Test

After deployment, the workflow performs two health checks:

* Confirms the Azure Function API endpoint responds successfully.
* Verifies that the deployed frontend URL returns a valid HTTP response.

### 4. Notify via Logic App (Email)

After the smoke tests, a POST request is sent to an Azure Logic App endpoint. The Logic App parses the request and sends an email containing the deployment results.

### Key Configuration Details

* **Environment variables** such as `VITE_AZURE_FUNCTION_ENDPOINT` and `LOGICAPP_URL` are securely stored in GitHub Secrets.
* The Logic App is secured using a Shared Access Signature (SAS) token included in the trigger URL.
* All email recipients and GitHub metadata are configurable and can be replaced with your own values.

## Azure Logic App Breakdown

The Azure Logic App serves as the notification system, receiving deployment data from GitHub Actions and sending automated email updates.

### 1. Create the Logic App

1. In the **Azure Portal**, create a new Logic App named `maplecart-deploy-notify`.
2. Select the same **resource group** and **region** used for your Static Web App.
3. Choose the **Consumption (Pay-Per-Use)** plan.
4. Open the **Logic App Designer** after creation.

### 2. Add the HTTP Trigger

1. Select **When an HTTP request is received**.

2. Click **Use sample payload to generate schema** and paste the following:

   ```json
   {
     "status": "success",
     "environment": "production",
     "workflow": "Azure Static Web App CI/CD",
     "run_id": "12345",
     "commit": "abc123",
     "repo": "<your-github-username>/<your-repo-name>",
     "timestamp": "2025-10-11T15:45:00Z"
   }
   ```

3. Save the Logic App to generate the **HTTP POST URL**.

4. Copy the URL and add it as a secret in your GitHub repository under the key `LOGICAPP_URL`.

### 3. Add a Condition Block

1. Add a **Condition** step to evaluate the deployment result:

   ```
   @equals(triggerBody()?['status'], 'success')
   ```
2. Define two branches:

   * **If true:** Send success email.
   * **If false:** Send failure email.

### 4. Configure Email Notifications

1. Add a **Send an email (V2)** action under both branches using the **Office 365 Outlook connector**.

**Success Path:**

* To: `@{variables('recipientEmail')}` (or directly use your own email)
* Subject: `MapleCart Deployment Successful ✅`
* Body:

  ```html
  <p>Deployment succeeded for @{triggerBody()?['repo']}.</p>
  <p><strong>Commit:</strong> @{triggerBody()?['commit']}</p>
  <p><strong>Timestamp:</strong> @{triggerBody()?['timestamp']}</p>
  <p><strong>Workflow:</strong> @{triggerBody()?['workflow']}</p>
  ```

**Failure Path:**

* Subject: `MapleCart Deployment Failed ❌`
* Include similar fields with an alert to check GitHub Actions logs.

### 5. Save and Test

* Click **Save** and trigger the Logic App by running your GitHub Actions workflow.
* In the Logic App’s **Run History**, verify that the workflow ran successfully and check your inbox for the email notification.

### 6. Logic App Visual Flow

```
When HTTP request received
      ↓
  Condition: status == "success"
   ├── Yes → Send Success Email
   └── No  → Send Failure Email
```

## Validation Steps

1. Push new code to the `main` or `dev` branch to trigger the workflow.
2. Watch the GitHub Actions pipeline run through all stages.
3. Check Azure Portal → Static Web App for the updated deployment.
4. Confirm an email notification was received indicating success or failure.

## Screenshots

**GitHub Actions Successful Run**
Displays all stages (build, deploy, test, and notify) completing successfully.

![GitHub Action Success](../docs/images/phase7/ci:cd%20flow.png)

**Logic App Designer Workflow**
Shows the Logic App with HTTP trigger, conditional logic, and email connectors.

![Logic App Workflow](../docs/images/phase7/Logic%20app%20designer.png)

**Email Notification Example**
Example of the received email with repository, commit, and timestamp details.

![Email Notification](../docs/images/phase7/success%20of%20the%20logic%20app.png)

## Key Learnings

* YAML syntax and quoting are critical for accurate CI/CD job execution.
* Logic Apps provide an easy low-code way to add real-time notifications.
* Automating notifications ensures visibility into each deployment's health.

## References

* [Azure Static Web Apps Documentation](https://learn.microsoft.com/en-us/azure/static-web-apps/)
* [GitHub Actions for Azure](https://github.com/Azure/actions)
* [Azure Logic Apps Overview](https://learn.microsoft.com/en-us/azure/logic-apps/)
* [Office 365 Email Connector for Logic Apps](https://learn.microsoft.com/en-us/connectors/office365/)
