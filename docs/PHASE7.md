# MapleCart CI/CD Pipeline with Azure Logic App Notifications

## Overview

This phase focused on strengthening the deployment process of the MapleCart application by improving its CI/CD pipeline and integrating Azure Logic Apps for real-time email notifications. The workflow automatically builds, tests, deploys, and verifies the Azure Static Web App, followed by a deployment status email sent through a Logic App.

## What Was Implemented

* A multi-stage GitHub Actions workflow that handles build, test, and deployment.
* Automatic notifications via Azure Logic App when deployments succeed or fail.
* A smoke test stage to verify both API and frontend availability after deployment.
* Secure environment variables stored in GitHub Secrets.

## CI/CD Workflow Breakdown

**1. Build, Lint, and Test**
The workflow installs dependencies, runs linting, executes tests (if available), and builds the production-ready frontend assets.

**2. Deploy to Azure Static Web App**
Once the build succeeds, the pipeline deploys to Azure Static Web App using the `Azure/static-web-apps-deploy@v1` GitHub Action.

**3. Post-Deployment Smoke Test**
After deployment, the pipeline uses cURL to verify the Azure Function endpoint and frontend URL are both accessible.

**4. Notify via Logic App (Email)**
The final step sends a POST request to a Logic App HTTP endpoint containing deployment metadata (status, commit ID, run ID, timestamp). The Logic App parses the payload and sends an automated email notification summarizing the outcome.

### Key Configuration Details

* Environment variables such as `VITE_AZURE_FUNCTION_ENDPOINT` and `LOGICAPP_URL` are stored securely in GitHub Secrets.
* The Logic App uses a Shared Access Signature (SAS) URL for secure inbound communication.
* Email notifications are configured using the Office 365 Outlook connector inside Logic App Designer.

## Validation Steps

1. Trigger the GitHub Action by pushing changes to the `main` or `dev` branch.
2. Observe the workflow executing four main jobs: build/test, deploy, smoke test, and notify.
3. Check the Azure portal to confirm the Static Web App reflects the new deployment.
4. Verify that an email notification is received confirming the status.

## Screenshots

**1. GitHub Actions Successful Run**
Shows all jobs completed successfully, including deployment and Logic App notification.

![GitHub Action Success](./images/github-success.png)

**2. Logic App Designer Workflow**
Displays the workflow with the HTTP trigger, condition check, and email connector.

![Logic App Workflow](./images/logicapp-designer.png)

**3. Email Notification Confirmation**
Screenshot of the received deployment email showing key metadata (status, repo, timestamp).

![Email Notification](./images/email-success.png)

## Key Learnings

* Quoting and escaping in YAML scripts is essential for correct command execution.
* Logic Apps provide a low-code way to extend CI/CD workflows with real-time alerts.
* Post-deployment smoke tests ensure application reliability before notifying stakeholders.

## References

* [Azure Static Web Apps Documentation](https://learn.microsoft.com/en-us/azure/static-web-apps/)
* [GitHub Actions for Azure](https://github.com/Azure/actions)
* [Azure Logic Apps Overview](https://learn.microsoft.com/en-us/azure/logic-apps/)
* [Office 365 Email Connector for Logic Apps](https://learn.microsoft.com/en-us/connectors/office365/)
