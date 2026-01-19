import React, { useState, useEffect } from 'react';
import FalconApi from '@crowdstrike/foundry-js';
import { SlButton, SlCard, SlSpinner, SlAlert, SlIcon } from '@shoelace-style/shoelace/dist/react';

// Define types for Detection data
interface DetectionData {
  description?: string;
  tactic?: string;
  technique?: string;
  hostname?: string;
  name?: string;
  severity?: string;
  [key: string]: any;
}

const Extension: React.FC = () => {
  const [falcon, setFalcon] = useState<FalconApi | null>(null);
  const [detectionData, setDetectionData] = useState<DetectionData | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initFalcon = async () => {
      try {
        const api = new FalconApi();
        await api.connect();
        setFalcon(api);

        // Check if we have data from the socket
        if (api.data) {
             setDetectionData(api.data);
        }

        // Listen for updates
        api.events.on('data', (data: any) => {
            setDetectionData(data);
            setAnalysis(null); // Reset analysis on new data
        });

      } catch (err) {
        setError('Failed to connect to Falcon.');
        console.error(err);
      }
    };
    initFalcon();
  }, []);

  const handleTriage = async () => {
    if (!falcon || !detectionData) return;

    setLoading(true);
    setError(null);

    try {
      // Call the backend function
      // Assuming generic function invocation via post
      const response = await falcon.functions.post('handle_triage_request', detectionData);

      if (response && response.status === 'success') {
          setAnalysis(response.response);
      } else {
          setError(response?.message || 'Analysis failed.');
      }

    } catch (err) {
      setError('Error calling AI service.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!detectionData) {
      return (
          <SlCard>
              <div style={{ padding: '20px', textAlign: 'center' }}>
                  <p>Waiting for detection data...</p>
                  {error && <SlAlert variant="danger" open>{error}</SlAlert>}
              </div>
          </SlCard>
      );
  }

  return (
    <div className="extension-container" style={{ padding: '1rem' }}>
      <SlCard>
        <div slot="header">
          <h3 style={{ margin: 0 }}>
             <SlIcon name="robot" style={{ marginRight: '8px' }} />
             AI Triage Assistant
          </h3>
        </div>

        <div style={{ marginBottom: '1rem' }}>
            <strong>Detection:</strong> {detectionData.name || 'Unknown'}<br/>
            <strong>Severity:</strong> {detectionData.severity || 'Unknown'}<br/>
            <strong>Tactic:</strong> {detectionData.tactic || 'Unknown'}
        </div>

        {error && (
            <SlAlert variant="danger" open style={{ marginBottom: '1rem' }}>
                <SlIcon slot="icon" name="exclamation-octagon" />
                {error}
            </SlAlert>
        )}

        {!analysis && !loading && (
             <SlButton variant="primary" onClick={handleTriage}>
                 Triage with AI
             </SlButton>
        )}

        {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <SlSpinner /> Analyzing detection...
            </div>
        )}

        {analysis && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--sl-color-neutral-50)', borderRadius: '4px' }}>
                <h4>Analysis Result</h4>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                    {analysis}
                </div>
                <SlButton size="small" variant="default" onClick={handleTriage} style={{ marginTop: '1rem' }}>
                    Re-analyze
                </SlButton>
            </div>
        )}

      </SlCard>
    </div>
  );
};

export default Extension;
