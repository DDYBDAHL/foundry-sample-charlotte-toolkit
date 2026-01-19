# Azure-Analyst User Documentation

## Overview

Azure-Analyst is a CrowdStrike Foundry application that provides AI-powered analysis of detections and incidents using your own Azure OpenAI endpoint.

It extends the Falcon console with:
- **Detection Analysis**: Deep threat analysis of endpoint detections
- **Incident Analysis**: Strategic incident response guidance
- **Expert Insights**: Structured recommendations from GPT-4 analysis

## Features

### 1. Real-time Analysis

- Analyzes any detection or incident with a single click
- Leverages your own Azure OpenAI deployment (GPT-4)
- Results appear directly in the Falcon console

### 2. Detection Analysis Includes

- **Threat Summary**: What is the threat?
- **IoC Extraction**: Indicators of compromise identified
- **Investigation Steps**: Recommended next actions
- **Severity Assessment**: Risk level evaluation
- **Response Actions**: Suggested containment and remediation

### 3. Incident Analysis Includes

- **Executive Summary**: High-level incident overview
- **Attack Timeline**: Chronological progression
- **Impact Assessment**: Scope and affected systems
- **Root Cause**: What happened and how
- **Remediation**: Immediate and long-term fixes
- **Risk Assessment**: Business impact

## How to Use

### Accessing Azure-Analyst

1. **Navigate to Detections**
   - Go to **Endpoint Security** → **Monitor** → **Endpoint Detections**
   - OR **Next-Gen SIEM** → **Detections**

2. **Open Detection Details**
   - Click any detection to open the side panel
   - Scroll down to find **Azure-Analyst Extension**
   - Click the extension title to expand

3. **Analyze**
   - Click the **🤖 Analyze with Azure OpenAI** button
   - Wait 10-30 seconds for analysis
   - Results appear in the extension panel

### For Incidents

1. **Navigate to Incidents**
   - Go to **Next-Gen SIEM** → **Incidents**
   - OR **Crowdscore** → **Incidents**

2. **Open Incident Details**
   - Click any incident
   - Azure-Analyst Extension appears in the panel

3. **Analyze**
   - Same process: Click button and wait for results

## Understanding Results

### Analysis Structure

Results are organized into numbered sections:

```
1. Summary - Main finding
2. Indicators - IoCs or details
3. Steps - What to do next
4. Assessment - Severity/impact
5. Actions - Recommended responses
```

### Example Detection Analysis

```
1. Summary of the threat
   Suspicious PowerShell execution detected from user account.
   Potential command-line enumeration or lateral movement activity.

2. Indicators of compromise (IoCs)
   - Process: powershell.exe
   - Command: Get-ADUser -Filter *
   - Parent: explorer.exe
   - User: domain\user1

3. Recommended investigation steps
   - Check execution timeline
   - Review network connections
   - Search for similar activity
   - Check for credentials in memory

4. Severity assessment: Medium
   - Execution of reconnaissance tools
   - Within normal business hours
   - Single endpoint affected

5. Suggested response actions
   - Isolate for deeper inspection
   - Review recent user activity
   - Check for compromise indicators
```

## Best Practices

### 1. Use for Investigation Enrichment
- Don't rely solely on Azure-Analyst results
- Use as a starting point for investigation
- Combine with manual analysis and CrowdStrike data

### 2. Investigate High-Severity Alerts First
- Azure-Analyst helps prioritize high-impact items
- Start with Critical/High detections
- Use results to guide investigation path

### 3. Document Analysis Results
- Copy analysis for your incident report
- Use as justification for containment actions
- Track analysis history for trending

### 4. Tune Azure OpenAI Prompts
- Contact your administrator to customize analysis
- Different organizations may want different focus
- Prompts can be tuned for your MITRE ATT&CK priorities

## Tips and Tricks

### Copy Analysis Easily
- Click **📋 Copy Analysis** button
- Paste into incident response tools
- Use for documentation and reporting

### Use with Workflows (SOAR)
- Azure-Analyst integrates with Falcon Fusion SOAR
- Create automated response workflows
- Trigger analysis on new detections automatically

### Link Multiple Analyses
- Analyze each detection in an incident separately
- Compare findings across detection group
- Identify patterns and attack progression

## Troubleshooting

### "No data available"
**Solution**: Click on a detection or incident first - the extension needs data context

### "Failed to get analysis"
**Possible causes:**
- Azure OpenAI endpoint offline
- API key expired or invalid
- API rate limits exceeded
- Contact your administrator

### "Analyzing..." takes too long (>1 minute)
**Possible causes:**
- Heavy Azure OpenAI load
- Large detection/incident data
- Network latency
- Try again after a few minutes

### Analysis seems generic or incomplete
**Solutions:**
- Ensure all detection fields are populated
- Check that detection has full context (MITRE tactic/technique)
- Contact administrator about prompt tuning

## Privacy & Security

### Data Handling
- Detection/incident data is sent to YOUR Azure OpenAI endpoint
- Data is NOT sent to CrowdStrike or third parties
- Results are stored in your environment

### What Data is Sent
- Detection ID, timestamps, severity
- MITRE ATT&CK tactic and technique
- Process information and command lines
- User and host information
- Affected assets and scope (for incidents)

### What is NOT Sent
- Sensor authentication tokens
- API keys or credentials
- Other detections or incidents
- Confidential business data (unless in detection name/description)

## Contact & Support

- **Azure OpenAI Issues**: Check Azure Portal status
- **Foundry App Issues**: Contact your CrowdStrike administrator
- **Feature Requests**: Submit through your CrowdStrike account team

## Advanced Usage

### Integration with Incident Response Platforms
1. Analyze detection in Azure-Analyst
2. Copy results
3. Paste into Jira, ServiceNow, or incident tracking tool
4. Use as basis for response action

### Building Custom Workflows
- Administrators can create SOAR workflows using Azure-Analyst
- Automate analysis on new detections
- Create ticketing workflows
- Integrate with external platforms

### API Integration
- Backend function is REST API accessible
- Can be called from external tools
- Enables custom integrations and automation

## FAQ

**Q: Does Azure-Analyst store analysis results?**
A: By default, results are displayed but not stored. Your administrator can enable collection storage for audit trails.

**Q: Can I analyze multiple detections at once?**
A: Currently, analyze one detection at a time. For bulk analysis, contact your administrator about SOAR workflow automation.

**Q: What models can Azure-Analyst use?**
A: Any Azure OpenAI deployment (GPT-4, GPT-4 Turbo, etc.). Your administrator configures this.

**Q: Is analysis available for all detection types?**
A: Yes, Azure-Analyst works with all CrowdStrike detections and incidents.

**Q: Can I customize the analysis prompts?**
A: Your administrator can customize analysis prompts by editing the backend_function.py.

**Q: What happens if Azure OpenAI is down?**
A: You'll see an error message. Check Azure status and try again when service is restored.

**Q: How long does analysis take?**
A: Typically 10-30 seconds depending on Azure OpenAI load and data size.

**Q: Can I use this with other Azure services?**
A: The backend is flexible - advanced administrators can integrate with other Azure APIs.

## Keyboard Shortcuts

None currently, but common browser shortcuts work:
- **Ctrl+C** / **Cmd+C**: Copy selected text
- **Ctrl+F** / **Cmd+F**: Search in panel

## Accessibility

- Full keyboard navigation support
- Screen reader compatible
- High contrast mode supported
- WCAG 2.1 AA compliant

## Version Information

- **Application**: Azure-Analyst 1.0.0
- **Compatible with**: Falcon Insight XDR, Falcon Prevent
- **Required roles**: Any (read-only)
- **Deployment**: Falcon Foundry

## Change Log

### Version 1.0.0 (Initial Release)
- Detection and incident analysis using Azure OpenAI
- UI extension for Endpoint Detections and Incidents pages
- Backend function with customizable prompts
- SOAR workflow integration support

---

**Last Updated**: January 2026
**Maintained by**: Security Engineering
**Questions?**: Contact your CrowdStrike administrator
