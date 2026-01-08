# Azure-Analyst Environment Configuration Guide

## ⚡ QUICK START: Your Azure OpenAI Endpoint

### Your Endpoint
```
https://ad-jo-mg8x3t2p-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-5/chat/completions?api-version=2025-01-01-preview
```

### Extract These Values:

**From your endpoint URL, I've already extracted:**

```python
# ✅ ALREADY DONE IN backend_function.py

AZURE_RESOURCE_NAME = "ad-jo-mg8x3t2p"      # From: https://[THIS]-eastus2.cognitiveservices...
AZURE_REGION = "eastus2"                    # From: https://ad-jo-mg8x3t2p-[THIS].cognitiveservices...
AZURE_DEPLOYMENT_NAME = "gpt-5"             # From: .../deployments/[THIS]/chat/completions...
API_VERSION = "2025-01-01-preview"          # From: ?api-version=[THIS]

# AUTO-CONSTRUCTED:
AZURE_ENDPOINT_URL = "https://ad-jo-mg8x3t2p-eastus2.cognitiveservices.azure.com"
```

### ✅ What You Need to Update

**Only 1 line in `backend_function.py` (Line 18):**

```python
AZURE_API_KEY = "your-azure-openai-api-key-here"  # ← REPLACE THIS
```

Replace with your actual API key from Azure Portal:
1. Go to: https://portal.azure.com
2. Find your resource: **ad-jo-mg8x3t2p**
3. Click **Keys and Endpoint**
4. Copy **Key 1** (or Key 2)
5. Paste it replacing the placeholder

---

## 📋 Configuration Reference

### Endpoint Anatomy (for your reference)

```
https://ad-jo-mg8x3t2p-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-5/chat/completions?api-version=2025-01-01-preview
        │         │       │              │                 │         │     │                            │
        │         │       │              │                 │         │     │                            └── API Version
        │         │       │              │                 │         │     └── Deployment Name
        │         │       │              │                 │         └── Path to API
        │         │       │              │                 └── Service
        │         │       │              └── Domain
        │         │       └── Azure Region
        │         └── Resource Name
        └── Protocol
```

### Current Configuration (AUTO-SET)

| Parameter | Value | Source |
|-----------|-------|--------|
| `AZURE_RESOURCE_NAME` | `ad-jo-mg8x3t2p` | From endpoint ✅ |
| `AZURE_REGION` | `eastus2` | From endpoint ✅ |
| `AZURE_DEPLOYMENT_NAME` | `gpt-5` | From endpoint ✅ |
| `API_VERSION` | `2025-01-01-preview` | From endpoint ✅ |
| `AZURE_API_KEY` | **YOUR KEY HERE** | Azure Portal ⚠️ |

---

## 🔑 Getting Your API Key (5 minutes)

### Step 1: Open Azure Portal
```
https://portal.azure.com
```

### Step 2: Find Your Resource
- Click **All Resources** (or search for "ad-jo-mg8x3t2p")
- Click your resource name

### Step 3: Get the Key
- In left sidebar, click **Keys and Endpoint**
- You'll see:
  ```
  Key 1: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  Key 2: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  Endpoint: https://ad-jo-mg8x3t2p-eastus2.cognitiveservices.azure.com/
  ```

### Step 4: Copy Key 1
- Click the **copy icon** next to **Key 1**
- It's now in your clipboard

### Step 5: Update backend_function.py

**Open:** `backend_function.py`  
**Find:** Line 18  
**Change this:**
```python
AZURE_API_KEY = "your-azure-openai-api-key-here"
```

**To this:**
```python
AZURE_API_KEY = "paste-your-key-1-value-here"
```

**Example (NOT REAL):**
```python
AZURE_API_KEY = "a7k9f3h2j1k5l8m0n3p6q9r2s5t8v1w4"
```

---

## ✅ Verification Checklist

Before deploying, verify:

- [ ] Azure resource created and deployed
- [ ] Model deployed (gpt-5 in your case) ✅
- [ ] API key retrieved from Azure Portal
- [ ] API key pasted into `backend_function.py` line 18
- [ ] **NO spaces** before/after API key
- [ ] File saved
- [ ] Can see endpoint URL in `backend_function.py` around line 44:
  ```python
  AZURE_ENDPOINT_URL = f"https://{AZURE_RESOURCE_NAME}-{AZURE_REGION}.cognitiveservices.azure.com"
  # Should resolve to: https://ad-jo-mg8x3t2p-eastus2.cognitiveservices.azure.com
  ```

---

## 🧪 Test Your Configuration (Optional)

### Test 1: Verify Endpoint URL

```bash
# This should print: https://ad-jo-mg8x3t2p-eastus2.cognitiveservices.azure.com
python3 << 'EOF'
AZURE_RESOURCE_NAME = "ad-jo-mg8x3t2p"
AZURE_REGION = "eastus2"
AZURE_ENDPOINT_URL = f"https://{AZURE_RESOURCE_NAME}-{AZURE_REGION}.cognitiveservices.azure.com"
print(f"Endpoint: {AZURE_ENDPOINT_URL}")
EOF
```

### Test 2: Verify API Key Format

```bash
# This should show your API key is loaded
python3 << 'EOF'
with open('backend_function.py', 'r') as f:
    for line in f:
        if 'AZURE_API_KEY =' in line:
            print(line.strip())
EOF
```

### Test 3: Test Azure OpenAI Connection (Full Test)

```bash
# Replace YOUR_KEY_HERE with your actual key
AZURE_API_KEY="your-key-here"
AZURE_ENDPOINT="https://ad-jo-mg8x3t2p-eastus2.cognitiveservices.azure.com"
AZURE_DEPLOYMENT="gpt-5"
API_VERSION="2025-01-01-preview"

curl -X POST "${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${API_VERSION}" \
  -H "api-key: ${AZURE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Say hello"}],
    "temperature": 0.7,
    "max_tokens": 100
  }'

# Expected response: JSON with AI response
# Error response: 401 = bad key, 404 = wrong deployment name, 429 = quota exceeded
```

---

## 🔒 Security Notes

### For Development (Local Testing)

OK to hardcode temporarily:
```python
AZURE_API_KEY = "actual-key"
```

### For Production (Before Going Live)

Never commit actual keys. Options:

**Option A: Environment Variables**
```python
import os
AZURE_API_KEY = os.getenv('AZURE_OPENAI_API_KEY')  # Read from environment
```

**Option B: CrowdStrike API Integration (Recommended)**
See "Option 2: CrowdStrike API Integrations" section below

**Option C: Azure Key Vault (Enterprise)**
See "Option 4: Azure Key Vault" section below

---

## Option 1: Environment Variables (Recommended for Development)

### Step 1: Create .env File (LOCAL DEVELOPMENT ONLY)

```bash
# In your repository root, create .env file
cat > .env << 'EOF'
AZURE_OPENAI_API_KEY=your-actual-api-key-here
AZURE_OPENAI_ENDPOINT=https://ad-jo-mg8x3t2p-eastus2.cognitiveservices.azure.com
AZURE_DEPLOYMENT_NAME=gpt-5
AZURE_API_VERSION=2025-01-01-preview
EOF

# Protect the file
chmod 600 .env

# Add to .gitignore to prevent accidental commit
echo ".env" >> .gitignore
```

### Step 2: Update backend_function.py to Read Environment Variables

```python
#!/usr/bin/env python3
"""
Azure-Analyst Backend Function
Reads credentials from environment variables for security.
"""

import json
import requests
import logging
import os
from typing import Dict, Any, Optional
from dotenv import load_dotenv  # pip install python-dotenv

# Load environment variables from .env file (development only)
load_dotenv()

# ============================================================================
# CONFIGURATION - NOW READS FROM ENVIRONMENT
# ============================================================================

AZURE_API_KEY = os.getenv('AZURE_OPENAI_API_KEY')
AZURE_RESOURCE_NAME = os.getenv('AZURE_RESOURCE_NAME', 'ad-jo-mg8x3t2p')
AZURE_REGION = os.getenv('AZURE_REGION', 'eastus2')
AZURE_DEPLOYMENT_NAME = os.getenv('AZURE_DEPLOYMENT_NAME', 'gpt-5')
API_VERSION = os.getenv('AZURE_API_VERSION', '2025-01-01-preview')
AZURE_ENDPOINT_URL = f"https://{AZURE_RESOURCE_NAME}-{AZURE_REGION}.cognitiveservices.azure.com"

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Validate credentials at startup
if not AZURE_API_KEY or AZURE_API_KEY == "your-azure-openai-api-key-here":
    logger.error("Missing required environment variable: AZURE_OPENAI_API_KEY")
    raise ValueError("Azure API key not configured")

# ... rest of code remains the same ...
```

### Step 3: Install python-dotenv

```bash
pip install python-dotenv
```

### Step 4: Run Locally with Environment Variables

```bash
# Load environment and run
set -a
source .env
set +a

python3 backend_function.py
```

**⚠️ IMPORTANT:** Never commit `.env` file to git!

---

## Option 2: CrowdStrike API Integrations (RECOMMENDED FOR PRODUCTION)

This is the most secure method for production Foundry deployments.

### Step 1: Create API Integration in Falcon Console

1. **Log into Falcon Console**
2. **Go to:** Integrations > API Integrations
3. **Click:** "Create API Integration"
4. **Fill in:**
   - **Name:** Azure-OpenAI-Credentials
   - **Type:** Custom API (or API Key)
   - **Auth Type:** API Key
   - **Key Name:** api-key
   - **Key Value:** (your Azure OpenAI API key)
   - **Base URL:** https://ad-jo-mg8x3t2p-eastus2.cognitiveservices.azure.com

5. **Save** the integration

### Step 2: Update manifest.yml to Reference Integration

```yaml
api_integrations:
  - name: azure-openai
    description: Azure OpenAI Service Credentials
    auth_type: custom

functions:
  - name: azure_analyzer
    description: Sends detection/incident data to Azure OpenAI
    file_location: backend_function.py
    handler: handler
    runtime: python3.9
    api_integrations:
      - azure-openai
    memory_limit_mb: 512
    timeout_seconds: 30
```

### Step 3: Update backend_function.py to Use Credentials from Integration

```python
# In backend_function.py
import os
from falcon_integration import get_integration_credentials  # Foundry SDK

def get_azure_credentials():
    """
    Retrieves Azure credentials from Foundry API Integration.
    Much more secure than hardcoded credentials.
    """
    try:
        creds = get_integration_credentials('azure-openai')
        return {
            'api_key': creds.get('key'),
            'endpoint': creds.get('base_url'),
        }
    except Exception as e:
        logger.error(f"Failed to retrieve credentials: {e}")
        return None

# Use in your handler
def call_azure_openai(prompt: str) -> Optional[str]:
    creds = get_azure_credentials()
    if not creds:
        logger.error("Cannot retrieve credentials")
        return None
    
    api_url = f"{creds['endpoint']}/openai/deployments/{AZURE_DEPLOYMENT_NAME}/chat/completions?api-version={API_VERSION}"
    headers = {
        "Content-Type": "application/json",
        "api-key": creds['api_key']
    }
    # ... rest of function ...
```

---

## Option 3: Azure Managed Identity (ADVANCED)

For deployments running on Azure infrastructure, use Managed Identity for zero-secret deployments.

### Prerequisites
- Foundry app running on Azure infrastructure
- System-assigned Managed Identity enabled
- RBAC role assignment to Azure OpenAI resource

### Implementation

```python
from azure.identity import DefaultAzureCredential
from azure.core.client import ClientSession

def get_azure_token():
    """
    Gets token using Managed Identity (no credentials needed).
    """
    credential = DefaultAzureCredential()
    token = credential.get_token("https://cognitiveservices.azure.com/.default")
    return token.token

def call_azure_openai(prompt: str) -> Optional[str]:
    # Get token from Managed Identity
    token = get_azure_token()
    
    api_url = f"{AZURE_ENDPOINT_URL}/openai/deployments/{AZURE_DEPLOYMENT_NAME}/chat/completions?api-version={API_VERSION}"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    # ... rest of function ...
```

---

## Option 4: Azure Key Vault (ENTERPRISE)

For enterprise deployments with centralized secret management.

### Prerequisites
- Azure Key Vault instance
- Managed Identity with access to Key Vault

### Implementation

```python
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

def get_credentials_from_keyvault():
    """
    Retrieves credentials from Azure Key Vault.
    """
    credential = DefaultAzureCredential()
    client = SecretClient(
        vault_url="https://your-keyvault-name.vault.azure.net/",
        credential=credential
    )
    
    api_key = client.get_secret("azure-openai-api-key").value
    
    return api_key

# Use in handler
def handler(event: Dict[str, Any]) -> Dict[str, Any]:
    try:
        api_key = get_credentials_from_keyvault()
        # ... rest of function ...
    except Exception as e:
        logger.error(f"Failed to retrieve credentials from Key Vault: {e}")
        return {"status": "error", "message": "Credential retrieval failed"}
```

---

## Credential Rotation Strategy

### For API Key Based Auth

**Daily Rotation (Recommended):**

1. **Generate new key** in Azure Portal
2. **Update in backend_function.py** (or .env or CrowdStrike integration)
3. **Test deployment**
4. **Delete old key**

**Using Azure CLI:**

```bash
RESOURCE_GROUP="azure-analyst-rg"
RESOURCE_NAME="ad-jo-mg8x3t2p"

# Get current keys
az cognitiveservices account keys list \
  --resource-group $RESOURCE_GROUP \
  --name $RESOURCE_NAME

# Regenerate Key 2
az cognitiveservices account keys regenerate \
  --resource-group $RESOURCE_GROUP \
  --name $RESOURCE_NAME \
  --key-name key2

# Update your integration with new key

# Regenerate Key 1
az cognitiveservices account keys regenerate \
  --resource-group $RESOURCE_GROUP \
  --name $RESOURCE_NAME \
  --key-name key1
```

---

## Testing Credential Configuration

```bash
# Test 1: Verify your endpoint constructs correctly
python3 << 'EOF'
AZURE_RESOURCE_NAME = "ad-jo-mg8x3t2p"
AZURE_REGION = "eastus2"
AZURE_ENDPOINT_URL = f"https://{AZURE_RESOURCE_NAME}-{AZURE_REGION}.cognitiveservices.azure.com"
print(f"Endpoint: {AZURE_ENDPOINT_URL}")
EOF

# Test 2: Test Azure OpenAI connectivity
AZURE_API_KEY="your-key-here"
AZURE_ENDPOINT="https://ad-jo-mg8x3t2p-eastus2.cognitiveservices.azure.com"
AZURE_DEPLOYMENT="gpt-5"
API_VERSION="2025-01-01-preview"

curl -X POST "${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${API_VERSION}" \
  -H "api-key: ${AZURE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "test"}], "temperature": 0.7, "max_tokens": 100}'
```

---

## Troubleshooting

**"401 Unauthorized from Azure OpenAI"**
```bash
# 1. Verify key is correct (copy from Azure Portal again)
# 2. Verify endpoint matches (ad-jo-mg8x3t2p-eastus2)
# 3. Verify deployment name is gpt-5 (matches your endpoint)
# 4. Verify API version is 2025-01-01-preview
```

**"Module not found: requests"**
```bash
pip install requests
```

**"Module not found: dotenv"**
```bash
pip install python-dotenv
```

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Status:** Production Ready
