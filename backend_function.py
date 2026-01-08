#!/usr/bin/env python3
"""
Azure-Analyst Backend Function

Purpose: Accepts CrowdStrike Detection/Incident JSON payloads and sends them to Azure OpenAI
for security analysis. Returns the AI-generated analysis back to the UI.

Author: Security Engineer
Date: January 2026
"""

import json
import requests
import logging
from typing import Dict, Any, Optional

# ============================================================================
# CONFIGURATION - PASTE YOUR AZURE CREDENTIALS HERE
# ============================================================================

# Your Azure OpenAI API Key (store securely in environment variables in production)
# Example: os.getenv('AZURE_OPENAI_API_KEY')
AZURE_API_KEY = "your-azure-openai-api-key-here"

# Your Azure OpenAI Endpoint URL
# Format: https://<your-resource-name>.openai.azure.com/
AZURE_ENDPOINT_URL = "https://your-resource-name.openai.azure.com"

# Your deployment name in Azure OpenAI (e.g., gpt-4, gpt-35-turbo)
AZURE_DEPLOYMENT_NAME = "gpt-4"

# API version (check Azure OpenAI docs for latest)
API_VERSION = "2024-02-15-preview"

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# ============================================================================
# MAIN HANDLER FUNCTION (Entry point for Foundry)
# ============================================================================

def handler(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main handler function called by Falcon Foundry.
    
    Args:
        event (Dict[str, Any]): JSON payload containing Detection or Incident details
        
    Returns:
        Dict[str, Any]: Response with analysis results or error message
    """
    
    try:
        logger.info("Handler invoked with event: %s", json.dumps(event, indent=2))
        
        # Extract relevant fields from the payload
        extracted_data = extract_detection_data(event)
        
        if not extracted_data:
            return {
                "status": "error",
                "message": "Unable to extract detection/incident data from payload",
                "analysis": ""
            }
        
        logger.info("Extracted data: %s", json.dumps(extracted_data, indent=2))
        
        # Prepare the prompt for Azure OpenAI
        prompt = build_analysis_prompt(extracted_data)
        
        # Send request to Azure OpenAI
        analysis_response = call_azure_openai(prompt)
        
        if not analysis_response:
            return {
                "status": "error",
                "message": "Failed to get response from Azure OpenAI",
                "analysis": ""
            }
        
        logger.info("Analysis response received: %s", analysis_response)
        
        # Return successful response
        return {
            "status": "success",
            "message": "Analysis completed successfully",
            "analysis": analysis_response,
            "extracted_data": extracted_data
        }
        
    except Exception as e:
        logger.error("Error in handler: %s", str(e), exc_info=True)
        return {
            "status": "error",
            "message": f"Exception occurred: {str(e)}",
            "analysis": ""
        }

# ============================================================================
# DATA EXTRACTION FUNCTION
# ============================================================================

def extract_detection_data(payload: Dict[str, Any]) -> Optional[Dict[str, str]]:
    """
    Extracts relevant fields from CrowdStrike Detection or Incident JSON payload.
    
    Looks for:
    - Description / Summary
    - Tactic (MITRE ATT&CK)
    - Technique (MITRE ATT&CK)
    - Host Name / Device Name
    - Detection Name
    - Severity
    
    Args:
        payload (Dict[str, Any]): Full Detection/Incident JSON payload
        
    Returns:
        Optional[Dict[str, str]]: Extracted fields or None if insufficient data
    """
    
    extracted = {}
    
    # Try to extract description/summary
    extracted['description'] = payload.get('description') or \
                               payload.get('summary') or \
                               payload.get('name') or \
                               payload.get('behavior') or \
                               "No description provided"
    
    # Try to extract tactic (MITRE ATT&CK)
    extracted['tactic'] = payload.get('tactic') or \
                          payload.get('tactics') or \
                          payload.get('primary_tactic') or \
                          "Unknown"
    
    # Try to extract technique (MITRE ATT&CK)
    extracted['technique'] = payload.get('technique') or \
                             payload.get('techniques') or \
                             payload.get('primary_technique') or \
                             "Unknown"
    
    # Try to extract host/device name
    extracted['host_name'] = payload.get('hostname') or \
                             payload.get('host_name') or \
                             payload.get('device_name') or \
                             payload.get('computer_name') or \
                             "Unknown"
    
    # Try to extract detection name
    extracted['detection_name'] = payload.get('name') or \
                                  payload.get('detection_name') or \
                                  payload.get('rule_name') or \
                                  "Unknown"
    
    # Try to extract severity
    extracted['severity'] = str(payload.get('severity') or \
                                payload.get('priority') or \
                                "Unknown").upper()
    
    # Try to extract detection ID for reference
    extracted['detection_id'] = payload.get('detection_id') or \
                                payload.get('id') or \
                                "Unknown"
    
    logger.info("Extracted detection data: %s", json.dumps(extracted, indent=2))
    
    return extracted if extracted['description'] != "No description provided" else None

# ============================================================================
# PROMPT BUILDER FUNCTION
# ============================================================================

def build_analysis_prompt(extracted_data: Dict[str, str]) -> str:
    """
    Builds a structured prompt for Azure OpenAI to analyze the detection.
    
    Args:
        extracted_data (Dict[str, str]): Extracted detection/incident fields
        
    Returns:
        str: Formatted prompt for Azure OpenAI
    """
    
    prompt = f"""You are a senior cybersecurity analyst. Analyze the following CrowdStrike detection and provide a detailed security assessment.

Detection Information:
- Detection Name: {extracted_data.get('detection_name', 'Unknown')}
- Description: {extracted_data.get('description', 'Unknown')}
- MITRE ATT&CK Tactic: {extracted_data.get('tactic', 'Unknown')}
- MITRE ATT&CK Technique: {extracted_data.get('technique', 'Unknown')}
- Affected Host: {extracted_data.get('host_name', 'Unknown')}
- Severity: {extracted_data.get('severity', 'Unknown')}
- Detection ID: {extracted_data.get('detection_id', 'Unknown')}

Please provide:
1. A brief summary of what this detection indicates
2. Potential threat actors or campaigns associated with this technique
3. Recommended immediate investigation steps
4. Suggested containment/remediation actions
5. Risk assessment (Critical/High/Medium/Low)

Format your response in clear sections with proper markdown formatting."""
    
    logger.debug("Generated prompt: %s", prompt)
    return prompt

# ============================================================================
# AZURE OPENAI API CALL FUNCTION
# ============================================================================

def call_azure_openai(prompt: str) -> Optional[str]:
    """
    Sends the analysis prompt to Azure OpenAI and retrieves the response.
    
    Uses the Azure OpenAI Chat Completions API.
    
    Args:
        prompt (str): The analysis prompt to send to Azure OpenAI
        
    Returns:
        Optional[str]: The AI-generated analysis response or None on error
    """
    
    try:
        # Construct the Azure OpenAI API endpoint
        api_url = f"{AZURE_ENDPOINT_URL}/openai/deployments/{AZURE_DEPLOYMENT_NAME}/chat/completions?api-version={API_VERSION}"
        
        # Prepare request headers
        headers = {
            "Content-Type": "application/json",
            "api-key": AZURE_API_KEY
        }
        
        # Prepare request payload
        payload = {
            "messages": [
                {
                    "role": "system",
                    "content": "You are a cybersecurity expert specializing in threat analysis and incident response."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 2000,
            "top_p": 0.95,
            "frequency_penalty": 0,
            "presence_penalty": 0
        }
        
        logger.info("Sending request to Azure OpenAI: %s", api_url)
        
        # Send POST request to Azure OpenAI
        response = requests.post(
            api_url,
            headers=headers,
            json=payload,
            timeout=25  # Must be less than Foundry's 30-second timeout
        )
        
        logger.info("Azure OpenAI response status: %s", response.status_code)
        
        # Check for successful response
        if response.status_code != 200:
            logger.error("Azure OpenAI API error: Status %s, Response: %s",
                        response.status_code, response.text)
            return None
        
        # Parse response JSON
        response_json = response.json()
        
        # Extract the assistant's message
        if 'choices' in response_json and len(response_json['choices']) > 0:
            analysis = response_json['choices'][0]['message']['content']
            logger.info("Successfully extracted analysis from Azure OpenAI")
            return analysis
        else:
            logger.error("Unexpected response format from Azure OpenAI: %s", response_json)
            return None
            
    except requests.exceptions.RequestException as e:
        logger.error("Request exception when calling Azure OpenAI: %s", str(e))
        return None
    except json.JSONDecodeError as e:
        logger.error("JSON decode error: %s", str(e))
        return None
    except Exception as e:
        logger.error("Unexpected error in call_azure_openai: %s", str(e), exc_info=True)
        return None

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def validate_azure_config() -> bool:
    """
    Validates that Azure OpenAI credentials are properly configured.
    
    Returns:
        bool: True if valid, False otherwise
    """
    
    if not AZURE_API_KEY or AZURE_API_KEY == "your-azure-openai-api-key-here":
        logger.error("Azure API Key not configured")
        return False
    
    if not AZURE_ENDPOINT_URL or AZURE_ENDPOINT_URL == "https://your-resource-name.openai.azure.com":
        logger.error("Azure Endpoint URL not configured")
        return False
    
    return True

# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    # For local testing only
    test_event = {
        "description": "Suspicious process execution detected",
        "tactic": "Execution",
        "technique": "Command Line Interface",
        "hostname": "WORKSTATION-001",
        "name": "Process Hollowing Detected",
        "severity": "High",
        "detection_id": "evt:abc123def456"
    }
    
    result = handler(test_event)
    print(json.dumps(result, indent=2))
