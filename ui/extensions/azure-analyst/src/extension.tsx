import React, { useEffect, useState } from 'react';
import { useFalcon } from '@crowdstrike/foundry-js';
import './extension.css';

interface AnalysisResult {
  status: 'success' | 'error' | 'loading';
  analysis?: string;
  message?: string;
  timestamp?: string;
  model?: string;
}

interface DetectionData {
  id: string;
  detection_id?: string;
  incident_id?: string;
  type?: string;
  created_timestamp?: number;
  [key: string]: any;
}

const AzureAnalystExtension: React.FC = () => {
  const falcon = useFalcon();
  const [data, setData] = useState<DetectionData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for data changes from Falcon
  useEffect(() => {
    const unsubscribe = falcon.events.on('data', (newData: DetectionData) => {
      console.log('Received data from Falcon:', newData);
      setData(newData);
      setAnalysis(null);
      setError(null);
    });

    return () => unsubscribe();
  }, [falcon]);

  const handleAnalyze = async () => {
    if (!data) {
      setError('No detection or incident data available');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis({ status: 'loading' });

    try {
      // Call the Foundry backend function
      const response = await falcon.fn.execute('azure_analyzer', {
        type: data.incident_id ? 'incident' : 'detection',
        data: data
      });

      if (response.status === 'success') {
        setAnalysis({
          status: 'success',
          analysis: response.analysis,
          timestamp: response.timestamp,
          model: response.model
        });
      } else {
        setAnalysis({
          status: 'error',
          message: response.message || 'Analysis failed'
        });
        setError(response.message || 'Failed to get analysis');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setAnalysis({
        status: 'error',
        message: errorMessage
      });
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAnalysisText = (text: string) => {
    return text.split('\n').map((line, idx) => (
      <p key={idx} className="analysis-line">{line || '\u00A0'}</p>
    ));
  };

  return (
    <div className="azure-analyst-extension">
      <div className="extension-header">
        <h2>Azure-Analyst</h2>
        <p className="subtitle">AI-Powered Detection & Incident Analysis</p>
      </div>

      <div className="extension-content">
        {/* Data Info Section */}
        {data && (
          <div className="data-info-section">
            <h3>Detection Information</h3>
            <div className="data-info-grid">
              <div className="info-item">
                <label>ID:</label>
                <code>{data.id || data.detection_id || data.incident_id || 'N/A'}</code>
              </div>
              {data.created_timestamp && (
                <div className="info-item">
                  <label>Created:</label>
                  <span>{new Date(data.created_timestamp * 1000).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="action-section">
          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading || !data}
            title={!data ? 'No detection data available' : 'Analyze with Azure OpenAI'}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              '🤖 Analyze with Azure OpenAI'
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && analysis.status === 'success' && analysis.analysis && (
          <div className="analysis-result">
            <div className="result-header">
              <h3>Analysis Result</h3>
              <div className="result-metadata">
                {analysis.model && <span className="model-badge">{analysis.model}</span>}
                {analysis.timestamp && (
                  <span className="timestamp-badge">
                    {new Date(analysis.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <div className="result-content">
              {formatAnalysisText(analysis.analysis)}
            </div>
            <button
              className="copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(analysis.analysis || '');
              }}
            >
              📋 Copy Analysis
            </button>
          </div>
        )}

        {/* No Data State */}
        {!data && !analysis && (
          <div className="empty-state">
            <p>👁️ Waiting for detection or incident data...</p>
            <p className="help-text">Click on a detection or incident to start the analysis.</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !analysis && (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Contacting Azure OpenAI for analysis...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AzureAnalystExtension;
