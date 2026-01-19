#!/usr/bin/env python3
"""
Azure-Analyst Foundry Backend Function
Sends detection/incident data to Azure OpenAI for analysis.
"""

import json
import os
import logging
from typing import Any, Dict, Optional
from datetime import datetime

try:
    import requests
    from openai import AzureOpenAI
except ImportError:
    # These will be installed by Foundry
    pass

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Azure OpenAI Configuration from environment variables
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_DEPLOYMENT_NAME = os.getenv("AZURE_DEPLOYMENT_NAME", "gpt-4")
AZURE_API_VERSION = os.getenv("AZURE_API_VERSION", "2024-08-01-preview")


def validate_config() -> bool:
    """
    Validate Azure OpenAI configuration is set up correctly.
    """
    if not all([AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY]):
        logger.error("Missing Azure OpenAI configuration. Check environment variables.")
        return False
    return True


def format_detection_for_analysis(detection_data: Dict[str, Any]) -> str:
    """
    Format CrowdStrike detection data into a readable prompt for Azure OpenAI.
    """
    prompt = f"""
Analyze the following CrowdStrike detection and provide:
1. Summary of the threat
2. Indicators of compromise (IoCs)
3. Recommended investigation steps
4. Severity assessment (Low/Medium/High/Critical)
5. Suggested response actions

Detection Data:
{json.dumps(detection_data, indent=2, default=str)}

Provide a concise, actionable analysis suitable for a security analyst.
"""
    return prompt


def format_incident_for_analysis(incident_data: Dict[str, Any]) -> str:
    """
    Format CrowdStrike incident data into a readable prompt for Azure OpenAI.
    """
    prompt = f"""
Analyze the following CrowdStrike incident and provide:
1. Executive summary of the incident
2. Attack timeline and progression
3. Affected assets and scope
4. Root cause analysis
5. Immediate and long-term remediation steps
6. Risk assessment

Incident Data:
{json.dumps(incident_data, indent=2, default=str)}

Provide a detailed, strategic analysis suitable for security leadership and incident response teams.
"""
    return prompt


def analyze_with_azure_openai(prompt: str, max_tokens: int = 1500) -> Optional[str]:
    """
    Send prompt to Azure OpenAI and get analysis response.
    
    Args:
        prompt: The formatted analysis request
        max_tokens: Maximum tokens in response
        
    Returns:
        Analysis response from Azure OpenAI or None if error
    """
    if not validate_config():
        return None
    
    try:
        client = AzureOpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            api_version=AZURE_API_VERSION,
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
        )
        
        logger.info(f"Sending analysis request to Azure OpenAI (deployment: {AZURE_DEPLOYMENT_NAME})")
        
        response = client.chat.completions.create(
            model=AZURE_DEPLOYMENT_NAME,
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert cybersecurity analyst with deep knowledge of threat detection, 
incident response, and attack methodologies. Analyze detection and incident data to provide actionable security insights."""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=max_tokens,
            top_p=0.95,
        )
        
        analysis = response.choices[0].message.content
        logger.info("Analysis completed successfully")
        return analysis
        
    except Exception as e:
        logger.error(f"Error calling Azure OpenAI: {str(e)}")
        return None


def handler(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main handler function for Foundry.
    
    Args:
        event: Foundry event containing detection or incident data
        
    Returns:
        Analysis result with metadata
    """
    try:
        logger.info(f"Processing event: {event.get('type', 'unknown')}")
        
        event_type = event.get("type", "detection")
        data = event.get("data", {})
        
        # Format appropriate prompt based on event type
        if event_type == "incident":
            prompt = format_incident_for_analysis(data)
        else:
            prompt = format_detection_for_analysis(data)
        
        # Get analysis from Azure OpenAI
        analysis = analyze_with_azure_openai(prompt)
        
        if not analysis:
            return {
                "status": "error",
                "message": "Failed to get analysis from Azure OpenAI",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        return {
            "status": "success",
            "type": event_type,
            "analysis": analysis,
            "source": "azure-openai",
            "model": AZURE_DEPLOYMENT_NAME,
            "timestamp": datetime.utcnow().isoformat(),
            "data_id": data.get("id", "unknown")
        }
        
    except Exception as e:
        logger.error(f"Error in handler: {str(e)}")
        return {
            "status": "error",
            "message": f"Exception in handler: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }


if __name__ == "__main__":
    # For local testing
    test_detection = {
        "type": "detection",
        "data": {
            "id": "test-detection-001",
            "technique": "T1059 - Command and Scripting Interpreter",
            "tactic": "Execution",
            "severity": "High",
            "description": "Suspicious PowerShell execution detected",
            "host_name": "workstation-01",
            "user_name": "domain\\user1"
        }
    }
    
    result = handler(test_detection)
    print(json.dumps(result, indent=2))
