# Azure-Analyst Deployment Guide

## Prerequisites

- CrowdStrike Falcon console access with App Developer role
- Falcon Insight XDR or Falcon Prevent entitlement
- Azure OpenAI resource deployed with gpt-4 model
- Foundry CLI installed locally
- Node.js 18+ for UI builds
- Python 3.9+ for backend function

## Prerequisites Setup

### 1. Install Foundry CLI

```bash
npm install -g @crowdstrike/foundry-cli
```

### 2. Verify Installation

```bash
foundry --version
foundry auth status
```

### 3. Get Azure OpenAI Credentials

1. Go to Azure Portal → Cognitive Services → Your OpenAI Resource
2. Navigate to "Keys and Endpoints"
3. Copy:
   - **Endpoint URL** → `AZURE_OPENAI_ENDPOINT`
   - **API Key** → `AZURE_OPENAI_API_KEY`
   - **Deployment Name** → Use in `AZURE_DEPLOYMENT_NAME`

## Development Workflow

### Step 1: Clone Your Fork

```bash
cd ~/projects
git clone https://github.com/DDYBDAHL/foundry-sample-charlotte-toolkit.git
cd foundry-sample-charlotte-toolkit
git checkout azure-analyst
```

### Step 2: Install Dependencies

```bash
# Root dependencies
npm install

# UI dependencies
cd ui/extensions/azure-analyst
npm install
cd ../../../
```

### Step 3: Create Environment File

Copy `.env.example` to `.env` and fill in your Azure credentials:

```bash
cp .env.example .env
```

**Edit `.env` with your Azure OpenAI details:**

```env
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_KEY=your-actual-api-key
AZURE_DEPLOYMENT_NAME=gpt-4
AZURE_API_VERSION=2024-08-01-preview
```

### Step 4: Build UI Extension

```bash
cd ui/extensions/azure-analyst
npm run build
cd ../../../
```

This generates the `dist` folder needed for bundling.

### Step 5: Validate Configuration

```bash
foundry validate
```

## Bundling for Deployment - STRICT STEP-BY-STEP

### ⚠️ CRITICAL: Follow these steps EXACTLY

These are the explicit, verified steps to bundle your Azure-Analyst application for production deployment.

---

### **STEP 1: Clean Previous Builds**

**Purpose**: Ensure no stale files interfere with bundling

```bash
# Remove old bundles
rm -rf dist/
rm -f *.tar.gz

# Clear build caches
rm -rf ui/extensions/azure-analyst/dist
rm -rf node_modules/.cache
rm -rf ~/.foundry/cache  # Optional: Foundry cache
```

**Verify:**
```bash
ls -la | grep -E '(dist|tar.gz)'
# Should show NO dist folder or tar.gz files
```

---

### **STEP 2: Rebuild UI Extension (MANDATORY)**

**Purpose**: Generate production-optimized UI bundle

```bash
# Navigate to UI extension directory
cd ui/extensions/azure-analyst

# Option A: Full clean rebuild (RECOMMENDED)
rm -rf dist node_modules package-lock.json
npm install
npm run build

# Option B: Quick rebuild (if dependencies unchanged)
npm run build

# Verify dist folder exists and contains required files
ls -la dist/
```

**Expected output:**
```
index.html
main.[hash].js
main.[hash].css
favicon.ico
```

**Return to root:**
```bash
cd ../../../
```

**Verify from root (IMPORTANT):**
```bash
test -f ui/extensions/azure-analyst/dist/index.html && echo "✓ UI built successfully" || echo "✗ UI build failed"
```

---

### **STEP 3: Verify Backend Function**

**Purpose**: Ensure backend Python is valid

```bash
# Verify file exists
test -f backend_function.py && echo "✓ backend_function.py exists" || echo "✗ NOT FOUND"

# Check Python syntax (if Python 3 available)
python3 -m py_compile backend_function.py && echo "✓ Python syntax valid" || echo "✗ Syntax error"
```

---

### **STEP 4: Verify Manifest Configuration**

**Purpose**: Ensure manifest.yml references built files correctly

```bash
# Check manifest exists
test -f manifest.yml && echo "✓ manifest.yml exists" || echo "✗ NOT FOUND"

# Verify key sections
grep -E "^(name:|description:|functions:)" manifest.yml

# Verify UI extension path references built dist
grep "path: ui/extensions/azure-analyst/dist" manifest.yml && echo "✓ UI path correct" || echo "✗ UI path incorrect"

# Verify backend function reference
grep "file_location: backend_function.py" manifest.yml && echo "✓ Backend path correct" || echo "✗ Backend path incorrect"
```

**Expected grep output:**
```
name: Azure-Analyst
description: AI-powered detection and incident analysis using Azure OpenAI
functions:
path: ui/extensions/azure-analyst/dist
file_location: backend_function.py
```

---

### **STEP 5: Run Foundry Validation**

**Purpose**: Pre-flight check before bundling

```bash
# From root directory
foundry validate
```

**Success output:**
```
✓ Validating manifest...
✓ Checking file references...
✓ Verifying backend function...
✓ Validation passed
```

**If validation FAILS:**
```bash
# Get detailed error info
foundry validate --verbose

# Common issues:
# 1. UI dist folder missing → Re-run STEP 2
# 2. Manifest syntax error → Check manifest.yml for typos
# 3. Backend function not found → Ensure backend_function.py exists in root
# 4. Path references wrong → Update manifest.yml paths
```

---

### **STEP 6: Create Application Bundle**

**Purpose**: Package all files for deployment

```bash
# From root directory, create bundle
foundry bundle create
```

**Success output:**
```
✓ Validating manifest...
✓ Building bundle...
✓ Bundle created: azure-analyst-1.0.0.tar.gz
```

**If bundle creation FAILS:**
```bash
# Re-run validation first
foundry validate --verbose

# If validation passes but bundle fails:
# Try with verbose output
foundry bundle create --verbose
```

---

### **STEP 7: Verify Bundle Contents**

**Purpose**: Ensure all required files are in bundle

```bash
# List all files in bundle
tar -tzf azure-analyst-*.tar.gz | head -20

# Verify critical files are present
echo "Checking for manifest.yml..."
tar -tzf azure-analyst-*.tar.gz | grep "manifest.yml" && echo "✓ Found" || echo "✗ NOT FOUND"

echo "Checking for backend_function.py..."
tar -tzf azure-analyst-*.tar.gz | grep "backend_function.py" && echo "✓ Found" || echo "✗ NOT FOUND"

echo "Checking for UI extension..."
tar -tzf azure-analyst-*.tar.gz | grep "dist/index.html" && echo "✓ Found" || echo "✗ NOT FOUND"

echo "Checking for workflows..."
tar -tzf azure-analyst-*.tar.gz | grep "workflows/" && echo "✓ Found" || echo "✗ NOT FOUND"
```

**Expected files in bundle:**
```
manifest.yml
backend_function.py
ui/extensions/azure-analyst/dist/index.html
ui/extensions/azure-analyst/dist/main.[hash].js
ui/extensions/azure-analyst/dist/main.[hash].css
workflows/analyze_detection.yaml
USERDOCS.md
DEPLOYNOTES.md
```

---

### **STEP 8: Authenticate with Foundry (First Time Only)**

**Purpose**: Set up credentials for deployment

```bash
# Check authentication status
foundry auth status

# If not authenticated, login
if [ $? -ne 0 ]; then
  foundry auth login
fi
```

**Follow login prompts:**
1. Paste CrowdStrike API client ID
2. Paste CrowdStrike API client secret
3. Confirm authentication

---

### **STEP 9: Deploy Bundle to CrowdStrike**

**Purpose**: Upload and install app to Falcon console

```bash
# Get the bundle filename
BUNDLE=$(ls -t azure-analyst-*.tar.gz | head -1)
echo "Deploying bundle: $BUNDLE"

# Deploy the bundle
foundry app install "$BUNDLE"
```

**Success output:**
```
✓ Validating bundle...
✓ Uploading application...
✓ Application installed successfully
✓ App ID: [app-id-string]
✓ Status: Ready
```

**If deployment FAILS:**
```bash
# Check status
foundry auth status  # Verify still authenticated

# Try with verbose output
foundry app install "$BUNDLE" --verbose

# Common issues:
# 1. Unauthorized → Re-authenticate: foundry auth login
# 2. Invalid bundle → Re-create: go back to STEP 1
# 3. App already exists → See STEP 10 for update
```

---

### **STEP 10: Verify Installation**

**Purpose**: Confirm app deployed successfully

```bash
# Check app status
foundry app status

# List all deployed apps
foundry app list

# View specific app details
foundry app describe azure-analyst
```

**Expected status:**
```
Name: Azure-Analyst
Status: Ready
Version: 1.0.0
Created: [timestamp]
```

---

### **STEP 11: Configure Environment Variables in Console**

**Purpose**: Set Azure OpenAI credentials in running app

**Method A: Via Falcon Console UI (RECOMMENDED)**

1. Open **Foundry** tab in Falcon console
2. Click **Apps** → **Installed Apps**
3. Find **Azure-Analyst** in list
4. Click **Azure-Analyst** to open app details
5. Click **Configure** button (or ⚙️ settings icon)
6. Under **Environment Variables** section, add:
   - `AZURE_OPENAI_ENDPOINT` = `https://your-resource.openai.azure.com/`
   - `AZURE_OPENAI_API_KEY` = `your-api-key-xxxxx`
   - `AZURE_DEPLOYMENT_NAME` = `gpt-4` (or your deployment)
   - `AZURE_API_VERSION` = `2024-08-01-preview`
7. Click **Save Configuration**
8. Wait for app to restart (~30 seconds)

**Method B: Via Foundry CLI**

```bash
foundry app config set azure-analyst \
  AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/" \
  AZURE_OPENAI_API_KEY="your-api-key-xxxxx" \
  AZURE_DEPLOYMENT_NAME="gpt-4" \
  AZURE_API_VERSION="2024-08-01-preview"
```

**Verify configuration:**
```bash
foundry app config get azure-analyst
```

---

### **STEP 12: Release Application**

**Purpose**: Make app available to all users

```bash
# Check if app needs release
foundry app status

# Release to users
foundry app release azure-analyst
```

**Success output:**
```
✓ Application released successfully
✓ App now available to all users
```

---

## Testing the Deployment

### Quick Test Checklist

- [ ] Log into Falcon console
- [ ] Navigate to **Endpoint Security** → **Monitor** → **Endpoint Detections**
- [ ] Click on any detection to open details panel
- [ ] Scroll down to find **Azure-Analyst Extension**
- [ ] Click to expand extension
- [ ] Click **🤖 Analyze with Azure OpenAI** button
- [ ] Wait 15-30 seconds for analysis
- [ ] Verify analysis appears in panel

### Verify UI Extension Loads

1. Go to **Endpoint Security** → **Monitor** → **Endpoint Detections**
2. Click on any detection
3. Scroll down in details panel
4. Look for **Azure-Analyst Extension** section
5. Should see: "Waiting for detection or incident data..."

### Test Analysis Function

1. Click **🤖 Analyze with Azure OpenAI** button
2. Should show loading spinner: "Analyzing..."
3. After 10-30 seconds, analysis should appear
4. Should include numbered sections (1. Summary, 2. Indicators, etc.)

### Check Backend Logs

```bash
# View function execution logs
foundry logs --function azure_analyzer --tail 50

# Filter for errors
foundry logs --function azure_analyzer | grep -i error

# Watch logs in real-time
foundry logs --function azure_analyzer --follow
```

---

## Troubleshooting

### Issue: Bundle Creation Fails

**Symptoms:**
```
✗ Error: Invalid manifest
✗ Error: File not found
```

**Solution:**
```bash
# Check for validation errors
foundry validate --verbose

# Ensure dist folder exists
test -d ui/extensions/azure-analyst/dist && echo "✓ dist exists" || echo "✗ dist missing"

# Rebuild if needed
cd ui/extensions/azure-analyst && npm run build && cd ../../../

# Verify backend exists
test -f backend_function.py && echo "✓ backend exists" || echo "✗ backend missing"
```

### Issue: Deployment Fails

**Symptoms:**
```
✗ Unauthorized
✗ Invalid credentials
```

**Solution:**
```bash
# Check auth status
foundry auth status

# Re-authenticate if needed
foundry auth logout
foundry auth login

# Verify bundle integrity
tar -tzf azure-analyst-*.tar.gz | wc -l  # Should show 10+ files
```

### Issue: Analysis Not Working

**Symptoms:**
- Button shows "Analyzing..." but never completes
- Error: "Failed to get analysis from Azure OpenAI"

**Solution:**
```bash
# 1. Verify environment variables are set
foundry app config get azure-analyst

# 2. Check function logs
foundry logs --function azure_analyzer --tail 20

# 3. Test Azure OpenAI endpoint connectivity
curl -I "https://your-resource.openai.azure.com/"

# 4. Verify API key in Azure Portal
# Go to Azure Portal → OpenAI Resource → Keys and Endpoints

# 5. Check function memory and timeout limits
foundry app describe azure-analyst

# 6. If needed, update configuration and redeploy
foundry app config set azure-analyst AZURE_OPENAI_API_KEY="new-key"
```

### Issue: CORS or CSP Errors

**Symptoms:**
Browser console shows CSP violation for openai.azure.com

**Solution:**
- Manifest CSP already allows Azure endpoints
- Check browser console for specific blocked resource
- Contact CrowdStrike support if CSP needs expansion

### Issue: UI Extension Not Visible

**Symptoms:**
- Extension panel doesn't appear in detection details

**Solution:**
```bash
# 1. Verify app status
foundry app status

# 2. Check if released
foundry app release azure-analyst

# 3. Clear browser cache
# In Falcon: Settings → Clear Cache

# 4. Try incognito/private window

# 5. If still not visible, delete and reinstall
foundry app delete azure-analyst
foundry app install azure-analyst-*.tar.gz
foundry app release azure-analyst
```

---

## Rollback Procedure

If deployment has critical issues:

```bash
# Option 1: Delete app (reverts to no extension)
foundry app delete azure-analyst

# Option 2: Redeploy with previous bundle
foundry app install previous-bundle.tar.gz

# Option 3: Update app configuration only (no redeployment needed)
foundry app config set azure-analyst AZURE_OPENAI_API_KEY="corrected-key"
```

---

## Advanced Customization

### Update Prompts

Edit `backend_function.py` functions:
- `format_detection_for_analysis()` - Change detection analysis prompt
- `format_incident_for_analysis()` - Change incident analysis prompt

Then redeploy:
```bash
foundry bundle create
foundry app install azure-analyst-*.tar.gz
```

### Add Additional Sockets

Edit `manifest.yml` `sockets` section:
```yaml
sockets:
  - activity.detections.details
  - crowdscore.incidents.details
  - falcon.host_management.hosts  # Add this
  - crowdscore.services.details    # Or this
```

### Store Analysis Results

Uncomment in `manifest.yml`:
```yaml
collections:
  - name: detection_analyses
    description: "Storage for detection analysis results"
    definition: collections/detection_analyses.json
```

---

## Support & Resources

- **Foundry CLI Help**: `foundry help`
- **App Status**: `foundry app status`
- **View Logs**: `foundry logs --function azure_analyzer`
- **Azure OpenAI Docs**: https://learn.microsoft.com/azure/ai-services/openai/
- **CrowdStrike Docs**: https://developer.crowdstrike.com/docs/samples/
