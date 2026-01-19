#!/usr/bin/env python3
"""
AzureAI-Toolkit Backend Function

Purpose: Handles triage requests for CrowdStrike detections and general security chat/analysis
using Azure OpenAI.
"""

import json
import requests
import logging
import os
from typing import Dict, Any, Optional

# ============================================================================
# CONFIGURATION
# ============================================================================

# Azure OpenAI Configuration
AZURE_API_KEY = os.environ.get("AZURE_API_KEY", "placeholder")
AZURE_RESOURCE_NAME = "ad-jo-mg8x3t2p"
AZURE_REGION = "eastus2"
AZURE_DEPLOYMENT_NAME = "gpt-5"
API_VERSION = "2025-01-01-preview"

# Endpoint: https://ad-jo-mg8x3t2p-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-5/chat/completions?api-version=2025-01-01-preview
AZURE_ENDPOINT_URL = f"https://{AZURE_RESOURCE_NAME}-{AZURE_REGION}.cognitiveservices.azure.com"

# ============================================================================
# LOGGING
# ============================================================================

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# ============================================================================
# MAIN HANDLER
# ============================================================================

def handler(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main handler function called by Falcon Foundry.

    Args:
        event (Dict[str, Any]): JSON payload. Can be detection details or a chat request.

    Returns:
        Dict[str, Any]: Response with analysis or chat reply.
    """
    try:
        logger.info("Handler invoked")

        # Determine request type
        # Foundry RPC calls pass arguments as the event dict
        payload = event

        prompt = ""
        request_type = "unknown"

        if payload.get('query') or payload.get('message') or payload.get('logs'):
            # Chat / Log Analysis
            request_type = "chat"
            user_input = payload.get('query') or payload.get('message') or payload.get('logs')
            prompt = build_chat_prompt(user_input)

        elif payload.get('description') or payload.get('tactic') or payload.get('detection_id') or payload.get('name'):
            # Detection Triage
            request_type = "triage"
            extracted_data = extract_detection_data(payload)
            if not extracted_data:
                return {"status": "error", "message": "Insufficient data for triage"}
            prompt = build_triage_prompt(extracted_data)

        else:
            # Fallback or error
            return {"status": "error", "message": "Unknown request format"}

        logger.info(f"Processing {request_type} request")

        analysis_response = call_azure_openai(prompt)

        if not analysis_response:
             return {"status": "error", "message": "Failed to get response from AI"}

        return {
            "status": "success",
            "type": request_type,
            "response": analysis_response
        }

    except Exception as e:
        logger.error("Error in handler: %s", str(e), exc_info=True)
        return {"status": "error", "message": str(e)}

# ============================================================================
# HELPERS
# ============================================================================

def extract_detection_data(payload: Dict[str, Any]) -> Optional[Dict[str, str]]:
    extracted = {}
    extracted['description'] = payload.get('description') or payload.get('summary') or "No description"
    extracted['tactic'] = payload.get('tactic') or "Unknown"
    extracted['technique'] = payload.get('technique') or "Unknown"
    extracted['hostname'] = payload.get('hostname') or payload.get('device_name') or "Unknown"
    extracted['severity'] = str(payload.get('severity') or "Unknown").upper()
    extracted['detection_name'] = payload.get('name') or payload.get('detection_name') or "Unknown"

    return extracted

def build_triage_prompt(data: Dict[str, str]) -> str:
    return f"""Analyze this CrowdStrike detection:

- Name: {data.get('detection_name')}
- Severity: {data.get('severity')}
- Tactic: {data.get('tactic')}
- Technique: {data.get('technique')}
- Host: {data.get('hostname')}
- Description: {data.get('description')}

Provide:
1. Summary of the threat.
2. Potential threat actors (if applicable).
3. Recommended investigation steps.
4. Containment actions.
5. Risk assessment.
"""

def build_chat_prompt(user_input: str) -> str:
    return f"""You are a security expert. Answer the following inquiry or analyze the provided logs:

{user_input}
"""

def call_azure_openai(prompt: str) -> Optional[str]:
    api_url = f"{AZURE_ENDPOINT_URL}/openai/deployments/{AZURE_DEPLOYMENT_NAME}/chat/completions?api-version={API_VERSION}"

    headers = {
        "Content-Type": "application/json",
        "api-key": AZURE_API_KEY
    }

    payload = {
        "messages": [
            {"role": "system", "content": "You are a cybersecurity expert."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 2000
    }

    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=25)
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        else:
            logger.error(f"Azure API Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Request failed: {str(e)}")
        return None

if __name__ == "__main__":
    # Local test
    print(handler({"description": "Test detection", "severity": "High", "tactic": "Execution"}))
