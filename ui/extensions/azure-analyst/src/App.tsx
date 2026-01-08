import React, { useState, useEffect } from 'react';
import { FalconClient } from '@crowdstrike/foundry-js';
import './App.css';

/**
 * Azure-Analyst UI Extension Component
 * 
 * Purpose: Displays a clean UI for analyzing CrowdStrike detections/incidents with Azure OpenAI
 * Renders as an extension in Detection Details and Incident Details panels
 */

interface DetectionData {
  description?: string;
  tactic?: string;
  technique?: string;
  hostname?: string;
  host_name?: string;
  device_name?: string;
  name?: string;
  detection_name?: string;
  severity?: string;
  detection_id?: string;
  [key: string]: any;
}

interface AnalysisResponse {
  status: string;
  message: string;
  analysis: string;
  extracted_data?: Record<string, string>;
}

const App: React.FC = () => {
  // State management
  const [detectionData, setDetectionData] = useState<DetectionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [falcon, setFalcon] = useState<any>(null);

  // Initialize Falcon Client and listen for data events
  useEffect(() => {
    const initializeFalcon = async () => {
      try {
        const client = new FalconClient();
        setFalcon(client);

        // Listen for detection/incident data from Falcon Console
        client.events.on('data', (data: DetectionData) => {
          console.log('Received detection data:', data);
          setDetectionData(data);
          setAnalysisResult(null); // Clear previous analysis
          setError(null);
        });
      } catch (err) {
        console.error('Failed to initialize Falcon client:', err);
        setError('Failed to initialize Falcon client');
      }
    };

    initializeFalcon();
  }, []);

  /**
   * Handles the Analyze button click
   * Sends detection data to backend function and displays results
   */
  const handleAnalyzeClick = async () => {
    if (!detectionData) {
      setError('No detection data available to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      console.log('Sending detection data for analysis:', detectionData);

      // Call the backend function (Azure OpenAI analyzer)
      // The exact function call depends on Foundry's RPC interface
      // This is a placeholder - adjust based on your Foundry setup
      const response = await fetch('/api/functions/azure_analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(detectionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AnalysisResponse = await response.json();
      console.log('Analysis result:', result);

      if (result.status === 'success') {
        setAnalysisResult(result);
      } else {
        setError(result.message || 'Analysis failed');
      }
    } catch (err) {
      console.error('Error during analysis:', err);
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Extracts a readable host/device name from detection data
   */
  const getHostName = () => {
    return (
      detectionData?.hostname ||
      detectionData?.host_name ||
      detectionData?.device_name ||
      'Unknown Device'
    );
  };

  /**
   * Extracts a readable detection name
   */
  const getDetectionName = () => {
    return detectionData?.name || detectionData?.detection_name || 'Unknown Detection';
  };

  return (
    <div className="azure-analyst-container">
      {/* Header Section */}
      <div className="analyst-header">
        <h2 className="analyst-title">🤖 Azure-Analyst</h2>
        <p className="analyst-subtitle">
          AI-Powered Threat Analysis with Azure OpenAI
        </p>
      </div>

      {/* Detection Info Panel */}
      {detectionData && (
        <div className="detection-info-panel">
          <h3 className="panel-title">📋 Detection Summary</h3>
          <div className="detection-details">
            <div className="detail-row">
              <span className="label">Detection Name:</span>
              <span className="value">{getDetectionName()}</span>
            </div>
            <div className="detail-row">
              <span className="label">Host:</span>
              <span className="value">{getHostName()}</span>
            </div>
            {detectionData.tactic && (
              <div className="detail-row">
                <span className="label">Tactic:</span>
                <span className="value">{detectionData.tactic}</span>
              </div>
            )}
            {detectionData.technique && (
              <div className="detail-row">
                <span className="label">Technique:</span>
                <span className="value">{detectionData.technique}</span>
              </div>
            )}
            {detectionData.severity && (
              <div className="detail-row">
                <span className="label">Severity:</span>
                <span className="value severity-badge">
                  {String(detectionData.severity).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Analyze Button */}
          <button
            className="analyze-button"
            onClick={handleAnalyzeClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner">⏳</span> Analyzing...
              </>
            ) : (
              <>
                <span className="icon">🔍</span> Analyze with Azure OpenAI
              </>
            )}
          </button>
        </div>
      )}

      {/* No Data State */}
      {!detectionData && !error && (
        <div className="no-data-panel">
          <p className="no-data-text">
            ℹ️ Open a detection or incident to begin analysis
          </p>
        </div>
      )}

      {/* Error Message Panel */}
      {error && (
        <div className="error-panel">
          <h4 className="error-title">❌ Error</h4>
          <p className="error-message">{error}</p>
        </div>
      )}

      {/* Analysis Results Panel */}
      {analysisResult && (
        <div className="analysis-result-panel">
          <h3 className="panel-title">📊 Azure OpenAI Analysis</h3>
          <div className="analysis-content">
            <div className="analysis-text">
              {/* Parse and format the analysis text with line breaks and sections */}
              {analysisResult.analysis.split('\n').map((line, index) => {
                if (line.trim() === '') return <br key={index} />;
                if (line.startsWith('##')) {
                  return (
                    <h4 key={index} className="analysis-subheading">
                      {line.replace(/^#+\s/, '')}
                    </h4>
                  );
                }
                if (line.startsWith('- ')) {
                  return (
                    <li key={index} className="analysis-list-item">
                      {line.replace(/^-\s/, '')}
                    </li>
                  );
                }
                return (
                  <p key={index} className="analysis-paragraph">
                    {line}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Re-analyze Button */}
          <button
            className="analyze-button secondary"
            onClick={handleAnalyzeClick}
            disabled={isLoading}
          >
            🔄 Re-analyze
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-panel">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <p className="loading-text">Analyzing with Azure OpenAI...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
